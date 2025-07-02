const express = require('express');
const {
  order,
  order_item,
  Product,
  ProductImage,
  product_options,
} = require('../models');

const { Op, fn, col, literal } = require('sequelize');

const router = express.Router();

// 주문내역 리스트 가져오기
router.post('/', async (req, res) => {
  const { page = 1, limit = 5 } = req.body;
  const { userId } = req.query;

  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await order.findAndCountAll({
      where: { user_id: userId },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
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

    return res.status(200).json({
      message: '주문내역 가져오기 성공',
      data: rows,
      limit: parseInt(limit),
      totalCount: count,
    });
  } catch (error) {
    return res.status(400).json({
      message: '주문내역 가져오기 실패',
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
router.get('/sales', async (req, res) => {
  try {
    const result = await order_item.findAll({
      where: {
        status: { [Op.ne]: 'refunded' },
      },
      include: [
        {
          model: product_options,
          include: [
            {
              model: Product,
            },
          ],
        },
      ],
      attributes: [
        [fn('DATE_FORMAT', col('order_item.createdAt'), '%Y-%m'), 'month'],
        [col('product_option->Product.category'), 'category'],
        [
          fn('SUM', literal('order_item.quantity * order_item.price')),
          'totalSales',
        ],
      ],
      group: [
        fn('DATE_FORMAT', col('order_item.createdAt'), '%Y-%m'),
        col('product_option->Product.category'),
      ],
      order: [[fn('DATE_FORMAT', col('order_item.createdAt'), '%Y-%m'), 'ASC']],
      raw: false,
    });

    return res.status(200).json({
      message: '매출 가져오기 성공',
      result,
    });
  } catch (error) {
    return res.status(400).json({
      message: '매출 가져오기 실패',
      error,
    });
  }
});

module.exports = router;
