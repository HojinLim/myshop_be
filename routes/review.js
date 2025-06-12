const express = require('express');
const { review } = require('../models');
const router = express.Router();
const createS3Uploader = require('../config/createS3Uploader');

const upload = createS3Uploader().fields([
  {
    name: 'reviewImage',
    maxCount: 2,
  },
]);

// 리뷰 등록
router.post('/create', upload, async (req, res) => {
  try {
    const { product_id, option_id, user_id, rating, content, imageUrl } =
      req.body;
    console.log(req.files['reviewImage'], req.file);
    res.status(201);
    const review_data = await review.create({
      product_id,
      option_id,
      user_id,
      rating,
      content,
      imageUrl,
    });
    res.status(201).json(review_data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 특정 상품 리뷰 조회
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await review.findAll({
      where: { productId: req.params.productId },
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 리뷰 수정
router.put('/update/:id', async (req, res) => {
  try {
    const { rating, content, image } = req.body;
    await review.update(
      { rating, content, image },
      { where: { id: req.params.id } }
    );
    res.json({ message: '수정 완료' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 리뷰 삭제
router.delete('/delete/:id', async (req, res) => {
  try {
    await review.destroy({ where: { id: req.params.id } });
    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
