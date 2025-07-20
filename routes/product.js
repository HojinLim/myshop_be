const express = require('express');
const {
  Product,
  ProductImage,
  product_options,
  favorite,
} = require('../models');
const router = express.Router();

const s3 = require('../config/s3');

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const createS3Uploader = require('../config/createS3Uploader');
const { where, Op } = require('sequelize');

// 상품 리스트 가져오기
router.get('/', async (req, res) => {
  try {
    const { id, category, page = 1, limit = 6 } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (category && category !== '전체') {
      whereCondition.category = category;
    } else if (id) {
      whereCondition.id = id;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']], // 정렬 기준 설정
      distinct: true, // 중복 방지
      include: [
        {
          model: ProductImage,
          attributes: ['id', 'imageUrl', 'type'],
        },
        {
          model: favorite,
          attributes: ['id', 'product_id'],
        },
      ],
    });

    return res.status(200).json({
      message: '상품 가져오기 성공',
      products,
      totalCount: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return res.status(400).json({
      message: '상품 가져오기 실패',
      error,
    });
  }
});

//  Multer 설정 (메인 이미지 & 디테일 이미지)
const upload = createS3Uploader().fields([
  { name: 'mainImages', maxCount: 10 },
  { name: 'detailImages', maxCount: 10 },
]);

//  상품 업로드 API
router.post('/upload_product', upload, async (req, res) => {
  try {
    const req_product = JSON.parse(req.body.product || '{}'); // JSON 변환
    console.log('req.files.mainImages', req.files.mainImages);

    const mainImageUrls = (req.files.mainImages || []).map((file) => file.key);
    const detailImageUrls = (req.files.detailImages || []).map(
      (file) => file.key
    );

    console.log(' 업로드된 메인 이미지:', mainImageUrls);
    console.log(' 업로드된 상세 이미지:', detailImageUrls);

    //  상품 저장
    const product = await Product.create(req_product);

    //  이미지 저장
    const imageRecords = [
      ...mainImageUrls.map((url) => ({
        product_id: product.id,
        imageUrl: url,
        type: 'main',
      })),
      ...detailImageUrls.map((url) => ({
        product_id: product.id,
        imageUrl: url,
        type: 'detail',
      })),
    ];

    await ProductImage.bulkCreate(imageRecords);

    return res.status(201).json({ message: '업로드 성공', product });
  } catch (error) {
    console.error(' 업로드 에러:', error);
    return res.status(400).json({ message: '업로드 실패', error });
  }
});

// 상품 삭제
router.post('/delete_product', async (req, res) => {
  const { product_id } = req.query;

  if (!product_id) {
    return res.status(400).json({ message: '상품 ID를 입력하세요.' });
  }

  try {
    //   RDS(MySQL)에서 상품 삭제
    await Product.destroy({ where: { id: product_id } }); //  상품 삭제

    //   해당 상품의 이미지 URL 가져오기
    const images = await ProductImage.findAll({
      where: { product_id },
      attributes: ['imageUrl'],
    });

    //  AWS S3에서 이미지 삭제
    for (const image of images) {
      const imageKey = image.imageUrl;

      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME, //  S3 버킷 이름
        Key: imageKey,
      };

      await s3.send(new DeleteObjectCommand(deleteParams));
    }
    //   RDS(MySQL)에서 관련 이미지 삭제
    await ProductImage.destroy({ where: { product_id } }); //  상품 이미지 삭제

    return res.status(200).json({ message: '상품 삭제 완료' });
  } catch (error) {
    console.error(' 상품 삭제 오류:', error);
    return res.status(500).json({ message: '상품 삭제 실패', error });
  }
});

