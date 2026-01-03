const express = require('express');
const pool = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all projects (public)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 12, location, status, minPrice, maxPrice, featured } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (location) {
      whereClause += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (minPrice) {
      whereClause += ' AND price_from >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      whereClause += ' AND price_from <= ?';
      params.push(maxPrice);
    }
    if (featured === 'true') {
      whereClause += ' AND is_featured = 1';
    }

    const [projects] = await pool.query(`
      SELECT * FROM projects
      WHERE ${whereClause}
      ORDER BY is_featured DESC, created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM projects
      WHERE ${whereClause}
    `, params);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get featured projects
router.get('/featured', async (req, res, next) => {
  try {
    const [projects] = await pool.query(`
      SELECT * FROM projects
      WHERE is_featured = 1
      ORDER BY created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
});

// Get single project
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [projects] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: projects[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create project (admin only)
router.post('/', authenticate, adminOnly, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('price_from').optional().isNumeric(),
  body('status').optional().isIn(['upcoming', 'ongoing', 'completed'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, location, price_from, developer, description, image, status, is_featured } = req.body;

    const [result] = await pool.query(`
      INSERT INTO projects (title, location, price_from, developer, description, image, status, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, location, price_from || null, developer || null, description || null, image || null, status || 'upcoming', is_featured || false]);

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Project created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update project (admin only)
router.put('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['title', 'location', 'price_from', 'developer', 'description', 'image', 'status', 'is_featured'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => updates[field]);

    await pool.query(`UPDATE projects SET ${setClause} WHERE id = ?`, [...values, id]);

    res.json({
      success: true,
      message: 'Project updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete project (admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

