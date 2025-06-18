require('dotenv').config();
const express = require('express');
const { Product, ProductImage, review } = require('../models');
const { fn, col, Op } = require('sequelize');
const router = express.Router();

// 제품 조회(검색)
router.get('/:keyword?', async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword) {
      return res.status(400).json({ message: '키워드가 없습니다' });
    }

    const products = await Product.findAll({
      where: {
        name: { [Op.like]: `%${keyword}%` },
      },
      attributes: {
        include: [
          [fn('AVG', col('reviews.rating')), 'avg_rating'], // 리뷰의 평균 rating
        ],
      },
      include: [
        {
          model: ProductImage,
          attributes: ['imageUrl'],
        },
        {
          model: review,
          attributes: ['rating'],
        },
      ],
      group: ['Product.id', 'ProductImages.id'], // group by 필요
    });
    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: '검색 결과가 없습니다.', products });
    }
    res.json({ message: '검색 완료', products });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
