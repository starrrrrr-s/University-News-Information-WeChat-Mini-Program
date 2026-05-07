import requests
from bs4 import BeautifulSoup
import csv
import time
import chardet
import re


def safe_print(text):
    """安全打印，处理特殊字符"""
    try:
        print(text)
    except UnicodeEncodeError:
        safe_text = text.encode('gbk', errors='replace').decode('gbk', errors='replace')
        print(safe_text)


def get_xsdt_content(url):
    """获取学术动态新闻详情页内容，针对图片和文件类型做特殊处理"""
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
        
        result = {
            'content_type': 'text',  # text, image, file, mixed
            'text_content': '',
            'image_urls': [],
            'file_urls': [],
            'file_names': []
        }
        
        # 1. 查找所有图片
        all_imgs = soup.find_all('img')
        for img in all_imgs:
            img_src = img.get('src', '')
            if img_src:
                if img_src.startswith('/'):
                    img_src = 'https://www.cug.edu.cn' + img_src
                # 过滤小图标，只保留有意义的图片（宽度>100像素）
                width = img.get('width', '')
                if width and int(width) > 100:
                    result['image_urls'].append(img_src)
                elif not width:  # 如果没有宽度属性，也添加
                    result['image_urls'].append(img_src)
        
        # 2. 查找所有文件下载链接
        all_links = soup.find_all('a')
        for link in all_links:
            href = link.get('href', '')
            if href:
                # 检查是否是文件链接
                file_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar']
                lower_href = href.lower()
                for ext in file_extensions:
                    if ext in lower_href:
                        if href.startswith('/'):
                            href = 'https://www.cug.edu.cn' + href
                        result['file_urls'].append(href)
                        result['file_names'].append(link.get_text(strip=True) or href.split('/')[-1])
                        break
        
        # 3. 获取文本内容
        text_content = ""
        
        # 尝试多种方式获取文本
        content_elem = soup.select_one('article, .article, .content, .news-content, .news-detail')
        if content_elem:
            text_content = content_elem.get_text(strip=True)
        
        if not text_content:
            paragraphs = soup.select('div.TRS_Editor p, div.v_news_content p, .entry-content p, .content p')
            if paragraphs:
                text_content = '\n'.join([p.get_text(strip=True) for p in paragraphs])
        
        if not text_content:
            content_div = soup.select_one('div.content_text, div.main-content, div.detail-content')
            if content_div:
                text_content = content_div.get_text(strip=True)
        
        if not text_content:
            all_p = soup.find_all('p')
            if all_p:
                text_content = '\n'.join([p.get_text(strip=True) for p in all_p[:30]])
        
        result['text_content'] = text_content[:5000]
        
        # 4. 判断内容类型
        if len(result['image_urls']) > 2 and len(result['text_content']) < 100:
            result['content_type'] = 'image'
        elif len(result['file_urls']) > 0:
            result['content_type'] = 'file'
        elif len(result['image_urls']) > 0 and len(result['text_content']) > 0:
            result['content_type'] = 'mixed'
        else:
            result['content_type'] = 'text'
        
        return result
        
    except Exception as e:
        safe_print(f"获取详情页 {url} 失败: {e}")
        return {
            'content_type': 'error',
            'text_content': '',
            'image_urls': [],
            'file_urls': [],
            'file_names': []
        }


def main():
    """主函数：爬取学术动态新闻内容"""
    input_file = "xueshudongtai.CSV"
    output_file = "xueshudongtai_full_content.CSV"
    
    safe_print(f"正在处理学术动态板块: {input_file}")
    safe_print("=" * 60)
    
    news_list = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            news_list.append(row)
    
    safe_print(f"共找到 {len(news_list)} 条新闻")
    
    content_stats = {
        'text': 0,
        'image': 0,
        'file': 0,
        'mixed': 0,
        'error': 0
    }
    
    for idx, news in enumerate(news_list):
        url = news.get('link', '')
        if not url:
            news['content_type'] = 'no_link'
            news['text_content'] = ''
            news['image_urls'] = ''
            news['file_urls'] = ''
            news['file_names'] = ''
            continue
        
        title = news.get('title', '')[:30] if news.get('title') else ""
        safe_print(f"正在爬取 [{idx+1}/{len(news_list)}]: {title}...")
        
        content = get_xsdt_content(url)
        
        news['content_type'] = content['content_type']
        news['text_content'] = content['text_content']
        news['image_urls'] = '|'.join(content['image_urls'])
        news['file_urls'] = '|'.join(content['file_urls'])
        news['file_names'] = '|'.join(content['file_names'])
        
        content_stats[content['content_type']] += 1
        
        safe_print(f"  内容类型: {content['content_type']}")
        safe_print(f"  图片数量: {len(content['image_urls'])}")
        safe_print(f"  文件数量: {len(content['file_urls'])}")
        safe_print(f"  文本长度: {len(content['text_content'])}")
        safe_print("-" * 40)
        
        time.sleep(0.2)
    
    # 保存结果
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'image_url', 'link', 'read_count', 'content',
                      'content_type', 'text_content', 'image_urls', 'file_urls', 'file_names']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for news in news_list:
            writer.writerow(news)
    
    safe_print(f"\n数据已保存到 {output_file}")
    safe_print("\n内容类型统计:")
    for key, value in content_stats.items():
        safe_print(f"  {key}: {value}条")


if __name__ == "__main__":
    main()