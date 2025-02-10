const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middlewares/authenticateToken');

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
        message: `모든 필드를 입력하세요.`,
      });
      ㅣ;
    }
    // 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 패스워드 길이 검사
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    const basicForm = {
      username,
      email,
      password: hashedPassword,
    };
    // 어드민 생성시
    if (email === process.env.ADMIN_EMAIL) {
      try {
        const user = await User.create({
          ...basicForm,
          role: 'admin',
        });
        res.status(201).json({ message: '회원가입 성공', user });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `회원가입 실패 `, error: error });
      }
    }

    // 일반 유저 생성시
    const user = await User.create({
      ...basicForm,
      role: 'user',
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
    const { email, password } = req.body;

    // 입력값 확인
    if (!email || !password) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 유저 찾기
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '로그인 실패' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류 발생' });
  }
});

module.exports = router;
