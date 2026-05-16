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
        # 分页URL格式（需要测试是否也是反向的）
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
        # 查找每条新闻的li标签
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
            
            # 点赞量（这里先留空，后续从详情页获取）
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
        
        # 尝试获取点赞量
        # 方法1：查找包含点赞信息的元素
        like_elem = soup.select_one('.like-count')
        if like_elem:
            return like_elem.get_text(strip=True)
        
        # 方法2：查找包含"点赞"文字的元素
        like_span = soup.find('span', text=re.compile(r'点赞'))
        if like_span:
            return like_span.get_text(strip=True)
        
        return ""
    except Exception as e:
        print(f"获取详情页 {news_url} 失败: {e}")
        return ""


def save_to_csv(all_news, filename="meitidida.CSV"):
    """保存数据到CSV文件"""
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'image_url', 'link', 'like_count']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        # 只写入指定的字段
        for news in all_news:
            filtered_news = {k: news[k] for k in fieldnames}
            writer.writerow(filtered_news)
    print(f"数据已保存到 {filename}")


def main():
    """主函数"""
    total_pages = 121  # 总页数
    all_news = []
    
    print(f"开始爬取中国地质大学'媒体地大'栏目，共{total_pages}页...")
    print("=" * 60)
    
    for page in range(1, total_pages + 1):
        print(f"正在爬取第 {page}/{total_pages} 页...")
        
        # 获取列表页
        news_list = get_news_list(page)
        print(f"  本页找到 {len(news_list)} 条新闻")
        
        # 如果本页没有新闻，可能是URL格式问题，尝试反向分页
        if len(news_list) == 0 and page > 1:
            print(f"  尝试反向分页...")
            page_value = total_pages - page + 1
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
        
        # 获取每条新闻的点赞量（由于页数较多，这里可以选择性获取）
        for idx, news in enumerate(news_list):
            if news['link']:
                # 安全打印标题，处理编码问题
                safe_title = news['title'][:30] if news['title'] else ""
                try:
                    print(f"    获取 [{idx+1}/{len(news_list)}] 点赞量: {safe_title}...")
                except UnicodeEncodeError:
                    print(f"    获取 [{idx+1}/{len(news_list)}] 点赞量: [标题包含特殊字符]...")
                news['like_count'] = get_news_detail(news['link'])
                # 避免请求过快
                time.sleep(0.2)
        
        all_news.extend(news_list)
        print(f"  累计已采集 {len(all_news)} 条新闻")
        print("-" * 40)
        
        # 每爬完一页暂停一下，避免对服务器造成压力
        time.sleep(0.5)
    
    # 保存数据
    save_to_csv(all_news)
    
    # 打印统计信息
    print("\n" + "=" * 60)
    print("爬取完成！统计信息：")
    print(f"  总新闻数: {len(all_news)}")
    
    # 统计有图片的新闻数
    with_img = sum(1 for n in all_news if n['image_url'])
    print(f"  有图片的新闻: {with_img}")
    
    # 统计有点赞量的新闻数
    with_likes = sum(1 for n in all_news if n['like_count'])
    print(f"  有点赞量的新闻: {with_likes}")


if __name__ == "__main__":
    main()