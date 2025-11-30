const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const bcrypt = require('bcryptjs');

// GET user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching user profile for user ID:', req.user.userId);
    
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
      success: true,
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
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Terjadi kesalahan server',
      details: error.message 
    });
  }
});

// UPDATE user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Updating profile for user ID:', req.user.userId);
    console.log('📝 Update data:', req.body);
    
    const { 
      namaLengkap, 
      email, 
      nomorHP, 
      alamat, 
      jenisKelamin, 
      tanggalLahir 
    } = req.body;

    // Validasi required fields
    if (!namaLengkap || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Nama lengkap dan email wajib diisi' 
      });
    }

    // Check if email already exists (excluding current user)
    const emailCheck = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.user.userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Email sudah digunakan oleh user lain' 
      });
    }

    // Update user data
    const updatedUser = await db.query(
      `UPDATE users 
       SET nama_lengkap = $1, email = $2, nomor_hp = $3, alamat = $4, 
           jenis_kelamin = $5, tanggal_lahir = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING id, nama_lengkap, email, nomor_hp, alamat, jenis_kelamin, tanggal_lahir, username, foto_profil`,
      [namaLengkap, email, nomorHP, alamat, jenisKelamin, tanggalLahir, req.user.userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User tidak ditemukan' 
      });
    }

    const userData = updatedUser.rows[0];

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: {
        id: userData.id,
        namaLengkap: userData.nama_lengkap,
        email: userData.email,
        nomorHP: userData.nomor_hp,
        alamat: userData.alamat,
        jenisKelamin: userData.jenis_kelamin,
        tanggalLahir: userData.tanggal_lahir,
        username: userData.username,
        fotoProfil: userData.foto_profil
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Terjadi kesalahan server',
      details: error.message 
    });
  }
});

// UPLOAD profile photo
router.post('/profile/photo', authenticateToken, upload.single('fotoProfil'), async (req, res) => {
  try {
    console.log('🖼️ Uploading profile photo for user ID:', req.user.userId);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'File foto tidak ditemukan' 
      });
    }

    const fotoProfil = `/uploads/${req.file.filename}`;

    // Update user photo in database
    const updatedUser = await db.query(
      `UPDATE users 
       SET foto_profil = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING id, nama_lengkap, email, foto_profil`,
      [fotoProfil, req.user.userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User tidak ditemukan' 
      });
    }

    const userData = updatedUser.rows[0];

    res.json({
      success: true,
      message: 'Foto profil berhasil diupload',
      user: {
        id: userData.id,
        namaLengkap: userData.nama_lengkap,
        email: userData.email,
        fotoProfil: userData.foto_profil
      }
    });

  } catch (error) {
    console.error('❌ Upload photo error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Terjadi kesalahan server',
      details: error.message 
    });
  }
});

// CHANGE PASSWORD
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 Changing password for user ID:', req.user.userId);
    
    const { oldPassword, newPassword } = req.body;

    // Validasi input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Password lama dan password baru harus diisi' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password baru minimal 6 karakter' 
      });
    }

    // Get user dengan password_hash
    const user = await db.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User tidak ditemukan' 
      });
    }

    const userData = user.rows[0];
    console.log('🔍 User found, verifying old password...');

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(oldPassword, userData.password_hash);
    
    if (!isPasswordValid) {
      console.log('❌ Old password incorrect');
      return res.status(400).json({ 
        success: false,
        error: 'Password lama salah' 
      });
    }

    console.log('✅ Old password verified, hashing new password...');

    // Hash password baru
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password_hash di database
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.userId]
    );

    console.log('✅ Password changed successfully for user ID:', req.user.userId);

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Terjadi kesalahan server',
      details: error.message 
    });
  }
});

module.exports = router;