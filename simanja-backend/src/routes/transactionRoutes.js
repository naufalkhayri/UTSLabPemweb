const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadBuktiTransaksi } = require('../middleware/uploadMiddleware');

// Semua route membutuhkan autentikasi
router.use(authenticate);

// Create transaction dengan upload bukti
router.post('/', uploadBuktiTransaksi, transactionController.createTransaction);

// Get all transactions
router.get('/', transactionController.getTransactions);

// Get transaction by id
router.get('/:id', transactionController.getTransaction);

// Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

// Get summary
router.get('/summary/summary', transactionController.getSummary);

// Get expense by category
router.get('/expense/categories', transactionController.getExpenseByCategory);

module.exports = router;