// 상품 옵션 추가하기
router.post('/create_options', async (req, res) => {
  try {
    const { product_id, size, color, stock, price } = req.body;

    // 입력값 확인
    // 상품 옵션 추가 (옵션 o)
    if (!stock || !price) {
      return res
        .status(400)
        .json({ message: '가격, 재고 필드를 확인해주세요.' });
    }
    // 옵션이 없는 제품 존재
    const no_option = await Product.findOne({
      where: {
        id: Number(product_id),
        stock: { [Op.gt]: 0 },
      },
    });

    if (no_option) {
      return res
        .status(400)
        .json({ message: '옵션 없는 상품을 먼저 제거 해주세요.' });
    }

    // 중복된 옵션인지 검증
    if (size && color) {
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
    }
    // 상품 재고 업데이트 (옵션 x)
    else {
      const exist_option = await product_options.findOne({
        where: {
          product_id: Number(product_id),
        },
      });

      if (exist_option) {
        return res
          .status(400)
          .json({ message: '존재하는 옵션을 먼저 삭제해주세요', exist_option });
      }

      // size, color 값이 없고 재고만 업데이트
      const updated_product = await Product.update(
        { stock: stock },
        { where: { id: product_id } }
      );
      return res.status(200).json({
        message: '재고 업데이트 성공',
        updated_product: {
          ...updated_product,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '옵션 생성 실패', error });
  }
});
// 상품 옵션 조회
router.get('/product_options', async (req, res) => {
  try {
    const { product_id } = req.query;

    // 입력값 확인
    if (!product_id) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 해당 제품 id의 옵션들 모두 조회
    const options = await product_options.findAll({
      where: {
        product_id: Number(product_id),
      },
      include: [
        {
          model: Product, //  Product 모델 포함
          attributes: ['id', 'name', 'originPrice'],
          include: [
            {
              model: ProductImage, //  ProductImage 모델 포함
              attributes: ['imageUrl'],
            },
          ],
        },
      ],
    });
    const productWithStock = await Product.findOne({
      where: {
        id: product_id,
        stock: { [Op.gt]: 0 }, // stock > 0
      },
      include: [
        {
          model: ProductImage, //  ProductImage 모델 포함
          attributes: ['imageUrl'],
        },
      ],
    });

    return res.status(200).json({
      message: '옵션 조회 성공',
      product_option: options,
      productWithStock: productWithStock || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '옵션 조회 실패', error });
  }
});
// 상품 옵션 업데이트
router.post('/update_options', async (req, res) => {
  try {
    const { id, size, color, stock, price, product_id } = req.body;

    // 입력값 확인
    if (!stock || !price) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    // 중복된 옵션인지 검증
    const exist_option = await product_options.findOne({
      where: {
        // id: Number(id),
        size,
        color,
        stock,
        price,
      },
    });
    console.log('exist_option', exist_option);

    if (exist_option !== null) {
      return res
        .status(400)
        .json({ message: '이미 존재하는 옵션입니다.', exist_option });
    }
    const product_option = await product_options.update(
      { size, color, stock, price }, //  업데이트할 값
      { where: { id: Number(id) } } //  특정 상품 ID에 대해 업데이트);
    );

    return res.status(200).json({
      message: '옵션 업데이트 성공',
      product_option: {
        ...product_option,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '옵션 업데이트 실패', error });
  }
});
// 상품 사진 업데이트
router.post('/update_photo/:productId', upload, async (req, res) => {
  try {
    const { productId } = req.params;
    const mainImageUrls = (req.files.mainImages || []).map((file) => file.key);
    const detailImageUrls = (req.files.detailImages || []).map(
      (file) => file.key
    );
    const deleteImageIds = JSON.parse(req.body.deleteImageIds || '[]');

    if (deleteImageIds.length > 0) {
      const imagesToDelete = await ProductImage.findAll({
        where: { id: deleteImageIds, product_id: productId },
      });

      for (const image of imagesToDelete) {
        const imageKey = image.imageUrl;

        const deleteParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: imageKey,
        };

        await s3.send(new DeleteObjectCommand(deleteParams));
      }

      //  DB 삭제
      await ProductImage.destroy({
        where: { id: deleteImageIds },
      });
    }

    // 이미지 저장
    const imageRecords = [
      ...mainImageUrls.map((url) => ({
        product_id: productId,
        imageUrl: url,
        type: 'main',
      })),
      ...detailImageUrls.map((url) => ({
        product_id: productId,
        imageUrl: url,
        type: 'detail',
      })),
    ];
    await ProductImage.bulkCreate(imageRecords);

    return res.status(200).json({
      message: '상품 사진 업데이트 성공',
      ProductImage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '상품 업데이트 실패', error });
  }
});
// 상품 옵션 삭제
router.post('/delete_product_options', async (req, res) => {
  const { product_id } = req.query;

  if (!product_id) {
    return res.status(400).json({ message: '상품 ID를 입력하세요.' });
  }
  // 옵션이 없는 제품 존재 삭제 시 수량 0으로 업데이트
  const no_option = await Product.findOne({
    where: {
      id: Number(product_id),
      stock: { [Op.gt]: 0 },
    },
  });

  if (no_option) {
    no_option.update({ stock: 0 }, { where: { id: product_id } });

    return res
      .status(200)
      .json({ message: '상품 옵션 삭제(수량 초기화) 완료' });
  }

  try {
    //  RDS(MySQL)에서 상품 옵션 삭제
    await product_options.destroy({ where: { id: product_id } }); //  상품 옵션 삭제

    return res.status(200).json({ message: '상품 옵션 삭제 완료' });
  } catch (error) {
    console.error(' 상품 삭제 오류:', error);
    return res.status(500).json({ message: '상품 옵션 삭제 실패', error });
  }
});

module.exports = router;
