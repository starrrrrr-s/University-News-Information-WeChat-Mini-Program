const { success, error, paginate } = require('../../utils/response');

describe('response工具函数测试', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
  });

  describe('success函数', () => {
    test('应返回成功响应', () => {
      const data = { id: 1, name: '测试' };
      
      success(mockRes, data, '操作成功');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: { id: 1, name: '测试' }
      });
    });

    test('使用默认消息', () => {
      success(mockRes, null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: null
      });
    });

    test('不传data时使用默认值', () => {
      success(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: null
      });
    });
  });

  describe('error函数', () => {
    test('应返回默认错误响应(400)', () => {
      error(mockRes, '操作失败');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '操作失败'
      });
    });

    test('应返回自定义状态码(500)', () => {
      error(mockRes, '服务器错误', 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器错误'
      });
    });

    test('使用默认消息和状态码', () => {
      error(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '操作失败'
      });
    });

    test('返回401未授权状态码', () => {
      error(mockRes, '未授权', 401);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '未授权'
      });
    });

    test('返回403禁止访问状态码', () => {
      error(mockRes, '禁止访问', 403);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '禁止访问'
      });
    });
  });

  describe('paginate函数', () => {
    test('应返回分页响应', () => {
      const data = [{ id: 1 }, { id: 2 }];
      
      paginate(mockRes, data, 100, 1, 10);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          total: 100,
          page: 1,
          limit: 10,
          pages: 10
        }
      });
    });

    test('计算分页页数', () => {
      const data = [];
      
      paginate(mockRes, data, 15, 1, 10);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: [],
        pagination: {
          total: 15,
          page: 1,
          limit: 10,
          pages: 2
        }
      });
    });

    test('空数据分页', () => {
      paginate(mockRes, [], 0, 1, 10);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      });
    });
  });
});