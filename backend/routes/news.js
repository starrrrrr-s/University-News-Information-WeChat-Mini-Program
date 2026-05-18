const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 获取新闻列表
router.get('/', newsController.getNewsList);

// 获取最新新闻
router.get('/latest', newsController.getLatestNews);

// 搜索新闻（必须在 /:id 之前注册）
router.get('/search', newsController.searchNews);

// 获取新闻详情
router.get('/:id', newsController.getNewsDetail);

// 新增新闻（管理员）
router.post('/', auth, admin, newsController.createNews);

// 更新新闻（管理员）
router.put('/:id', auth, admin, newsController.updateNews);

// 删除新闻（管理员）
router.delete('/:id', auth, admin, newsController.deleteNews);

// AI：提取新闻内容并生成要点
router.post('/extract-content', aiController.extractNewsContent);

// TTS：语音合成
router.post('/tts', aiController.textToSpeech);

module.exports = router;
