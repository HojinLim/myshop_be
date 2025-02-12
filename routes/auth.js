const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middlewares/authenticateToken');
const cloudinary = require('../config/cloudinary');

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
    res.status(500).json({ message: '로그인 실패', error });
  }
});

// 프로필 이미지 업로드
router.post('/upload_profile', async (req, res) => {
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  };

  try {
    // Upload the image
    const testUrl =
      'https://res.cloudinary.com/demo/image/upload/v1651585298/happy_people.jpg';
    const result = await cloudinary.uploader.upload(testUrl, options);
    console.log('result', result);

    getAssetInfo(result.public_id);

    return result.public_id;
  } catch (error) {
    console.error(error);
  }
});
const getAssetInfo = async (publicId) => {
  // Return colors in the response
  const options = {
    colors: true,
  };

  try {
    // Get details about the asset
    const result = await cloudinary.api.resource(publicId, options);
    console.log('result', result);
    return result.colors;
  } catch (error) {
    console.error(error);
  }
};
// router.post(
//   '/upload_profile',
//   authenticateToken,
//   upload.single('profileImage'),
//   async (req, res) => {
//     try {
//       console.log('🟢 업로드된 파일 정보:', req.file); // 🔍 디버깅 코드 추가

//       if (!req.file) {
//         return res
//           .status(400)
//           .json({ success: false, error: 'No file uploaded' });
//       }

//       const imageUrl = req.file.path; // 🔥 `secure_url` 대신 `path` 사용

//       // DB 업데이트
//       await User.update(
//         { profileUrl: imageUrl },
//         { where: { id: req.user.id } }
//       );

//       res.json({ success: true, imageUrl });
//     } catch (error) {
//       console.error('🔴 업로드 에러:', error);
//       res.status(500).json({ success: false, error: 'Upload failed' });
//     }
//   }
// );

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
