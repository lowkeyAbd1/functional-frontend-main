const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Temporary: Log auth routes file path
console.log("AUTH ROUTES LOADED FROM:", __filename);

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Generate token
    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Safe debugging logs (no secrets)
    console.log('[LOGIN] Attempting login for email:', email);
    console.log('[LOGIN] DB Config - Host:', process.env.DB_HOST || 'localhost', '| DB:', process.env.DB_NAME || 'faithstate_db');

    // Find user - login validates ONLY email and password, NOT role
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('[LOGIN] User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];
    console.log('[LOGIN] User found - ID:', user.id, '| Name:', user.name, '| Role:', user.role || 'NULL');

    // Defensive check: Verify password hash format (bcrypt hashes start with $2a$ or $2b$)
    // This detects corrupted passwords from manual DB edits (e.g., truncated to "a0")
    const isBcryptHash = user.password && (
      user.password.startsWith('$2a$') || 
      user.password.startsWith('$2b$') ||
      user.password.startsWith('$2y$')
    );
    
    console.log('[LOGIN] Password hash format valid:', isBcryptHash, '| Hash length:', user.password ? user.password.length : 0);
    
    if (!isBcryptHash) {
      console.log('[LOGIN] Password hash corrupted for user ID:', user.id, '| Hash value:', user.password ? user.password.substring(0, 10) + '...' : 'NULL');
      return res.status(401).json({
        success: false,
        message: 'Password corrupted. Please reset password.'
      });
    }

    // Check password - this is the ONLY authentication check
    // Login validates ONLY email + password, NOT role
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('[LOGIN] Password mismatch for user ID:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('[LOGIN] Password verified successfully for user ID:', user.id);

    // Safely handle role - default to 'user' if NULL or invalid
    // Role is NOT required for authentication, only for authorization
    const userRole = user.role && ['user', 'agent', 'admin'].includes(user.role) 
      ? user.role 
      : 'user';

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('[LOGIN] Login successful for user ID:', user.id, '| Role:', userRole);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole
      }
    });
  } catch (error) {
    console.error('[LOGIN] Error during login:', error.message);
    console.error('[LOGIN] Error code:', error.code);
    console.error('[LOGIN] SQL Message:', error.sqlMessage);
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    // Check if user was set by middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      data: req.user
    });
  } catch (err) {
    // Log full error details
    console.error('ME ENDPOINT ERROR:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL Message:', err.sqlMessage);
    console.error('Error stack:', err.stack);
    
    // Return actual error details instead of generic 500
    return res.status(500).json({
      success: false,
      message: 'ME endpoint failed',
      error: err?.message,
      sqlMessage: err?.sqlMessage,
      code: err?.code,
      sqlState: err?.sqlState,
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  }
});

// Logout (client-side token removal, but we can track if needed)
router.post('/logout', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Forgot Password - Request password reset
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res, next) => {
  // Guaranteed logging at handler entry
  console.log("FORGOT PASSWORD HIT:", req.body?.email);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    // Always return success (don't reveal if email exists)
    // But only generate token if user exists
    if (users.length > 0) {
      const user = users[0];
      
      // Generate secure token - RAW token to send to user
      const token = crypto.randomBytes(32).toString('hex');
      
      // Hash token with SHA-256 for storage
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Set expiration to 30 minutes from now
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      
      // Store token hash in database
      const [insertResult] = await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, ?)',
        [user.id, tokenHash, expiresAt, false]
      );
      
      // Log DB insert result
      console.log("RESET TOKEN SAVED:", insertResult.insertId || insertResult);
      
      // Build reset URL using template literal with encoded token
      const resetUrl = `http://localhost:8080/reset-password?token=${encodeURIComponent(token)}`;
      
      // Guaranteed logging of reset link
      console.log("=== PASSWORD RESET LINK ===", resetUrl);
      
      // Detailed logging in console (for localhost/dev)
      console.log('\n=== PASSWORD RESET DETAILS ===');
      console.log(`Email: ${email}`);
      console.log(`User ID: ${user.id}`);
      console.log(`Raw Token: ${token}`);
      console.log(`Token Hash: ${tokenHash}`);
      console.log(`Expires At: ${expiresAt}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=============================\n');
    }

    // Always return success with generic message
    res.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.'
    });
  } catch (err) {
    // Log full error details for debugging
    console.error('FORGOT_PASSWORD_ERROR:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL Message:', err.sqlMessage);
    console.error('SQL State:', err.sqlState);
    console.error('Error stack:', err.stack);
    
    // Return detailed error in development (including SQL errors)
    return res.status(500).json({
      success: false,
      error: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
      sqlState: err.sqlState,
      message: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${err.message}${err.sqlMessage ? ` (SQL: ${err.sqlMessage})` : ''}`
        : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Reset Password - Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Debug logging
    console.log('\n=== RESET PASSWORD REQUEST ===');
    console.log('RAW TOKEN RECEIVED:', token);
    
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    console.log('HASH:', tokenHash);
    console.log('=============================\n');

    // Find valid token (not used, not expired)
    const [tokens] = await pool.query(
      `SELECT prt.*, u.id as user_id 
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = ? 
       AND prt.used = 0 
       AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const resetToken = tokens[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, resetToken.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
      [resetToken.id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (err) {
    // Log full error details for debugging
    console.error('RESET_PASSWORD_ERROR:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL Message:', err.sqlMessage);
    console.error('SQL State:', err.sqlState);
    
    // Return detailed error in development
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
      sqlState: err.sqlState,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
