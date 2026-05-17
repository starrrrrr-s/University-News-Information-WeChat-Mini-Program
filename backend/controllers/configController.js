const AppConfig = require('../models/AppConfig');
const { Op } = require('sequelize');
const { success, error } = require('../utils/response');

const DEFAULT_THEME_COLOR = '#1AAD19';

const initDefaultConfig = async () => {
  try {
    const exists = await AppConfig.findOne({ where: { config_key: 'theme_color' } });
    if (!exists) {
      await AppConfig.create({
        config_key: 'theme_color',
        config_value: DEFAULT_THEME_COLOR,
        description: '主题主色'
      });
    }
    console.log('初始化主题配置成功');
  } catch (err) {
    console.error('初始化主题配置失败:', err);
  }
};

const getThemeColor = async (req, res) => {
  try {
    const config = await AppConfig.findOne({ 
      where: { config_key: 'theme_color' },
      attributes: ['config_value']
    });

    const themeColor = config ? config.config_value : DEFAULT_THEME_COLOR;

    return success(res, { 
      primaryColor: themeColor,
      navigationBarBackgroundColor: themeColor,
      tabBarSelectedColor: themeColor 
    }, '获取主题颜色成功');
  } catch (err) {
    console.error('获取主题颜色失败:', err);
    return error(res, '获取主题颜色失败');
  }
};

const updateThemeColor = async (req, res) => {
  try {
    const { color } = req.body;

    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return error(res, '无效的颜色值');
    }

    await AppConfig.upsert({
      config_key: 'theme_color',
      config_value: color
    });

    return success(res, { 
      primaryColor: color,
      navigationBarBackgroundColor: color,
      tabBarSelectedColor: color 
    }, '更新主题颜色成功');
  } catch (err) {
    console.error('更新主题颜色失败:', err);
    return error(res, '更新主题颜色失败');
  }
};

const getPresetColors = async (req, res) => {
  try {
    const presets = [
      { name: '绿色', color: '#1AAD19' },
      { name: '黄色', color: '#FFD700' },
      { name: '红色', color: '#FF4444' },
      { name: '粉色', color: '#FF69B4' },
      { name: '蓝色', color: '#3366FF' },
      { name: '紫色', color: '#9933FF' },
      { name: '橙色', color: '#FF9900' },
      { name: '青色', color: '#00CCCC' }
    ];

    const currentConfig = await AppConfig.findOne({ 
      where: { config_key: 'theme_color' },
      attributes: ['config_value']
    });

    const currentColor = currentConfig ? currentConfig.config_value : DEFAULT_THEME_COLOR;

    return success(res, {
      presets,
      currentColor
    }, '获取预设颜色成功');
  } catch (err) {
    console.error('获取预设颜色失败:', err);
    return error(res, '获取预设颜色失败');
  }
};

module.exports = {
  initDefaultConfig,
  getThemeColor,
  updateThemeColor,
  getPresetColors
};