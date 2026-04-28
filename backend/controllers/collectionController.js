const Collection = require('../models/Collection');
const News = require('../models/News');
const Category = require('../models/Category');
const { success, error } = require('../utils/response');

// 获取用户收藏列表
const getCollectionList = async (req, res) => {
  try {
    const collections = await Collection.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: News,
          include: [{ model: Category, attributes: ['id', 'name'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 提取新闻信息
    const newsList = collections.map(item => item.News);

    return success(res, newsList, '获取收藏列表成功');
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    return error(res, '获取收藏列表失败');
  }
};

// 添加收藏
const addCollection = async (req, res) => {
  try {
    const { news_id } = req.body;

    if (!news_id) {
      return error(res, '缺少新闻ID');
    }

    // 检查新闻是否存在
    const news = await News.findByPk(news_id);
    if (!news) {
      return error(res, '新闻不存在');
    }

    // 检查是否已收藏
    const existingCollection = await Collection.findOne({
      where: { user_id: req.user.id, news_id }
    });

    if (existingCollection) {
      return error(res, '已收藏该新闻');
    }

    // 添加收藏
    await Collection.create({
      user_id: req.user.id,
      news_id
    });

    return success(res, null, '收藏成功');
  } catch (err) {
    console.error('添加收藏失败:', err);
    return error(res, '添加收藏失败');
  }
};

// 删除收藏
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!collection) {
      return error(res, '收藏不存在');
    }

    await collection.destroy();
    return success(res, null, '取消收藏成功');
  } catch (err) {
    console.error('删除收藏失败:', err);
    return error(res, '删除收藏失败');
  }
};

// 批量删除收藏
const batchDeleteCollection = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return error(res, '缺少收藏ID列表');
    }

    await Collection.destroy({
      where: {
        id: ids,
        user_id: req.user.id
      }
    });

    return success(res, null, '批量取消收藏成功');
  } catch (err) {
    console.error('批量删除收藏失败:', err);
    return error(res, '批量删除收藏失败');
  }
};

module.exports = {
  getCollectionList,
  addCollection,
  deleteCollection,
  batchDeleteCollection
};