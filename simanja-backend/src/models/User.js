const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(data) {
    const {
      username,
      email,
      password,
      namaLengkap,
      jenisKelamin = 'Laki-laki',
      tanggalLahir,
      alamat,
      nomorHP,
    } = data;

    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users 
      (username, email, password_hash, nama_lengkap, jenis_kelamin, tanggal_lahir, alamat, nomor_hp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, nama_lengkap, jenis_kelamin, tanggal_lahir, alamat, nomor_hp, foto_profil, created_at, updated_at
    `;

    const values = [
      username,
      email,
      passwordHash,
      namaLengkap,
      jenisKelamin,
      tanggalLahir,
      alamat,
      nomorHP,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      namaLengkap,
      email,
      nomorHP,
      tanggalLahir,
      jenisKelamin,
      alamat,
    } = data;

    const query = `
      UPDATE users 
      SET nama_lengkap = $1, 
          email = $2, 
          nomor_hp = $3, 
          tanggal_lahir = $4, 
          jenis_kelamin = $5, 
          alamat = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, username, email, nama_lengkap, jenis_kelamin, tanggal_lahir, alamat, nomor_hp, foto_profil, created_at, updated_at
    `;

    const values = [
      namaLengkap,
      email,
      nomorHP,
      tanggalLahir,
      jenisKelamin,
      alamat,
      id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateFotoProfil(id, fotoProfil) {
    const query = `
      UPDATE users 
      SET foto_profil = $1, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, nama_lengkap, jenis_kelamin, tanggal_lahir, alamat, nomor_hp, foto_profil, created_at, updated_at
    `;

    const result = await pool.query(query, [fotoProfil, id]);
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const query = `
      UPDATE users 
      SET password_hash = $1, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await pool.query(query, [passwordHash, id]);
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;