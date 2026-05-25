const Feedback = require('../../models/Feedback');

describe('Feedback 模型测试', () => {
  test('模型应正确导出', () => {
    expect(Feedback).toBeDefined();
    expect(typeof Feedback).toBe('function');
  });

  test('模型应具有正确的表名', () => {
    expect(Feedback.tableName).toBe('feedback');
  });

  test('应具有必要的属性', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.id).toBeDefined();
    expect(attributes.user_id).toBeDefined();
    expect(attributes.type).toBeDefined();
    expect(attributes.content).toBeDefined();
    expect(attributes.status).toBeDefined();
  });

  test('type 应为字符串类型', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.type.type.key).toBe('STRING');
    expect(attributes.type.allowNull).toBe(false);
  });

  test('content 应为文本类型', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.content.type.key).toBe('TEXT');
    expect(attributes.content.allowNull).toBe(false);
  });

  test('status 默认值应为 0', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.status.defaultValue).toBe(0);
  });

  test('is_read 默认值应为 false', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.is_read.defaultValue).toBe(false);
  });

  test('admin_read 默认值应为 false', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.admin_read.defaultValue).toBe(false);
  });

  test('contact 应为可空字符串', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.contact.type.key).toBe('STRING');
    expect(attributes.contact.allowNull).toBe(true);
  });

  test('reply 应为可空文本', () => {
    const attributes = Feedback.getAttributes();
    expect(attributes.reply.type.key).toBe('TEXT');
    expect(attributes.reply.allowNull).toBe(true);
  });
});