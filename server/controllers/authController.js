const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const OcrTask = require('../models/OcrTask');

// Validation middleware for signup and login
exports.validateSignup = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

exports.validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Validation for display name
exports.validateDisplayName = [
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters long')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Display name can only contain letters and spaces'),
];

// User Registration
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = new User({ 
      email, 
      passwordHash,
      displayName: null // New users won't have display name initially
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'User created successfully.', 
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        isFirstTime: true // Flag to show display name modal
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'An error occurred during signup. Please try again.' });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ 
      message: 'Login successful.', 
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        isFirstTime: !user.displayName // Flag to show display name modal if null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'An error occurred during login. Please try again.' });
  }
};

// NEW: Update Display Name
exports.updateDisplayName = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { displayName } = req.body;
    const userId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { displayName: displayName.trim() },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'Display name updated successfully.',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (err) {
    console.error('Update display name error:', err);
    res.status(500).json({ message: 'Failed to update display name.' });
  }
};

// Get Home Stats for logged-in user
exports.getHomeStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalAssigned = await OcrTask.countDocuments({ assignedTo: userId });
    const totalSubmitted = await OcrTask.countDocuments({ assignedTo: userId, status: 'submitted' });
    const totalApproved = await OcrTask.countDocuments({ assignedTo: userId, status: 'approved' });

    // Calculate accuracy rate
    const accuracyRate = totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0;

    res.status(200).json({ 
      totalAssigned, 
      totalSubmitted, 
      totalApproved,
      accuracyRate
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Error fetching statistics.', error: err.message });
  }
};

// Get Profile for logged-in user (UPDATED)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const recentTasks = await OcrTask.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('imageUrl status correctedText createdAt')
      .lean();

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName, // Include display name
        createdAt: user.createdAt,
      },
      recentTasks,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Error fetching profile.', error: err.message });
  }
};
