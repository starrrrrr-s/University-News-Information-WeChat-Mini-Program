const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// 获取评论列表（公开，无需登录）
router.get('/', commentController.getCommentList);

// 发表评论（需登录）
router.post('/', auth, commentController.createComment);

// 删除自己的评论（需登录）
router.delete('/:id', auth, commentController.deleteOwnComment);

module.exports = router;
