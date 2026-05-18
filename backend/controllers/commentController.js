const Comment = require('../models/Comment');
const User = require('../models/User');
const { success, error, paginate } = require('../utils/response');

// ─── 用户接口 ────────────────────────────────────────────────

/**
 * 获取评论列表（按目标类型+ID）
 * GET /api/comments?target_type=news&target_id=1&page=1&limit=20
 */
const getCommentList = async (req, res) => {
  try {
    const { target_type, target_id, page = 1, limit = 20 } = req.query;

    if (!target_type || !target_id) {
      return error(res, '缺少 target_type 或 target_id 参数');
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Comment.findAndCountAll({
      where: {
        target_type,
        target_id: parseInt(target_id),
        status: 1  // 只返回已通过的评论
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar_url']
        }
      ],
      order: [
        ['is_top', 'DESC'],   // 置顶评论优先
        ['id', 'ASC']  // 按ID升序（等价于按时间顺序）
      ],
      limit: parseInt(limit),
      offset
    });

    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取评论列表失败:', err);
    return error(res, '获取评论列表失败');
  }
};

/**
 * 发表评论
 * POST /api/comments
 * body: { target_type, target_id, content, parent_id? }
 */
const createComment = async (req, res) => {
  try {
    const { target_type, target_id, content, parent_id } = req.body;

    if (!target_type || !target_id || !content) {
      return error(res, '缺少必要参数');
    }

    if (!['news', 'lecture'].includes(target_type)) {
      return error(res, 'target_type 只能是 news 或 lecture');
    }

    if (content.trim().length === 0) {
      return error(res, '评论内容不能为空');
    }

    if (content.length > 500) {
      return error(res, '评论内容不能超过500字');
    }

    // 检查用户是否被拉黑
    if (req.user.is_blocked) {
      return error(res, '您已被拉黑，暂时无法发表评论，请等待解封');
    }

    // 如果是回复，检查父评论是否存在
    if (parent_id) {
      const parentComment = await Comment.findByPk(parent_id);
      if (!parentComment) {
        return error(res, '回复的评论不存在');
      }
    }

    const comment = await Comment.create({
      target_type,
      target_id: parseInt(target_id),
      user_id: req.user.id,
      content: content.trim(),
      parent_id: parent_id || null,
      status: 1  // 默认通过
    });

    // 返回带用户信息的评论
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar_url']
        }
      ]
    });

    return success(res, commentWithUser, '评论成功');
  } catch (err) {
    console.error('发表评论失败:', err);
    return error(res, '发表评论失败');
  }
};

/**
 * 删除自己的评论
 * DELETE /api/comments/:id
 */
const deleteOwnComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return error(res, '评论不存在');
    }

    // 只能删除自己的评论（管理员可通过 admin 接口删除任意评论）
    if (comment.user_id !== req.user.id) {
      return error(res, '无权删除他人评论', 403);
    }

    await comment.destroy();
    return success(res, null, '删除评论成功');
  } catch (err) {
    console.error('删除评论失败:', err);
    return error(res, '删除评论失败');
  }
};

// ─── 管理员接口 ──────────────────────────────────────────────

/**
 * 管理员获取所有评论（支持筛选）
 * GET /api/admin/comments?target_type=news&target_id=1&status=0&page=1&limit=20
 */
const adminGetCommentList = async (req, res) => {
  try {
    const { target_type, target_id, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (target_type) where.target_type = target_type;
    if (target_id) where.target_id = parseInt(target_id);
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar_url']
        }
      ],
      order: [
        ['is_top', 'DESC'],
        ['id', 'DESC']
      ],
      limit: parseInt(limit),
      offset
    });

    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('管理员获取评论列表失败:', err);
    return error(res, '获取评论列表失败');
  }
};

/**
 * 管理员审核评论（通过/拒绝）
 * PUT /api/admin/comments/:id/status
 * body: { status: 1 | 2 }
 */
const adminUpdateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![0, 1, 2].includes(parseInt(status))) {
      return error(res, 'status 只能是 0(待审核)、1(通过)、2(拒绝)');
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return error(res, '评论不存在');
    }

    await comment.update({ status: parseInt(status) });
    return success(res, comment, '审核操作成功');
  } catch (err) {
    console.error('审核评论失败:', err);
    return error(res, '审核评论失败');
  }
};

/**
 * 管理员置顶/取消置顶评论
 * PUT /api/admin/comments/:id/top
 * body: { is_top: 0 | 1 }
 */
const adminToggleCommentTop = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_top } = req.body;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return error(res, '评论不存在');
    }

    await comment.update({ is_top: is_top ? 1 : 0 });
    const action = is_top ? '置顶' : '取消置顶';
    return success(res, comment, `${action}成功`);
  } catch (err) {
    console.error('置顶操作失败:', err);
    return error(res, '置顶操作失败');
  }
};

/**
 * 管理员删除任意评论
 * DELETE /api/admin/comments/:id
 */
const adminDeleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return error(res, '评论不存在');
    }

    await comment.destroy();
    return success(res, null, '删除评论成功');
  } catch (err) {
    console.error('管理员删除评论失败:', err);
    return error(res, '删除评论失败');
  }
};

/**
 * 管理员获取某用户的所有评论
 * GET /api/admin/users/:userId/comments
 */
const adminGetUserComments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Comment.findAndCountAll({
      where: { user_id: parseInt(userId) },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar_url']
        }
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('获取用户评论失败:', err);
    return error(res, '获取用户评论失败');
  }
};

module.exports = {
  getCommentList,
  createComment,
  deleteOwnComment,
  adminGetCommentList,
  adminUpdateCommentStatus,
  adminToggleCommentTop,
  adminDeleteComment,
  adminGetUserComments
};
