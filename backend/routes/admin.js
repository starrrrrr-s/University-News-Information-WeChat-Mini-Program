const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── 用户管理 ────────────────────────────────────────────────

// 获取用户列表
router.get('/users', auth, admin, adminController.getUserList);

// 更新用户权限
router.put('/users/:id', auth, admin, adminController.updateUserPermission);

// 删除用户
router.delete('/users/:id', auth, admin, adminController.deleteUser);

// 拉黑用户
router.put('/users/:id/block', auth, admin, adminController.blockUser);

// 解封用户
router.put('/users/:id/unblock', auth, admin, adminController.unblockUser);

// 获取某用户的所有评论
router.get('/users/:userId/comments', auth, admin, commentController.adminGetUserComments);

// ─── 评论管理 ────────────────────────────────────────────────

// 获取评论列表（支持按 target_type/target_id/status 筛选）
router.get('/comments', auth, admin, commentController.adminGetCommentList);

// 审核评论（通过/拒绝）
router.put('/comments/:id/status', auth, admin, commentController.adminUpdateCommentStatus);

// 置顶/取消置顶评论
router.put('/comments/:id/top', auth, admin, commentController.adminToggleCommentTop);

// 删除评论
router.delete('/comments/:id', auth, admin, commentController.adminDeleteComment);

module.exports = router;