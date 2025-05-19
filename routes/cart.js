const express = require('express');
const Cart = require('../models/Cart');
const product_options = require('../models/product_options');

const router = express.Router();

// 카트 리스트 가져오기
router.get('/', async (req, res) => {});

// 카트 추가 가져오기
router.post('/add', async (req, res) => {
  try {
    const { user_id, product_option_id, quantity } = req.body;

    // 입력값 확인
    if (!quantity) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 존재하는 옵션인지 검증
    const exist_option = await product_options.findOne({
      where: {
        id: Number(product_option_id),
      },
    });
    if (exist_option !== null) {
      return res
        .status(400)
        .json({ message: '존재하는 않는 옵션입니다.', exist_option });
    }

    const cart = await Cart.create({
      ...req.body,
    });

    return res.status(200).json({
      message: '카트 생성 성공',
      cart: {
        ...cart,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '카트 생성 실패', error });
  }
});

module.exports = router;
