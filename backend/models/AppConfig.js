const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AppConfig = sequelize.define('AppConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  config_key: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  config_value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255)
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'app_config',
  updatedAt: 'updated_at'
});

module.exports = AppConfig;