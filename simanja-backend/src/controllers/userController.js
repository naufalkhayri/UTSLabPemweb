const User = require('../models/User');

// Helper untuk format user response
const formatUserResponse = (user) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    namaLengkap: user.nama_lengkap,
    jenisKelamin: user.jenis_kelamin,
    tanggalLahir: user.tanggal_lahir,
    alamat: user.alamat,
    nomorHP: user.nomor_hp,
    fotoProfil: user.foto_profil,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

exports.getProfile = async (req, res) => {
  try {
    console.log('🔍 Get profile for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    res.json({
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat mengambil data profil',
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      namaLengkap,
      email,
      nomorHP,
      tanggalLahir,
      jenisKelamin,
      alamat,
    } = req.body;

    console.log('🔍 Update profile for user:', req.user.id, req.body);

    // Validasi input
    if (!namaLengkap || !email) {
      return res.status(400).json({
        error: 'Nama lengkap dan email wajib diisi',
      });
    }

    // Cek apakah email sudah digunakan oleh user lain
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({
        error: 'Email sudah digunakan oleh user lain',
      });
    }

    const userData = {
      namaLengkap,
      email,
      nomorHP,
      tanggalLahir,
      jenisKelamin,
      alamat,
    };

    const updatedUser = await User.update(req.user.id, userData);

    res.json({
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat memperbarui profil',
    });
  }
};

exports.updatePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Tidak ada file yang diupload',
      });
    }

    console.log('📸 Update photo for user:', req.user.id);
    console.log('📁 File uploaded:', req.file.path);

    // Dapatkan URL dari Cloudinary
    const fotoProfil = req.file.path;

    const updatedUser = await User.updateFotoProfil(req.user.id, fotoProfil);

    res.json({
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('❌ Update photo error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat mengupdate foto profil',
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    console.log('🔐 Change password for user:', req.user.id);

    // Validasi input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        error: 'Password lama dan baru wajib diisi',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password baru minimal 6 karakter',
      });
    }

    // Dapatkan user
    const user = await User.findById(req.user.id);

    // Verifikasi password lama
    const isPasswordValid = await User.verifyPassword(oldPassword, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Password lama salah',
      });
    }

    // Update password
    await User.updatePassword(req.user.id, newPassword);

    res.json({
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat mengubah password',
    });
  }
};