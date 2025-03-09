const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('./s3');
// Multer + S3 설정
const createS3Uploader = (path) => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const originalName = file.originalname.replace(/\s+/g, '_');
        console.log('req.body', req.body);

        // jpg, png 형식 정하기
        const splited = originalName.split('.');
        const type = splited[splited.length - 1];

        // 고유한 시간값
        const timestamp = Date.now();
        const filePath = `${path}/${timestamp}_${file.fieldname}.${type}`;
        cb(null, filePath); // S3에 저장할 경로
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  });
};

module.exports = createS3Uploader;
