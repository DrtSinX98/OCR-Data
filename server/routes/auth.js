const express = require('express');
const {
  signup,
  login,
  getHomeStats,
  getProfile,
  updateDisplayName,
  validateSignup,
  validateLogin,
  validateDisplayName
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Authentication routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', auth, getProfile);
router.get('/stats', auth, getHomeStats);

// NEW: Display name route
router.put('/display-name', auth, validateDisplayName, updateDisplayName);

module.exports = router;
