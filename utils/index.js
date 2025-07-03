const axios = require('axios');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const product_options = require('../models/product_options');
const ProductImage = require('../models/ProductImage');

const getCartItems = async (user_id) => {
  const result = await Cart.findAll({
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
              model: product_options, //  현재 옵션의 상품과 관련된 모든 옵션 조회
              attributes: ['id', 'size', 'color', 'price', 'stock'],
            },
            {
              model: ProductImage, //  상품 이미지 조회 추가
              attributes: ['id', 'imageUrl', 'type'],
            },
          ],
        },
      },
    ],
  });
  return result;
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
