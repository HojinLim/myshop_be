require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const paymentRoutes = require('./routes/payments');
const pointsRoutes = require('./routes/points');
const orderRoutes = require('./routes/order');
const favoriteRoutes = require('./routes/favorite');
const reviewRoutes = require('./routes/review');
const searchRoutes = require('./routes/search');
const reviewLikeRoutes = require('./routes/review_like');
const User = require('./models/User');
const app = express();

const allowedOrigins = ['http://localhost:3000'];

// 헤더 설정 미들웨어
app.use((req, res, next) => {
  const deployURL = process.env.DEPLOY_URL;

  // res.setHeader('Access-Control-Allow-Origin', '*'); // 모든 도메인 허용 (보안 필요시 도메인 제한 가능)

  allowedOrigins.push(deployURL);
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // 클라이언트와 서버 간에 쿠키 주고받기 허용
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// parse application/json
app.use(express.json());

// 미들웨어 설정
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/review_like', reviewLikeRoutes);

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

connection.end();

// 데이터베이스 연결
(async () => {
  try {
    await User.sync({ alter: false, force: false }); // 테이블 생성 또는 업데이트
    console.log('데이터베이스 연결 성공+ 자동배포테스트!!');
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
  }
})();

app.listen(PORT, function () {
  console.log(`Server is running... on port${PORT}`);
});
