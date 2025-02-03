const mysql2 = require('mysql2');
require('dotenv').config();
console.log('DB_USER:', process.env.DB_USER);
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};
module.exports = dbConfig;
