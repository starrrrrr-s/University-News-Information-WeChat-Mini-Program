const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./Category');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  summary: {
    type: DataTypes.STRING(500)
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  image_url: {
    type: DataTypes.TEXT
  },
  source_url: {
    type: DataTypes.TEXT
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  published_at: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  tableName: 'news',
  underscored: true
});

News.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = News;