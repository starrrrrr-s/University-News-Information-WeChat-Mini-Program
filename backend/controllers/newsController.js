const News = require('../models/News');
const Category = require('../models/Category');
const { success, error, paginate } = require('../utils/response');

// 获取新闻列表
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
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取新闻列表失败:', err);
    return error(res, '获取新闻列表失败');
  }
};

// 获取新闻详情
const getNewsDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id, {
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });

    if (!news) {
      return error(res, '新闻不存在');
    }

    // 增加阅读量
    await news.update({ views: news.views + 1 });

    return success(res, news, '获取新闻详情成功');
  } catch (err) {
    console.error('获取新闻详情失败:', err);
    return error(res, '获取新闻详情失败');
  }
};

// 获取最新新闻
const getLatestNews = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const news = await News.findAll({
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['date', 'DESC']],
      limit: parseInt(limit)
    });

    return success(res, news, '获取最新新闻成功');
  } catch (err) {
    console.error('获取最新新闻失败:', err);
    return error(res, '获取最新新闻失败');
  }
};

// 新增新闻
const createNews = async (req, res) => {
  try {
    const { title, content, summary, category_id, author, date } = req.body;

    if (!title || !content || !category_id || !author || !date) {
      return error(res, '缺少必要参数');
    }

    const news = await News.create({
      title,
      content,
      summary,
      category_id,
      author,
      date
    });

    return success(res, news, '新增新闻成功');
  } catch (err) {
    console.error('新增新闻失败:', err);
    return error(res, '新增新闻失败');
  }
};

// 更新新闻
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category_id, author, date } = req.body;

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
      date: date || news.date
    });

    return success(res, news, '更新新闻成功');
  } catch (err) {
    console.error('更新新闻失败:', err);
    return error(res, '更新新闻失败');
  }
};

// 删除新闻
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

module.exports = {
  getNewsList,
  getNewsDetail,
  getLatestNews,
  createNews,
  updateNews,
  deleteNews
};