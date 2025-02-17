const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middlewares/authenticateToken');
const s3 = require('../config/s3');

const multer = require('multer');
const multerS3 = require('multer-s3');

const router = express.Router();

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

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
      expiresIn: '1h',
    });

    return res.status(200).json({
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
    return res.status(500).json({ message: '로그인 실패', error });
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
      profileUrl: user.profileUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류 발생' });
  }
});

// 🔹 Multer + S3 설정
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    // acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `profile/${Date.now()}_${file.originalname}`);
    },
  }),
});

// 프로필 업로드
router.post('/upload', upload.single('profile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
  }

  // 유저 ID 받아오기 (formData에 포함되어 있음)
  const userId = req.body.userId;
  console.log(userId);

  try {
    // Sequelize를 사용하여 프로필 이미지 업데이트
    const user = await User.findByPk(userId); // userId로 해당 사용자 찾기

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 프로필 이미지 URL 업데이트
    user.profileUrl = req.file.key; // S3의 URL을 DB에 저장
    await user.save(); // 저장

    return res.json({ message: '업로드 성공!', imageUrl: req.file.location }); // S3에 저장된 이미지 URL 반환
  } catch (error) {
    console.error('DB 저장 실패:', error);
    return res.status(500).json({ error: 'DB 저장 실패' });
  }
});

// 프로필 가져오기
router.post('/get_profile', async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;

    const { profileUrl } = req.body;

    const fileName = profileUrl;

    // 예시로 임시 URL을 반환
    const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    return res.json({
      message: '프로필 링크 가져오기 성공',
      profileUrl: imageUrl,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: '프로필 가져오기 실패', error: error });
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

    // S3에서 프로필 이미지 삭제
    const fileKey = user.profileUrl; // DB에 저장된 파일 경로

    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    };

    // S3에서 이미지 삭제
    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command); // send()로 명령 실행

    // DB에서 프로필 URL 삭제 (기본 이미지로 변경하거나 null로 설정)
    user.profileUrl = null; // 또는 기본 이미지 URL로 설정
    await user.save();

    console.log('파일 삭제 성공');
    return res.json({ message: '프로필 이미지가 삭제되었습니다.' });
  } catch (error) {
    console.error('프로필 이미지 삭제 실패:', error);
    return res.status(500).json({ error: '프로필 이미지 삭제 실패' });
  }
});

module.exports = router;
