const { Sequelize, DataTypes } = require('sequelize');
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;
const sequelize = new Sequelize(database, 'root', password, {
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
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = User;
