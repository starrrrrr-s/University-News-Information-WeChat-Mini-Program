import requests
from bs4 import BeautifulSoup
import csv
import time
import chardet


def safe_print(text):
    try:
        print(text)
    except UnicodeEncodeError:
        safe_text = text.encode('gbk', errors='replace').decode('gbk', errors='replace')
        print(safe_text)


def get_xsdt_content(url):
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
        
        image_links = []
        file_links = []
        
        # 获取所有图片链接
        all_imgs = soup.find_all('img')
        for img in all_imgs:
            img_src = img.get('src', '')
            if img_src:
                if img_src.startswith('/'):
                    img_src = 'https://www.cug.edu.cn' + img_src
                elif img_src.startswith('http'):
                    pass
                elif img_src.startswith('../'):
                    img_src = 'https://www.cug.edu.cn/index/' + img_src[3:]
                # 过滤小图标
                if 'icon' not in img_src.lower() and 'logo' not in img_src.lower():
                    image_links.append(img_src)
        
        # 获取所有文件链接
        all_links = soup.find_all('a')
        for link in all_links:
            href = link.get('href', '')
            if href:
                file_exts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar']
                lower_href = href.lower()
                for ext in file_exts:
                    if ext in lower_href:
                        if href.startswith('/'):
                            href = 'https://www.cug.edu.cn' + href
                        file_links.append(f"{link.get_text(strip=True) or href.split('/')[-1]}|{href}")
                        break
        
        # 获取文本内容
        text_content = ""
        content_div = soup.select_one('.article-content, .content, article, div[class*="content"]')
        if content_div:
            text_content = content_div.get_text(strip=True)[:5000]
        else:
            paragraphs = soup.find_all('p')
            if paragraphs:
                text_content = '\n'.join([p.get_text(strip=True) for p in paragraphs[:20]])[:5000]
        
        return {
            'images': image_links,
            'files': file_links,
            'text': text_content
        }
        
    except Exception as e:
        safe_print(f"获取详情页 {url} 失败: {e}")
        return {'images': [], 'files': [], 'text': ''}


def main():
    input_file = "xueshudongtai.CSV"
    output_file = "xueshudongtai_final.CSV"
    
    safe_print(f"正在处理学术动态数据，修复图片链接格式...")
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
            news['图片链接'] = ''
            news['文件链接'] = ''
            news['新闻正文'] = ''
            continue
        
        title = news.get('title', '')[:30] if news.get('title') else ""
        safe_print(f"正在处理 [{idx+1}/{len(news_list)}]: {title}...")
        
        content = get_xsdt_content(url)
        
        # 格式化图片链接（每行一个）
        if content['images']:
            news['图片链接'] = '\n'.join(content['images'])
        else:
            news['图片链接'] = ''
        
        # 格式化文件链接
        if content['files']:
            news['文件链接'] = '\n'.join(content['files'])
        else:
            news['文件链接'] = ''
        
        news['新闻正文'] = content['text']
        
        safe_print(f"  图片数量: {len(content['images'])}")
        safe_print(f"  文件数量: {len(content['files'])}")
        safe_print("-" * 40)
        
        time.sleep(0.2)
    
    # 保存结果
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'link', '图片链接', '文件链接', '新闻正文']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for news in news_list:
            row = {k: news.get(k, '') for k in fieldnames}
            writer.writerow(row)
    
    safe_print(f"\n数据已保存到 {output_file}")
    safe_print("图片链接现在是可点击的URL格式了！")


if __name__ == "__main__":
    main()