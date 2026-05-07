import requests
from bs4 import BeautifulSoup
import csv
import time
import re
from urllib.parse import urljoin
import chardet


def get_news_list(page_num):
    """获取某一页的新闻列表"""
    if page_num == 1:
        url = "https://www.cug.edu.cn/index/xsdt.htm"
    else:
        url = f"https://www.cug.edu.cn/index/xsdt/{page_num}.htm"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        detected = chardet.detect(response.content)
        response.encoding = detected['encoding'] or 'utf-8'
        if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
            response.encoding = 'gb18030'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        news_list = []
        items = soup.select('.xblist-oli')
        
        for item in items:
            news_item = {}
            
            date_month = item.select_one('.xblist-date p')
            date_day = item.select_one('.xblist-date h2')
            if date_month and date_day:
                news_item['date'] = f"{date_month.get_text(strip=True)}-{date_day.get_text(strip=True)}"
            else:
                news_item['date'] = ""
            
            title_div = item.select_one('.xblist-title')
            if title_div:
                title_elem = title_div.select_one('a')
                if title_elem:
                    h2_elem = title_elem.select_one('h2')
                    if h2_elem:
                        news_item['title'] = h2_elem.get_text(strip=True)
                    else:
                        news_item['title'] = title_elem.get_text(strip=True)
                    news_item['link'] = urljoin("https://www.cug.edu.cn", title_elem.get('href', ''))
                else:
                    news_item['title'] = ""
                    news_item['link'] = ""
            else:
                news_item['title'] = ""
                news_item['link'] = ""
            
            pic_elem = item.select_one('.xblist-pic span')
            if pic_elem:
                style = pic_elem.get('style', '')
                match = re.search(r'url\(([^)]+)\)', style)
                if match:
                    img_url = match.group(1).strip("'\"")
                    if img_url.startswith('/'):
                        img_url = "https://www.cug.edu.cn" + img_url
                    news_item['image_url'] = img_url
                else:
                    news_item['image_url'] = ""
            else:
                news_item['image_url'] = ""
            
            read_count = item.select_one('.xblist-count')
            if read_count:
                news_item['read_count'] = read_count.get_text(strip=True)
            else:
                news_item['read_count'] = ""
            
            news_list.append(news_item)
        
        return news_list
        
    except Exception as e:
        print(f"获取第{page_num}页失败: {e}")
        return []


def save_to_csv(all_news, filename="xueshudongtai.CSV"):
    """保存数据到CSV文件"""
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'image_url', 'link', 'read_count']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for news in all_news:
            filtered_news = {k: news[k] for k in fieldnames}
            writer.writerow(filtered_news)
    print(f"数据已保存到 {filename}")


def is_valid_year(date_str):
    """检查日期是否在2023-2026年之间"""
    try:
        year = int(date_str.split('-')[0])
        return 2023 <= year <= 2026
    except:
        return False


def main():
    """主函数：爬取1-189页，过滤2023-2026年的数据"""
    total_pages = 189
    all_news = []
    valid_news_count = 0
    
    print(f"开始爬取中国地质大学'学术动态'栏目（1-189页）...")
    print("=" * 60)
    
    for page in range(1, total_pages + 1):
        print(f"正在爬取第 {page}/{total_pages} 页...")
        
        news_list = get_news_list(page)
        
        if len(news_list) == 0:
            print(f"  本页没有新闻，可能已到达最后一页")
            continue
            
        print(f"  本页找到 {len(news_list)} 条新闻")
        
        # 过滤2023-2026年的新闻
        valid_news = [news for news in news_list if is_valid_year(news['date'])]
        
        if valid_news:
            valid_news_count += len(valid_news)
            print(f"  找到 {len(valid_news)} 条2023-2026年的新闻")
            all_news.extend(valid_news)
        
        print(f"  累计已采集 {len(all_news)} 条有效新闻")
        print("-" * 40)
        
        time.sleep(0.2)
    
    # 按日期排序（最新的在前）
    print("正在按日期排序...")
    all_news.sort(key=lambda x: x['date'], reverse=True)
    
    # 保存数据
    save_to_csv(all_news)
    
    print("\n" + "=" * 60)
    print("爬取完成！统计信息：")
    print(f"  总爬取页数: {total_pages}")
    print(f"  有效新闻数(2023-2026年): {len(all_news)}")
    
    with_img = sum(1 for n in all_news if n['image_url'])
    print(f"  有图片的新闻: {with_img}")
    
    with_read = sum(1 for n in all_news if n['read_count'])
    print(f"  有阅读量的新闻: {with_read}")


if __name__ == "__main__":
    main()