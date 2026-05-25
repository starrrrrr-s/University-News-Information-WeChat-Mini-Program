const Collection = require('../../models/Collection');

describe('Collection 模型测试', () => {
  test('模型应正确导出', () => {
    expect(Collection).toBeDefined();
    expect(typeof Collection).toBe('function');
  });

  test('模型应具有正确的表名', () => {
    expect(Collection.tableName).toBe('collections');
  });

  test('应具有必要的属性', () => {
    const attributes = Collection.getAttributes();
    expect(attributes.id).toBeDefined();
    expect(attributes.user_id).toBeDefined();
    expect(attributes.news_id).toBeDefined();
  });

  test('user_id 应为整数类型且必填', () => {
    const attributes = Collection.getAttributes();
    expect(attributes.user_id.type.key).toBe('INTEGER');
    expect(attributes.user_id.allowNull).toBe(false);
  });

  test('news_id 应为整数类型且必填', () => {
    const attributes = Collection.getAttributes();
    expect(attributes.news_id.type.key).toBe('INTEGER');
    expect(attributes.news_id.allowNull).toBe(false);
  });

  test('应存在复合唯一索引', () => {
    expect(Collection.options.indexes).toBeDefined();
    const uniqueIndex = Collection.options.indexes.find(
      idx => idx.unique && idx.fields.includes('user_id') && idx.fields.includes('news_id')
    );
    expect(uniqueIndex).toBeDefined();
  });

  test('应具有关联方法', () => {
    expect(Collection.belongsTo).toBeDefined();
  });
});