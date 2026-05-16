const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const sequelize = require('./config/db');
const News = require('./models/News');
const Category = require('./models/Category');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let cachedNews = [];
let cachedCategories = [];
let isInitialized = false;

async function initializeData() {
  try {
    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    console.log('正在加载新闻数据...');
    cachedNews = await News.findAll({
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['published_at', 'DESC'], ['created_at', 'DESC']]
    });
    cachedNews = cachedNews.map(n => n.toJSON());
    console.log(`加载了 ${cachedNews.length} 条新闻`);

    console.log('正在加载分类数据...');
    cachedCategories = await Category.findAll();
    cachedCategories = cachedCategories.map(c => c.toJSON());
    console.log(`加载了 ${cachedCategories.length} 个分类`);

    isInitialized = true;
    console.log('数据初始化完成');
  } catch (error) {
    console.error('数据初始化失败:', error.message);
  }
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

app.get('/api/news/latest', (req, res) => {
  if (!isInitialized) {
    return res.json({ success: false, message: '数据未初始化' });
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const total = cachedNews.length;
  const newsList = cachedNews.slice(offset, offset + limit).map(item => {
    const category = item.Category || { id: item.category_id, name: '未分类' };
    const images = parseImages(item.image_url);
    
    return {
      id: item.id,
      title: item.title,
      summary: item.summary || item.content.substring(0, 100) + '...',
      content: item.content,
      category: category.name,
      categoryId: category.id,
      author: item.author,
      image: images[0] || null,
      images: images,
      date: item.published_at ? formatDate(item.published_at) : formatDate(item.created_at),
      views: item.views || 0
    };
  });

  res.json({
    success: true,
    data: newsList,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit),
      total
    }
  });
});

