require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const User = require('./models/User');
const app = express();

// parse application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// parse application/json
app.use(express.json());

// 미들웨어 설정
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5000;

// DB 설정
const mysql = require('mysql2');
const dbconfig = require('./config/database.js');
const connection = mysql.createConnection(dbconfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL successfully!');
});

// connection.query('SELECT * from user', (error, rows, fields) => {
//   if (error) throw error;
//   console.log('User info is: ', rows);
// });

connection.end();

// 데이터베이스 연결
(async () => {
  try {
    await User.sync({ alter: false, force: false }); // 테이블 생성 또는 업데이트
    console.log('데이터베이스 연결 성공');
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
  }
})();

app.get('/login', (req, res) => {});

app.listen(PORT, function () {
  console.log(`Server is running... on port${PORT}`);
});
