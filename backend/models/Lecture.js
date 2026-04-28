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
    allowNull: false
  },
  speaker: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  speaker_title: {
    type: DataTypes.STRING(100)
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  organizer: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  is_free: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  timestamps: true,
  tableName: 'lectures'
});

module.exports = Lecture;