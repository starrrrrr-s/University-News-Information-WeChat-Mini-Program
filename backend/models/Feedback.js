const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contact: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  reply: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0:待处理 1:处理中 2:已解决'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '用户是否已读回复'
  },
  admin_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '管理员是否已读'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'feedback'
});

module.exports = Feedback;