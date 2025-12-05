// middleware/upload.js - Memory storage untuk Vercel
const multer = require('multer');

console.log('🚀 Multer configured with MEMORY storage');

// Gunakan memory storage (tidak simpan ke disk)
const storage = multer.memoryStorage();

// Filter file gambar
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Hanya file gambar yang diizinkan! (${allowedMimeTypes.join(', ')})`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB (lebih kecil dari 5MB untuk hemat memory)
  }
});

// Export dengan info tambahan
upload.info = {
  storageType: 'memory',
  maxFileSize: '2MB',
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

module.exports = upload;