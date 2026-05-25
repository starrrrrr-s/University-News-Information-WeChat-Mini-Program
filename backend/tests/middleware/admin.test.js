const admin = require('../../middleware/admin');

describe('管理员中间件测试', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { user: null };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('用户未登录应返回401', () => {
    mockReq.user = null;

    admin(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('非管理员用户应返回403', () => {
    mockReq.user = { id: 1, is_admin: 0 };

    admin(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('管理员应调用next', () => {
    mockReq.user = { id: 1, is_admin: 1 };

    admin(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});