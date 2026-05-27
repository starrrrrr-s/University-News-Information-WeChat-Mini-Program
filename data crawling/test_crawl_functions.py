import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from bs4 import BeautifulSoup

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crawl_xsdt_content import safe_print, get_xsdt_content
from crawl_xsdt_enhanced import analyze_content_type, extract_text_content, extract_images, extract_files


class TestSafePrint(unittest.TestCase):
    """测试safe_print函数"""
    
    def test_safe_print_normal_text(self):
        """测试正常文本打印"""
        # safe_print应该不会抛出异常
        try:
            safe_print("Hello World")
            safe_print("正常中文测试")
        except Exception as e:
            self.fail(f"safe_print抛出异常: {e}")
    
    def test_safe_print_special_characters(self):
        """测试特殊字符处理"""
        special_text = "Test with special chars: \x00 \x1f \xff"
        try:
            safe_print(special_text)
        except Exception as e:
            self.fail(f"safe_print处理特殊字符时抛出异常: {e}")


class TestAnalyzeContentType(unittest.TestCase):
    """测试内容类型分析函数"""
    
    def test_analyze_content_type_report(self):
        """测试报告类型（包含文件）"""
        html = '''<html>
            <body>
                <a href="/docs/report.pdf">下载报告</a>
                <p>Some text</p>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = analyze_content_type(soup, 'http://example.com')
        self.assertEqual(result, 'report')
    
    def test_analyze_content_type_image(self):
        """测试图片类型"""
        html = '''<html>
            <body>
                <img src="/images/photo1.jpg">
                <img src="/images/photo2.jpg">
                <p>Short text</p>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = analyze_content_type(soup, 'http://example.com')
        self.assertEqual(result, 'image')
    
    def test_analyze_content_type_text(self):
        """测试文本类型"""
        html = '''<html>
            <body>
                <p>This is a long text content that exceeds 500 characters. ''' + 'x' * 500 + '''</p>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = analyze_content_type(soup, 'http://example.com')
        self.assertEqual(result, 'text')
    
    def test_analyze_content_type_mixed(self):
        """测试混合类型"""
        html = '''<html>
            <body>
                <img src="/images/photo.jpg">
                <p>Some moderate text content</p>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = analyze_content_type(soup, 'http://example.com')
        self.assertEqual(result, 'mixed')


class TestExtractTextContent(unittest.TestCase):
    """测试文本提取函数"""
    
    def test_extract_text_from_article_tag(self):
        """测试从article标签提取文本"""
        html = '''<html>
            <article>这是文章内容</article>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_text_content(soup)
        self.assertEqual(result, '这是文章内容')
    
    def test_extract_text_from_class_content(self):
        """测试从class=content提取文本"""
        html = '''<html>
            <div class="content">这是内容区域</div>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_text_content(soup)
        self.assertEqual(result, '这是内容区域')
    
    def test_extract_text_from_paragraphs(self):
        """测试从p标签提取文本"""
        html = '''<html>
            <body>
                <p>第一段</p>
                <p>第二段</p>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_text_content(soup)
        self.assertEqual(result, '第一段\n第二段')
    
    def test_extract_text_empty(self):
        """测试空内容"""
        html = '''<html><body></body></html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_text_content(soup)
        self.assertEqual(result, '')


class TestExtractImages(unittest.TestCase):
    """测试图片提取函数"""
    
    def test_extract_images_absolute_path(self):
        """测试提取绝对路径图片"""
        html = '''<html>
            <body>
                <img src="https://example.com/img.jpg" alt="测试图片">
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_images(soup)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['url'], 'https://example.com/img.jpg')
        self.assertEqual(result[0]['description'], '测试图片')
    
    def test_extract_images_relative_path(self):
        """测试提取相对路径图片"""
        html = '''<html>
            <body>
                <img src="/img/test.jpg">
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_images(soup)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['url'], 'https://www.cug.edu.cn/img/test.jpg')
    
    def test_filter_icon_images(self):
        """测试过滤图标图片"""
        html = '''<html>
            <body>
                <img src="/images/icon.png">
                <img src="/images/logo.png">
                <img src="/images/photo.jpg">
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_images(soup)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['url'], 'https://www.cug.edu.cn/images/photo.jpg')


class TestExtractFiles(unittest.TestCase):
    """测试文件提取函数"""
    
    def test_extract_pdf_file(self):
        """测试提取PDF文件"""
        html = '''<html>
            <body>
                <a href="/docs/report.pdf">下载PDF报告</a>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_files(soup)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['name'], '下载PDF报告')
        self.assertEqual(result[0]['url'], 'https://www.cug.edu.cn/docs/report.pdf')
    
    def test_extract_multiple_files(self):
        """测试提取多个文件"""
        html = '''<html>
            <body>
                <a href="/docs/report.pdf">报告</a>
                <a href="/docs/data.docx">文档</a>
                <a href="/docs/archive.zip">压缩包</a>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_files(soup)
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]['name'], '报告')
        self.assertEqual(result[1]['name'], '文档')
        self.assertEqual(result[2]['name'], '压缩包')
    
    def test_extract_files_relative_path(self):
        """测试提取相对路径文件"""
        html = '''<html>
            <body>
                <a href="/files/test.xlsx">Excel文件</a>
            </body>
        </html>'''
        soup = BeautifulSoup(html, 'html.parser')
        result = extract_files(soup)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['url'], 'https://www.cug.edu.cn/files/test.xlsx')


class TestGetXsdtContent(unittest.TestCase):
    """测试get_xsdt_content函数"""
    
    @patch('chardet.detect')
    @patch('requests.get')
    def test_get_xsdt_content_text_type(self, mock_get, mock_detect):
        """测试获取纯文本内容"""
        html_content = '<html><body><article>文章内容</article></body></html>'
        mock_response = Mock()
        mock_response.content = html_content.encode('utf-8')
        mock_response.text = html_content
        mock_get.return_value = mock_response
        mock_detect.return_value = {'encoding': 'utf-8'}
        
        result = get_xsdt_content('http://example.com')
        self.assertEqual(result['content_type'], 'text')
        self.assertEqual(result['text_content'], '文章内容')
        self.assertEqual(len(result['image_urls']), 0)
        self.assertEqual(len(result['file_urls']), 0)
    
    @patch('chardet.detect')
    @patch('requests.get')
    def test_get_xsdt_content_with_images(self, mock_get, mock_detect):
        """测试获取包含图片的内容"""
        html_content = '''<html>
            <body>
                <img src="/img1.jpg">
                <img src="/img2.jpg">
                <p>一些文本</p>
            </body>
        </html>'''
        mock_response = Mock()
        mock_response.content = html_content.encode('utf-8')
        mock_response.text = html_content
        mock_get.return_value = mock_response
        mock_detect.return_value = {'encoding': 'utf-8'}
        
        result = get_xsdt_content('http://example.com')
        self.assertEqual(result['content_type'], 'mixed')
        self.assertEqual(len(result['image_urls']), 2)
    
    @patch('requests.get')
    def test_get_xsdt_content_error(self, mock_get):
        """测试请求失败的情况"""
        mock_get.side_effect = Exception('网络错误')
        
        result = get_xsdt_content('http://example.com')
        self.assertEqual(result['content_type'], 'error')


if __name__ == '__main__':
    unittest.main(verbosity=2)