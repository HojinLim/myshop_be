const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const product_options = require('../models/product_options');
const { Op } = require('sequelize');
const router = express.Router();

// 카트 리스트 가져오기
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    const cartItems = await Cart.findAll({
      where: { user_id },
      include: [
        {
          model: product_options,
          attributes: ['id', 'size', 'color', 'price'],
          include: {
            model: Product,
            attributes: ['id', 'name', 'originPrice'],
            include: [
              {
                model: product_options, // ✅ 현재 옵션의 상품과 관련된 모든 옵션 조회
                attributes: ['id', 'size', 'color', 'price', 'stock'],
              },
              {
                model: ProductImage, // ✅ 상품 이미지 조회 추가
                attributes: ['imageUrl'],
              },
            ],
          },
        },
      ],
    });

    return res.status(200).json({
      message: '카트 가져오기 성공',
      cartItems,
    });
  } catch (error) {
    return res.status(400).json({
      message: '카트 가져오기 실패',
      error,
    });
  }
});

// 카트 추가 가져오기
router.post('/add', async (req, res) => {
  try {
    const { user_id, product_option_id, quantity } = req.body;

    // 입력값 확인
    if (!quantity) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 로그인 유효 검사
    if (!user_id) {
      return res.status(400).json({ message: '로그인이 필요합니다.' });
    }
    // 존재하는 옵션인지 검증
    const exist_option = await product_options.findOne({
      where: {
        id: Number(product_option_id),
      },
    });
    // TODO: 이미 카트에 존재하는 옵션일 시 update 수량만 올리게끔

    if (!exist_option) {
      return res
        .status(400)
        .json({ message: '존재하지 않는 옵션입니다.', exist_option });
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

// 카트 수량 업데이트
router.post('/update_quantity', async (req, res) => {
  const { user_id, product_option_id, quantity } = req.body;
  try {
    const canBuy = await product_options.findOne({
      where: {
        id: product_option_id, // ✅ 특정 옵션 기준
        stock: { [Op.gte]: quantity }, // ✅ stock >= quantity 체크
      },
    });

    if (!canBuy) {
      console.log('구매 불가: 재고 부족');
      return res.status(400).json({ message: '재고가 부족합니다.' });
    }

    // ✅ 카트 업데이트 진행
    await Cart.update(
      { quantity },
      { where: { user_id, product_option_id: product_option_id } }
    );

    console.log('카트 업데이트 완료');
    res.status(200).json({ message: '카트가 정상적으로 업데이트되었습니다.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '옵션 업데이트 실패', error });
  }
});

// 카트 옵션 업데이트
router.post('/update_option', async (req, res) => {
  const { user_id, product_option_id, cart_id, quantity = 1 } = req.body;
  // 최소 양 : 1로 지정

  try {
    const option_exist = await Cart.findOne({
      where: {
        user_id,
        product_option_id: product_option_id,
      },
    });

    // ✅ 이미 존재하면 수량 증가
    if (option_exist) {
      await Cart.update(
        { quantity: option_exist.quantity + quantity },
        { where: { id: option_exist.id } }
      );

      if (cart_id) {
        await Cart.destroy({ where: { id: cart_id } });
        return res
          .status(200)
          .json({ message: '카트 업데이트 완료 및 기존 항목 삭제됨' });
      } else {
        return res.status(200).json({ message: '카트 업데이트 완료' });
      }
    } else {
      // ✅ 없으면 새 옵션 추가 (초기 quantity = 1)
      await Cart.create({
        user_id,
        product_option_id: product_option_id,
        quantity,
      });
      if (cart_id) {
        await Cart.destroy({ where: { id: cart_id } });
        res.status(200).json({ message: '카트 업데이트 및 기존 항목 삭제' });
      } else {
        return res.status(200).json({ message: '카트 업데이트 완료' });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '카트 업데이트 실패', error });
  }
});

// 카트 삭제
router.post('/delete', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: '카트 ID를 입력하세요.' });
  }

  try {
    //  RDS(MySQL)에서 카트 삭제
    await Cart.destroy({ where: { id: id } }); // ✅ 카트 삭제

    return res.status(200).json({ message: '카트 삭제 완료' });
  } catch (error) {
    console.error('❌ 상품 삭제 오류:', error);
    return res.status(500).json({ message: '카트 삭제 실패', error });
  }
});

module.exports = router;
