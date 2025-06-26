require('dotenv').config();

const express = require('express');
const axios = require('axios');

const { getToken } = require('../utils');
const router = express.Router();
const { order, order_item, User, point_history } = require('../models');
const { where } = require('sequelize');

//  결제 검증
router.post('/verify', async (req, res) => {
  const {
    userId,
    imp_uid,
    totalPrice,
    paymentMethod,
    usedPoint = 0,
    order_items = [],
  } = req.body;

  try {
    // 1. 아임포트 토큰 발급
    const access_token = await getToken();

    // 2. imp_uid로 결제 정보 조회

    const paymentData = await axios.get(
      `https://api.iamport.kr/payments/${imp_uid}`,
      {
        headers: { Authorization: access_token },
      }
    );

    const amountPaid = paymentData.data.response.amount;

    // 3. 서버 기준 금액 비교 (위조 방지) 및 결제 확인
    if (
      amountPaid === totalPrice &&
      paymentData.data.response.status === 'paid'
    ) {
      // 결제 완료
      // 주문 정보 생성 (포인트 없이 결제)
      let newOrder;
      if (usedPoint <= 0) {
        newOrder = await order.create({
          user_id: userId,
          totalPrice,
          payment_method: paymentMethod,
          status: 'paid',
          imp_uid,
          amount_paid_by_pg: totalPrice,
          amount_paid_by_point: 0,
        });
      }
      // 주문 정보 생성 (포인트 포함 결제)
      else {
        newOrder = await order.create({
          user_id: userId,
          totalPrice,
          payment_method: paymentMethod,
          status: 'paid',
          imp_uid,
          amount_paid_by_pg: totalPrice - usedPoint,
          amount_paid_by_point: usedPoint,
        });

        // 포인트 차감 내역 저장 (사용했을 경우)
        if (usedPoint > 0) {
          await point_history.create({
            user_id: userId,
            order_id: newOrder.id,
            point: -usedPoint,
            type: 'used',
            description: `주문 #${newOrder.id}에 포인트 사용`,
          });
        }
        await User.decrement('points', {
          by: usedPoint,
          where: { id: userId },
        });
      }
      //  포인트 적립 내역 저장 (예: 총 결제 금액의 5% 적립 등)
      const savedPoint = Math.floor(totalPrice * 0.05); // 예시
      if (savedPoint > 0) {
        await point_history.create({
          user_id: userId,
          order_id: newOrder.id,
          point: savedPoint,
          type: 'saved',
          description: `주문 #${newOrder.id} 결제 포인트 적립`,
        });
      }
      await User.increment('points', {
        by: savedPoint,
        where: { id: userId },
      });

      // 주문 아이템 생성
      //주문 상세(order_item) 저장 (장바구니 or 구매 옵션 기반)
      for (const item of order_items) {
        await order_item.create({
          order_id: newOrder.id,
          user_id: userId,
          product_id: item.Product.id,
          option_id: item.id,
          price: item.price,
          quantity: item.quantity,
          status: 'pending',
        });
      }

      return res.send({ success: true });
    } else {
      return res.send({ success: false, message: '금액 불일치' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: '서버 오류' });
  }
});
// 실 결제 금액없이 포인트로 상품 구매
router.post('/without_money', async (req, res) => {
  const { userId, totalPrice, usedPoint = 0, order_items = [] } = req.body;
  try {
    const newOrder = await order.create({
      user_id: userId,
      totalPrice,
      payment_method: 'points',
      status: 'paid',
      imp_uid: null,
      amount_paid_by_pg: 0,
      amount_paid_by_point: usedPoint,
    });

    // 포인트 차감 내역 저장 (사용했을 경우)
    if (usedPoint > 0) {
      await point_history.create({
        user_id: userId,
        order_id: newOrder.id,
        point: -usedPoint,
        type: 'used',
        description: `주문 #${newOrder.id}에 포인트 사용`,
      });
    }
    await User.decrement('points', {
      by: usedPoint,
      where: { id: userId },
    });
    //주문 상세(order_item) 저장 (장바구니 or 구매 옵션 기반)
    for (const item of order_items) {
      await order_item.create({
        order_id: newOrder.id,
        user_id: userId,
        product_id: item.Product.id,
        option_id: item.id,
        price: item.price,
        quantity: item.quantity,
        status: 'pending',
      });
    }

    res.status(200).json({ newOrder, message: '결제 성공!' });
  } catch (error) {
    res.status(400).json({ error, message: '결제 실패!' });
  }
});

// 결제 취소

router.post('/refund', async (req, res) => {
  const { imp_uid, amount, reason, order_item_id } = req.body;

  try {
    // 주문 아이템 먼저 조회
    const orderItem = await order_item.findOne({
      where: { id: order_item_id },
    });

    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: '주문 아이템 없음' });
    }

    // 주문 조회
    const orderData = await order.findOne({
      where: { id: orderItem.order_id },
    });

    if (!orderData) {
      return res.status(404).json({ success: false, message: '주문 없음' });
    }

    // 실 결제(imp_uid) 환불
    let cancel_result = null;
    if (imp_uid) {
      const access_token = await getToken();

      cancel_result = await axios.post(
        'https://api.iamport.kr/payments/cancel',
        {
          imp_uid,
          amount, // 환불할 금액 (부분 환불 가능)
          // checksum: totalAmount, // 전체 결제 금액
          reason: reason || '환불 처리',
        },
        {
          headers: { Authorization: access_token },
        }
      );
    }

    // 주문 아이템 환불 처리
    await order_item.update(
      { status: 'refunded' },
      { where: { id: order_item_id } }
    );

    // 전체 vs 부분 환불 판단
    const totalCount = await order_item.count({
      where: { order_id: orderData.id },
    });
    const refundedCount = await order_item.count({
      where: { order_id: orderData.id, status: 'refunded' },
    });

    const orderStatus =
      refundedCount === totalCount ? 'refunded' : 'partial_refunded';

    await order.update(
      { status: orderStatus },
      { where: { id: orderData.id } }
    );

    // 포인트 환불 처리
    const refundPoint = orderItem.quantity * orderItem.price;

    if (
      orderData.payment_method === 'points' ||
      orderData.payment_method === 'mix'
    ) {
      await point_history.create({
        user_id: orderItem.user_id,
        order_id: orderData.id,
        point: refundPoint,
        type: 'refunded',
        description: `주문 아이템 #${order_item_id} 포인트 환불`,
      });

      await User.increment('points', {
        by: refundPoint,
        where: { id: orderItem.user_id },
      });
    }

    // 응답
    res.status(200).json({
      success: true,
      message: '환불 완료',
      data: cancel_result?.data?.response || null,
    });
  } catch (error) {
    console.error('결제 취소 오류:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: '결제 취소 중 오류 발생',
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
