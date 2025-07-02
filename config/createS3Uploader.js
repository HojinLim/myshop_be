const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('./s3');

// ✅ Multer + S3 설정 (폴더 구분)
const createS3Uploader = () => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const fieldName = file.fieldname;
        const originalName = file.originalname.replace(/\s+/g, '_');
        const type = originalName.split('.').pop();
        const timestamp = Date.now();
        let filePath;

        // 파일명 커스텀
        if (req?.body?.customName) {
          filePath = `${fieldName}/${req.body.customName}.${type}`;
        } else {
          filePath = `${fieldName}/${timestamp}_${fieldName}.${type}`;
        }
        console.log('file', file);
        console.log('filePath', filePath);

        cb(null, filePath); // S3에 저장할 경로
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  });
};

module.exports = createS3Uploader;
