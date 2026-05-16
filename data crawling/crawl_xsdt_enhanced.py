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


def analyze_content_type(soup, url):
    """分析页面内容类型"""
    text_length = 0
    image_count = 0
    file_count = 0
    
    # 计算文本长度
    all_text = soup.get_text(strip=True)
    text_length = len(all_text)
    
    # 统计图片数量
    all_imgs = soup.find_all('img')
    valid_images = []
    for img in all_imgs:
        src = img.get('src', '')
        if src and 'icon' not in src.lower() and 'logo' not in src.lower():
            if src.startswith('/'):
                src = 'https://www.cug.edu.cn' + src
            valid_images.append(src)
    image_count = len(valid_images)
    
    # 统计文件数量
    file_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar']
    all_links = soup.find_all('a')
    valid_files = []
    for link in all_links:
        href = link.get('href', '')
        if href:
            lower_href = href.lower()
            for ext in file_extensions:
                if ext in lower_href:
                    if href.startswith('/'):
                        href = 'https://www.cug.edu.cn' + href
                    file_name = link.get_text(strip=True) or href.split('/')[-1]
                    valid_files.append({'name': file_name, 'url': href})
                    break
    file_count = len(valid_files)
    
    # 判断内容类型
    if file_count > 0:
        return 'report'  # 报告/文件类型
    elif image_count >= 2 and text_length < 500:
        return 'image'   # 图片类型
    elif text_length >= 500:
        return 'text'    # 文字类型
    else:
        return 'mixed'   # 混合类型


def extract_text_content(soup):
    """提取文本内容"""
    text_content = ""
    
    # 尝试多种方式提取文本
    methods = [
        'article',
        '.article',
        '.content',
        '.news-content',
        '.news-detail',
        '.article-content',
        'div[class*="content"]',
        'div.TRS_Editor',
        'div.v_news_content',
        '.entry-content'
    ]
    
    for selector in methods:
        elem = soup.select_one(selector)
        if elem:
            text_content = elem.get_text(strip=True)[:5000]
            if text_content:
                break
    
    # 如果以上都不行，提取所有段落
    if not text_content:
        paragraphs = soup.find_all('p')
        if paragraphs:
            text_content = '\n'.join([p.get_text(strip=True) for p in paragraphs[:30]])[:5000]
    
    return text_content


def extract_images(soup):
    """提取图片链接"""
    images = []
    all_imgs = soup.find_all('img')
    
    for img in all_imgs:
        src = img.get('src', '')
        if src:
            # 过滤小图标
            if 'icon' in src.lower() or 'logo' in src.lower():
                continue
            
            # 处理相对路径
            if src.startswith('/'):
                src = 'https://www.cug.edu.cn' + src
            elif src.startswith('../'):
                src = 'https://www.cug.edu.cn/index/' + src[3:]
            
            # 获取图片描述
            alt = img.get('alt', '') or img.get('title', '')
            images.append({'url': src, 'description': alt})
    
    return images


def extract_files(soup):
    """提取文件下载链接"""
    files = []
    file_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar']
    all_links = soup.find_all('a')
    
    for link in all_links:
        href = link.get('href', '')
        if href:
            lower_href = href.lower()
            for ext in file_extensions:
                if ext in lower_href:
                    if href.startswith('/'):
                        href = 'https://www.cug.edu.cn' + href
                    file_name = link.get_text(strip=True) or href.split('/')[-1]
                    files.append({'name': file_name, 'url': href})
                    break
    
    return files


def get_news_details(url):
    """获取新闻详情，返回结构化数据"""
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
        
        content_type = analyze_content_type(soup, url)
        text = extract_text_content(soup)
        images = extract_images(soup)
        files = extract_files(soup)
        
        return {
            'success': True,
            'content_type': content_type,
            'text_content': text,
            'images': images,
            'files': files
        }
        
    except Exception as e:
        return {
            'success': False,
            'content_type': 'error',
            'text_content': '',
            'images': [],
            'files': [],
            'error': str(e)
        }


def main():
    input_file = "xueshudongtai.CSV"
    output_file = "xueshudongtai_categorized.CSV"
    
    safe_print("=" * 70)
    safe_print("学术动态内容智能分类爬取")
    safe_print("=" * 70)
    
    # 读取输入文件
    news_list = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            news_list.append(row)
    
    safe_print(f"共找到 {len(news_list)} 条新闻")
    safe_print("-" * 70)
    
    # 统计各类内容数量
    category_counts = {
        'text': 0,
        'image': 0,
        'report': 0,
        'mixed': 0,
        'error': 0
    }
    
    # 爬取每条新闻的详情
    for idx, news in enumerate(news_list):
        url = news.get('link', '').strip()
        if not url:
            news['内容类型'] = '无链接'
            news['正文内容'] = ''
            news['图片列表'] = ''
            news['文件列表'] = ''
            continue
        
        title = news.get('title', '')[:30] if news.get('title') else ""
        safe_print(f"[{idx+1}/{len(news_list)}] 正在爬取: {title}")
        
        result = get_news_details(url)
        
        if result['success']:
            news['内容类型'] = result['content_type']
            news['正文内容'] = result['text_content']
            
            # 格式化图片列表
            if result['images']:
                img_lines = []
                for i, img in enumerate(result['images'], 1):
                    desc = img['description'] if img['description'] else f"图片{i}"
                    img_lines.append(f"{desc}: {img['url']}")
                news['图片列表'] = '\n'.join(img_lines)
            else:
                news['图片列表'] = ''
            
            # 格式化文件列表
            if result['files']:
                file_lines = []
                for file in result['files']:
                    file_lines.append(f"{file['name']}: {file['url']}")
                news['文件列表'] = '\n'.join(file_lines)
            else:
                news['文件列表'] = ''
            
            category_counts[result['content_type']] += 1
            safe_print(f"  → 内容类型: {result['content_type']}")
            safe_print(f"  → 图片数量: {len(result['images'])}")
            safe_print(f"  → 文件数量: {len(result['files'])}")
        else:
            news['内容类型'] = '爬取失败'
            news['正文内容'] = ''
            news['图片列表'] = ''
            news['文件列表'] = ''
            category_counts['error'] += 1
            safe_print(f"  → 爬取失败: {result['error']}")
        
        safe_print("-" * 50)
        time.sleep(0.3)
    
    # 保存结果
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'link', '内容类型', '正文内容', '图片列表', '文件列表']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for news in news_list:
            row = {k: news.get(k, '') for k in fieldnames}
            writer.writerow(row)
    
    # 输出统计结果
    safe_print("=" * 70)
    safe_print("爬取完成！内容分类统计：")
    safe_print("=" * 70)
    for category, count in category_counts.items():
        safe_print(f"  {category}: {count} 条")
    safe_print("=" * 70)
    safe_print(f"数据已保存到: {output_file}")


if __name__ == "__main__":
    main()