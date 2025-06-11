const express = require('express');
const { point_history } = require('../models');
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

module.exports = router;
