const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');

/**
 * POST /api/admin/agents
 * Admin-only endpoint to create user + agent in one transaction
 * Creates:
 * - users row (email, password, role='agent')
 * - agents row (linked via user_id)
 */
router.post('/agents', authenticate, adminOnly, async (req, res) => {
  const {
    name,
    email,
    password,
    title,
    phone,
    whatsapp,
    bio,
    profile_photo,
    image,
    experience,
    specialization,
    specialty,
    languages,
    city,
    company,
    is_active = 1
  } = req.body;

  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'name and email are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if email already exists
    const [existingUsers] = await conn.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    
    if (existingUsers.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Generate password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user (users table doesn't have is_active column)
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password, role, created_at)
       VALUES (?, ?, ?, 'agent', NOW())`,
      [name, email, hashedPassword]
    );
    const userId = userResult.insertId;

    // Create agent - only use columns that exist in the table
    // Based on migrate.js: user_id, name, title, specialty, city, languages, specialization,
    // company, phone, whatsapp, profile_photo, image, experience, rating, reviews, sales
    const [agentResult] = await conn.query(
      `INSERT INTO agents (
        user_id, name, title, phone, whatsapp, 
        profile_photo, image, experience, specialization, specialty, 
        languages, city, company, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        name,
        title || null,
        phone || null,
        whatsapp || null,
        profile_photo || null,
        image || null,
        experience ? parseInt(experience) : 0,
        specialization || null,
        specialty || null,
        languages || null,
        city || null,
        company || null
      ]
    );

    // Update users.agent_id if column exists (for backward compatibility)
    try {
      await conn.query(
        `UPDATE users SET agent_id = ? WHERE id = ?`,
        [agentResult.insertId, userId]
      );
    } catch (err) {
      // Column may not exist, ignore
      if (!err.message.includes('Unknown column')) {
        console.warn('Warning updating users.agent_id:', err.message);
      }
    }

    await conn.commit();

    const response = {
      success: true,
      message: 'Agent created successfully',
      data: {
        user: {
          id: userId,
          name,
          email,
          role: 'agent'
        },
        agent: {
          id: agentResult.insertId,
          user_id: userId
        }
      }
    };

    // Include temp password if not provided by admin
    if (!password) {
      response.tempPassword = tempPassword;
    }

    return res.status(201).json(response);
  } catch (err) {
    await conn.rollback();
    console.error('[AdminAgents] Create agent error:', err);
    console.error('[AdminAgents] Error details:', {
      message: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
      sqlState: err.sqlState,
      stack: err.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to create agent',
      error: err.sqlMessage || err.message,
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? {
        sqlMessage: err.sqlMessage,
        code: err.code,
        sqlState: err.sqlState
      } : undefined
    });
  } finally {
    conn.release();
  }
});

module.exports = router;

