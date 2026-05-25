const Comment = require('../../models/Comment');

describe('Comment 模型测试', () => {
  test('模型应正确导出', () => {
    expect(Comment).toBeDefined();
    expect(typeof Comment).toBe('function');
  });

  test('模型应具有正确的表名', () => {
    expect(Comment.tableName).toBe('comments');
  });

  test('应具有必要的属性', () => {
    const attributes = Comment.getAttributes();
    expect(attributes.id).toBeDefined();
    expect(attributes.user_id).toBeDefined();
    expect(attributes.target_type).toBeDefined();
    expect(attributes.target_id).toBeDefined();
    expect(attributes.content).toBeDefined();
    expect(attributes.status).toBeDefined();
  });

  test('content 应为文本类型且必填', () => {
    const attributes = Comment.getAttributes();
    expect(attributes.content.type.key).toBe('TEXT');
    expect(attributes.content.allowNull).toBe(false);
  });

  test('status 默认值应为 1', () => {
    const attributes = Comment.getAttributes();
    expect(attributes.status.defaultValue).toBe(1);
  });

  test('is_top 默认值应为 0', () => {
    const attributes = Comment.getAttributes();
    expect(attributes.is_top.defaultValue).toBe(0);
  });

  test('parent_id 应为可空整数', () => {
    const attributes = Comment.getAttributes();
    expect(attributes.parent_id.type.key).toBe('INTEGER');
    expect(attributes.parent_id.allowNull).toBe(true);
  });

  test('target_type 应为枚举类型', () => {
    const attributes = Comment.getAttributes();
    expect(attributes.target_type.type.key).toBe('ENUM');
    expect(attributes.target_type.allowNull).toBe(false);
    expect(attributes.target_type.type.values).toEqual(['news', 'lecture']);
  });

  test('应具有关联方法', () => {
    expect(Comment.belongsTo).toBeDefined();
  });
});