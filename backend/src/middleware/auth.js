const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    // Check JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('ERROR: JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET missing'
      });
    }

    // SAFE: Check authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid Authorization header'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid Authorization header'
      });
    }

    // SAFE: Extract token (won't crash if split fails)
    const parts = authHeader.split(' ');
    const token = parts.length > 1 ? parts[1] : null;
    
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid Authorization header'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Return 401 for JWT errors, NOT 500
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: jwtError.message
        });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          error: jwtError.message
        });
      }
      // Log unexpected JWT errors
      console.error('JWT VERIFY ERROR:', jwtError.name, jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token verification failed',
        error: jwtError.message
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }
    
    // Get user from database with agent_id if agent
    // Check if agent_id column exists, if not use fallback query
    let users;
    try {
      // Try query with agent_id column first
      const result = await pool.query(
        `SELECT 
           u.id, 
           u.name, 
           u.email, 
           u.role, 
           COALESCE(u.agent_id, a.id) as agentId,
           u.agent_id
         FROM users u 
         LEFT JOIN agents a ON a.user_id = u.id 
         WHERE u.id = ?`,
        [decoded.userId]
      );
      users = result[0];
    } catch (queryError) {
      // If agent_id column doesn't exist, use simpler query
      if (queryError.code === 'ER_BAD_FIELD_ERROR' && queryError.sqlMessage && queryError.sqlMessage.includes('agent_id')) {
        console.log('agent_id column not found, using fallback query');
        const result = await pool.query(
          `SELECT 
             u.id, 
             u.name, 
             u.email, 
             u.role,
             a.id as agentId
           FROM users u 
           LEFT JOIN agents a ON a.user_id = u.id 
           WHERE u.id = ?`,
          [decoded.userId]
        );
        users = result[0];
      } else {
        // Log actual SQL error and return 500 with details
        console.error('DATABASE QUERY ERROR:', queryError.code, queryError.sqlMessage);
        console.error('Full error:', queryError);
        return res.status(500).json({
          success: false,
          message: 'Database error while fetching user',
          error: queryError.sqlMessage || queryError.message,
          code: queryError.code,
          sqlState: queryError.sqlState
        });
      }
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    // Log unexpected errors with full details
    console.error('AUTH MIDDLEWARE ERROR:', error.name, error.message);
    console.error('Error code:', error.code);
    console.error('SQL Message:', error.sqlMessage);
    console.error('Error stack:', error.stack);
    
    // Return 401 for auth-related errors, 500 for unexpected errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
        error: error.message
      });
    }
    
    // For other errors, return 500 with full error details
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
      sqlMessage: error.sqlMessage,
      code: error.code,
      sqlState: error.sqlState,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Optional authentication - doesn't require token but attaches user if present
// CRITICAL: This middleware MUST NEVER block - always call next()
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // No auth header = public user, continue
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      req.user = null;
      return next();
    }

    // Try to verify token - if it fails, continue as public user
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Token invalid/expired - continue as public user (DO NOT BLOCK)
      console.log('[optionalAuth] Token invalid/expired, continuing as public user:', jwtError.name);
      req.user = null;
      return next();
    }

    // Token valid - try to get user from DB
    try {
      const [users] = await pool.query(
        `SELECT 
           u.id, 
           u.name, 
           u.email, 
           u.role, 
           COALESCE(u.agent_id, a.id) as agentId 
         FROM users u 
         LEFT JOIN agents a ON a.user_id = u.id 
         WHERE u.id = ?`,
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = users[0];
      } else {
        req.user = null;
      }
    } catch (dbError) {
      // DB error - log but continue as public user (DO NOT BLOCK)
      console.error('[optionalAuth] DB error, continuing as public user:', dbError.message);
      req.user = null;
    }
    
    // ALWAYS call next() - never block the request
    next();
  } catch (error) {
    // ANY error - log but continue as public user (DO NOT BLOCK)
    console.error('[optionalAuth] Unexpected error, continuing as public user:', error.message);
    req.user = null;
    next();
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Role-based authorization middleware (allows multiple roles)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { authenticate, optionalAuth, adminOnly, authorizeRoles };
