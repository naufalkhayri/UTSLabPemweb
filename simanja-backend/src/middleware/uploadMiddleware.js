const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage untuk foto profil
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/profile`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }],
  },
});

// Storage untuk bukti transaksi
const receiptStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/receipts`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, crop: 'limit' }],
  },
});

// Middleware untuk upload foto profil
const uploadFotoProfil = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'), false);
    }
  },
}).single('fotoProfil');

// Middleware untuk upload bukti transaksi
const uploadBuktiTransaksi = multer({
  storage: receiptStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'), false);
    }
  },
}).single('buktiTransaksi');

module.exports = {
  uploadFotoProfil,
  uploadBuktiTransaksi,
};