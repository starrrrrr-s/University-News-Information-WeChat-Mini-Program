jest.mock('../../models/AppConfig', () => {
  const mockAppConfig = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    destroy: jest.fn()
  };
  mockAppConfig.belongsTo = jest.fn();
  mockAppConfig.hasMany = jest.fn();
  return mockAppConfig;
});

const { initDefaultConfig, getThemeColor, updateThemeColor, getPresetColors } = require('../../controllers/configController');
const AppConfig = require('../../models/AppConfig');

describe('配置控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = { body: {}, params: {} };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('initDefaultConfig', () => {
    test('配置已存在时不创建', async () => {
      AppConfig.findOne.mockResolvedValue({ config_key: 'theme_color' });

      await initDefaultConfig();

      expect(AppConfig.create).not.toHaveBeenCalled();
    });

    test('配置不存在时创建默认配置', async () => {
      AppConfig.findOne.mockResolvedValue(null);
      AppConfig.create.mockResolvedValue({});

      await initDefaultConfig();

      expect(AppConfig.create).toHaveBeenCalled();
    });
  });

  describe('getThemeColor', () => {
    test('返回已配置的主题色', async () => {
      AppConfig.findOne.mockResolvedValue({ config_value: '#FF0000' });

      await getThemeColor(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('无配置时返回默认色', async () => {
      AppConfig.findOne.mockResolvedValue(null);

      await getThemeColor(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      AppConfig.findOne.mockRejectedValue(new Error('DB error'));

      await getThemeColor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateThemeColor', () => {
    test('无效颜色格式应返回错误', async () => {
      mockReq.body = { color: 'invalid' };

      await updateThemeColor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('缺少颜色参数应返回错误', async () => {
      mockReq.body = {};

      await updateThemeColor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('有效颜色应更新成功', async () => {
      mockReq.body = { color: '#FF0000' };
      AppConfig.upsert.mockResolvedValue({});

      await updateThemeColor(mockReq, mockRes);

      expect(AppConfig.upsert).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getPresetColors', () => {
    test('应返回预设颜色列表', async () => {
      AppConfig.findOne.mockResolvedValue({ config_value: '#1AAD19' });

      await getPresetColors(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    test('数据库错误应返回错误', async () => {
      AppConfig.findOne.mockRejectedValue(new Error('DB error'));

      await getPresetColors(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});