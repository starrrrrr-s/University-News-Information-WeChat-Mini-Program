const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwtConfig = require('../../config/jwt');

jest.mock('../../models/User');
jest.mock('jsonwebtoken');

describe('认证中间件测试', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      header: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('缺少 Authorization header', () => {
    test('应返回 401 错误', async () => {
      mockReq.header.mockReturnValue(null);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '请先登录'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('token 为空', () => {
    test('应返回 401 错误', async () => {
      mockReq.header.mockReturnValue('Bearer ');

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '请先登录'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('token 无效或过期', () => {
    test('应返回 401 错误', async () => {
      mockReq.header.mockReturnValue('Bearer invalid_token');
      jwt.verify.mockImplementation(() => {
        throw new Error('无效的token');
      });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '登录已过期，请重新登录'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('用户不存在', () => {
    test('应返回 401 错误', async () => {
      mockReq.header.mockReturnValue('Bearer valid_token');
      jwt.verify.mockReturnValue({ id: 999 });
      User.findByPk.mockResolvedValue(null);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '用户不存在'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('认证成功', () => {
    test('应设置 req.user 和 req.token 并调用 next', async () => {
      const mockUser = { id: 1, nickname: '测试用户' };
      mockReq.header.mockReturnValue('Bearer valid_token');
      jwt.verify.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(mockUser);

      await auth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.token).toBe('valid_token');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('捕获异常', () => {
    test('应返回 401 错误', async () => {
      mockReq.header.mockImplementation(() => {
        throw new Error('未知错误');
      });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '认证失败'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});