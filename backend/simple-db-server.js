const express = require('express');
const cors = require('cors');
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
  
  const limit = parseInt(req.query.limit) || 5;
  const news = cachedNews.slice(0, limit).map(item => {
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

  res.json({ success: true, data: news });
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

app.get('/api/news/:id', (req, res) => {
  if (!isInitialized) {
    return res.json({ success: false, message: '数据未初始化' });
  }
  
  const { id } = req.params;
  const item = cachedNews.find(n => n.id == id);
  
  if (!item) {
    return res.json({ success: false, message: '新闻不存在' });
  }
  
  const category = item.Category || { id: item.category_id, name: '未分类' };
  const imageUrl = item.image_url ? 
    (item.image_url.startsWith('http') ? item.image_url : `http://localhost:3001${item.image_url}`) : null;
  
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
      image: imageUrl,
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

initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
});
