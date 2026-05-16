import requests
from bs4 import BeautifulSoup
import chardet

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# 测试多个页码
pages_to_test = [1, 2, 10, 20, 30, 40, 44, 50, 100, 146, 189]

for page_num in pages_to_test:
    if page_num == 1:
        url = "https://www.cug.edu.cn/index/xsdt.htm"
    else:
        url = f"https://www.cug.edu.cn/index/xsdt/{page_num}.htm"
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        detected = chardet.detect(response.content)
        response.encoding = detected['encoding'] or 'utf-8'
        if response.encoding.lower() in ['gb2312', 'gbk', 'gb18030']:
            response.encoding = 'gb18030'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        items = soup.select('.xblist-oli')
        if items:
            dates = []
            for item in items[:3]:
                date_month = item.select_one('.xblist-date p')
                date_day = item.select_one('.xblist-date h2')
                if date_month and date_day:
                    dates.append(f"{date_month.get_text(strip=True)}-{date_day.get_text(strip=True)}")
            
            print(f"第{page_num}页: {len(items)}条新闻 | 日期范围: {dates[0]} ~ {dates[-1]}")
        else:
            print(f"第{page_num}页: 未找到新闻")
            
    except Exception as e:
        print(f"第{page_num}页: 错误 - {e}")