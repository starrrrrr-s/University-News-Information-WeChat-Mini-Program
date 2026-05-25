jest.mock('../../models/Feedback', () => {
  const mockFeedback = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
  };
  mockFeedback.belongsTo = jest.fn();
  mockFeedback.hasMany = jest.fn();
  return mockFeedback;
});

jest.mock('../../models/User', () => {
  const mockUser = {
    findByPk: jest.fn(),
    findAll: jest.fn()
  };
  mockUser.belongsTo = jest.fn();
  mockUser.hasMany = jest.fn();
  return mockUser;
});

const {
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
} = require('../../controllers/feedbackController');
const Feedback = require('../../models/Feedback');

describe('反馈控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {}, user: { id: 1 } };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('createFeedback', () => {
    test('缺少必要参数应返回错误', async () => {
      mockReq.body = {};

      await createFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('创建反馈成功', async () => {
      mockReq.body = { type: 'suggestion', content: '测试内容' };
      Feedback.create.mockResolvedValue({ id: 1 });

      await createFeedback(mockReq, mockRes);

      expect(Feedback.create).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getUserFeedbackList', () => {
    test('获取用户反馈列表', async () => {
      mockReq.query = { page: 1, limit: 20 };
      Feedback.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });

      await getUserFeedbackList(mockReq, mockRes);

      expect(Feedback.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    test('标记已读成功', async () => {
      mockReq.params = { id: 1 };
      const mockUpdate = jest.fn();
      Feedback.findOne.mockResolvedValue({ id: 1, update: mockUpdate });

      await markAsRead(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    });

    test('反馈不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Feedback.findOne.mockResolvedValue(null);

      await markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getUnreadCount', () => {
    test('获取未读数量', async () => {
      Feedback.count.mockResolvedValue(5);

      await getUnreadCount(mockReq, mockRes);

      expect(Feedback.count).toHaveBeenCalled();
    });
  });

  describe('getAdminFeedbackList', () => {
    test('获取所有反馈列表', async () => {
      mockReq.query = { page: 1, limit: 20 };
      Feedback.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });

      await getAdminFeedbackList(mockReq, mockRes);

      expect(Feedback.findAndCountAll).toHaveBeenCalled();
    });

    test('按状态筛选', async () => {
      mockReq.query = { page: 1, limit: 20, status: '1' };
      Feedback.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getAdminFeedbackList(mockReq, mockRes);

      expect(Feedback.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('getUnhandledCount', () => {
    test('获取未处理数量', async () => {
      Feedback.count.mockResolvedValue(3);

      await getUnhandledCount(mockReq, mockRes);

      expect(Feedback.count).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    test('更新状态成功', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { status: 2 };
      const mockUpdate = jest.fn();
      Feedback.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await updateStatus(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test('反馈不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Feedback.findByPk.mockResolvedValue(null);

      await updateStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('replyFeedback', () => {
    test('回复反馈成功', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { reply: '已处理' };
      const mockUpdate = jest.fn();
      Feedback.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await replyFeedback(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test('反馈不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Feedback.findByPk.mockResolvedValue(null);

      await replyFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('markAdminRead', () => {
    test('管理员标记已读成功', async () => {
      mockReq.params = { id: 1 };
      const mockUpdate = jest.fn();
      Feedback.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await markAdminRead(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalledWith({ admin_read: true });
    });

    test('反馈不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Feedback.findByPk.mockResolvedValue(null);

      await markAdminRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteFeedback', () => {
    test('删除反馈成功', async () => {
      mockReq.params = { id: 1 };
      const mockDestroy = jest.fn();
      Feedback.findByPk.mockResolvedValue({ id: 1, destroy: mockDestroy });

      await deleteFeedback(mockReq, mockRes);

      expect(mockDestroy).toHaveBeenCalled();
    });

    test('反馈不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Feedback.findByPk.mockResolvedValue(null);

      await deleteFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});