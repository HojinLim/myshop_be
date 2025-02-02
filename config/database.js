const mysql2 = require('mysql2');
require('dotenv').config();

// const connection = mysql2.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   port: process.env.DB_PORT,
// });
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};
module.exports = dbConfig;
// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err);
//     return;
//   }
//   console.log('Connected to MySQL successfully!');
// });

// connection.query('SELECT * from user', (error, rows, fields) => {
//   if (error) throw error;
//   console.log('User info is: ', rows);
// });

// connection.end();
