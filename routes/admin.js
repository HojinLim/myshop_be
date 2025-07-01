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

module.exports = router;
