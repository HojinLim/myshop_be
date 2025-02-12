require('dotenv').config();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  // cloud_name: process.env.CLOUD_NAME,
  // api_key: process.env.CLOUD_KEY,
  // api_secret: process.env.CLOUD_SECRET,
  secure: true, // HTTPS URL 반환
});

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     console.log('🟢 요청된 req.user:', req.user); // 🔍 디버깅 코드 추가
//     console.log('🟢 요청된 req.profileImage:', req.profileImage); // 🔍 디버깅 코드 추가

//     if (!req.user) {
//       throw new Error('User not authenticated');
//     }

//     return {
//       folder: 'profile_pics',
//       format: 'jpg',
//       public_id: req.user.id,
//       resource_type: 'auto',
//       access_mode: 'public',
//     };
//   },
// });

// const upload = multer({ storage });
module.exports = cloudinary;
