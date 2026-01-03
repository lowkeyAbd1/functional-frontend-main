const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Submit contact form (public)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('email').isEmail().withMessage('Valid email is required').isLength({ max: 255 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  body('phone').optional().isLength({ max: 50 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone, message, property_id } = req.body;

    const [result] = await pool.query(`
      INSERT INTO contacts (name, email, phone, message, property_id)
      VALUES (?, ?, ?, ?, ?)
    `, [name, email, phone || null, message, property_id || null]);

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Message sent successfully. We will get back to you soon!'
    });
  } catch (error) {
    next(error);
  }
});

// Get all contacts (admin only)
router.get('/', authenticate, authorizeRoles('admin', 'agent'), async (req, res, next) => {
  try {
    const [contacts] = await pool.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        message,
        property_id,
        status,
        created_at
      FROM contacts
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
});

// Get single contact (admin only)
router.get('/:id', authenticate, authorizeRoles('admin', 'agent'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const [contacts] = await pool.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        message,
        property_id,
        status,
        created_at
      FROM contacts
      WHERE id = ?
    `, [id]);

    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contacts[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
