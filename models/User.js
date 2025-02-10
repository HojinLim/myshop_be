const { Sequelize, DataTypes } = require('sequelize');
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;
const user = process.env.DB_USER;
const sequelize = new Sequelize(database, user, password, {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
});

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
  role: {
    type: DataTypes.ENUM,
    allowNull: false,
    values: ['user', 'admin'],
  },
});

module.exports = User;
