const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const News = require('./News');

const Collection = sequelize.define('Collection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  news_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: News,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'collections',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'news_id']
    }
  ]
});

// 关联关系
Collection.belongsTo(User, { foreignKey: 'user_id' });
Collection.belongsTo(News, { foreignKey: 'news_id' });

module.exports = Collection;