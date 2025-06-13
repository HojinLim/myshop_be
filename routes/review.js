require('dotenv').config();
const express = require('express');
const {
  review,
  review_image,
  Product,
  product_options,
  ProductImage,
} = require('../models');
const router = express.Router();
const createS3Uploader = require('../config/createS3Uploader');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

const upload = createS3Uploader().fields([
  {
    name: 'reviewImage',
    maxCount: 3, // 3개 제한
  },
]);

// 리뷰 등록
router.post('/create', upload, async (req, res) => {
  try {
    const { product_id, option_id, user_id, rating, content } = req.body;
    const files = req.files['reviewImage'] || [];

    const newReview = await review.create({
      user_id,
      product_id,
      option_id,
      content,
      rating,
    });

    let newImages;
    if (files.length > 0) {
      const imageRecords = files.map((file) => ({
        review_id: newReview.id,
        imageUrl: file.key, // S3 URL
      }));

      newImages = await review_image.bulkCreate(imageRecords);
    }

    res.status(201).json({ message: '리뷰 등록 성공', newReview, newImages });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
  const reviewId = req.params.id;
  try {
    const images = await review_image.findAll({
      where: { review_id: reviewId },
      attributes: ['imageUrl'],
    });

    // 1. S3에서 이미지 삭제
    for (const image of images) {
      const imageKey = image.imageUrl;
      console.log('Deleting from S3:', imageKey);

      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageKey,
      };

      await s3.send(new DeleteObjectCommand(deleteParams));
    }

    // 2. DB에서 리뷰 및 리뷰 이미지 삭제
    await review_image.destroy({ where: { review_id: reviewId } });
    await review.destroy({ where: { id: reviewId } });

    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// 특정 상품 리뷰 조회
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await review.findAll({
      where: { product_id: req.params.productId },
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 유저 리뷰 조회
router.get('/me/:userId', async (req, res) => {
  try {
    const reviews = await review.findAll({
      where: { user_Id: req.params.userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          attributes: ['name'], // 상품 이름만 가져오기
          include: [
            {
              model: ProductImage,
              attributes: ['imageUrl'],
            },
          ],
        },
        {
          model: product_options,
          attributes: ['size', 'color'],
        },
        {
          model: review_image,
          attributes: ['imageUrl'], // 리뷰 이미지도 같이 가져오기
        },
      ],
    });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
