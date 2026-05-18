const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── 用户接口 ────────────────────────────────────────────────

// 用户提交反馈
router.post('/', auth, feedbackController.createFeedback);

// 用户获取自己的反馈列表
router.get('/my', auth, feedbackController.getUserFeedbackList);

// 用户标记反馈为已读
router.put('/:id/read', auth, feedbackController.markAsRead);

// 用户获取未读反馈数量
router.get('/unread-count', auth, feedbackController.getUnreadCount);

// ─── 管理员接口 ────────────────────────────────────────────────

// 管理员获取反馈列表
router.get('/admin', auth, admin, feedbackController.getAdminFeedbackList);

// 管理员获取未处理反馈数量
router.get('/admin/unhandled-count', auth, admin, feedbackController.getUnhandledCount);

// 管理员更新反馈状态
router.put('/admin/:id/status', auth, admin, feedbackController.updateStatus);

// 管理员回复反馈
router.put('/admin/:id/reply', auth, admin, feedbackController.replyFeedback);

// 管理员标记反馈为已读
router.put('/admin/:id/read', auth, admin, feedbackController.markAdminRead);

// 管理员删除反馈
router.delete('/admin/:id', auth, admin, feedbackController.deleteFeedback);

module.exports = router;