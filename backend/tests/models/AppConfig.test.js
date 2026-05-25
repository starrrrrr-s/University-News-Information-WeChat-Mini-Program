const AppConfig = require('../../models/AppConfig');

describe('AppConfig 模型测试', () => {
  test('模型应正确导出', () => {
    expect(AppConfig).toBeDefined();
    expect(typeof AppConfig).toBe('function');
  });

  test('模型应具有正确的表名', () => {
    expect(AppConfig.tableName).toBe('app_config');
  });

  test('应具有必要的属性', () => {
    const attributes = AppConfig.getAttributes();
    expect(attributes.id).toBeDefined();
    expect(attributes.config_key).toBeDefined();
    expect(attributes.config_value).toBeDefined();
  });

  test('config_key 应为字符串类型且必填', () => {
    const attributes = AppConfig.getAttributes();
    expect(attributes.config_key.type.key).toBe('STRING');
    expect(attributes.config_key.allowNull).toBe(false);
    expect(attributes.config_key.unique).toBe(true);
  });

  test('config_value 应为文本类型且必填', () => {
    const attributes = AppConfig.getAttributes();
    expect(attributes.config_value.type.key).toBe('TEXT');
    expect(attributes.config_value.allowNull).toBe(false);
  });

  test('description 应为可选字符串', () => {
    const attributes = AppConfig.getAttributes();
    expect(attributes.description.type.key).toBe('STRING');
    // allowNull 默认就是 true，所以可能是 undefined
    expect(attributes.description.allowNull === undefined || attributes.description.allowNull === true).toBe(true);
  });
});