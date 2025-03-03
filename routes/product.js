const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

const s3 = require('../config/s3');

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const createS3Uploader = require('../config/createS3Uploader');

// 카테고리 리스트 가져오기
router.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll({});
    return res.status(200).json({
      message: '상품 가져오기 성공',
      categories: categories,
    });
  } catch (error) {
    return res.status(400).json({
      message: '상품 가져오기 실패',
      error,
    });
  }
});

// 카테고리 업데이트
router.post(
  '/upload_product',
  createS3Uploader('products').array('productImages', 10),
  async (req, res) => {
    try {
      let req_product = JSON.parse(req.body.product || '[]'); // JSON 변환
      let uploadedFiles = req.files || [];

      let productList = [];

      // 상품 경로 저장
      for (let i = 0; i < uploadedFiles.length; i++) {
        let imageUrl = uploadedFiles[i].key; // S3 이미지 URL 저장

        // 상품 업로드
        const product = await Product.create({
          ...req_product,
          imageUrl: imageUrl,
        });
        productList.push(product);
      }

      return res.status(201).json({ message: '업로드 성공', productList });
    } catch (error) {
      return res.status(400).json({ message: '업로드 에러', error });
    }
  }
);

module.exports = router;
