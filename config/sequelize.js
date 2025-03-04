const { Sequelize } = require('sequelize');
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;
const user = process.env.DB_USER;
const sequelize = new Sequelize(database, user, password, {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  // define: {
  //   timestamps: false,
  // },
});

module.exports = sequelize;
