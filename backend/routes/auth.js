/**
 * Authentication Routes
 * 
 * Handles user registration, login, logout, password reset,
 * email verification, and account management.
 */

const express = require('express');
const crypto = require('crypto');
const { body, query } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');

// Middleware
const { authenticate, createSendToken } = require('../middleware/auth');
const { 
  catchAsync, 
  validationError, 
  authError, 
  notFoundError 
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
    body('agreeToTerms')
      .isBoolean()
      .custom(value => {
        if (!value) {
          throw new Error('You must agree to the terms and conditions');
        }
        return true;
      })
  ],
  catchAsync(async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw validationError('Email already registered', 'email');
      }
      if (existingUser.username === username) {
        throw validationError('Username already taken', 'username');
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'user',
      isActive: true,
      isVerified: false // Require email verification
    });

    await user.save();

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // In production, you would save these tokens to the database
    // For now, we'll log them
    console.log(`Verification token for ${email}: ${verificationToken}`);

    // Send welcome response
    createSendToken(user, 201, res, 'Registration successful! Please check your email to verify your account.');
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean()
  ],
  catchAsync(async (req, res) => {
    const { identifier, password, rememberMe } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    }).select('+password +isActive');

    if (!user || !(await user.matchPassword(password))) {
      throw authError('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw authError('Account has been deactivated. Please contact support.');
    }

    // Update last login
    user.stats.lastActive = new Date();
    await user.save();

    // Set token expiration based on "remember me"
    const tokenExpiration = rememberMe ? '30d' : '1d';
    process.env.JWT_EXPIRE = tokenExpiration;

    createSendToken(user, 200, res, 'Login successful');
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout',
  authenticate,
  catchAsync(async (req, res) => {
    // Clear the JWT cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],
  catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // In production, save these to the database
    console.log(`Reset token for ${email}: ${resetToken}`);
    console.log(`Reset expires: ${new Date(resetExpires)}`);

    // In production, send email here
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  catchAsync(async (req, res) => {
    const { token, password } = req.body;

    // In production, verify token from database
    // For demo, we'll find user by a mock token validation
    const user = await User.findOne({ email: 'demo@example.com' }); // Mock

    if (!user) {
      throw authError('Invalid or expired reset token');
    }

    // Update password
    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  })
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      throw authError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
  ],
  catchAsync(async (req, res) => {
    const { token } = req.body;

    // In production, verify token from database
    // For demo, we'll mock the verification
    const user = await User.findOne({ email: 'demo@example.com' }); // Mock

    if (!user) {
      throw authError('Invalid or expired verification token');
    }

    // Mark email as verified
    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  })
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/resend-verification',
  authenticate,
  catchAsync(async (req, res) => {
    if (req.user.isVerified) {
      throw validationError('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log(`New verification token for ${req.user.email}: ${verificationToken}`);

    // In production, send email here
    // await sendVerificationEmail(req.user.email, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent'
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticate,
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  })
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me',
  authenticate,
  [
    body('firstName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],
  catchAsync(async (req, res) => {
    const allowedFields = ['firstName', 'lastName', 'username', 'email'];
    const updates = {};

    // Filter allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if username or email already exists (if being updated)
    if (updates.username || updates.email) {
      const query = {
        _id: { $ne: req.user._id }
      };

      if (updates.username) {
        query.username = updates.username;
      }
      if (updates.email) {
        query.email = updates.email;
      }

      const existingUser = await User.findOne(query);
      if (existingUser) {
        if (existingUser.username === updates.username) {
          throw validationError('Username already taken', 'username');
        }
        if (existingUser.email === updates.email) {
          throw validationError('Email already registered', 'email');
        }
      }
    }

    // If email is being updated, mark as unverified
    if (updates.email && updates.email !== req.user.email) {
      updates.isVerified = false;
    }

    // Update user
    Object.assign(req.user, updates);
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: req.user
      }
    });
  })
);

/**
 * @route   DELETE /api/auth/me
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/me',
  authenticate,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required to deactivate account'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],
  catchAsync(async (req, res) => {
    const { password, reason } = req.body;

    // Verify password
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(password))) {
      throw authError('Incorrect password');
    }

    // Deactivate account (soft delete)
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivationReason = reason;
    await user.save();

    // Clear JWT cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  })
);

/**
 * @route   POST /api/auth/reactivate
 * @desc    Reactivate deactivated account
 * @access  Public
 */
router.post('/reactivate',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Find deactivated user
    const user = await User.findOne({ 
      email,
      isActive: false 
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      throw authError('Invalid credentials or account not found');
    }

    // Reactivate account
    user.isActive = true;
    user.deactivatedAt = null;
    user.deactivationReason = null;
    user.stats.lastActive = new Date();
    await user.save();

    createSendToken(user, 200, res, 'Account reactivated successfully');
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh',
  authenticate,
  catchAsync(async (req, res) => {
    // Update last active
    req.user.stats.lastActive = new Date();
    await req.user.save();

    createSendToken(req.user, 200, res, 'Token refreshed successfully');
  })
);

/**
 * @route   GET /api/auth/check-availability
 * @desc    Check username/email availability
 * @access  Public
 */
router.get('/check-availability',
  [
    query('username').optional().isLength({ min: 3, max: 30 }),
    query('email').optional().isEmail().normalizeEmail()
  ],
  catchAsync(async (req, res) => {
    const { username, email } = req.query;

    if (!username && !email) {
      throw validationError('Username or email parameter is required');
    }

    const result = {};

    if (username) {
      const userExists = await User.findOne({ username });
      result.username = {
        available: !userExists,
        value: username
      };
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      result.email = {
        available: !emailExists,
        value: email
      };
    }

    res.json({
      success: true,
      data: result
    });
  })
);

module.exports = router;