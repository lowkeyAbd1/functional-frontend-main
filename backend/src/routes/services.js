const express = require('express');
const pool = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all active services (public)
router.get('/', async (req, res, next) => {
  try {
    const [services] = await pool.query(`
      SELECT * FROM services
      WHERE is_active = 1
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
});

// Get all services including inactive (admin only)
router.get('/all', authenticate, adminOnly, async (req, res, next) => {
  try {
    const [services] = await pool.query(`
      SELECT * FROM services
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
});

// Get single service
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [services] = await pool.query(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: services[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create service (admin only)
router.post('/', authenticate, adminOnly, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional().trim(),
  body('icon').optional().trim().isLength({ max: 255 }),
  body('is_active').optional().isBoolean()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, icon, is_active } = req.body;

    const [result] = await pool.query(
      `INSERT INTO services (title, description, icon, is_active)
       VALUES (?, ?, ?, ?)`,
      [title, description || null, icon || null, is_active !== undefined ? is_active : 1]
    );

    const [newService] = await pool.query(
      'SELECT * FROM services WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newService[0],
      message: 'Service created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update service (admin only)
router.put('/:id', authenticate, adminOnly, [
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('icon').optional().trim().isLength({ max: 255 }),
  body('is_active').optional().isBoolean()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, description, icon, is_active } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    await pool.query(
      `UPDATE services SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.query(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updated[0],
      message: 'Service updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete service (admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Soft delete
    await pool.query(
      'UPDATE services SET is_active = 0 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

