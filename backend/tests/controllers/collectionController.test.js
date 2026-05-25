jest.mock('../../models/Collection', () => {
  const mockCollection = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };
  mockCollection.belongsTo = jest.fn();
  mockCollection.hasMany = jest.fn();
  return mockCollection;
});

jest.mock('../../models/News', () => {
  const mockNews = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };
  mockNews.belongsTo = jest.fn();
  mockNews.hasMany = jest.fn();
  return mockNews;
});

jest.mock('../../models/Category', () => {
  const mockCategory = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };
  mockCategory.belongsTo = jest.fn();
  mockCategory.hasMany = jest.fn();
  return mockCategory;
});

const { getCollectionList, addCollection, deleteCollection, batchDeleteCollection } = require('../../controllers/collectionController');
const Collection = require('../../models/Collection');
const News = require('../../models/News');

describe('收藏控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      user: { id: 1 }
    };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCollectionList', () => {
    test('应获取收藏列表', async () => {
      Collection.findAll.mockResolvedValue([{ News: { id: 1, title: '新闻1' } }]);

      await getCollectionList(mockReq, mockRes);

      expect(Collection.findAll).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      Collection.findAll.mockRejectedValue(new Error('DB error'));

      await getCollectionList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('addCollection', () => {
    test('应添加收藏', async () => {
      mockReq.body = { news_id: 1 };
      News.findByPk.mockResolvedValue({ id: 1 });
      Collection.findOne.mockResolvedValue(null);
      Collection.create.mockResolvedValue({ id: 1 });

      await addCollection(mockReq, mockRes);

      expect(Collection.create).toHaveBeenCalled();
    });

    test('缺少新闻ID应返回错误', async () => {
      mockReq.body = {};

      await addCollection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('新闻不存在应返回错误', async () => {
      mockReq.body = { news_id: 999 };
      News.findByPk.mockResolvedValue(null);

      await addCollection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('已收藏应返回错误', async () => {
      mockReq.body = { news_id: 1 };
      News.findByPk.mockResolvedValue({ id: 1 });
      Collection.findOne.mockResolvedValue({ id: 1 });

      await addCollection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteCollection', () => {
    test('应删除收藏', async () => {
      mockReq.params = { id: 1 };
      const mockDestroy = jest.fn();
      Collection.findOne.mockResolvedValue({ id: 1, destroy: mockDestroy });

      await deleteCollection(mockReq, mockRes);

      expect(mockDestroy).toHaveBeenCalled();
    });

    test('收藏不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Collection.findOne.mockResolvedValue(null);

      await deleteCollection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('batchDeleteCollection', () => {
    test('应批量删除收藏', async () => {
      mockReq.body = { ids: [1, 2, 3] };
      Collection.destroy.mockResolvedValue(3);

      await batchDeleteCollection(mockReq, mockRes);

      expect(Collection.destroy).toHaveBeenCalled();
    });

    test('缺少ID列表应返回错误', async () => {
      mockReq.body = {};

      await batchDeleteCollection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});