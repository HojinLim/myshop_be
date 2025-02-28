const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

const s3 = require('../config/s3');

const multer = require('multer');
const multerS3 = require('multer-s3');

// 카테고리 리스트 가져오기
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({});
    return res.status(200).json({
      message: '카테고리 가져오기 성공',
      categories: categories,
    });
  } catch (error) {
    return res.status(400).json({
      message: '카테고리 가져오기 실패',
      error,
    });
  }
});

// Multer + S3 설정
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      console.log('📌 [Body] 요청 데이터:', req.body);
      console.log('📌 [Multer] 파일 목록:', req.files);
      console.log('📌 [Category IDs]:', req.body.categoryIds);

      const categoryIds = JSON.parse(req.body.categoryIds || '[]'); // ✅ JSON 변환
      // req.files가 객체 형태일 경우, 배열로 변환
      const filesArray = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files);

      console.log('📌 [Multer] 배열로 변환된 파일 목록:', filesArray);

      // 파일 인덱스 찾기
      const index = filesArray.findIndex(
        (f) => f.originalname === file.originalname
      );
      console.log('📌 [Multer] 파일 인덱스:', index);

      const categoryId = categoryIds[index] || 'unknown'; // 파일에 대응하는 카테고리 ID (없으면 unknown)

      const originalName = file.originalname.replace(/\s+/g, '_');
      const splited = originalName.split('.');
      const type = splited[splited.length - 1];
      const timestamp = Date.now();
      const filePath = `category/${timestamp}_${file.fieldname}.${type}`;
      cb(null, filePath); // S3에 저장할 경로
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

// 카테고리 업데이트
router.post(
  '/update_categories',
  upload.array('categoryImages', 10),
  async (req, res) => {
    try {
      let categories = JSON.parse(req.body.categories || '[]'); // JSON 변환
      let uploadedFiles = req.files || [];
      let categoryIds = JSON.parse(req.body.categoryIds || '[]'); // ✅ JSON 변환
      console.log('categoryIds!!!', categoryIds);
      console.log('categories!!!', categories);

      if (categories.length > 0) {
        for (let i = 0; i < categories.length; i++) {
          const categoryId = categories[i].id;

          const category = await Category.findByPk(categoryId);
          if (!category) {
            return res
              .status(404)
              .json({ error: '해당 카테고리를 찾을 수 없습니다.' });
          }

          // 카테고리 이름 변경
          category.name = categories[i].name;

          await category.save();
        }
      }

      let savedCategories = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        let imageUrl = uploadedFiles[i].key; // S3 이미지 URL 저장
        let categoryId = categoryIds[i]; // ⬅️ 해당 이미지의 카테고리 ID 매칭
        console.log('i', categoryId);

        // DB 업데이트 (카테고리 ID로 찾고 이미지 URL 추가)
        let category = await Category.findByPk(categoryId);
        if (category) {
          category.imageUrl = imageUrl;
          await category.save();
          savedCategories.push(category);
        }
      }

      return res.status(200).json({ message: '카테고리 업데이트 완료.' });
    } catch (error) {
      return res.status(400).json({
        message: '카테고리 업데이트 실패',
        error,
      });
    }
  }
);

module.exports = router;