app.get('/api/news', (req, res) => {
  if (!isInitialized) {
    return res.json({ success: false, message: '数据未初始化' });
  }
  
  const { category_id, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  let filteredNews = cachedNews;
  if (category_id) {
    filteredNews = filteredNews.filter(n => n.category_id == category_id);
  }
  
  const total = filteredNews.length;
  const newsList = filteredNews.slice(offset, offset + parseInt(limit)).map(item => {
    const category = item.Category || { id: item.category_id, name: '未分类' };
    const imageUrl = item.image_url ? 
      (item.image_url.startsWith('http') ? item.image_url : `http://localhost:3001${item.image_url}`) : null;
    
    return {
      id: item.id,
      title: item.title,
      summary: item.summary || item.content.substring(0, 100) + '...',
      content: item.content,
      category: category.name,
      categoryId: category.id,
      author: item.author,
      image: imageUrl,
      date: item.published_at ? formatDate(item.published_at) : formatDate(item.created_at),
      views: item.views || 0
    };
  });

  res.json({
    success: true,
    data: newsList,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
});

app.get('/api/news/search', (req, res) => {
  if (!isInitialized) {
    return res.json({ success: false, message: '数据未初始化' });
  }

  const { keyword, page = 1, pageSize = 10 } = req.query;

  if (!keyword || !keyword.trim()) {
    return res.json({ success: true, data: [], pagination: { page: 1, pageSize: 10, total: 0, pages: 0 } });
  }

  const searchTerm = keyword.toLowerCase().trim();
  const pageNum = parseInt(page) || 1;
  const size = parseInt(pageSize) || 10;

  const isFullDateSearch = /^\d{4}-\d{2}-\d{2}$/.test(searchTerm);
  const isMonthSearch = /^\d{4}-\d{2}$/.test(searchTerm);
  const isYearSearch = /^\d{4}$/.test(searchTerm);

  let filteredNews = cachedNews.filter(item => {
    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    const category = ((item.Category && item.Category.name) || '').toLowerCase();

    let matches = false;

    if (isFullDateSearch) {
       const date = item.published_at || item.created_at;
       if (date) {
         const dateStr = formatDate(date);
         const searchParts = searchTerm.split('-');
         const dateParts = dateStr.split('-');

         matches = searchParts[0] === dateParts[0] && searchParts[1] === dateParts[1] && searchParts[2] === dateParts[2];
       }
     } else if (isMonthSearch) {
       const date = item.published_at || item.created_at;
       if (date) {
         const dateStr = formatDate(date);
         const searchParts = searchTerm.split('-');
         const dateParts = dateStr.split('-');

         matches = searchParts[0] === dateParts[0] && searchParts[1] === dateParts[1];
       }
     } else if (isYearSearch) {
       const date = item.published_at || item.created_at;
       if (date) {
         const dateStr = formatDate(date);
         const dateParts = dateStr.split('-');

         matches = searchTerm === dateParts[0];
       }
     } else {
      matches = title.includes(searchTerm) || summary.includes(searchTerm) || content.includes(searchTerm);

      const categoryNames = ['立德树人', '科技创新', '学术动态', '媒体地大'];
      const matchedCategory = categoryNames.find(name => name.toLowerCase().includes(searchTerm));
      matches = matches || category.includes(searchTerm) || (matchedCategory && item.category_id === categoryNames.indexOf(matchedCategory) + 1);

      const date = item.published_at || item.created_at;
      if (date) {
        const dateStr = formatDate(date).toLowerCase();
        matches = matches || dateStr.includes(searchTerm);
      }
    }

    return matches;
  });

  const total = filteredNews.length;
  const totalPages = Math.ceil(total / size);
  const offset = (pageNum - 1) * size;
  const paginatedNews = filteredNews.slice(offset, offset + size);

  const newsList = paginatedNews.map(item => {
    const category = item.Category || { id: item.category_id, name: '未分类' };
    const images = parseImages(item.image_url);

    return {
      id: item.id,
      title: item.title,
      summary: item.summary || item.content.substring(0, 100) + '...',
      content: item.content,
      category: category.name,
      categoryId: category.id,
      author: item.author,
      image: images[0] || null,
      images: images,
      date: item.published_at ? formatDate(item.published_at) : formatDate(item.created_at),
      views: item.views || 0
    };
  });

  res.json({
    success: true,
    data: newsList,
    pagination: {
      page: pageNum,
      pageSize: size,
      total: total,
      pages: totalPages
    }
  });
});

function parseImages(imageUrl) {
  if (!imageUrl) return [];
  
  let images = [];
  
  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) {
      images = parsed;
    } else if (typeof parsed === 'string') {
      images = [parsed];
    }
  } catch {
    images = imageUrl.split(/[,，;；]/).filter(img => img.trim());
  }
  
  return images.map(img => {
    const trimmed = img.trim();
    if (trimmed.startsWith('http')) {
      return `http://localhost:3001/proxy/image?url=${encodeURIComponent(trimmed)}`;
    }
    return `http://localhost:3001${trimmed}`;
  });
}

app.get('/api/news/:id', (req, res) => {
  if (!isInitialized) {
    return res.json({ success: false, message: '数据未初始化' });
  }
  
  const { id } = req.params;
  // 尝试多种方式匹配ID：数字、字符串、去除前后空格
  const item = cachedNews.find(n => 
    n.id == id || 
    String(n.id) === String(id) ||
    String(n.id).trim() === String(id).trim()
  );
  
  if (!item) {
    return res.json({ success: false, message: '新闻不存在' });
  }
  
  const category = item.Category || { id: item.category_id, name: '未分类' };
  const images = parseImages(item.image_url);
  
  res.json({
    success: true,
    data: {
      id: item.id,
      title: item.title,
      summary: item.summary || item.content.substring(0, 150) + '...',
      content: item.content,
      category: category.name,
      categoryId: category.id,
      author: item.author,
      image: images[0] || null,
      images: images,
      date: item.published_at ? formatDate(item.published_at) : formatDate(item.created_at),
      views: item.views || 0
    }
  });
});

app.get('/api/categories', (req, res) => {
  if (!isInitialized) {
    return res.json({ success: false, message: '数据未初始化' });
  }
  
  res.json({ success: true, data: cachedCategories });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务正常运行', initialized: isInitialized });
});

app.get('/proxy/image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: '缺少图片URL' });
  }

  const protocol = imageUrl.startsWith('https') ? https : http;
  
  protocol.get(imageUrl, (response) => {
    if (response.statusCode !== 200) {
      res.status(404).json({ success: false, message: '图片获取失败' });
      return;
    }

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    response.pipe(res);
  }).on('error', (err) => {
    console.error('图片代理错误:', err.message);
    res.status(500).json({ success: false, message: '图片代理失败' });
  });
});

initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
});
