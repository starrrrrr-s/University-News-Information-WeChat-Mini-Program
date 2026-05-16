import requests
from bs4 import BeautifulSoup
import chardet
import re

# 分析网站的分页机制
url = "https://www.cug.edu.cn/index/ldsr.htm"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

try:
    response = requests.get(url, headers=headers, timeout=15)
    print(f"状态码: {response.status_code}")
    
    detected = chardet.detect(response.content)
    response.encoding = detected['encoding'] or 'utf-8'
    if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
        response.encoding = 'gb18030'
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 查找分页相关的JavaScript代码
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string:
            # 查找包含分页逻辑的代码
            if 'page' in script.string.lower() or 'pagination' in script.string.lower():
                print("\n分页相关JavaScript:")
                print(script.string[:500] + "..." if len(script.string) > 500 else script.string)
    
    # 查找所有a标签，寻找分页链接
    print("\n所有a标签链接:")
    for a in soup.find_all('a', href=True):
        href = a.get('href')
        text = a.get_text(strip=True)
        # 查找包含数字的链接，可能是分页链接
        if re.search(r'\d', href) and ('ldsr' in href or 'index' in href):
            print(f"  {text}: {href}")
    
    # 查找可能的分页容器
    pagination = soup.select('.pagination, .page, .pages, .paging')
    if pagination:
        print("\n分页容器:")
        for p in pagination:
            print(p.prettify())
    
    # 查找新闻项数量
    items = soup.select('.xblist-oli')
    print(f"\n第1页找到 {len(items)} 条新闻")
    
    # 测试第2页
    page2_url = "https://www.cug.edu.cn/index/ldsr/2.htm"
    page2_response = requests.get(page2_url, headers=headers)
    page2_soup = BeautifulSoup(page2_response.text, 'html.parser')
    page2_items = page2_soup.select('.xblist-oli')
    print(f"第2页找到 {len(page2_items)} 条新闻")
    
    # 测试第26页
    page26_url = "https://www.cug.edu.cn/index/ldsr/26.htm"
    page26_response = requests.get(page26_url, headers=headers)
    page26_soup = BeautifulSoup(page26_response.text, 'html.parser')
    page26_items = page26_soup.select('.xblist-oli')
    print(f"第26页找到 {len(page26_items)} 条新闻")
    
    # 尝试从第1页获取总页数
    # 查找包含"共"、"页"等关键词的元素
    total_pages = None
    for elem in soup.find_all(text=re.compile(r'共\d+页')):
        match = re.search(r'共(\d+)页', elem)
        if match:
            total_pages = int(match.group(1))
            print(f"\n总页数: {total_pages}")
    
    if not total_pages:
        print("\n未找到总页数信息")
        
except Exception as e:
    print(f"错误: {e}")
    import traceback
    traceback.print_exc()