const express = require('express');
const {
  order,
  order_item,
  Product,
  ProductImage,
  product_options,
} = require('../models');

const { Op } = require('sequelize');

const router = express.Router();

// 주문내역 리스트 가져오기
router.post('/', async (req, res) => {
  const { page = 1, limit = 5 } = req.body;
  const { userId } = req.query;
  console.log(req.body);

  const offset = (page - 1) * limit;
  try {
    const { count, rows } = await order.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      // order: [['createdAt', 'ASC']], // 최신순 정렬 (옵션)
      include: [
        {
          model: order_item,
          include: [
            {
              model: product_options,
              include: [{ model: Product, include: [{ model: ProductImage }] }],
            },
          ],
        },
      ],
    });
    // const totalPages = Math.ceil(count / limit);
    let totalCount = count;
    return res.status(200).json({
      message: '카트 가져오기 성공',
      data: rows,
      limit,
      totalCount,
    });
  } catch (error) {
    return res.status(400).json({
      message: '카트 가져오기 실패',
      error,
    });
  }
});
// 주문내역 개수
router.get('/count', async (req, res) => {
  const { userId } = req.query;

  try {
    const count = await order.count({
      where: { user_id: userId },
    });
    return res.status(200).json({
      message: '주문내역 개수 가져오기 성공',
      count,
    });
  } catch (error) {
    return res.status(400).json({
      message: '주문내역 개수 가져오기 실패',
      error,
    });
  }
});

module.exports = router;
