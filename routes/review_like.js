const express = require('express');
const { review } = require('../models');
const review_like = require('../models/review_like');
const router = express.Router();

// 리뷰 좋아요
router.post('/create', async (req, res) => {
  const { userId, reviewId } = req.body;
  try {
    // 중복된 옵션인지 검증
    const exist_option = await review_like.findOne({
      where: {
        user_id: userId,
        review_id: reviewId,
      },
    });

    if (exist_option !== null) {
      return res
        .status(400)
        .json({ message: '이미 존재하는 옵션입니다.', exist_option });
    }

    const results = await review_like.create({
      user_id: userId,
      review_id: reviewId,
    });

    res.status(200).json({ message: '리뷰 좋아요 성공', results });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// 리뷰 좋아요 삭제
router.delete('/delete', async (req, res) => {
  const { userId, reviewId } = req.query;

  try {
    const result = await review_like.destroy({
      where: {
        user_id: userId,
        review_id: reviewId,
      },
    });

    res.status(200).json({ message: '리뷰 좋아요 삭제 성공', result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 리뷰 좋아요 체크
router.get('/check', async (req, res) => {
  const { userId, reviewId } = req.body;
  try {
    const isReviewLike = await review_like.findOne({
      where: {
        user_id: userId,
        review_id: reviewId,
      },
    });

    res
      .status(200)
      .json({ message: '리뷰 좋아요 체크 성공', isReviewLike: !!isReviewLike });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 리뷰 좋아요 개수 가져오기
router.get('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  try {
    const result = await review_like.count({
      review_id: reviewId,
    });

    res.status(200).json({ message: '리뷰 좋아요 개수 조회', result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
