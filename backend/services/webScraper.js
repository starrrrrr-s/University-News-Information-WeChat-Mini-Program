const axios = require('axios');
const cheerio = require('cheerio');

class WebScraper {
  static async fetchContent(url) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      let title = $('title').text() || '';
      let content = '';
      const selectors = [
        'article',
        '.article-content',
        '.news-content',
        '.content',
        '#content',
        'main',
        '.post-content'
      ];
      
      for (const selector of selectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 100) break;
        }
      }
      
      if (content.length < 100) {
        content = $('p').map((i, el) => $(el).text()).get().join('\n').trim();
      }
      
      return {
        success: true,
        title: title.replace(/\s+/g, ' ').trim(),
        content: content.replace(/\s+/g, ' ').trim()
      };
    } catch (error) {
      console.error('网页抓取失败:', error.message);
      return {
        success: false,
        error: '无法获取网页内容'
      };
    }
  }
}

module.exports = WebScraper;
