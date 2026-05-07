import requests
from bs4 import BeautifulSoup
import csv
import time
import chardet


def safe_print(text):
    """安全打印，处理特殊字符"""
    try:
        print(text)
    except UnicodeEncodeError:
        # 移除无法编码的字符
        safe_text = text.encode('gbk', errors='replace').decode('gbk', errors='replace')
        print(safe_text)


def get_news_content(url):
    """从新闻详情页获取内容"""
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
        
        content = ""
        
        content_elem = soup.select_one('article, .article, .content, .news-content, .news-detail')
        if content_elem:
            content = content_elem.get_text(strip=True)
        
        if not content:
            paragraphs = soup.select('div.TRS_Editor p, div.v_news_content p, .entry-content p')
            if paragraphs:
                content = '\n'.join([p.get_text(strip=True) for p in paragraphs])
        
        if not content:
            content_div = soup.select_one('div.content_text, div.main-content, div.detail-content')
            if content_div:
                content = content_div.get_text(strip=True)
        
        if not content:
            all_p = soup.find_all('p')
            if all_p:
                content = '\n'.join([p.get_text(strip=True) for p in all_p[:30]])
        
        if not content:
            body = soup.find('body')
            if body:
                content = body.get_text(strip=True)[:5000]
        
        return content[:10000]
    
    except Exception as e:
        safe_print(f"获取详情页 {url} 失败: {e}")
        return ""


def crawl_content(input_file):
    """爬取单个文件的新闻内容"""
    output_file = input_file.replace('.csv', '_content.csv')
    
    safe_print(f"\n正在处理: {input_file}")
    safe_print("=" * 60)
    
    news_list = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            news_list.append(row)
    
    safe_print(f"共找到 {len(news_list)} 条新闻")
    
    for idx, news in enumerate(news_list):
        url = news.get('link', '')
        if not url:
            news['content'] = ""
            continue
        
        title = news.get('title', '')[:30] if news.get('title') else ""
        safe_print(f"正在爬取 [{idx+1}/{len(news_list)}]: {title}...")
        
        content = get_news_content(url)
        news['content'] = content
        
        safe_print(f"  内容长度: {len(content)} 字符")
        safe_print("-" * 40)
        
        time.sleep(0.2)
    
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'image_url', 'link', 'like_count', 'content']
        if news_list and 'read_count' in news_list[0]:
            fieldnames = ['date', 'title', 'image_url', 'link', 'read_count', 'content']
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for news in news_list:
            writer.writerow(news)
    
    safe_print(f"数据已保存到 {output_file}")
    return len(news_list)


def main():
    """主函数：批量处理所有板块"""
    files = [
        "SMEACP.CSV",        # 立德树人
        "meitidida.CSV",     # 媒体地大
        "xueshudongtai.CSV"  # 学术动态
    ]
    
    total_count = 0
    
    for file in files:
        count = crawl_content(file)
        total_count += count
    
    safe_print("\n" + "=" * 60)
    safe_print(f"批量处理完成！共爬取 {total_count} 条新闻内容")


if __name__ == "__main__":
    main()