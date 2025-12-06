const Transaction = require('../models/Transaction');

// Helper untuk format transaction response
const formatTransactionResponse = (transaction) => {
  return {
    id: transaction.id,
    userId: transaction.user_id,
    jenis: transaction.jenis,
    keterangan: transaction.keterangan,
    jumlah: parseFloat(transaction.jumlah),
    tanggal: transaction.tanggal,
    buktiTransaksi: transaction.bukti_transaksi,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at
  };
};

exports.createTransaction = async (req, res) => {
  try {
    const { keterangan, jumlah, jenis, tanggal } = req.body;

    console.log('💰 Create transaction for user:', req.user.id, req.body);

    // Validasi input
    if (!keterangan || !jumlah || !jenis || !tanggal) {
      return res.status(400).json({
        error: 'Semua field wajib diisi',
      });
    }

    // Validasi jenis transaksi
    if (!['income', 'expense'].includes(jenis)) {
      return res.status(400).json({
        error: 'Jenis transaksi harus income atau expense',
      });
    }

    // Validasi jumlah
    const amount = parseFloat(jumlah);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Jumlah harus lebih dari 0',
      });
    }

    // Dapatkan URL bukti transaksi jika ada
    let buktiTransaksi = null;
    if (req.file) {
      buktiTransaksi = req.file.path;
      console.log('📁 Bukti transaksi uploaded:', buktiTransaksi);
    }

    const transactionData = {
      userId: req.user.id,
      jenis,
      keterangan,
      jumlah: amount,
      tanggal,
      buktiTransaksi,
    };

    const transaction = await Transaction.create(transactionData);

    res.status(201).json({
      transaction: formatTransactionResponse(transaction),
    });
  } catch (error) {
    console.error('❌ Create transaction error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat menambahkan transaksi',
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { limit = 1000, offset = 0, startDate, endDate } = req.query;

    console.log('📋 Get transactions for user:', req.user.id, { limit, offset });

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate,
      endDate,
    };

    const transactions = await Transaction.findByUserId(req.user.id, options);

    console.log(`✅ Found ${transactions.length} transactions`);

    res.json({
      transactions: transactions.map(formatTransactionResponse),
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat mengambil data transaksi',
    });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Get transaction:', id, 'for user:', req.user.id);

    const transaction = await Transaction.findById(id, req.user.id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaksi tidak ditemukan',
      });
    }

    res.json({
      transaction: formatTransactionResponse(transaction),
    });
  } catch (error) {
    console.error('❌ Get transaction error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat mengambil data transaksi',
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Delete transaction:', id, 'for user:', req.user.id);

    const transaction = await Transaction.delete(id, req.user.id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaksi tidak ditemukan',
      });
    }

    res.json({
      message: 'Transaksi berhasil dihapus',
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('❌ Delete transaction error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat menghapus transaksi',
    });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('📊 Get summary for user:', req.user.id, { startDate, endDate });

    const options = {
      startDate,
      endDate,
    };

    const summary = await Transaction.getSummary(req.user.id, options);

    console.log('✅ Summary:', summary);

    res.json({
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      balance: summary.balance,
    });
  } catch (error) {
    console.error('❌ Get summary error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat mengambil summary',
    });
  }
};

exports.getExpenseByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('📈 Get expense by category for user:', req.user.id);

    const options = {
      startDate,
      endDate,
    };

    const categories = await Transaction.getExpenseByCategory(req.user.id, options);

    res.json({
      categories,
    });
  } catch (error) {
    console.error('❌ Get expense by category error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat mengambil data kategori pengeluaran',
    });
  }
};