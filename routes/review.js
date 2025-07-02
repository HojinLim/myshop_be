require('dotenv').config();
const sequelize = require('../config/sequelize');
const express = require('express');
const {
  review,
  review_image,
  Product,
  product_options,
  ProductImage,
  User,
} = require('../models');
const router = express.Router();
const createS3Uploader = require('../config/createS3Uploader');
const {
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');
const review_like = require('../models/review_like');

const upload = createS3Uploader().fields([
  {
    name: 'reviewImage',
    maxCount: 3, // 3개 제한
  },
]);

// 리뷰 등록
router.post('/create', upload, async (req, res) => {
  try {
    const {
      product_id,
      option_id,
      user_id,
      rating,
      content,
      gender,
      weight,
      height,
    } = req.body;
    const files = req.files['reviewImage'] || [];

    const newReview = await review.create({
      user_id,
      product_id,
      option_id,
      content,
      rating,
      gender,
      weight,
      height,
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
router.post('/update/:reviewId', upload, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const {
      rating,
      content,
      gender,
      weight,
      height,
      deleteImageIds = '[]', // 삭제할 이미지 ID 리스트 (프론트에서 전달)
    } = req.body;
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);

    const parsedDeleteImageIds = JSON.parse(deleteImageIds);
    const files = req.files['reviewImage'] || [];

    // 리뷰 업데이트
    await review.update(
      { rating, content, gender, weight, height },
      { where: { id: reviewId } }
    );

    // 삭제할 이미지 DB에서 삭제 및 S3에서도 삭제
    if (parsedDeleteImageIds.length > 0) {
      const imagesToDelete = await review_image.findAll({
        where: { id: parsedDeleteImageIds, review_id: reviewId },
      });
      console.log(imagesToDelete.map((img) => ({ Key: img.imageUrl })));

      // S3 삭제

      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delete: {
          Objects: imagesToDelete.map((img) => ({ Key: img.imageUrl })),
          Quiet: true,
        },
      };
      await s3.send(new DeleteObjectsCommand(deleteParams));

      // DB 삭제
      await review_image.destroy({ where: { id: parsedDeleteImageIds } });
    }

    // 새 이미지 추가
    let newImages = [];
    if (files.length > 0) {
      const newImageRecords = files.map((file) => ({
        review_id: reviewId,
        imageUrl: file.key,
      }));
      newImages = await review_image.bulkCreate(newImageRecords);
    }

    res.status(200).json({ message: '리뷰 수정 완료', newImages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
    // 리뷰 이미지가 존재할 시
    if (images) {
      for (const image of images) {
        const imageKey = image.imageUrl;

        const deleteParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: imageKey,
        };

        await s3.send(new DeleteObjectCommand(deleteParams));
      }

      // 2. DB에서 리뷰 및 리뷰 이미지 삭제
      await review_image.destroy({ where: { review_id: reviewId } });
    }

    await review.destroy({ where: { id: reviewId } });

    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 유저 리뷰 조회
router.get('/me/:userId', async (req, res) => {
  try {
    const reviews = await review.findAll({
      where: { user_Id: req.params.userId },
      order: [['createdAt', 'DESC']],
      attributes: {
        include: [
          [
            sequelize.literal(`(
          SELECT COUNT(*) 
          FROM review_like AS rl 
          WHERE rl.review_id = review.id
        )`),
            'likeCount',
          ],
        ],
      },
      include: [
        {
          model: Product,
          attributes: ['id', 'name'], // 상품 이름만 가져오기
          include: [
            {
              model: ProductImage,
              attributes: ['id', 'imageUrl', 'type'],
            },
          ],
        },
        {
          model: product_options,
          attributes: ['id', 'size', 'color'],
        },
        {
          model: review_image,
          attributes: ['id', 'imageUrl'], // 리뷰 이미지도 같이 가져오기
        },
        {
          model: review_like,
          as: 'likes',
          attributes: [],
          required: false,
        },
      ],
    });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 특정 상품 리뷰 조회
router.get('/', async (req, res) => {
  const { userId, productId } = req.query;
  try {
    //  리뷰 전체 조회 (이미지 포함)
    const reviews = await review.findAll({
      where: { product_id: productId },
      include: [
        {
          model: review_image,
          attributes: ['imageUrl'],
        },
        {
          model: User,
          attributes: ['username'],
        },
        {
          model: product_options,
          attributes: ['color', 'size'],
        },
        {
          model: review_like, // ← 좋아요 모델
          as: 'likes',
        },
      ],
      attributes: {
        include: [
          // 좋아요 개수
          [
            review.sequelize.literal(`(
          SELECT COUNT(*) FROM review_like AS rl
          WHERE rl.review_id = review.id
        )`),
            'likeCount',
          ],
          // 내가 누른 좋아요 유무
          [
            review.sequelize.literal(`(
          SELECT COUNT(*) > 0 FROM review_like AS rl
          WHERE rl.review_id = review.id AND rl.user_id = ${userId}
        )`),
            'isLiked',
          ],
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    //  rating 평균 계산
    const { avg_rating } = await review.findOne({
      where: { product_id: productId },
      attributes: [
        [
          review.sequelize.fn('AVG', review.sequelize.col('rating')),
          'avg_rating',
        ],
      ],
      raw: true,
    });

    res.json({
      averageRating: parseFloat(avg_rating).toFixed(1),
      reviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// 리뷰 개수
router.get('/count', async (req, res) => {
  const { userId } = req.query;

  try {
    const count = await review.count({
      where: { user_id: userId },
    });
    return res.status(200).json({
      message: '리뷰 개수 가져오기 성공',
      count,
    });
  } catch (error) {
    return res.status(400).json({
      message: '리뷰 개수 가져오기 실패',
      error,
    });
  }
});
module.exports = router;
