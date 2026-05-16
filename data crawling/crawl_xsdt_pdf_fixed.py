import requests
from bs4 import BeautifulSoup
import csv
import time
import chardet
import os


def safe_print(text):
    try:
        print(text)
    except UnicodeEncodeError:
        safe_text = text.encode('gbk', errors='replace').decode('gbk', errors='replace')
        print(safe_text)


def find_pdf_links(soup, base_url):
    """第一步：找到PDF文件的真实下载链接"""
    pdf_links = []

    all_links = soup.find_all('a')
    for link in all_links:
        href = link.get('href', '')
        if href:
            lower_href = href.lower()
            if '.pdf' in lower_href or 'pdf' in lower_href:
                if href.startswith('/'):
                    full_url = 'https://www.cug.edu.cn' + href
                elif href.startswith('../'):
                    full_url = base_url + '/' + href[3:]
                elif not href.startswith('http'):
                    full_url = base_url + '/' + href
                else:
                    full_url = href

                file_name = link.get_text(strip=True) or href.split('/')[-1]
                pdf_links.append({'name': file_name, 'url': full_url})

    embeds = soup.find_all('embed')
    for embed in embeds:
        src = embed.get('src', '')
        if src and '.pdf' in src.lower():
            if src.startswith('/'):
                src = 'https://www.cug.edu.cn' + src
            pdf_links.append({'name': 'embedded_pdf', 'url': src})

    return pdf_links


def download_pdf(pdf_url, save_dir='pdf_cache'):
    """第二步：下载PDF文件"""
    os.makedirs(save_dir, exist_ok=True)

    pdf_name = pdf_url.split('/')[-1]
    if not pdf_name.endswith('.pdf'):
        pdf_name += '.pdf'
    pdf_path = os.path.join(save_dir, pdf_name)

    if os.path.exists(pdf_path):
        safe_print(f"  PDF已缓存: {pdf_name}")
        return pdf_path

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(pdf_url, headers=headers, timeout=30)
        if response.status_code == 200:
            with open(pdf_path, 'wb') as f:
                f.write(response.content)
            safe_print(f"  PDF下载成功: {pdf_name} ({len(response.content)} bytes)")
            return pdf_path
    except Exception as e:
        safe_print(f"  PDF下载失败: {e}")
        return None


def extract_pdf_text(pdf_path):
    """第三步：解析PDF中的文本内容"""
    text_content = []

    # 方法1：使用pypdf
    try:
        import pypdf

        with open(pdf_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            safe_print(f"  PDF页数: {len(reader.pages)}")

            for page_num, page in enumerate(reader.pages, 1):
                try:
                    text = page.extract_text()
                    if text:
                        text_content.append(f"[第{page_num}页]\n{text}")
                except:
                    continue

        return '\n\n'.join(text_content)

    except ImportError:
        pass

    # 方法2：使用pdfplumber
    try:
        import pdfplumber

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    text_content.append(f"[第{page_num}页]\n{text}")

        return '\n\n'.join(text_content)

    except ImportError:
        safe_print("  提示: 请安装PDF处理库")
        return ""

    return '\n\n'.join(text_content)


def extract_pdf_images(pdf_path):
    """从PDF中提取图片"""
    images = []

    try:
        import fitz

        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc, 1):
            image_list = page.get_images()
            for img_index, img in enumerate(image_list):
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha < 4:
                    img_name = f"page{page_num}_img{img_index+1}.png"
                    img_path = os.path.join('pdf_images', img_name)
                    os.makedirs('pdf_images', exist_ok=True)
                    if pix.n < 5:
                        pix.save(img_path)
                    else:
                        pix1 = fitz.Pixmap(fitz.csRGB, pix)
                        pix1.save(img_path)
                    images.append(img_path)
                pix = None
        doc.close()

    except ImportError:
        safe_print("  提示: 未安装pymupdf")

    return images


def process_news_with_pdf(url):
    """处理包含PDF的新闻"""
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

        text_content = ""
        content_elem = soup.select_one('article, .article, .content, .news-content')
        if content_elem:
            text_content = content_elem.get_text(strip=True)

        if not text_content:
            paragraphs = soup.select('p')
            text_content = '\n'.join([p.get_text(strip=True) for p in paragraphs[:20]])

        pdf_links = find_pdf_links(soup, 'https://www.cug.edu.cn')

        result = {
            'has_pdf': len(pdf_links) > 0,
            'pdf_links': pdf_links,
            'pdf_texts': [],
            'pdf_images': [],
            'web_text': text_content
        }

        if pdf_links:
            safe_print(f"  发现{len(pdf_links)}个PDF文件")
            for pdf_info in pdf_links:
                pdf_path = download_pdf(pdf_info['url'])
                if pdf_path:
                    text = extract_pdf_text(pdf_path)
                    if text:
                        result['pdf_texts'].append({'name': pdf_info['name'], 'text': text})
                    images = extract_pdf_images(pdf_path)
                    if images:
                        result['pdf_images'].extend(images)

        return result

    except Exception as e:
        return {
            'has_pdf': False,
            'pdf_links': [],
            'pdf_texts': [],
            'pdf_images': [],
            'web_text': '',
            'error': str(e)
        }


def main():
    input_file = "xueshudongtai.CSV"
    output_file = "xueshudongtai_with_pdf.CSV"

    safe_print("=" * 70)
    safe_print("学术动态PDF内容专项爬取")
    safe_print("功能：1) 查找PDF链接  2) 下载PDF  3) 解析PDF文本/图片")
    safe_print("=" * 70)

    news_list = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            news_list.append(row)

    safe_print(f"共找到 {len(news_list)} 条新闻")
    safe_print("-" * 70)

    pdf_count = 0
    web_only_count = 0

    for idx, news in enumerate(news_list):
        url = news.get('link', '').strip()
        if not url:
            news['PDF链接'] = ''
            news['PDF文本内容'] = ''
            news['PDF图片'] = ''
            continue

        title = news.get('title', '')[:30] if news.get('title') else ""
        safe_print(f"\n[{idx+1}/{len(news_list)}] {title}")

        result = process_news_with_pdf(url)

        if result['has_pdf']:
            pdf_count += 1
            news['PDF链接'] = '\n'.join([p['url'] for p in result['pdf_links']])
            if result['pdf_texts']:
                pdf_text_combined = '\n\n'.join([f"【{p['name']}】\n{p['text']}" for p in result['pdf_texts']])
                news['PDF文本内容'] = pdf_text_combined[:8000]
            else:
                news['PDF文本内容'] = ''
            news['PDF图片'] = '\n'.join(result['pdf_images']) if result['pdf_images'] else ''
            safe_print(f"  ✓ 含PDF内容")
        else:
            web_only_count += 1
            news['PDF链接'] = ''
            news['PDF文本内容'] = ''
            news['PDF图片'] = ''
            safe_print(f"  - 网页内容")

        time.sleep(0.3)

    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['date', 'title', 'link', 'PDF链接', 'PDF文本内容', 'PDF图片']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for news in news_list:
            row = {k: news.get(k, '') for k in fieldnames}
            writer.writerow(row)

    safe_print("\n" + "=" * 70)
    safe_print(f"爬取完成！统计结果：")
    safe_print(f"  含PDF内容的新闻: {pdf_count} 条")
    safe_print(f"  仅网页内容的新闻: {web_only_count} 条")
    safe_print(f"  PDF文件已保存到: pdf_cache/ 目录")
    safe_print(f"  PDF图片已保存到: pdf_images/ 目录")
    safe_print(f"  数据已保存到: {output_file}")
    safe_print("=" * 70)


if __name__ == "__main__":
    main()