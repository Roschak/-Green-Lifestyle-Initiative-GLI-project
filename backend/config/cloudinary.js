const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Hubungkan ke akun Cloudinary kamu
cloudinary.config({
  cloud_name: 'glifamily',
  api_key: '427338252625375',
  api_secret: 'Pb_aUfpaT2oE1ymCh8d7b6Modh8'   
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gli_actions', // Nama folder otomatis di Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    // PRO TIP: Otomatis kompres foto agar kuota gratis awet selamanya
    transformation: [
      { width: 800, quality: "auto", fetch_format: "auto" }
    ]
  },
});

module.exports = { storage };