const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// 비밀 키 설정
const SECRET_KEY = process.env.SECRET_KEY;

// 회원가입 API
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // 입력값 확인
    if (!username || !email || !password) {
      return res.status(400).json({
        message: `모든 필드를 입력하세요.${username}${email}${password}`,
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 유저 생성
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: '회원가입 성공', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `회원가입 실패 `, error: error });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 입력값 확인
    if (!username || !password) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 유저 찾기
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: '로그인 성공', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '로그인 실패' });
  }
});

module.exports = router;
