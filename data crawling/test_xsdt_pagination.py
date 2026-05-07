import requests
from bs4 import BeautifulSoup
import chardet

# 测试不同页码的URL
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# 测试第1页
print("=== 测试第1页 ===")
url1 = "https://www.cug.edu.cn/index/xsdt.htm"
response = requests.get(url1, headers=headers)
detected = chardet.detect(response.content)
response.encoding = detected['encoding'] or 'utf-8'
if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
    response.encoding = 'gb18030'
soup = BeautifulSoup(response.text, 'html.parser')
items = soup.select('.xblist-oli')
for i, item in enumerate(items[:3]):
    date_month = item.select_one('.xblist-date p')
    date_day = item.select_one('.xblist-date h2')
    if date_month and date_day:
        date = f"{date_month.get_text(strip=True)}-{date_day.get_text(strip=True)}"
    title_elem = item.select_one('.xblist-title a')
    if title_elem:
        title = title_elem.get_text(strip=True)[:50]
    print(f"  第{i+1}条: {date} - {title}")

# 测试第2页（直接URL）
print("\n=== 测试第2页 (xsdt/2.htm) ===")
url2 = "https://www.cug.edu.cn/index/xsdt/2.htm"
response = requests.get(url2, headers=headers)
detected = chardet.detect(response.content)
response.encoding = detected['encoding'] or 'utf-8'
if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
    response.encoding = 'gb18030'
soup = BeautifulSoup(response.text, 'html.parser')
items = soup.select('.xblist-oli')
for i, item in enumerate(items[:3]):
    date_month = item.select_one('.xblist-date p')
    date_day = item.select_one('.xblist-date h2')
    if date_month and date_day:
        date = f"{date_month.get_text(strip=True)}-{date_day.get_text(strip=True)}"
    title_elem = item.select_one('.xblist-title a')
    if title_elem:
        title = title_elem.get_text(strip=True)[:50]
    print(f"  第{i+1}条: {date} - {title}")

# 测试第43页（反向后的值）
print("\n=== 测试第43页 (xsdt/43.htm) ===")
url43 = "https://www.cug.edu.cn/index/xsdt/43.htm"
response = requests.get(url43, headers=headers)
detected = chardet.detect(response.content)
response.encoding = detected['encoding'] or 'utf-8'
if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
    response.encoding = 'gb18030'
soup = BeautifulSoup(response.text, 'html.parser')
items = soup.select('.xblist-oli')
for i, item in enumerate(items[:3]):
    date_month = item.select_one('.xblist-date p')
    date_day = item.select_one('.xblist-date h2')
    if date_month and date_day:
        date = f"{date_month.get_text(strip=True)}-{date_day.get_text(strip=True)}"
    title_elem = item.select_one('.xblist-title a')
    if title_elem:
        title = title_elem.get_text(strip=True)[:50]
    print(f"  第{i+1}条: {date} - {title}")

# 查找分页链接
print("\n=== 查找分页链接 ===")
response = requests.get(url1, headers=headers)
detected = chardet.detect(response.content)
response.encoding = detected['encoding'] or 'utf-8'
if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
    response.encoding = 'gb18030'
soup = BeautifulSoup(response.text, 'html.parser')
pagination = soup.select('.pagination')
if pagination:
    for a in pagination[0].find_all('a', href=True):
        print(f"  {a.get_text(strip=True)}: {a.get('href')}")
else:
    print("  未找到分页信息")