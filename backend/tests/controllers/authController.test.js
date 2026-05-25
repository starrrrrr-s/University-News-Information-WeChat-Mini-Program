const { login, getUserInfo, updateUserInfo, adminLogin } = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

jest.mock('../../models/User');
jest.mock('jsonwebtoken');
jest.mock('axios');

describe('认证控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { id: 1 }
    };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('login 函数', () => {
    test('缺少 code 参数应返回错误', async () => {
      mockReq.body = {};

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('测试 code 应使用测试 openid', async () => {
      mockReq.body = { code: 'test_123', nickname: '测试用户' };
      const mockUser = { id: 1, openid: 'test_123', nickname: '测试用户', avatar_url: '', is_admin: 0 };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock_token');

      await login(mockReq, mockRes);

      expect(User.create).toHaveBeenCalled();
    });

    test('现有用户应返回用户信息和 token', async () => {
      mockReq.body = { code: 'test_456' };
      const mockUser = { id: 2, openid: 'test_456', nickname: '老用户', avatar_url: 'url', is_admin: 0 };
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock_token');

      await login(mockReq, mockRes);

      expect(User.create).not.toHaveBeenCalled();
    });

    test('微信接口成功获取 openid', async () => {
      mockReq.body = { code: 'wx_real_code' };
      axios.get.mockResolvedValue({ data: { openid: 'real_openid' } });
      const mockUser = { id: 1, openid: 'real_openid', nickname: '微信用户', avatar_url: '', is_admin: 0 };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock_token');

      await login(mockReq, mockRes);

      expect(axios.get).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('微信接口失败使用降级 openid', async () => {
      mockReq.body = { code: 'wx_failed_code' };
      axios.get.mockResolvedValue({ data: {} }); // 没有 openid
      const mockUser = { id: 1, openid: expect.stringContaining('test_openid_'), nickname: expect.any(String), avatar_url: '', is_admin: 0 };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock_token');

      await login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('axios 抛出异常应使用降级 openid', async () => {
      mockReq.body = { code: 'wx_error_code' };
      axios.get.mockRejectedValue(new Error('网络错误'));
      const mockUser = { id: 1, openid: expect.stringContaining('test_openid_'), nickname: expect.any(String), avatar_url: '', is_admin: 0 };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock_token');

      await login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getUserInfo 函数', () => {
    test('应返回用户信息', async () => {
      const mockUser = { id: 1, nickname: '测试用户', avatar_url: 'url', is_admin: 0, openid: 'openid' };
      User.findByPk.mockResolvedValue(mockUser);

      await getUserInfo(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith(1);
    });

    test('用户不存在应返回错误', async () => {
      User.findByPk.mockResolvedValue(null);

      await getUserInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateUserInfo 函数', () => {
    test('应更新用户信息', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(true);
      const mockUser = {
        id: 1,
        nickname: '旧昵称',
        avatar_url: '旧url',
        is_admin: 0,
        openid: 'openid',
        update: mockUpdate
      };
      mockReq.body = { nickname: '新昵称', avatar_url: '新url' };
      User.findByPk.mockResolvedValue(mockUser);

      await updateUserInfo(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test('用户不存在应返回错误', async () => {
      User.findByPk.mockResolvedValue(null);

      await updateUserInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('adminLogin 函数', () => {
    test('缺少用户名或密码应返回错误', async () => {
      mockReq.body = {};

      await adminLogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('用户名不存在应返回错误', async () => {
      mockReq.body = { username: 'admin', password: 'password' };
      User.findOne.mockResolvedValue(null);

      await adminLogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('密码错误应返回错误', async () => {
      const bcrypt = require('bcryptjs');
      mockReq.body = { username: 'admin', password: 'wrong' };
      const mockUser = { id: 1, username: 'admin', password: bcrypt.hashSync('correct', 10), is_admin: 1 };
      User.findOne.mockResolvedValue(mockUser);

      await adminLogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('非管理员用户应返回错误', async () => {
      mockReq.body = { username: 'user', password: 'password' };
      const mockUser = { id: 1, username: 'user', password: 'hashed_password', is_admin: 0 };
      User.findOne.mockResolvedValue(mockUser);

      await adminLogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('管理员登录成功', async () => {
      const bcrypt = require('bcryptjs');
      mockReq.body = { username: 'admin', password: 'password' };
      const mockUser = { id: 1, username: 'admin', password: bcrypt.hashSync('password', 10), is_admin: 1, nickname: '管理员', avatar_url: '' };
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock_token');

      await adminLogin(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});