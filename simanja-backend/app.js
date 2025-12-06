const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');

// Initialize express app
const app = express();

// Middleware CORS - PERBAIKAN DI BAGIAN INI
app.use(cors({
  origin: [
    'http://localhost:8080', 
    'http://127.0.0.1:8080', 
    'file://', 
    'null',
    // DOMAIN FRONT-END VERCEL ANDA
    'https://simanja-frontend.vercel.app' 
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Simanja API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      transactions: '/api/transactions'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  // Multer error handling
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Ukuran file terlalu besar. Maksimal 5MB'
      });
    }
    return res.status(400).json({
      error: err.message
    });
  }
  
  // Cloudinary error
  if (err.message.includes('Cloudinary')) {
    return res.status(500).json({
      error: 'Error saat mengupload file ke cloud'
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token tidak valid'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token telah kadaluarsa'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint tidak ditemukan'
  });
});

// EKSPOR APLIKASI EXPRESS (Wajib untuk Vercel)
module.exports = app;
