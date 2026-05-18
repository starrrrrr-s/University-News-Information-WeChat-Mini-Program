const News = require('../models/News');
const Category = require('../models/Category');
const { Op } = require('sequelize');
const { success, error, paginate } = require('../utils/response');

const getNewsList = async (req, res) => {
  try {
    const { category_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      published_at: { [Op.lte]: new Date() }
    };
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

    await News.update({ views: (news.views || 0) + 1 }, { where: { id } });

    const updatedNews = await News.findByPk(id, {
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });

    const category = updatedNews.Category || { id: updatedNews.category_id, name: '未分类' };
    const imageUrl = updatedNews.image_url ? 
      (updatedNews.image_url.startsWith('http') ? updatedNews.image_url : `http://localhost:3000${updatedNews.image_url}`) : null;

    const newsDetail = {
      id: updatedNews.id,
      title: updatedNews.title,
      content: updatedNews.content,
      summary: updatedNews.summary,
      category: category.name,
      categoryId: category.id,
      author: updatedNews.author,
      image: imageUrl,
      image_url: imageUrl,
      source_url: updatedNews.source_url || '',
      date: updatedNews.published_at ? formatDate(updatedNews.published_at) : formatDate(updatedNews.created_at),
      views: updatedNews.views || 0,
      published_at: updatedNews.published_at,
      created_at: updatedNews.created_at
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
      where: {
        published_at: { [Op.lte]: new Date() }
      },
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
    const { keyword, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = {};

    if (keyword) {
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(keyword);
      const isYearMonth = /^\d{4}-\d{2}$/.test(keyword);
      const isYear = /^\d{4}$/.test(keyword);

      if (isDate) {
        const start = new Date(keyword);
        const end = new Date(keyword);
        end.setDate(end.getDate() + 1);
        where = {
          [Op.or]: [
            { published_at: { [Op.between]: [start, end] } },
            { created_at: { [Op.between]: [start, end] } }
          ]
        };
      } else if (isYearMonth) {
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
        where = {
          title: { [Op.like]: `%${keyword}%` }
        };
      }
    }

    where.published_at = { [Op.lte]: new Date() };

    const { count, rows } = await News.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['published_at', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset
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
        views: news.views || 0
      };
    });

    return paginate(res, newsList, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('搜索新闻失败:', err);
    return error(res, '搜索新闻失败');
  }
};

const getNewsByCategory = async (req, res) => {
  try {
    const { category_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await News.findAndCountAll({
      where: {
        category_id,
        published_at: { [Op.lte]: new Date() }
      },
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
        views: news.views || 0
      };
    });

    return paginate(res, newsList, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取分类新闻失败:', err);
    return error(res, '获取分类新闻失败');
  }
};

const createNews = async (req, res) => {
  try {
    const { title, content, summary, category_id, author, image_url, source_url, published_at } = req.body;

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
      source_url,
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
    const { title, content, summary, category_id, author, image_url, source_url, published_at } = req.body;

    const news = await News.findByPk(id);
    if (!news) {
      return error(res, '新闻不存在');
    }

    await News.update({
      title,
      content,
      summary,
      category_id,
      author,
      image_url,
      source_url,
      published_at
    }, { where: { id } });

    const updatedNews = await News.findByPk(id);
    return success(res, updatedNews, '更新新闻成功');
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

    await News.destroy({ where: { id } });
    return success(res, null, '删除新闻成功');
  } catch (err) {
    console.error('删除新闻失败:', err);
    return error(res, '删除新闻失败');
  }
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  getNewsList,
  getNewsDetail,
  getLatestNews,
  searchNews,
  getNewsByCategory,
  createNews,
  updateNews,
  deleteNews
};