const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

const s3 = require('../config/s3');

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const createS3Uploader = require('../config/createS3Uploader');

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
//

// 카테고리 업데이트
router.post(
  '/update_categories',
  createS3Uploader('category').array('categoryImages', 10),
  async (req, res) => {
    try {
      let categories = JSON.parse(req.body.categories || '[]'); // JSON 변환
      let uploadedFiles = req.files || [];
      let categoryIds = JSON.parse(req.body.categoryIds || '[]'); // ✅ JSON 변환

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

          // null이 들어올시 이미지 및 이미지 url 삭제
          if (categories[i].upload_photo === null) {
            console.log(categories[i]);

            // S3에서 카테고리리
            const imageUrl = category.imageUrl; // DB에 저장된 파일 경로

            const deleteParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: imageUrl,
              CacheControl: 'max-age=86400', // 1일 동안 캐시
            };

            try {
              const command = new DeleteObjectCommand(deleteParams);
              await s3.send(command); // S3 이미지 삭제
              console.log('✅ S3에서 이미지 삭제 성공');
            } catch (s3Error) {
              console.error('❌ S3 이미지 삭제 실패:', s3Error);
              return res
                .status(500)
                .json({ error: 'S3 이미지 삭제에 실패했습니다.' });
            }

            // S3 삭제 성공 후 DB 업데이트
            try {
              category.imageUrl = null;
              await category.save();
              console.log('✅ DB 프로필 URL 업데이트 성공');
            } catch (dbError) {
              console.error('❌ DB 업데이트 실패:', dbError);
              return res
                .status(500)
                .json({ error: 'DB 업데이트에 실패했습니다.' });
            }
          }
        }
      }

      for (let i = 0; i < uploadedFiles.length; i++) {
        let imageUrl = uploadedFiles[i].key; // S3 이미지 URL 저장
        let categoryId = categoryIds[i]; // ⬅️ 해당 이미지의 카테고리 ID 매칭

        // DB 업데이트 (카테고리 ID로 찾고 이미지 URL 추가 및 삭제)
        let category = await Category.findByPk(categoryId);
        if (category) {
          category.imageUrl = imageUrl;
          await category.save();
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
