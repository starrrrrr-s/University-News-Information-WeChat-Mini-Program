const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { Op } = require('sequelize');
const { success, error, paginate } = require('../utils/response');

// ─── 用户接口 ────────────────────────────────────────────────

/**
 * 用户提交反馈
 * POST /api/feedback
 */
const createFeedback = async (req, res) => {
  try {
    const { type, content, contact } = req.body;
    const userId = req.user.id;

    if (!type || !content) {
      return error(res, '缺少必要参数');
    }

    const feedback = await Feedback.create({
      user_id: userId,
      type,
      content,
      contact
    });

    return success(res, feedback, '反馈提交成功');
  } catch (err) {
    console.error('提交反馈失败:', err);
    return error(res, '提交反馈失败');
  }
};

/**
 * 用户获取自己的反馈列表
 * GET /api/feedback/my
 */
const getUserFeedbackList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Feedback.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取用户反馈列表失败:', err);
    return error(res, '获取反馈列表失败');
  }
};

/**
 * 用户标记反馈为已读
 * PUT /api/feedback/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const feedback = await Feedback.findOne({
      where: { id, user_id: userId }
    });

    if (!feedback) {
      return error(res, '反馈不存在');
    }

    await feedback.update({ is_read: true });

    return success(res, {}, '已标记为已读');
  } catch (err) {
    console.error('标记已读失败:', err);
    return error(res, '操作失败');
  }
};

/**
 * 用户获取未读反馈数量
 * GET /api/feedback/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Feedback.count({
      where: {
        user_id: userId,
        status: 2,  // 已解决
        is_read: false
      }
    });

    return success(res, { count });
  } catch (err) {
    console.error('获取未读数量失败:', err);
    return error(res, '操作失败');
  }
};

// ─── 管理员接口 ────────────────────────────────────────────────

/**
 * 管理员获取反馈列表
 * GET /api/admin/feedback
 */
const getAdminFeedbackList = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status !== '') {
      where.status = parseInt(status);
    }

    const { count, rows } = await Feedback.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取反馈列表失败:', err);
    return error(res, '获取反馈列表失败');
  }
};

/**
 * 管理员获取未处理反馈数量
 * GET /api/admin/feedback/unhandled-count
 */
const getUnhandledCount = async (req, res) => {
  try {
    const count = await Feedback.count({
      where: {
        status: { [Op.lt]: 2 },  // 待处理或处理中
        admin_read: false
      }
    });

    return success(res, { count });
  } catch (err) {
    console.error('获取未处理数量失败:', err);
    return error(res, '操作失败');
  }
};

/**
 * 管理员更新反馈状态
 * PUT /api/admin/feedback/:id/status
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return error(res, '反馈不存在');
    }

    await feedback.update({
      status: parseInt(status),
      admin_read: true,
      updated_at: new Date()
    });

    return success(res, feedback, '状态更新成功');
  } catch (err) {
    console.error('更新状态失败:', err);
    return error(res, '操作失败');
  }
};

/**
 * 管理员回复反馈
 * PUT /api/admin/feedback/:id/reply
 */
const replyFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, status = 2 } = req.body;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return error(res, '反馈不存在');
    }

    await feedback.update({
      reply,
      status: parseInt(status),
      is_read: false,  // 用户未读
      admin_read: true,
      updated_at: new Date()
    });

    return success(res, feedback, '回复成功');
  } catch (err) {
    console.error('回复反馈失败:', err);
    return error(res, '操作失败');
  }
};

/**
 * 管理员标记反馈为已读
 * PUT /api/admin/feedback/:id/admin-read
 */
const markAdminRead = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return error(res, '反馈不存在');
    }

    await feedback.update({ admin_read: true });

    return success(res, {}, '已标记为已读');
  } catch (err) {
    console.error('标记已读失败:', err);
    return error(res, '操作失败');
  }
};

/**
 * 管理员删除反馈
 * DELETE /api/admin/feedback/:id
 */
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return error(res, '反馈不存在');
    }

    await feedback.destroy();

    return success(res, {}, '删除成功');
  } catch (err) {
    console.error('删除反馈失败:', err);
    return error(res, '操作失败');
  }
};

module.exports = {
  createFeedback,
  getUserFeedbackList,
  markAsRead,
  getUnreadCount,
  getAdminFeedbackList,
  getUnhandledCount,
  updateStatus,
  replyFeedback,
  markAdminRead,
  deleteFeedback
};