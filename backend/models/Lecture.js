const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lecture = sequelize.define('Lecture', {
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
    allowNull: true
  },
  speaker: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  speaker_title: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organizer: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '学术讲座'
  },
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  current_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  is_free: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_published: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1
  }
}, {
  timestamps: true,
  tableName: 'lectures',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Lecture;