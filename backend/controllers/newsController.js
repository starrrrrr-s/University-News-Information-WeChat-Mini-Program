const News = require('../models/News');
const Category = require('../models/Category');
const { Op } = require('sequelize');
const { success, error, paginate } = require('../utils/response');

const getNewsList = async (req, res) => {
  try {
    const { category_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (category_id) {
      where.category_id = category_id;
    }

    const { count, rows } = await News.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['published_at', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const newsList = rows.map(news => {
      const category = news.Category || { id: news.category_id, name: '未分类' };
      const imageUrl = news.image_url ? 
        (news.image_url.startsWith('http') ? news.image_url : `http://localhost:3000${news.image_url}`) : null;
      
      return {
        id: news.id,
        title: news.title,
        summary: news.summary || news.content.substring(0, 100) + '...',
        content: news.content,
        category: category.name,
        categoryId: category.id,
        author: news.author,
        image: imageUrl,
        image_url: imageUrl,
        source_url: news.source_url || '',
        date: news.published_at ? formatDate(news.published_at) : formatDate(news.created_at),
        views: news.views || 0,
        published_at: news.published_at,
        created_at: news.created_at
      };
    });

    return paginate(res, newsList, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取新闻列表失败:', err);
    return error(res, '获取新闻列表失败');
  }
};

const getNewsDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id, {
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });

    if (!news) {
      return error(res, '新闻不存在');
    }

    await news.update({ 
      views: (news.views || 0) + 1
    });

    const category = news.Category || { id: news.category_id, name: '未分类' };
    const imageUrl = news.image_url ? 
      (news.image_url.startsWith('http') ? news.image_url : `http://localhost:3000${news.image_url}`) : null;

    const newsDetail = {
      id: news.id,
      title: news.title,
      summary: news.summary || news.content.substring(0, 150) + '...',
      content: news.content,
      category: category.name,
      categoryId: category.id,
      author: news.author,
      image: imageUrl,
      image_url: imageUrl,
      source_url: news.source_url || '',
      date: news.published_at ? formatDate(news.published_at) : formatDate(news.created_at),
      views: news.views || 0,
      published_at: news.published_at,
      created_at: news.created_at
    };

    return success(res, newsDetail, '获取新闻详情成功');
  } catch (err) {
    console.error('获取新闻详情失败:', err);
    return error(res, '获取新闻详情失败');
  }
};

const getLatestNews = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const news = await News.findAll({
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['published_at', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    const newsList = news.map(item => {
      const category = item.Category || { id: item.category_id, name: '未分类' };
      const imageUrl = item.image_url ? 
        (item.image_url.startsWith('http') ? item.image_url : `http://localhost:3000${item.image_url}`) : null;
      
      return {
        id: item.id,
        title: item.title,
        summary: item.summary || item.content.substring(0, 100) + '...',
        content: item.content,
        category: category.name,
        categoryId: category.id,
        author: item.author,
        image: imageUrl,
        image_url: imageUrl,
        source_url: item.source_url || '',
        date: item.published_at ? formatDate(item.published_at) : formatDate(item.created_at),
        views: item.views || 0
      };
    });

    return success(res, newsList, '获取最新新闻成功');
  } catch (err) {
    console.error('获取最新新闻失败:', err);
    return error(res, '获取最新新闻失败');
  }
};

const searchNews = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;

    if (!keyword) {
      return error(res, '请输入搜索关键词');
    }

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    let where = {};

    // 判断是否为日期格式搜索
    const isFullDate = /^\d{4}-\d{2}-\d{2}$/.test(keyword);   // 2025-05-16
    const isYearMonth = /^\d{4}-\d{2}$/.test(keyword);         // 2025-05
    const isYear = /^\d{4}$/.test(keyword);                    // 2025

    if (isFullDate) {
      // 精确到天：当天 00:00:00 ~ 23:59:59
      const start = new Date(`${keyword}T00:00:00`);
      const end = new Date(`${keyword}T23:59:59`);
      where = {
        [Op.or]: [
          { published_at: { [Op.between]: [start, end] } },
          { created_at: { [Op.between]: [start, end] } }
        ]
      };
    } else if (isYearMonth) {
      // 精确到月
      const [y, m] = keyword.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      where = {
        [Op.or]: [
          { published_at: { [Op.gte]: start, [Op.lt]: end } },
          { created_at: { [Op.gte]: start, [Op.lt]: end } }
        ]
      };
    } else if (isYear) {
      // 精确到年
      const y = parseInt(keyword);
      const start = new Date(y, 0, 1);
      const end = new Date(y + 1, 0, 1);
      where = {
        [Op.or]: [
          { published_at: { [Op.gte]: start, [Op.lt]: end } },
          { created_at: { [Op.gte]: start, [Op.lt]: end } }
        ]
      };
    } else {
      // 关键词搜索：仅匹配标题
      where = {
        title: { [Op.like]: `%${keyword}%` }
      };
    }

    const { count, rows } = await News.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['published_at', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset
    });

    const newsList = rows.map(item => {
      const category = item.Category || { id: item.category_id, name: '未分类' };
      const imageUrl = item.image_url ?
        (item.image_url.startsWith('http') ? item.image_url : `http://localhost:3000${item.image_url}`) : null;

      return {
        id: item.id,
        title: item.title,
        summary: item.summary || item.content.substring(0, 100) + '...',
        category: category.name,
        categoryId: category.id,
        author: item.author,
        image: imageUrl,
        image_url: imageUrl,
        source_url: item.source_url || '',
        date: item.published_at ? formatDate(item.published_at) : formatDate(item.created_at),
        views: item.views || 0
      };
    });

    return paginate(res, newsList, count, parseInt(page), limit);
  } catch (err) {
    console.error('搜索新闻失败:', err);
    return error(res, '搜索新闻失败');
  }
};

const createNews = async (req, res) => {
  try {
    const { title, content, summary, category_id, author, image_url, published_at } = req.body;

    if (!title || !content || !category_id || !author) {
      return error(res, '缺少必要参数');
    }

    const news = await News.create({
      title,
      content,
      summary,
      category_id,
      author,
      image_url,
      published_at: published_at || new Date()
    });

    return success(res, news, '新增新闻成功');
  } catch (err) {
    console.error('新增新闻失败:', err);
    return error(res, '新增新闻失败');
  }
};

const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category_id, author, image_url, published_at } = req.body;

    const news = await News.findByPk(id);
    if (!news) {
      return error(res, '新闻不存在');
    }

    await news.update({
      title: title || news.title,
      content: content || news.content,
      summary: summary || news.summary,
      category_id: category_id || news.category_id,
      author: author || news.author,
      image_url: image_url || news.image_url,
      published_at: published_at || news.published_at
    });

    return success(res, news, '更新新闻成功');
  } catch (err) {
    console.error('更新新闻失败:', err);
    return error(res, '更新新闻失败');
  }
};

const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);

    if (!news) {
      return error(res, '新闻不存在');
    }

    await news.destroy();
    return success(res, null, '删除新闻成功');
  } catch (err) {
    console.error('删除新闻失败:', err);
    return error(res, '删除新闻失败');
  }
};

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  getNewsList,
  getNewsDetail,
  getLatestNews,
  searchNews,
  createNews,
  updateNews,
  deleteNews
};