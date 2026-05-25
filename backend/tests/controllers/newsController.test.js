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

const { 
  getNewsList, 
  getNewsDetail, 
  getLatestNews, 
  searchNews, 
  getNewsByCategory, 
  createNews, 
  updateNews, 
  deleteNews 
} = require('../../controllers/newsController');
const News = require('../../models/News');
const Category = require('../../models/Category');

describe('新闻控制器测试', () => {
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

  describe('getNewsList', () => {
    test('应返回新闻列表', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '测试内容',
        summary: '测试摘要',
        category_id: 1,
        author: '作者',
        image_url: '',
        source_url: '',
        published_at: new Date(),
        created_at: new Date(),
        views: 10,
        Category: { id: 1, name: '测试分类' }
      };
      News.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockNews] });

      await getNewsList(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('按分类筛选新闻', async () => {
      mockReq.query = { category_id: '1', page: '1', limit: '10' };
      News.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getNewsList(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      mockReq.query = { page: 1, limit: 10 };
      News.findAndCountAll.mockRejectedValue(new Error('数据库错误'));

      await getNewsList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('新闻无分类时显示未分类', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '测试内容',
        category_id: 1,
        author: '作者',
        image_url: '',
        published_at: new Date(),
        created_at: new Date(),
        views: 10,
        Category: null
      };
      News.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockNews] });

      await getNewsList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('图片URL以http开头时保持不变', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '测试内容',
        category_id: 1,
        author: '作者',
        image_url: 'http://example.com/image.jpg',
        published_at: new Date(),
        created_at: new Date(),
        views: 10,
        Category: { id: 1, name: '测试分类' }
      };
      News.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockNews] });

      await getNewsList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('图片URL不以http开头时添加域名', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '测试内容',
        category_id: 1,
        author: '作者',
        image_url: '/uploads/image.jpg',
        published_at: new Date(),
        created_at: new Date(),
        views: 10,
        Category: { id: 1, name: '测试分类' }
      };
      News.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockNews] });

      await getNewsList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('无摘要时从内容截取', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '这是一段很长的测试内容，用于测试无摘要时的截取功能',
        summary: null,
        category_id: 1,
        author: '作者',
        image_url: '',
        published_at: new Date(),
        created_at: new Date(),
        views: 10,
        Category: { id: 1, name: '测试分类' }
      };
      News.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockNews] });

      await getNewsList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getNewsDetail', () => {
    test('应返回新闻详情', async () => {
      mockReq.params = { id: 1 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '测试内容',
        category_id: 1,
        author: '作者',
        image_url: '',
        views: 10,
        published_at: new Date(),
        created_at: new Date(),
        Category: { id: 1, name: '测试分类' }
      };
      News.findByPk.mockResolvedValue(mockNews);
      News.update.mockResolvedValue([1]);

      await getNewsDetail(mockReq, mockRes);

      expect(News.findByPk).toHaveBeenCalled();
    });

    test('新闻不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      News.findByPk.mockResolvedValue(null);

      await getNewsDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('更新浏览次数', async () => {
      mockReq.params = { id: 1 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '测试内容',
        category_id: 1,
        views: 5,
        published_at: new Date(),
        created_at: new Date(),
        Category: { id: 1, name: '测试分类' }
      };
      News.findByPk.mockResolvedValue(mockNews);
      News.update.mockResolvedValue([1]);

      await getNewsDetail(mockReq, mockRes);

      expect(News.update).toHaveBeenCalledWith({ views: 6 }, { where: { id: 1 } });
    });

    test('数据库错误应返回错误', async () => {
      mockReq.params = { id: 1 };
      News.findByPk.mockRejectedValue(new Error('数据库错误'));

      await getNewsDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getLatestNews', () => {
    test('应返回最新新闻', async () => {
      mockReq.query = { limit: 5 };
      News.findAll.mockResolvedValue([]);

      await getLatestNews(mockReq, mockRes);

      expect(News.findAll).toHaveBeenCalled();
    });

    test('使用默认limit', async () => {
      mockReq.query = {};
      News.findAll.mockResolvedValue([]);

      await getLatestNews(mockReq, mockRes);

      expect(News.findAll).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      mockReq.query = { limit: 5 };
      News.findAll.mockRejectedValue(new Error('数据库错误'));

      await getLatestNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('searchNews', () => {
    test('按关键词搜索', async () => {
      mockReq.query = { keyword: '测试', page: 1, limit: 10 };
      News.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await searchNews(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('按日期搜索(YYYY-MM-DD)', async () => {
      mockReq.query = { keyword: '2024-01-15', page: 1, limit: 10 };
      News.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await searchNews(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('按年月搜索(YYYY-MM)', async () => {
      mockReq.query = { keyword: '2024-01', page: 1, limit: 10 };
      News.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await searchNews(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('按年份搜索(YYYY)', async () => {
      mockReq.query = { keyword: '2024', page: 1, limit: 10 };
      News.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await searchNews(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('无关键词时返回所有', async () => {
      mockReq.query = { page: 1, limit: 10 };
      News.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await searchNews(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      mockReq.query = { keyword: '测试', page: 1, limit: 10 };
      News.findAndCountAll.mockRejectedValue(new Error('数据库错误'));

      await searchNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getNewsByCategory', () => {
    test('应返回分类新闻列表', async () => {
      mockReq.query = { category_id: '1', page: 1, limit: 10 };
      News.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getNewsByCategory(mockReq, mockRes);

      expect(News.findAndCountAll).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      mockReq.query = { category_id: '1', page: 1, limit: 10 };
      News.findAndCountAll.mockRejectedValue(new Error('数据库错误'));

      await getNewsByCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('无摘要时从内容截取', async () => {
      mockReq.query = { category_id: '1', page: 1, limit: 10 };
      const mockNews = {
        id: 1,
        title: '测试新闻',
        content: '这是一段很长的测试内容',
        summary: null,
        category_id: 1,
        author: '作者',
        image_url: '',
        published_at: new Date(),
        created_at: new Date(),
        views: 10,
        Category: null
      };
      News.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockNews] });

      await getNewsByCategory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('createNews', () => {
    test('应创建新闻', async () => {
      mockReq.body = {
        title: '测试新闻',
        content: '测试内容',
        category_id: 1,
        author: '作者'
      };
      News.create.mockResolvedValue({ id: 1 });

      await createNews(mockReq, mockRes);

      expect(News.create).toHaveBeenCalled();
    });

    test('缺少必要参数应返回错误', async () => {
      mockReq.body = {};

      await createNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少标题应返回错误', async () => {
      mockReq.body = { content: '内容', category_id: 1, author: '作者' };

      await createNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少内容应返回错误', async () => {
      mockReq.body = { title: '标题', category_id: 1, author: '作者' };

      await createNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少分类应返回错误', async () => {
      mockReq.body = { title: '标题', content: '内容', author: '作者' };

      await createNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少作者应返回错误', async () => {
      mockReq.body = { title: '标题', content: '内容', category_id: 1 };

      await createNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('数据库错误应返回错误', async () => {
      mockReq.body = {
        title: '测试新闻',
        content: '测试内容',
        category_id: 1,
        author: '作者'
      };
      News.create.mockRejectedValue(new Error('数据库错误'));

      await createNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('带摘要和图片创建新闻', async () => {
      mockReq.body = {
        title: '测试新闻',
        content: '测试内容',
        summary: '测试摘要',
        category_id: 1,
        author: '作者',
        image_url: '/uploads/image.jpg',
        source_url: 'http://example.com',
        published_at: new Date()
      };
      News.create.mockResolvedValue({ id: 1 });

      await createNews(mockReq, mockRes);

      expect(News.create).toHaveBeenCalled();
    });
  });

  describe('updateNews', () => {
    test('应更新新闻', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { title: '新标题' };
      News.findByPk.mockResolvedValue({ id: 1 });
      News.update.mockResolvedValue([1]);

      await updateNews(mockReq, mockRes);

      expect(News.update).toHaveBeenCalled();
    });

    test('新闻不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      News.findByPk.mockResolvedValue(null);

      await updateNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('数据库错误应返回错误', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { title: '新标题' };
      News.findByPk.mockRejectedValue(new Error('数据库错误'));

      await updateNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('更新所有字段', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = {
        title: '新标题',
        content: '新内容',
        summary: '新摘要',
        category_id: 2,
        author: '新作者',
        image_url: '/new/image.jpg',
        source_url: 'http://new.example.com',
        published_at: new Date()
      };
      News.findByPk.mockResolvedValue({ id: 1 });
      News.update.mockResolvedValue([1]);

      await updateNews(mockReq, mockRes);

      expect(News.update).toHaveBeenCalled();
    });
  });

  describe('deleteNews', () => {
    test('应删除新闻', async () => {
      mockReq.params = { id: 1 };
      News.findByPk.mockResolvedValue({ id: 1 });
      News.destroy.mockResolvedValue(1);

      await deleteNews(mockReq, mockRes);

      expect(News.destroy).toHaveBeenCalled();
    });

    test('新闻不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      News.findByPk.mockResolvedValue(null);

      await deleteNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('数据库错误应返回错误', async () => {
      mockReq.params = { id: 1 };
      News.findByPk.mockRejectedValue(new Error('数据库错误'));

      await deleteNews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});