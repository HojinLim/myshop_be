const express = require('express');
const { point_history, User } = require('../models');
const router = express.Router();

// 포인트 조회
router.get('/', async (req, res) => {
  const { userId } = req.query;
  try {
    const point_data = await point_history.findAll({
      where: { user_id: userId },
    });

    return res.status(200).json({
      message: '포인트 조회 성공',
      data: point_data,
    });
  } catch (error) {
    return res.status(400).json({
      message: '포인트 조회 실패',
    });
  }
});
// 회원 포인트 수동 변경
router.post('/change_points', async (req, res) => {
  const { userId, points, reason } = req.body;
  try {
    await point_history.create({
      user_id: userId,
      point: points,
      type: 'admin',
      description: reason || `어드민 수동 포인트 적립`,
    });

    if (typeof points !== 'number' || points === 0) {
      return res.status(400).json({
        message: '숫자 타입 혹은 유효한 숫자를 기입하세요!',
      });
    }

    if (points > 0) {
      await User.increment('points', {
        by: points,
        where: { id: userId },
      });
    } else {
      await User.decrement('points', {
        by: Math.abs(points),
        where: { id: userId },
      });
    }

    return res.status(200).json({
      message: '포인트 보내기 완료',
    });
  } catch (error) {
    return res.status(400).json({
      message: '포인트 보내기 실패',
      error,
    });
  }
});

module.exports = router;
