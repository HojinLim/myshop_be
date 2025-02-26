const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

// 카테고리 리스트 가져오기
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({});
    return res.status(200).json({
      message: '카테고리 가져오기 성공',
      categories: categories,
    });
  } catch (error) {
    return res.status(400).json({
      message: '카테고리 가져오기 실패',
      error,
    });
  }
});

module.exports = router;
