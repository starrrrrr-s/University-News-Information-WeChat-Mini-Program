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
        url = "https://www.cug.edu.cn/index/mtdd.htm"
    else:
        url = f"https://www.cug.edu.cn/index/mtdd/{page_num}.htm"
    
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
            
            # 日期
            date_month = item.select_one('.xblist-date p')
            date_day = item.select_one('.xblist-date h2')
            if date_month and date_day:
                news_item['date'] = f"{date_month.get_text(strip=True)}-{date_day.get_text(strip=True)}"
            else:
                news_item['date'] = ""
            
            # 标题和链接
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
            
            # 图片URL
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
            
            news_item['like_count'] = ""
            news_list.append(news_item)
        
        return news_list
        
    except Exception as e:
        print(f"获取第{page_num}页失败: {e}")
        return []


def get_news_detail(news_url):
    """从详情页获取点赞量"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(news_url, headers=headers, timeout=15)
        detected = chardet.detect(response.content)
        response.encoding = detected['encoding'] or 'utf-8'
        if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
            response.encoding = 'gb18030'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        like_elem = soup.select_one('.like-count')
        if like_elem:
            return like_elem.get_text(strip=True)
        
        like_span = soup.find('span', text=re.compile(r'点赞'))
        if like_span:
            return like_span.get_text(strip=True)
        
        return ""
    except Exception as e:
        print(f"获取详情页 {news_url} 失败: {e}")
        return ""


def append_to_csv(all_news, filename="meitidida.CSV"):
    """追加数据到CSV文件"""
    with open(filename, 'a', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'image_url', 'link', 'like_count']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        for news in all_news:
            filtered_news = {k: news[k] for k in fieldnames}
            writer.writerow(filtered_news)
    print(f"已追加 {len(all_news)} 条数据到 {filename}")


def main():
    """主函数：继续爬取122-187页"""
    start_page = 122
    end_page = 187
    all_news = []
    
    print(f"开始继续爬取中国地质大学'媒体地大'栏目，第{start_page}-{end_page}页...")
    print("=" * 60)
    
    for page in range(start_page, end_page + 1):
        print(f"正在爬取第 {page}/{end_page} 页...")
        
        news_list = get_news_list(page)
        print(f"  本页找到 {len(news_list)} 条新闻")
        
        # 如果本页没有新闻，尝试反向分页
        if len(news_list) == 0 and page > 1:
            print(f"  尝试反向分页...")
            page_value = end_page - (page - start_page)
            url = f"https://www.cug.edu.cn/index/mtdd/{page_value}.htm"
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
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
                    news_item['like_count'] = ""
                    news_list.append(news_item)
                print(f"  反向分页后找到 {len(news_list)} 条新闻")
            except Exception as e:
                print(f"  反向分页也失败: {e}")
        
        # 获取点赞量
        for idx, news in enumerate(news_list):
            if news['link']:
                safe_title = news['title'][:30] if news['title'] else ""
                try:
                    print(f"    获取 [{idx+1}/{len(news_list)}] 点赞量: {safe_title}...")
                except UnicodeEncodeError:
                    print(f"    获取 [{idx+1}/{len(news_list)}] 点赞量: [标题包含特殊字符]...")
                news['like_count'] = get_news_detail(news['link'])
                time.sleep(0.2)
        
        all_news.extend(news_list)
        print(f"  累计已采集 {len(all_news)} 条新闻")
        print("-" * 40)
        
        time.sleep(0.5)
    
    # 追加数据到CSV
    append_to_csv(all_news)
    
    # 打印统计信息
    print("\n" + "=" * 60)
    print("爬取完成！统计信息：")
    print(f"  本次新增新闻数: {len(all_news)}")
    
    with_img = sum(1 for n in all_news if n['image_url'])
    print(f"  有图片的新闻: {with_img}")
    
    with_likes = sum(1 for n in all_news if n['like_count'])
    print(f"  有点赞量的新闻: {with_likes}")


if __name__ == "__main__":
    main()