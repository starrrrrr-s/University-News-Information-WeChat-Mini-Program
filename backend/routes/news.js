const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 获取新闻列表
router.get('/', newsController.getNewsList);

// 获取新闻详情
router.get('/:id', newsController.getNewsDetail);

// 获取最新新闻
router.get('/latest', newsController.getLatestNews);

// 新增新闻（管理员）
router.post('/', auth, admin, newsController.createNews);

// 更新新闻（管理员）
router.put('/:id', auth, admin, newsController.updateNews);

// 删除新闻（管理员）
router.delete('/:id', auth, admin, newsController.deleteNews);

module.exports = router;