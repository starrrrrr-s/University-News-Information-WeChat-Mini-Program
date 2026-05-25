const User = require('../../models/User');
const { DataTypes } = require('sequelize');

describe('User 模型测试', () => {
  describe('模型属性定义', () => {
    test('应包含正确的字段定义', () => {
      const attributes = User.rawAttributes;

      expect(attributes.id).toBeDefined();
      expect(attributes.id.type.key).toBe(DataTypes.INTEGER.key);
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.autoIncrement).toBe(true);

      expect(attributes.openid).toBeDefined();
      expect(attributes.openid.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.openid.unique).toBe(true);

      expect(attributes.username).toBeDefined();
      expect(attributes.username.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.username.unique).toBe(true);

      expect(attributes.password).toBeDefined();
      expect(attributes.password.type.key).toBe(DataTypes.STRING.key);

      expect(attributes.nickname).toBeDefined();
      expect(attributes.nickname.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.nickname.allowNull).toBe(false);

      expect(attributes.avatar_url).toBeDefined();
      expect(attributes.avatar_url.type.key).toBe(DataTypes.STRING.key);

      expect(attributes.is_admin).toBeDefined();
      expect(attributes.is_admin.type.key).toBe(DataTypes.TINYINT.key);
      expect(attributes.is_admin.defaultValue).toBe(0);

      expect(attributes.is_blocked).toBeDefined();
      expect(attributes.is_blocked.type.key).toBe(DataTypes.TINYINT.key);
      expect(attributes.is_blocked.defaultValue).toBe(0);
    });

    test('表名和时间戳配置正确', () => {
      expect(User.options.tableName).toBe('users');
      expect(User.options.timestamps).toBe(false);
    });
  });

  describe('模型方法可用性', () => {
    test('应具备 Sequelize 模型的基本方法', () => {
      expect(typeof User.create).toBe('function');
      expect(typeof User.findAll).toBe('function');
      expect(typeof User.findByPk).toBe('function');
      expect(typeof User.findOne).toBe('function');
      expect(typeof User.update).toBe('function');
      expect(typeof User.destroy).toBe('function');
    });
  });
});