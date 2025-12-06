const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

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

exports.register = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      namaLengkap,
      jenisKelamin = 'Laki-laki',
      tanggalLahir,
      alamat,
      nomorHP 
    } = req.body;

    console.log('🔍 Register attempt:', { username, email });

    // Validasi input
    if (!username || !email || !password || !namaLengkap) {
      return res.status(400).json({
        error: 'Semua field wajib diisi',
      });
    }

    // Cek apakah email sudah terdaftar
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email sudah terdaftar',
      });
    }

    // Cek apakah username sudah terdaftar
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        error: 'Username sudah terdaftar',
      });
    }

    // Buat user baru
    const userData = {
      username,
      email,
      password,
      namaLengkap,
      jenisKelamin,
      tanggalLahir,
      alamat,
      nomorHP,
    };

    const user = await User.create(userData);
    console.log('✅ User created:', user.id);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat registrasi',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔍 Login attempt:', { username });

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username dan password wajib diisi',
      });
    }

    // Cari user by email atau username
    let user = await User.findByEmail(username);
    if (!user) {
      user = await User.findByUsername(username);
    }

    // Cek user dan password
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        error: 'Username atau password salah',
      });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.id);
      return res.status(401).json({
        error: 'Username atau password salah',
      });
    }

    // Generate token
    const token = generateToken(user.id);
    console.log('✅ Login successful for user:', user.id);

    res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat login',
    });
  }
};