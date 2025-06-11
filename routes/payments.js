require('dotenv').config();

const express = require('express');
const axios = require('axios');

const { getToken } = require('../utils');
const router = express.Router();
const { order, order_item, User, point_history } = require('../models');

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
  console.log(req.body);

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

// 결제 취소
router.post('/cancel', async (req, res) => {
  const {
    imp_uid,
    amount,
    totalAmount,
    reason,
    order_id,
    order_item_ids = [],
  } = req.body;

  try {
    const access_token = await getToken();

    const { data } = await axios.post(
      'https://api.iamport.kr/payments/cancel',
      {
        imp_uid: imp_uid, // 필수
        amount: amount, // 부분 환불 금액
        checksum: totalAmount, // 환불 전 결제 금액(전체금액)
        reason: reason || '테스트 환불', // 선택
      },
      {
        headers: { Authorization: access_token },
      }
    );

    // order item ids를 파라미터에 보내면 부분 환불

    // 빈값으로 보내면 전체 환불로 처리
    if (order_item_ids.length > 0) {
      await order.update(
        { status: 'refunded' },
        { where: { order_id: order_id } }
      );
      await order_item.update(
        { status: 'refunded' },
        { where: { order_id: order_id } }
      );
    }
    // 부분 환불
    else {
      await order.update(
        { status: 'partial_refunded' },
        { where: { order_id: order_id } }
      );
      for (const id of order_item_ids) {
        await order_item.update({ status: 'refunded' }, { where: { id: id } });
      }
    }

    res.status(200).json({ success: true, data: data.response });
  } catch (error) {
    console.error('결제 취소 오류:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: '결제 취소 중 오류 발생',
      error: error.response?.data,
    });
  }
});

module.exports = router;
