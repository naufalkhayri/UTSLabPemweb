const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadFotoProfil } = require('../middleware/uploadMiddleware');

// Semua route membutuhkan autentikasi
router.use(authenticate);

// Get profile
router.get('/profile', userController.getProfile);

// Update profile
router.put('/profile', userController.updateProfile);

// Update photo
router.post('/profile/photo', uploadFotoProfil, userController.updatePhoto);

// Change password
router.put('/change-password', userController.changePassword);

module.exports = router;