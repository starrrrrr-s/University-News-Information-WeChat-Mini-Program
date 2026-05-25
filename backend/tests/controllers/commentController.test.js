jest.mock('../../models/User', () => {
  const mockUser = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };
  mockUser.belongsTo = jest.fn();
  mockUser.hasMany = jest.fn();
  return mockUser;
});

jest.mock('../../models/Comment', () => {
  const mockComment = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };
  mockComment.belongsTo = jest.fn();
  mockComment.hasMany = jest.fn();
  return mockComment;
});

const { 
  getCommentList, 
  createComment, 
  deleteOwnComment,
  adminGetCommentList,
  adminUpdateCommentStatus,
  adminToggleCommentTop,
  adminDeleteComment,
  adminGetUserComments
} = require('../../controllers/commentController');
const Comment = require('../../models/Comment');
const User = require('../../models/User');

describe('评论控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: { id: 1, is_blocked: 0 }
    };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCommentList', () => {
    test('获取评论列表', async () => {
      mockReq.query = { target_type: 'news', target_id: 1, page: 1, limit: 10 };
      Comment.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getCommentList(mockReq, mockRes);

      expect(Comment.findAndCountAll).toHaveBeenCalled();
    });

    test('缺少参数应返回错误', async () => {
      mockReq.query = {};

      await getCommentList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createComment', () => {
    test('应创建评论', async () => {
      mockReq.body = { target_type: 'news', target_id: 1, content: '测试评论' };
      Comment.create.mockResolvedValue({ id: 1 });
      Comment.findByPk.mockResolvedValue({ id: 1 });

      await createComment(mockReq, mockRes);

      expect(Comment.create).toHaveBeenCalled();
    });

    test('缺少必要参数应返回错误', async () => {
      mockReq.body = {};

      await createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('内容为空应返回错误', async () => {
      mockReq.body = { target_type: 'news', target_id: 1, content: '   ' };

      await createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('用户被拉黑应返回错误', async () => {
      mockReq.user.is_blocked = 1;
      mockReq.body = { target_type: 'news', target_id: 1, content: '测试评论' };

      await createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('无效target_type应返回错误', async () => {
      mockReq.body = { target_type: 'invalid', target_id: 1, content: '测试评论' };

      await createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('内容过长应返回错误', async () => {
      mockReq.body = { target_type: 'news', target_id: 1, content: 'a'.repeat(600) };

      await createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('回复不存在的评论应返回错误', async () => {
      mockReq.body = { target_type: 'news', target_id: 1, content: '回复', parent_id: 999 };
      Comment.findByPk.mockResolvedValue(null);

      await createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteOwnComment', () => {
    test('应删除自己的评论', async () => {
      mockReq.params = { id: 1 };
      const mockDestroy = jest.fn();
      Comment.findByPk.mockResolvedValue({ user_id: 1, destroy: mockDestroy });

      await deleteOwnComment(mockReq, mockRes);

      expect(mockDestroy).toHaveBeenCalled();
    });

    test('评论不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Comment.findByPk.mockResolvedValue(null);

      await deleteOwnComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('无权删除他人评论应返回错误', async () => {
      mockReq.params = { id: 1 };
      Comment.findByPk.mockResolvedValue({ user_id: 2 });

      await deleteOwnComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('adminGetCommentList', () => {
    test('管理员获取评论列表', async () => {
      mockReq.query = { page: 1, limit: 20 };
      Comment.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await adminGetCommentList(mockReq, mockRes);

      expect(Comment.findAndCountAll).toHaveBeenCalled();
    });

    test('按状态筛选', async () => {
      mockReq.query = { page: 1, limit: 20, status: '1' };
      Comment.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await adminGetCommentList(mockReq, mockRes);

      expect(Comment.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('adminUpdateCommentStatus', () => {
    test('更新评论状态', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { status: 1 };
      const mockUpdate = jest.fn();
      Comment.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await adminUpdateCommentStatus(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test('无效状态应返回错误', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { status: 999 };

      await adminUpdateCommentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('评论不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      mockReq.body = { status: 1 };
      Comment.findByPk.mockResolvedValue(null);

      await adminUpdateCommentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('adminToggleCommentTop', () => {
    test('置顶评论', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { is_top: true };
      const mockUpdate = jest.fn();
      Comment.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await adminToggleCommentTop(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test('取消置顶', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { is_top: false };
      const mockUpdate = jest.fn();
      Comment.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await adminToggleCommentTop(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test('评论不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Comment.findByPk.mockResolvedValue(null);

      await adminToggleCommentTop(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('adminDeleteComment', () => {
    test('管理员删除评论', async () => {
      mockReq.params = { id: 1 };
      const mockDestroy = jest.fn();
      Comment.findByPk.mockResolvedValue({ id: 1, destroy: mockDestroy });

      await adminDeleteComment(mockReq, mockRes);

      expect(mockDestroy).toHaveBeenCalled();
    });

    test('评论不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Comment.findByPk.mockResolvedValue(null);

      await adminDeleteComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('adminGetUserComments', () => {
    test('获取用户评论', async () => {
      mockReq.params = { userId: 1 };
      Comment.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await adminGetUserComments(mockReq, mockRes);

      expect(Comment.findAndCountAll).toHaveBeenCalled();
    });
  });
});