const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // 이메일 형식 유효성 검사
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  role: {
    type: DataTypes.ENUM,
    allowNull: false,
    values: ['user', 'admin'],
  },
  profileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;
