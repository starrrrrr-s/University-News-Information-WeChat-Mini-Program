const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  openid: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.STRING(255)
  },
  is_admin: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;