const pool = require('../config/database');

class Transaction {
  static async create(data) {
    const {
      userId,
      jenis,
      keterangan,
      jumlah,
      tanggal,
      buktiTransaksi,
    } = data;

    const query = `
      INSERT INTO transactions 
      (user_id, jenis, keterangan, jumlah, tanggal, bukti_transaksi)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      userId,
      jenis,
      keterangan,
      jumlah,
      tanggal,
      buktiTransaksi,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId, options = {}) {
    const { limit = 1000, offset = 0, startDate, endDate } = options;
    
    let query = `
      SELECT * FROM transactions 
      WHERE user_id = $1
    `;
    
    const values = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND tanggal >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND tanggal <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY tanggal DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id, userId) {
    const query = 'SELECT * FROM transactions WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async getSummary(userId, options = {}) {
    const { startDate, endDate } = options;
    
    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN jenis = 'income' THEN jumlah ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN jenis = 'expense' THEN jumlah ELSE 0 END), 0) as total_expense
      FROM transactions 
      WHERE user_id = $1
    `;
    
    const values = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND tanggal >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND tanggal <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, values);
    const summary = result.rows[0];
    
    return {
      totalIncome: parseFloat(summary.total_income) || 0,
      totalExpense: parseFloat(summary.total_expense) || 0,
      balance: (parseFloat(summary.total_income) || 0) - (parseFloat(summary.total_expense) || 0),
    };
  }

  static async getExpenseByCategory(userId, options = {}) {
    const { startDate, endDate } = options;
    
    let query = `
      SELECT 
        keterangan,
        COUNT(*) as count,
        SUM(jumlah) as total
      FROM transactions 
      WHERE user_id = $1 AND jenis = 'expense'
    `;
    
    const values = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND tanggal >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND tanggal <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY keterangan ORDER BY total DESC LIMIT 10`;
    
    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = Transaction;