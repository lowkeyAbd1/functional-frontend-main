const express = require('express');
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/database');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all properties
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, minPrice, maxPrice, location } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (category) {
      // Support both slug and name for backward compatibility, only active categories
      whereClause += ' AND (c.slug = ? OR c.name = ?) AND c.is_active = 1';
      params.push(category, category);
    } else {
      // Only show properties from active categories
      whereClause += ' AND (c.is_active = 1 OR c.id IS NULL)';
    }
    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(maxPrice);
    }
    if (location) {
      whereClause += ' AND (p.location LIKE ? OR p.region LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }

    const [properties] = await pool.query(`
      SELECT 
        p.*, 
        c.name as category,
        a.id AS agent_id,
        a.name AS agent_name,
        a.title AS agent_title,
        COALESCE(a.profile_photo, a.image) AS agent_photo,
        a.phone AS agent_phone,
        a.whatsapp AS agent_whatsapp
      FROM properties p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN agents a ON a.id = p.agent_id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM properties p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
    `, params);

    res.json({
      success: true,
      data: properties,
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

// Get featured properties
// Only show properties that have an agent_id (must be in admin properties)
router.get('/featured', async (req, res, next) => {
  try {
    const [properties] = await pool.query(`
      SELECT 
        p.*, 
        c.name as category,
        a.id AS agent_id,
        a.name AS agent_name,
        a.title AS agent_title,
        COALESCE(a.profile_photo, a.image) AS agent_photo,
        a.phone AS agent_phone,
        a.whatsapp AS agent_whatsapp
      FROM properties p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN agents a ON a.id = p.agent_id
      WHERE (p.featured = TRUE OR p.is_featured = 1) 
        AND p.is_published = 1 
        AND p.agent_id IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    next(error);
  }
});

// Search properties
router.get('/search', async (req, res, next) => {
  try {
    const { query: searchQuery, propertyType, priceRange, location } = req.query;
    
    let whereClause = '1=1';
    const params = [];

    if (searchQuery) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.location LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (propertyType) {
      // Support both slug and name for backward compatibility
      whereClause += ' AND (c.slug = ? OR c.name = ?)';
      params.push(propertyType, propertyType);
    }
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      if (min) {
        whereClause += ' AND p.price >= ?';
        params.push(min);
      }
      if (max) {
        whereClause += ' AND p.price <= ?';
        params.push(max);
      }
    }
    if (location) {
      whereClause += ' AND (p.location LIKE ? OR p.region LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }

    const [properties] = await pool.query(`
      SELECT p.*, c.name as category
      FROM properties p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY p.featured DESC, p.created_at DESC
    `, params);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    next(error);
  }
});

// Get properties by category (supports slug or name)
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    
    const [properties] = await pool.query(`
      SELECT p.*, c.name as category, c.slug as category_slug
      FROM properties p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (c.slug = ? OR c.name = ?) AND c.is_active = 1
      ORDER BY p.created_at DESC
    `, [category, category]);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    next(error);
  }
});

// Get single property
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [properties] = await pool.query(`
      SELECT p.*, c.name as category, a.name as agent_name, a.image as agent_image
      FROM properties p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN agents a ON p.agent_id = a.id
      WHERE p.id = ?
    `, [id]);

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: properties[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create property (admin only)
router.post('/', authenticate, adminOnly, [
  body('title').trim().notEmpty(),
  body('price').isNumeric(),
  body('location').trim().notEmpty(),
  body('region').trim().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, price, location, region, bedrooms, bathrooms, sqft, image, featured, category_id, agent_id } = req.body;

    const [result] = await pool.query(`
      INSERT INTO properties (title, description, price, location, region, bedrooms, bathrooms, sqft, image, featured, category_id, agent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, price, location, region, bedrooms || 0, bathrooms || 0, sqft || 0, image, featured || false, category_id, agent_id]);

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Property created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update property (admin only)
router.put('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['title', 'description', 'price', 'location', 'region', 'bedrooms', 'bathrooms', 'sqft', 'image', 'featured', 'category_id', 'agent_id'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => updates[field]);

    await pool.query(`UPDATE properties SET ${setClause} WHERE id = ?`, [...values, id]);

    res.json({
      success: true,
      message: 'Property updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete property (admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM properties WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
