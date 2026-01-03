const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Get all active categories with property count (public)
router.get('/', async (req, res, next) => {
  try {
    const [categories] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.icon,
        c.color,
        COUNT(p.id) as count
      FROM categories c
      LEFT JOIN properties p ON c.id = p.category_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.slug, c.icon, c.color
      ORDER BY c.name
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Get all categories (admin only - includes inactive)
router.get('/all', authenticate, adminOnly, async (req, res, next) => {
  try {
    const [categories] = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as count
      FROM categories c
      LEFT JOIN properties p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Get single category by ID (admin)
router.get('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create category (admin only)
router.post('/', authenticate, adminOnly, [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be 100 characters or less'),
  body('slug').optional().trim().isLength({ max: 100 }).matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens (max 100 chars)'),
  body('icon').optional().trim().isLength({ max: 255 }).withMessage('Icon must be 255 characters or less'),
  body('color').optional().trim(),
  body('description').optional().trim(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, slug, icon, color, description, is_active } = req.body;
    const finalSlug = slug || generateSlug(name);

    // Check if slug already exists
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE slug = ?',
      [finalSlug]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, icon, color, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, finalSlug, icon || null, color || null, description || null, is_active !== undefined ? is_active : 1]
    );

    const [newCategory] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newCategory[0],
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update category (admin only)
router.put('/:id', authenticate, adminOnly, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }).withMessage('Name must be 100 characters or less'),
  body('slug').optional().trim().isLength({ max: 100 }).matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens (max 100 chars)'),
  body('icon').optional().trim().isLength({ max: 255 }).withMessage('Icon must be 255 characters or less'),
  body('color').optional().trim(),
  body('description').optional().trim(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
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
    const { name, slug, icon, color, description, is_active } = req.body;

    // Check if category exists
    const [existing] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If slug is being updated, check for conflicts
    if (slug) {
      const [slugCheck] = await pool.query(
        'SELECT id FROM categories WHERE slug = ? AND id != ?',
        [slug, id]
      );

      if (slugCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      values.push(slug);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
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
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updated[0],
      message: 'Category updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete category (admin only - soft delete by setting is_active = 0)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existing] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has properties
    const [properties] = await pool.query(
      'SELECT COUNT(*) as count FROM properties WHERE category_id = ?',
      [id]
    );

    if (properties[0].count > 0) {
      // Soft delete instead of hard delete
      await pool.query(
        'UPDATE categories SET is_active = 0 WHERE id = ?',
        [id]
      );

      return res.json({
        success: true,
        message: 'Category deactivated (has associated properties)'
      });
    }

    // Hard delete if no properties
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Toggle category active status (admin only)
router.patch('/:id/toggle', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const newStatus = existing[0].is_active ? 0 : 1;
    await pool.query(
      'UPDATE categories SET is_active = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
