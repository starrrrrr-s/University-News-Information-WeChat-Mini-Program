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

const { getUserList, updateUserPermission, deleteUser, blockUser, unblockUser } = require('../../controllers/adminController');
const User = require('../../models/User');

describe('管理员控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      user: { id: 1, is_admin: 1 }
    };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('getUserList', () => {
    test('应获取用户列表', async () => {
      User.findAll.mockResolvedValue([{ id: 1, nickname: '用户1' }]);

      await getUserList(mockReq, mockRes);

      expect(User.findAll).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      User.findAll.mockRejectedValue(new Error('DB error'));

      await getUserList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateUserPermission', () => {
    test('应更新用户权限', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { is_admin: 1 };
      const mockUpdate = jest.fn();
      User.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await updateUserPermission(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalledWith({ is_admin: 1 });
    });

    test('用户不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      User.findByPk.mockResolvedValue(null);

      await updateUserPermission(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteUser', () => {
    test('应删除用户', async () => {
      mockReq.params = { id: 1 };
      const mockDestroy = jest.fn();
      User.findByPk.mockResolvedValue({ id: 1, destroy: mockDestroy });

      await deleteUser(mockReq, mockRes);

      expect(mockDestroy).toHaveBeenCalled();
    });

    test('用户不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      User.findByPk.mockResolvedValue(null);

      await deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('blockUser', () => {
    test('应拉黑用户', async () => {
      mockReq.params = { id: 1 };
      const mockUpdate = jest.fn();
      User.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await blockUser(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalledWith({ is_blocked: 1 });
    });

    test('用户不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      User.findByPk.mockResolvedValue(null);

      await blockUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('unblockUser', () => {
    test('应解封用户', async () => {
      mockReq.params = { id: 1 };
      const mockUpdate = jest.fn();
      User.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await unblockUser(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalledWith({ is_blocked: 0 });
    });

    test('用户不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      User.findByPk.mockResolvedValue(null);

      await unblockUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});