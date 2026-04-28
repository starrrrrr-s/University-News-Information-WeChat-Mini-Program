const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// 微信登录
router.post('/login', authController.login);

// 获取用户信息
router.get('/user', auth, authController.getUserInfo);

// 更新用户信息
router.put('/user', auth, authController.updateUserInfo);

module.exports = router;