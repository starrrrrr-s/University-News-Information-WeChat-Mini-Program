const { getCategoryList, createCategory, updateCategory, deleteCategory } = require('../../controllers/categoryController');
const Category = require('../../models/Category');

jest.mock('../../models/Category');

describe('分类控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {}
    };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCategoryList 函数', () => {
    test('应返回分类列表', async () => {
      Category.findAll.mockResolvedValue([{ id: 1, name: '分类1' }]);

      await getCategoryList(mockReq, mockRes);

      expect(Category.findAll).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      Category.findAll.mockRejectedValue(new Error('数据库错误'));

      await getCategoryList(mockReq, mockRes);

      // error 函数默认返回 400
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createCategory 函数', () => {
    test('应创建分类', async () => {
      mockReq.body = { name: '新分类' };
      Category.create.mockResolvedValue({ id: 1, name: '新分类' });

      await createCategory(mockReq, mockRes);

      expect(Category.create).toHaveBeenCalledWith({ name: '新分类' });
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('缺少分类名称应返回错误', async () => {
      mockReq.body = {};

      await createCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateCategory 函数', () => {
    test('应更新分类', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { name: '更新后的分类' };
      const mockUpdate = jest.fn().mockResolvedValue(true);
      const mockCategory = { id: 1, name: '旧分类', update: mockUpdate };
      Category.findByPk.mockResolvedValue(mockCategory);

      await updateCategory(mockReq, mockRes);

      expect(mockUpdate).toHaveBeenCalledWith({ name: '更新后的分类' });
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('分类不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Category.findByPk.mockResolvedValue(null);

      await updateCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteCategory 函数', () => {
    test('应删除分类', async () => {
      mockReq.params = { id: 1 };
      const mockCategory = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      Category.findByPk.mockResolvedValue(mockCategory);

      await deleteCategory(mockReq, mockRes);

      expect(mockCategory.destroy).toHaveBeenCalled();
    });

    test('分类不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Category.findByPk.mockResolvedValue(null);

      await deleteCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});