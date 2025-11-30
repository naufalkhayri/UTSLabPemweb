const db = require('../config/database');

const transactionController = {
  // Get semua transaksi user
  getTransactions: async (req, res) => {
    try {
      const { page = 1, limit = 10, type, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT id, keterangan, jumlah, jenis, tanggal, bukti_transaksi, created_at 
        FROM transactions 
        WHERE user_id = $1
      `;
      let countQuery = `SELECT COUNT(*) FROM transactions WHERE user_id = $1`;
      const params = [req.user.userId];
      let paramCount = 1;

      // Filter by type
      if (type && (type === 'income' || type === 'expense')) {
        paramCount++;
        query += ` AND jenis = $${paramCount}`;
        countQuery += ` AND jenis = $${paramCount}`;
        params.push(type);
      }

      // Filter by date range
      if (startDate && endDate) {
        paramCount += 2;
        query += ` AND tanggal BETWEEN $${paramCount - 1} AND $${paramCount}`;
        countQuery += ` AND tanggal BETWEEN $${paramCount - 1} AND $${paramCount}`;
        params.push(startDate, endDate);
      }

      // Order dan pagination
      query += ` ORDER BY tanggal DESC, created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const [transactions, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params.slice(0, paramCount))
      ]);

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        transactions: transactions.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  },

  // Buat transaksi baru
  createTransaction: async (req, res) => {
    try {
      const { keterangan, jumlah, jenis, tanggal } = req.body;
      
      if (!keterangan || !jumlah || !jenis || !tanggal) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
      }

      if (jenis !== 'income' && jenis !== 'expense') {
        return res.status(400).json({ error: 'Jenis harus income atau expense' });
      }

      // Handle file upload jika ada
      const buktiTransaksi = req.file ? `/uploads/${req.file.filename}` : null;

      const newTransaction = await db.query(
        `INSERT INTO transactions 
         (user_id, keterangan, jumlah, jenis, tanggal, bukti_transaksi) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [req.user.userId, keterangan, parseFloat(jumlah), jenis, tanggal, buktiTransaksi]
      );

      res.status(201).json({
        message: 'Transaksi berhasil ditambahkan',
        transaction: newTransaction.rows[0]
      });

    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  },

  // Hapus transaksi
  deleteTransaction: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      }

      res.json({ message: 'Transaksi berhasil dihapus' });

    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  },

  // Get ringkasan keuangan
  getSummary: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let query = `
        SELECT 
          COALESCE(SUM(CASE WHEN jenis = 'income' THEN jumlah ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN jenis = 'expense' THEN jumlah ELSE 0 END), 0) as total_expense
        FROM transactions 
        WHERE user_id = $1
      `;
      const params = [req.user.userId];

      if (startDate && endDate) {
        query += ` AND tanggal BETWEEN $2 AND $3`;
        params.push(startDate, endDate);
      }

      const result = await db.query(query, params);
      const summary = result.rows[0];

      res.json({
        totalIncome: parseFloat(summary.total_income),
        totalExpense: parseFloat(summary.total_expense),
        balance: parseFloat(summary.total_income) - parseFloat(summary.total_expense)
      });

    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  },

  // Get data untuk chart
  getChartData: async (req, res) => {
    try {
      const { range = '1month', type = 'category' } = req.query;

      let query;
      if (type === 'category') {
        // Data untuk pie chart (pengeluaran per kategori)
        query = `
          SELECT keterangan as category, SUM(ABS(jumlah)) as amount
          FROM transactions 
          WHERE user_id = $1 AND jenis = 'expense'
          GROUP BY keterangan
          ORDER BY amount DESC
          LIMIT 10
        `;
      } else if (type === 'monthly') {
        // Data untuk line/bar chart (trend bulanan)
        query = `
          SELECT 
            TO_CHAR(tanggal, 'YYYY-MM') as month,
            SUM(CASE WHEN jenis = 'income' THEN jumlah ELSE 0 END) as income,
            SUM(CASE WHEN jenis = 'expense' THEN jumlah ELSE 0 END) as expense
          FROM transactions 
          WHERE user_id = $1
          GROUP BY TO_CHAR(tanggal, 'YYYY-MM')
          ORDER BY month
        `;
      }

      const result = await db.query(query, [req.user.userId]);
      res.json({ data: result.rows });

    } catch (error) {
      console.error('Get chart data error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
};

module.exports = transactionController;