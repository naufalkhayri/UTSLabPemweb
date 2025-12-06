// server.js - Hapus atau update bagian static files
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Debug info
console.log('=== SERVER STARTUP ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Running on Vercel:', !!process.env.VERCEL);
console.log('Upload storage: MEMORY (temporary)');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend.vercel.app'], // Ganti dengan frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== IMPORTANT: HAPUS STATIC FILES UNTUK UPLOADS ==========
// Karena kita pakai memory storage, tidak ada file yang disimpan di disk
// Jadi tidak perlu serve static files

// Atau berikan pesan error jika ada yang akses /uploads
app.use('/uploads', (req, res) => {
  res.status(403).json({
    error: 'File uploads not available',
    message: 'This deployment uses temporary memory storage. Files are not saved permanently.',
    solution: 'For permanent file storage, configure Cloudinary or another cloud storage service.'
  });
});

// Import database untuk test connection
const db = require('./config/database');

// Test database connection on startup
db.query('SELECT NOW()')
  .then(result => {
    console.log('✅ Database connected:', result.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Simanja API is running with memory storage',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uploadStorage: 'memory (temporary)',
    note: 'Uploaded files are not saved permanently'
  });
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'File terlalu besar',
      maxSize: '2MB',
      received: err.message 
    });
  }
  
  if (err.message && err.message.includes('Hanya file gambar')) {
    return res.status(400).json({ 
      error: 'Format file tidak didukung',
      allowed: ['JPEG', 'PNG', 'GIF', 'WEBP']
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Upload storage: MEMORY (files not saved)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});