const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authController = {
  // Register user baru
  register: async (req, res) => {
    try {
      const {
        namaLengkap,
        email,
        nomorHP,
        alamat,
        jenisKelamin,
        tanggalLahir,
        username,
        password
      } = req.body;

      // Validasi input
      if (!namaLengkap || !email || !username || !password) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter' });
      }

      // Cek apakah email atau username sudah terdaftar
      const userCheck = await db.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email atau username sudah terdaftar' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user baru
      const newUser = await db.query(
        `INSERT INTO users 
         (nama_lengkap, email, nomor_hp, alamat, jenis_kelamin, tanggal_lahir, username, password_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, nama_lengkap, email, username, created_at`,
        [namaLengkap, email, nomorHP, alamat, jenisKelamin, tanggalLahir, username, passwordHash]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.rows[0].id, username: newUser.rows[0].username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User berhasil didaftarkan',
        token,
        user: {
          id: newUser.rows[0].id,
          namaLengkap: newUser.rows[0].nama_lengkap,
          email: newUser.rows[0].email,
          username: newUser.rows[0].username
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
      }

      // Cari user by username atau email
      const user = await db.query(
        'SELECT * FROM users WHERE username = $1 OR email = $1',
        [username]
      );

      if (user.rows.length === 0) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }

      const userData = user.rows[0];

      // Verifikasi password
      const validPassword = await bcrypt.compare(password, userData.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: userData.id, username: userData.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login berhasil',
        token,
        user: {
          id: userData.id,
          namaLengkap: userData.nama_lengkap,
          email: userData.email,
          username: userData.username,
          fotoProfil: userData.foto_profil
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await db.query(
        `SELECT id, nama_lengkap, email, nomor_hp, alamat, jenis_kelamin, 
                tanggal_lahir, username, foto_profil, created_at 
         FROM users WHERE id = $1`,
        [req.user.userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      const userData = user.rows[0];
      
      res.json({
        user: {
          id: userData.id,
          namaLengkap: userData.nama_lengkap,
          email: userData.email,
          nomorHP: userData.nomor_hp,
          alamat: userData.alamat,
          jenisKelamin: userData.jenis_kelamin,
          tanggalLahir: userData.tanggal_lahir,
          username: userData.username,
          fotoProfil: userData.foto_profil,
          createdAt: userData.created_at
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
};

module.exports = authController;