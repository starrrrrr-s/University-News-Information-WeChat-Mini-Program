const Lecture = require('../../models/Lecture');

describe('Lecture 模型测试', () => {
  test('模型应正确导出', () => {
    expect(Lecture).toBeDefined();
    expect(typeof Lecture).toBe('function');
  });

  test('模型应具有正确的表名', () => {
    expect(Lecture.tableName).toBe('lectures');
  });

  test('应具有必要的属性', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.id).toBeDefined();
    expect(attributes.title).toBeDefined();
    expect(attributes.content).toBeDefined();
    expect(attributes.speaker).toBeDefined();
    expect(attributes.location).toBeDefined();
    expect(attributes.start_time).toBeDefined();
    expect(attributes.organizer).toBeDefined();
  });

  test('title 应为字符串类型且必填', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.title.type.key).toBe('STRING');
    expect(attributes.title.allowNull).toBe(false);
  });

  test('speaker 应为字符串类型且必填', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.speaker.type.key).toBe('STRING');
    expect(attributes.speaker.allowNull).toBe(false);
  });

  test('start_time 和 end_time 应为日期类型', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.start_time.type.key).toBe('DATE');
    expect(attributes.start_time.allowNull).toBe(false);
    expect(attributes.end_time.type.key).toBe('DATE');
    expect(attributes.end_time.allowNull).toBe(true);
  });

  test('is_published 默认值应为 1', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.is_published.defaultValue).toBe(1);
  });

  test('content 应为可空文本', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.content.type.key).toBe('TEXT');
    expect(attributes.content.allowNull).toBe(true);
  });

  test('location 应为必填字符串', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.location.type.key).toBe('STRING');
    expect(attributes.location.allowNull).toBe(false);
  });

  test('organizer 应为必填字符串', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.organizer.type.key).toBe('STRING');
    expect(attributes.organizer.allowNull).toBe(false);
  });

  test('is_free 默认值应为 1', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.is_free.defaultValue).toBe(1);
  });

  test('category 默认值应为 学术讲座', () => {
    const attributes = Lecture.getAttributes();
    expect(attributes.category.defaultValue).toBe('学术讲座');
  });
});