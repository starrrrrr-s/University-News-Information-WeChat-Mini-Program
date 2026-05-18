import requests
from bs4 import BeautifulSoup
import csv
import time
import chardet


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
        
        # 尝试多种方式获取新闻内容
        content = ""
        
        # 方式1：查找article或content类
        content_elem = soup.select_one('article, .article, .content, .news-content, .news-detail')
        if content_elem:
            content = content_elem.get_text(strip=True)
        
        # 方式2：查找正文段落
        if not content:
            paragraphs = soup.select('div.TRS_Editor p, div.v_news_content p, .entry-content p')
            if paragraphs:
                content = '\n'.join([p.get_text(strip=True) for p in paragraphs])
        
        # 方式3：查找包含正文的div
        if not content:
            content_div = soup.select_one('div.content_text, div.main-content, div.detail-content')
            if content_div:
                content = content_div.get_text(strip=True)
        
        # 方式4：查找所有p标签
        if not content:
            all_p = soup.find_all('p')
            if all_p:
                content = '\n'.join([p.get_text(strip=True) for p in all_p[:30]])
        
        # 方式5：直接获取body文本
        if not content:
            body = soup.find('body')
            if body:
                content = body.get_text(strip=True)[:5000]
        
        return content[:10000]  # 限制长度
    
    except Exception as e:
        print(f"获取详情页 {url} 失败: {e}")
        return ""


def main():
    """主函数：从CSV读取链接并爬取内容"""
    input_file = "kejichuangxin.csv"  # 输入文件
    output_file = "kejichuangxin_content.csv"  # 输出文件
    
    print(f"正在从 {input_file} 读取链接并爬取新闻内容...")
    print("=" * 60)
    
    # 读取CSV文件
    news_list = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            news_list.append(row)
    
    print(f"共找到 {len(news_list)} 条新闻")
    
    # 爬取每条新闻的内容
    for idx, news in enumerate(news_list):
        url = news.get('link', '')
        if not url:
            news['content'] = ""
            continue
        
        print(f"正在爬取 [{idx+1}/{len(news_list)}]: {news.get('title', '')[:30]}...")
        
        content = get_news_content(url)
        news['content'] = content
        
        print(f"  内容长度: {len(content)} 字符")
        print("-" * 40)
        
        # 避免请求过快
        time.sleep(0.3)
    
    # 保存结果
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'image_url', 'link', 'like_count', 'content']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for news in news_list:
            writer.writerow(news)
    
    print(f"\n数据已保存到 {output_file}")
    print(f"成功爬取 {len(news_list)} 条新闻内容")


if __name__ == "__main__":
    main()