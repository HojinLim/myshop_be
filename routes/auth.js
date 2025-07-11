const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middlewares/authenticateToken');
const s3 = require('../config/s3');

const router = express.Router();

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

// 비밀 키 설정
const SECRET_KEY = process.env.SECRET_KEY;

const createS3Uploader = require('../config/createS3Uploader');

const upload = createS3Uploader().single('profile');

// 회원가입 API
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // 입력값 확인
    if (!username || !email || !password) {
      return res.status(400).json({
        message: `모든 필드를 입력하세요.`,
      });
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
        return res.status(201).json({ message: '회원가입 성공', user });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ message: `회원가입 실패 `, error: error });
      }
    }

    // 일반 유저 생성시
    const user = await User.create({
      ...basicForm,
      role: 'user',
    });

    return res.status(201).json({ message: '회원가입 성공', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `회원가입 실패 `, error: error });
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
      expiresIn: '3h',
    });

    return res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '로그인 실패', error });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileUrl: user.profileUrl,
        points: user.points,
      },
      message: '유저 조회 성공',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류 발생' });
  }
});

// 프로필 업로드
router.post('/upload', upload, async (req, res) => {
  // const files = req.files['profile'];
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
  }

  const userId = req.query.userId;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    try {
      user.profileUrl = req.file.key;
      await user.save();
      return res.json({ message: '업로드 성공!' });
    } catch (error) {
      console.error('user.save() 실패!', error);
      return res
        .status(500)
        .json({ error: 'DB 저장 실패', detail: error.message });
    }
  } catch (error) {
    console.error('DB 저장 실패:', error);
    return res.status(500).json({ error: 'DB 저장 실패' });
  }
});

// 프로필 이미지 삭제
router.post('/delete_profile', async (req, res) => {
  const { userId } = req.body;

  try {
    // 사용자 정보 가져오기
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 프로필 이미지가 없는 경우 처리
    if (!user.profileUrl) {
      return res
        .status(400)
        .json({ error: '삭제할 프로필 이미지가 없습니다.' });
    }

    // S3에서 프로필 이미지 삭제
    const fileKey = user.profileUrl; // DB에 저장된 파일 경로

    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      // CacheControl: 'max-age=86400', // 1일 동안 캐시
    };

    try {
      const command = new DeleteObjectCommand(deleteParams);
      await s3.send(command); // S3 이미지 삭제
      console.log(' S3에서 이미지 삭제 성공');
    } catch (s3Error) {
      console.error(' S3 이미지 삭제 실패:', s3Error);
      return res.status(500).json({ error: 'S3 이미지 삭제에 실패했습니다.' });
    }

    // S3 삭제 성공 후 DB 업데이트
    try {
      user.profileUrl = null; // 또는 기본 이미지 URL 설정
      await user.save();
      console.log(' DB 프로필 URL 업데이트 성공');
    } catch (dbError) {
      console.error(' DB 업데이트 실패:', dbError);
      return res.status(500).json({ error: 'DB 업데이트에 실패했습니다.' });
    }

    return res.json({ message: '프로필 이미지가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error(' 프로필 이미지 삭제 실패:', error);
    return res
      .status(500)
      .json({ error: '프로필 이미지 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
