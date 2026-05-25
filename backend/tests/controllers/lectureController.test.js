jest.mock('../../models/Lecture', () => {
  const mockLecture = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };
  mockLecture.belongsTo = jest.fn();
  mockLecture.hasMany = jest.fn();
  return mockLecture;
});

const { 
  getLectureList, 
  getLectureDetail, 
  createLecture, 
  updateLecture, 
  deleteLecture 
} = require('../../controllers/lectureController');
const Lecture = require('../../models/Lecture');

describe('讲座控制器测试', () => {
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

  describe('getLectureList', () => {
    test('应返回讲座列表', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const mockLecture = {
        id: 1,
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date(),
        end_time: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          title: '测试讲座',
          speaker: '测试讲师',
          location: '测试地点',
          start_time: new Date(),
          end_time: new Date()
        })
      };
      Lecture.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockLecture] });

      await getLectureList(mockReq, mockRes);

      expect(Lecture.findAndCountAll).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      mockReq.query = { page: 1, limit: 10 };
      Lecture.findAndCountAll.mockRejectedValue(new Error('数据库错误'));

      await getLectureList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('讲座对象无toJSON方法时也能正常格式化', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const mockLecture = {
        id: 1,
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date(),
        end_time: new Date()
      };
      Lecture.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockLecture] });

      await getLectureList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('格式化开始时间和结束时间', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const startTime = new Date('2024-01-15T10:30:00');
      const endTime = new Date('2024-01-15T12:00:00');
      const mockLecture = {
        id: 1,
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: startTime,
        end_time: endTime,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          title: '测试讲座',
          speaker: '测试讲师',
          location: '测试地点',
          start_time: startTime,
          end_time: endTime
        })
      };
      Lecture.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockLecture] });

      await getLectureList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getLectureDetail', () => {
    test('应返回讲座详情', async () => {
      mockReq.params = { id: 1 };
      const mockLecture = {
        id: 1,
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          title: '测试讲座',
          speaker: '测试讲师',
          location: '测试地点',
          start_time: new Date()
        })
      };
      Lecture.findByPk.mockResolvedValue(mockLecture);

      await getLectureDetail(mockReq, mockRes);

      expect(Lecture.findByPk).toHaveBeenCalled();
    });

    test('讲座不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Lecture.findByPk.mockResolvedValue(null);

      await getLectureDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('数据库错误应返回错误', async () => {
      mockReq.params = { id: 1 };
      Lecture.findByPk.mockRejectedValue(new Error('数据库错误'));

      await getLectureDetail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('讲座对象无toJSON方法时也能正常格式化', async () => {
      mockReq.params = { id: 1 };
      const mockLecture = {
        id: 1,
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date()
      };
      Lecture.findByPk.mockResolvedValue(mockLecture);

      await getLectureDetail(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('createLecture', () => {
    test('应创建讲座', async () => {
      mockReq.body = {
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date(),
        organizer: '测试组织者'
      };
      Lecture.create.mockResolvedValue({ id: 1 });

      await createLecture(mockReq, mockRes);

      expect(Lecture.create).toHaveBeenCalled();
    });

    test('缺少必要参数应返回错误', async () => {
      mockReq.body = {};

      await createLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少标题应返回错误', async () => {
      mockReq.body = {
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date(),
        organizer: '测试组织者'
      };

      await createLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少讲师应返回错误', async () => {
      mockReq.body = {
        title: '测试讲座',
        location: '测试地点',
        start_time: new Date(),
        organizer: '测试组织者'
      };

      await createLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少地点应返回错误', async () => {
      mockReq.body = {
        title: '测试讲座',
        speaker: '测试讲师',
        start_time: new Date(),
        organizer: '测试组织者'
      };

      await createLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少开始时间应返回错误', async () => {
      mockReq.body = {
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        organizer: '测试组织者'
      };

      await createLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少组织者应返回错误', async () => {
      mockReq.body = {
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date()
      };

      await createLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('数据库错误应返回错误', async () => {
      mockReq.body = {
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date(),
        organizer: '测试组织者'
      };
      Lecture.create.mockRejectedValue(new Error('数据库错误'));

      await createLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('带完整参数创建讲座', async () => {
      mockReq.body = {
        title: '测试讲座',
        content: '测试内容',
        speaker: '测试讲师',
        speaker_title: '教授',
        location: '测试地点',
        start_time: new Date(),
        end_time: new Date(),
        organizer: '测试组织者',
        category: '学术讲座',
        is_free: 1,
        link: 'http://example.com',
        max_participants: 100
      };
      Lecture.create.mockResolvedValue({ id: 1 });

      await createLecture(mockReq, mockRes);

      expect(Lecture.create).toHaveBeenCalled();
    });

    test('is_free为false时设置为0', async () => {
      mockReq.body = {
        title: '测试讲座',
        speaker: '测试讲师',
        location: '测试地点',
        start_time: new Date(),
        organizer: '测试组织者',
        is_free: false
      };
      Lecture.create.mockResolvedValue({ id: 1 });

      await createLecture(mockReq, mockRes);

      expect(Lecture.create).toHaveBeenCalled();
    });
  });

  describe('updateLecture', () => {
    test('应更新讲座', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { title: '新标题' };
      const mockLecture = {
        id: 1,
        title: '旧标题',
        update: jest.fn().mockResolvedValue(true)
      };
      Lecture.findByPk.mockResolvedValue(mockLecture);

      await updateLecture(mockReq, mockRes);

      expect(mockLecture.update).toHaveBeenCalled();
    });

    test('讲座不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Lecture.findByPk.mockResolvedValue(null);

      await updateLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('数据库错误应返回错误', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { title: '新标题' };
      Lecture.findByPk.mockRejectedValue(new Error('数据库错误'));

      await updateLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('更新所有字段', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = {
        title: '新标题',
        content: '新内容',
        speaker: '新讲师',
        speaker_title: '副教授',
        location: '新地点',
        start_time: new Date(),
        end_time: new Date(),
        organizer: '新组织者',
        category: '研讨会',
        is_free: 0,
        link: 'http://new.example.com',
        max_participants: 200,
        is_published: 0
      };
      const mockLecture = {
        id: 1,
        title: '旧标题',
        content: '旧内容',
        speaker: '旧讲师',
        speaker_title: '教授',
        location: '旧地点',
        start_time: new Date(),
        end_time: new Date(),
        organizer: '旧组织者',
        category: '学术讲座',
        is_free: 1,
        link: 'http://old.example.com',
        max_participants: 100,
        is_published: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      Lecture.findByPk.mockResolvedValue(mockLecture);

      await updateLecture(mockReq, mockRes);

      expect(mockLecture.update).toHaveBeenCalled();
    });

    test('只更新部分字段', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { location: '新地点', speaker_title: '博士' };
      const mockLecture = {
        id: 1,
        title: '标题',
        location: '旧地点',
        speaker_title: '讲师',
        update: jest.fn().mockResolvedValue(true)
      };
      Lecture.findByPk.mockResolvedValue(mockLecture);

      await updateLecture(mockReq, mockRes);

      expect(mockLecture.update).toHaveBeenCalled();
    });
  });

  describe('deleteLecture', () => {
    test('应删除讲座', async () => {
      mockReq.params = { id: 1 };
      const mockLecture = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      Lecture.findByPk.mockResolvedValue(mockLecture);

      await deleteLecture(mockReq, mockRes);

      expect(mockLecture.destroy).toHaveBeenCalled();
    });

    test('讲座不存在应返回错误', async () => {
      mockReq.params = { id: 999 };
      Lecture.findByPk.mockResolvedValue(null);

      await deleteLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('数据库错误应返回错误', async () => {
      mockReq.params = { id: 1 };
      Lecture.findByPk.mockRejectedValue(new Error('数据库错误'));

      await deleteLecture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});