const express = require('express');
const { point_history, User } = require('../models');
const router = express.Router();

// 모든 유저 정보 가져오기
router.get('/getAllUsers', async (req, res) => {
  try {
    const allUser = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    return res.status(200).json({
      message: '정보 가져오기 성공',
      users: allUser,
    });
  } catch (error) {
    return res.status(400).json({
      message: '정보 가져오기 실패',
      error,
    });
  }
});

router.post('/upload_product', async (req, res) => {
  try {
  } catch (error) {}
});

// 회원 포인트 수동 적립
router.post('give_points', async (req, res) => {
  const { userId, points } = req.body;
  try {
    await point_history.create({
      user_id: userId,
      point: usedPoint,
      type: 'admin',
      description: `어드민 수동 포인트 적립`,
    });

    await User.increment('points', {
      by: points,
      where: { id: userId },
    });

    return res.status(200).json({
      message: '포인트 보내기 완료',
    });
  } catch (error) {
    return res.status(400).json({
      message: '포인트 보내기 실패',
    });
  }
});

module.exports = router;
