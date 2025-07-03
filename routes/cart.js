const express = require('express');
const { Cart, Product, ProductImage, product_options } = require('../models');

const { Op } = require('sequelize');
const {
  getCartItems,
  destroyAllCartByUID,
  updateCartOwner,
} = require('../utils');
const router = express.Router();

// 카트 리스트 가져오기
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    const cartItems = await getCartItems(user_id);

    return res.status(200).json({
      message: '카트 가져오기 성공',
      cartItems,
    });
  } catch (error) {
    console.log(error);

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
    if (!quantity || !product_option_id) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 존재하는 옵션인지 검증
    const exist_option = await product_options.findOne({
      where: {
        id: Number(product_option_id),
      },
    });

    if (!exist_option) {
      return res
        .status(400)
        .json({ message: '존재하지 않는 옵션입니다.', exist_option });
    }
    const exist_cart = await Cart.findOne({
      where: {
        user_id,
        product_option_id,
      },
    });
    // 이미 카트에 들어있음
    if (exist_cart) {
      //  카트 업데이트 진행
      const cart = await Cart.update(
        { quantity: exist_cart.quantity + quantity },
        { where: { user_id, product_option_id: product_option_id } }
      );
      return res.status(200).json({
        message: '카트 추가 성공',
        cart: {
          ...cart,
        },
      });
    }
    // 해당 옵션은 카트에 없음
    else {
      const cart = await Cart.create({
        ...req.body,
      });

      return res.status(200).json({
        message: '카트 생성 성공',
        cart: {
          ...cart,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '카트 생성 실패', error });
  }
});
// 장바구니 옮기기
router.post('/transfer', async (req, res) => {
  try {
    const { user_id, non_user_id } = req.body;

    if (!user_id || !non_user_id) {
      return res.status(400).json({ message: '필요한 정보가 부족합니다.' });
    }

    //  비회원 장바구니 조회
    const nonMemberCart = await getCartItems(non_user_id);

    if (nonMemberCart.length <= 0) {
      return res
        .status(200)
        .json({ message: '비회원 장바구니가 비어 있습니다.' });
    } else {
      // //  비회원 장바구니를 회원 장바구니로 이전
      await updateCartOwner(non_user_id, user_id);
      // //  이전 완료 후 기존 비회원 장바구니 삭제
      await destroyAllCartByUID(non_user_id);
    }

    return res.status(200).json({
      message: '비회원 장바구니를 회원 장바구니로 성공적으로 이동했습니다.',
    });
  } catch (error) {
    console.error('🚨 오류 발생:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카트 수량 업데이트
router.post('/update_quantity', async (req, res) => {
  const { user_id, product_option_id, quantity } = req.body;
  try {
    const canBuy = await product_options.findOne({
      where: {
        id: product_option_id, //  특정 옵션 기준
        stock: { [Op.gte]: quantity }, //  stock >= quantity 체크
      },
    });

    if (!canBuy) {
      console.log('구매 불가: 재고 부족');
      return res.status(400).json({ message: '재고가 부족합니다.' });
    }

    //  카트 업데이트 진행
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

    //  이미 존재하면 수량 증가
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
      //  없으면 새 옵션 추가 (초기 quantity = 1)
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
    await Cart.destroy({ where: { id: id } }); //  카트 삭제

    return res.status(200).json({ message: '카트 삭제 완료' });
  } catch (error) {
    console.error(' 상품 삭제 오류:', error);
    return res.status(500).json({ message: '카트 삭제 실패', error });
  }
});

module.exports = router;
