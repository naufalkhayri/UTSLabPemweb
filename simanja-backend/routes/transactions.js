const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, transactionController.getTransactions);
router.post('/', authenticateToken, upload.single('buktiTransaksi'), transactionController.createTransaction);
router.delete('/:id', authenticateToken, transactionController.deleteTransaction);
router.get('/summary', authenticateToken, transactionController.getSummary);
router.get('/chart-data', authenticateToken, transactionController.getChartData);

module.exports = router;