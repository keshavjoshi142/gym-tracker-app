const express = require('express');
const { 
  authenticateToken, 
  validateUserInput, 
  authLimiter 
} = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  validateUserInput(['username', 'email', 'password']),
  async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, profile } = req.body;

      // Check password strength
      if (password.length < 8) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters long',
          code: 'WEAK_PASSWORD'
        });
      }

      // Check if username is valid (alphanumeric + underscore, 3-30 chars)
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          error: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores',
          code: 'INVALID_USERNAME'
        });
      }

      const userData = {
        username,
        email: email.toLowerCase().trim(),
        password,
        firstName,
        lastName,
        profile
      };

      const user = await req.db.registerUser(userData);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: error.message,
          code: 'USER_EXISTS'
        });
      }
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return token
 * @access Public
 */
router.post('/login',
  validateUserInput(['identifier', 'password']),
  async (req, res, next) => {
    try {
      const { identifier, password } = req.body;

      const result = await req.db.loginUser(identifier, password);

      res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });

    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          error: 'Invalid email/username or password',
          code: 'INVALID_CREDENTIALS'
        });
      }
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate token
 * @access Private
 */
router.post('/logout',
  authenticateToken,
  async (req, res, next) => {
    try {
      await req.db.logoutUser(req.user.userId, req.token);

      res.json({
        message: 'Logged out successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me',
  authenticateToken,
  async (req, res, next) => {
    try {
      const userProfile = await req.db.getUserProfile(req.user.userId);

      res.json({
        user: userProfile
      });

    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      next(error);
    }
  }
);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile',
  authenticateToken,
  async (req, res, next) => {
    try {
      const updateData = req.body;

      // Validate email if being updated
      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase().trim();
      }

      const updatedProfile = await req.db.updateUserProfile(req.user.userId, updateData);

      res.json({
        message: 'Profile updated successfully',
        user: updatedProfile
      });

    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Email already in use by another account',
          code: 'EMAIL_EXISTS'
        });
      }
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/verify-token
 * @desc Verify if token is still valid
 * @access Private
 */
router.post('/verify-token',
  authenticateToken,
  async (req, res) => {
    res.json({
      valid: true,
      user: {
        id: req.user.userId,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });
  }
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password',
  authenticateToken,
  validateUserInput(['currentPassword', 'newPassword']),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Check new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'New password must be at least 8 characters long',
          code: 'WEAK_PASSWORD'
        });
      }

      // Verify current password by attempting login
      try {
        await req.db.loginUser(req.user.email, currentPassword);
      } catch (error) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Update password (you'll need to implement this method in db.js)
      await req.db.updateUserPassword(req.user.userId, newPassword);

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;