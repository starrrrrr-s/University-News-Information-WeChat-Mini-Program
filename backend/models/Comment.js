const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 评论目标类型：'news' 或 'lecture'
  target_type: {
    type: DataTypes.ENUM('news', 'lecture'),
    allowNull: false
  },
  // 评论目标 ID（新闻 ID 或讲座 ID）
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 评论用户 ID
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  // 回复的父评论 ID（null 表示顶级评论）
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  // 评论内容
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // 审核状态：0=待审核, 1=已通过, 2=已拒绝
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1  // 默认直接通过，管理员可改为 0 需审核
  },
  // 是否置顶
  is_top: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'comments'
});

// 关联关系
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Comment;
