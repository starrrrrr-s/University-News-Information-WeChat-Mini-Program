const News = require('../../models/News');
const { DataTypes } = require('sequelize');

describe('News 模型测试', () => {
  describe('模型属性定义', () => {
    test('应包含正确的字段定义', () => {
      const attributes = News.rawAttributes;

      expect(attributes.id).toBeDefined();
      expect(attributes.id.type.key).toBe(DataTypes.INTEGER.key);
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.autoIncrement).toBe(true);

      expect(attributes.title).toBeDefined();
      expect(attributes.title.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.title.allowNull).toBe(false);

      expect(attributes.content).toBeDefined();
      expect(attributes.content.type.key).toBe(DataTypes.TEXT.key);
      expect(attributes.content.allowNull).toBe(false);

      expect(attributes.summary).toBeDefined();
      expect(attributes.summary.type.key).toBe(DataTypes.STRING.key);

      expect(attributes.category_id).toBeDefined();
      expect(attributes.category_id.type.key).toBe(DataTypes.INTEGER.key);
      expect(attributes.category_id.allowNull).toBe(false);

      expect(attributes.author).toBeDefined();
      expect(attributes.author.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.author.allowNull).toBe(false);

      expect(attributes.image_url).toBeDefined();
      expect(attributes.image_url.type.key).toBe(DataTypes.TEXT.key);

      expect(attributes.source_url).toBeDefined();
      expect(attributes.source_url.type.key).toBe(DataTypes.TEXT.key);

      expect(attributes.views).toBeDefined();
      expect(attributes.views.type.key).toBe(DataTypes.INTEGER.key);
      expect(attributes.views.defaultValue).toBe(0);

      expect(attributes.published_at).toBeDefined();
      expect(attributes.published_at.type.key).toBe(DataTypes.DATE.key);
    });
  });

  describe('模型配置', () => {
    test('表名和时间戳配置正确', () => {
      expect(News.options.tableName).toBe('news');
      expect(News.options.timestamps).toBe(true);
      expect(News.options.underscored).toBe(true);
    });
  });

  describe('模型关联', () => {
    test('应与 Category 模型建立关联', () => {
      expect(News.associations).toBeDefined();
    });
  });

  describe('模型方法可用性', () => {
    test('应具备 Sequelize 模型的基本方法', () => {
      expect(typeof News.create).toBe('function');
      expect(typeof News.findAll).toBe('function');
      expect(typeof News.findByPk).toBe('function');
      expect(typeof News.findOne).toBe('function');
      expect(typeof News.update).toBe('function');
      expect(typeof News.destroy).toBe('function');
    });
  });
});
