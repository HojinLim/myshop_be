const axios = require('axios');

const { Cart, product_options, Product, ProductImage } = require('../models');

const { Op } = require('sequelize'); // Sequelize import 시 Op도 함께 가져와야 합니다.

const getCartItems = async (user_id) => {
  let cartItems = [];

  // 1. product_option_id가 있는 장바구니 아이템 조회 (옵션 상품)
  const optionItems = await Cart.findAll({
    where: {
      user_id,
      product_option_id: { [Op.ne]: null }, // product_option_id가 null이 아닌 경우
    },
    include: [
      {
        model: product_options, // Cart -> product_options 조인
        attributes: ['id', 'size', 'color', 'price', 'stock'], // 재고(stock)도 추가하여 가져오는 것이 좋습니다.
        include: {
          model: Product, // product_options -> Product 조인
          attributes: ['id', 'name', 'originPrice', 'discountPrice', 'stock'], // 상품 정보
          include: [
            {
              model: ProductImage, // Product -> ProductImage 조인 (메인 이미지 등)
              attributes: ['id', 'imageUrl', 'type'],
              where: { type: 'main' }, // 예시: 메인 이미지만 필요하다면 조건 추가
              required: false, // 이미지가 없을 수도 있으므로 LEFT JOIN
            },
            {
              model: product_options, // 해당 상품에 연결된 모든 옵션 정보 (다른 옵션들을 보여줄 때 유용)
              attributes: ['id', 'size', 'color', 'price', 'stock'],
              required: false, // 옵션이 없을 수도 있으므로 LEFT JOIN
            },
          ],
        },
      },
    ],
  });

  // 2. product_option_id가 없는 장바구니 아이템 조회 (단일 상품)
  const simpleItems = await Cart.findAll({
    where: {
      user_id,
      product_option_id: null, // product_option_id가 null인 경우
    },
    include: [
      {
        model: Product, // Cart -> Product 직접 조인
        attributes: ['id', 'name', 'originPrice', 'discountPrice', 'stock'], // 상품 정보
        include: [
          {
            model: ProductImage, // Product -> ProductImage 조인
            attributes: ['id', 'imageUrl', 'type'],
            where: { type: 'main' }, // 예시: 메인 이미지만 필요하다면 조건 추가
            required: false, // 이미지가 없을 수도 있으므로 LEFT JOIN
          },
        ],
      },
    ],
  });

  // 두 결과를 합치고 필요에 따라 정렬 또는 추가 처리
  cartItems = [...optionItems, ...simpleItems];

  // 예를 들어, 카트 ID 또는 추가 날짜 기준으로 정렬할 수 있습니다.
  cartItems.sort((a, b) => a.createdAt - b.createdAt); // 오래된 카트 아이템부터 정렬

  return cartItems;
};

const updateCartOwner = async (non_user_id, user_id) => {
  try {
    //  비회원 장바구니 조회
    const nonMemberCart = await Cart.findAll({
      where: { user_id: non_user_id },
    });

    for (const item of nonMemberCart) {
      const { product_option_id, quantity } = item;

      //  회원 장바구니에서 같은 `product_option_id` 찾기
      const existingItem = await Cart.findOne({
        where: { user_id, product_option_id },
      });

      if (existingItem) {
        //  기존 `quantity` 업데이트 (재고 초과 방지)
        const product_option = await product_options.findOne({
          where: { id: product_option_id },
          attributes: ['stock'],
        });

        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          product_option.stock
        );

        await existingItem.update({ quantity: newQuantity });
      } else {
        //  장바구니에 상품이 없으면 새로 추가
        await Cart.create({ user_id, product_option_id, quantity });
      }
    }

    return '장바구니 이전 완료';
  } catch (error) {
    console.error('🚨 오류 발생:', error);
    throw new Error('장바구니 이전 중 오류가 발생했습니다.');
  }
};

const destroyAllCartByUID = async (user_id) => {
  const result = await Cart.destroy({
    where: { user_id },
  });
  return result;
};

// 아임포트 엑세스 토큰 발급
async function getToken() {
  const response = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.IAMPORT_API_KEY,
    imp_secret: process.env.IAMPORT_API_SECRET,
  });
  return response.data.response.access_token;
}

module.exports = {
  getCartItems,
  updateCartOwner,
  destroyAllCartByUID,
  getToken,
};
