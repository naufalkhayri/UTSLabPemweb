const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

// Gunakan uploadManager yang smart
const upload = require('../middleware/uploadManager');

// Jika upload gagal load, buat dummy middleware
const uploadSingle = upload ? upload.single('buktiTransaksi') : (req, res, next) => {
  console.log('⚠️ Upload middleware not available, skipping file upload');
  next();
};

router.get('/', authenticateToken, transactionController.getTransactions);
router.post('/', authenticateToken, uploadSingle, transactionController.createTransaction);
router.delete('/:id', authenticateToken, transactionController.deleteTransaction);
router.get('/summary', authenticateToken, transactionController.getSummary);
router.get('/chart-data', authenticateToken, transactionController.getChartData);

module.exports = router;