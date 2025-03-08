const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

const s3 = require('../config/s3');

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const createS3Uploader = require('../config/createS3Uploader');
const product_options = require('../models/product_options');

// 상품 리스트 가져오기
router.get('/products', async (req, res) => {
  try {
    const { category, id } = req.query; // 쿼리스트링에서 category 가져오기

    let whereCondition = category ? { category } : {}; // category 값이 있으면 필터링

    if (Object.keys(whereCondition) <= 0) {
      whereCondition = id ? { id } : {}; // category 값이 있으면 필터링
    }

    const products = await Product.findAll({
      where: whereCondition,
    });
    return res.status(200).json({
      message: '상품 가져오기 성공',
      products: products,
    });
  } catch (error) {
    return res.status(400).json({
      message: '상품 가져오기 실패',
      error,
    });
  }
});

// 상품 업데이트
router.post(
  '/upload_product',
  createS3Uploader('products').array('productImages', 10),
  async (req, res) => {
    try {
      let req_product = JSON.parse(req.body.product || '[]'); // JSON 변환
      let uploadedFiles = req.files || [];

      let productList = [];

      console.log(uploadedFiles);

      console.log('req_product', req_product);

      // 상품 경로 저장
      for (let i = 0; i < uploadedFiles.length; i++) {
        let imageUrl = uploadedFiles[i].key; // S3 이미지 URL 저장

        // 상품 업로드
        const product = await Product.create({
          ...req_product,
          imageUrl,
        });
        productList.push(product);
      }

      return res.status(201).json({ message: '업로드 성공', productList });
    } catch (error) {
      return res.status(400).json({ message: '업로드 에러', error });
    }
  }
);

// 상품 옵션 추가하기
router.post('/create_options', async (req, res) => {
  try {
    const { product_id, size, color, stock, price } = req.body;

    // 입력값 확인
    if (!size || !color || !stock) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 중복된 옵션인지 검증
    const exist_option = await product_options.findOne({
      where: {
        product_id: Number(product_id),
        size,
        color,
      },
    });

    if (exist_option !== null) {
      return res
        .status(400)
        .json({ message: '이미 존재하는 옵션입니다.', exist_option });
    }
    const product_option = await product_options.create({
      ...req.body,
    });

    return res.status(200).json({
      message: '옵션 생성 성공',
      product_option: {
        ...product_option,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '옵션 생성 실패', error });
  }
});
// 상품 옵션 조회
router.get('/search_options', async (req, res) => {
  try {
    const { product_id } = req.query;
    console.log('product_id', product_id);

    // 입력값 확인
    if (!product_id) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 해당 제품 id의 옵션들 모두 조회
    const options = await product_options.findAll({
      where: {
        product_id: Number(product_id),
      },
    });

    if (options === null) {
      return res
        .status(400)
        .json({ message: '해당 아이디의 옵션이 존재하지 않습니다.' });
    }

    return res.status(200).json({
      message: '옵션 조회 성공',
      product_option: options,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '옵션 조회 실패', error });
  }
});

module.exports = router;
