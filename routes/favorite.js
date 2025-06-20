const express = require('express');
const router = express.Router();
const { favorite, Product, ProductImage } = require('../models');

// 🔘 찜 추가
router.post('/create', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const [favorite_data, created] = await favorite.findOrCreate({
      where: { user_id: userId, product_id: productId },
    });
    if (!created) {
      return res.status(400).json({ message: '이미 찜한 상품입니다.' });
    }

    res.status(201).json(favorite_data);
  } catch (err) {
    res.status(500).json({ message: '찜 추가 실패', error: err });
  }
});

// 🔘 찜 삭제
router.delete('/delete', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const deleted = await favorite.destroy({
      where: { user_id: userId, product_id: productId },
    });

    if (!deleted) {
      return res.status(404).json({ message: '찜 목록에 없음' });
    }

    res.json({ message: '찜 삭제 완료' });
  } catch (err) {
    res.status(500).json({ message: '찜 삭제 실패', error: err });
  }
});
// 🔘 현재 아이템 찜 여부
router.get('/check', async (req, res) => {
  // (쿼리방식)
  const { userId, productId } = req.query;

  try {
    const isFavorite = await favorite.findOne({
      where: { user_id: userId, product_id: productId },
    });

    res.json({ isFavorite: !!isFavorite });
  } catch (err) {
    res.status(500).json({ message: '찜 여부 확인 실패', error: err });
  }
});
// 🔘 현재 아이템의 찜 수
router.get('/product_count', async (req, res) => {
  const { productId } = req.query;

  try {
    const count = await favorite.count({
      where: { product_id: productId },
    });

    res.json({ productId, count });
  } catch (err) {
    res.status(500).json({ message: '찜 수 조회 실패', error: err });
  }
});
// 🔘 나의 찜 수
router.get('/count', async (req, res) => {
  const { userId } = req.query;

  try {
    const count = await favorite.count({
      where: { user_id: userId },
    });
    return res.status(200).json({
      message: '찜 개수 가져오기 성공',
      count,
    });
  } catch (error) {
    return res.status(400).json({
      message: '찜 개수 가져오기 실패',
      error,
    });
  }
});

// 🔘 내 찜 목록 조회
// (파라미터 방식)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const favorites = await favorite.findAll({
      where: { user_id: userId },
      include: [{ model: Product, include: [{ model: ProductImage }] }],
    });

    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: '찜 목록 조회 실패', error: err });
  }
});

module.exports = router;
