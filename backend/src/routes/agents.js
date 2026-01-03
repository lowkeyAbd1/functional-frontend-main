const express = require('express');
const pool = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all agents (with filters for Find My Agent)
router.get('/', async (req, res, next) => {
  try {
    const { city, language, name, specialization, purpose, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '1=1';
    const params = [];
    
    if (city) {
      whereClause += ' AND a.city LIKE ?';
      params.push(`%${city}%`);
    }
    
    if (language) {
      whereClause += ' AND a.languages LIKE ?';
      params.push(`%${language}%`);
    }
    
    if (name) {
      whereClause += ' AND a.name LIKE ?';
      params.push(`%${name}%`);
    }
    
    if (specialization) {
      whereClause += ' AND (a.specialization LIKE ? OR a.specialty LIKE ?)';
      params.push(`%${specialization}%`, `%${specialization}%`);
    }
    
    // Get total count
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM agents a WHERE ${whereClause}
    `, params);
    const total = countResult[0].total;
    
    // Get agents with pagination
    const [agents] = await pool.query(`
      SELECT 
        a.*,
        COUNT(DISTINCT p.id) as properties_count
      FROM agents a
      LEFT JOIN properties p ON p.agent_id = a.id AND p.is_published = 1
      WHERE ${whereClause}
      GROUP BY a.id
      ORDER BY a.rating DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: agents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create agent (admin only)
router.post('/', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const {
      user_id,
      name,
      title,
      specialty,
      city,
      languages,
      specialization,
      company,
      phone,
      whatsapp,
      profile_photo,
      image,
      experience,
      rating,
      reviews,
      sales
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Normalize image paths: reject Windows absolute paths, keep relative paths and URLs as-is
    let normalizedProfilePhoto = profile_photo ? profile_photo.trim() : null;
    let normalizedImage = image ? image.trim() : null;
    
    // Reject Windows paths (C:\, file://, etc.)
    if (normalizedProfilePhoto && (normalizedProfilePhoto.includes(':\\') || normalizedProfilePhoto.startsWith('file://') || normalizedProfilePhoto.startsWith('C:\\'))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile_photo path. Use relative path like /uploads/agents/filename.jpg or full URL'
      });
    }
    if (normalizedImage && (normalizedImage.includes(':\\') || normalizedImage.startsWith('file://') || normalizedImage.startsWith('C:\\'))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image path. Use relative path like /uploads/agents/filename.jpg or full URL'
      });
    }

    // Insert agent - store paths exactly as provided (relative /uploads/... or full URL)
    const [result] = await pool.query(`
      INSERT INTO agents (
        user_id, name, title, specialty, city, languages, specialization,
        company, phone, whatsapp, profile_photo, image, experience, rating, reviews, sales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id || null,
      name.trim(),
      title || null,
      specialty || null,
      city || null,
      languages || null,
      specialization || null,
      company || null,
      phone || null,
      whatsapp || null,
      normalizedProfilePhoto,
      normalizedImage,
      experience || 0,
      rating || 0,
      reviews || 0,
      sales || null
    ]);

    // If user_id was provided, also update users.agent_id
    if (user_id) {
      await pool.query('UPDATE users SET agent_id = ? WHERE id = ?', [result.insertId, user_id]);
    } else {
      // Auto-link by email if user_id not provided but email matches
      const [usersByEmail] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND role = ? LIMIT 1',
        [req.body.email || '', 'agent']
      );
      if (usersByEmail.length > 0) {
        const userId = usersByEmail[0].id;
        await pool.query('UPDATE users SET agent_id = ? WHERE id = ?', [result.insertId, userId]);
        await pool.query('UPDATE agents SET user_id = ? WHERE id = ?', [userId, result.insertId]);
      }
    }

    // Get created agent
    const [agents] = await pool.query('SELECT * FROM agents WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: agents[0],
      message: 'Agent created successfully'
    });
  } catch (error) {
    console.error('Create agent error:', error);
    next(error);
  }
});

// Get single agent
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [agents] = await pool.query(`
      SELECT a.*, u.email
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `, [id]);

    if (agents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Get agent's properties count
    const [propertiesCount] = await pool.query(`
      SELECT COUNT(*) as count FROM properties WHERE agent_id = ? AND is_published = 1
    `, [id]);
    
    // Get agent's active stories preview (latest 3)
    const [stories] = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.project_name,
        s.created_at,
        s.expires_at,
        COUNT(DISTINCT v.id) as views_count,
        (SELECT media_url FROM agent_story_media WHERE story_id = s.id ORDER BY sort_order ASC LIMIT 1) as preview_media
      FROM agent_stories s
      LEFT JOIN agent_story_views v ON s.id = v.story_id
      WHERE s.agent_id = ? AND s.is_active = 1 AND s.expires_at > NOW()
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 3
    `, [id]);

    res.json({
      success: true,
      data: {
        ...agents[0],
        propertiesCount: propertiesCount[0].count,
        activeStories: stories
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update agent (admin only)
router.put('/:id', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      name,
      title,
      specialty,
      city,
      languages,
      specialization,
      company,
      phone,
      whatsapp,
      profile_photo,
      image,
      experience,
      rating,
      reviews,
      sales
    } = req.body;

    // Check if agent exists
    const [existing] = await pool.query('SELECT id FROM agents WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Validate required fields
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Normalize image paths: reject Windows absolute paths
    let normalizedProfilePhoto = profile_photo !== undefined ? (profile_photo ? profile_photo.trim() : null) : undefined;
    let normalizedImage = image !== undefined ? (image ? image.trim() : null) : undefined;
    
    if (normalizedProfilePhoto !== undefined && normalizedProfilePhoto && (normalizedProfilePhoto.includes(':\\') || normalizedProfilePhoto.startsWith('file://') || normalizedProfilePhoto.startsWith('C:\\'))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile_photo path. Use relative path like /uploads/agents/filename.jpg or full URL'
      });
    }
    if (normalizedImage !== undefined && normalizedImage && (normalizedImage.includes(':\\') || normalizedImage.startsWith('file://') || normalizedImage.startsWith('C:\\'))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image path. Use relative path like /uploads/agents/filename.jpg or full URL'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (user_id !== undefined) {
      updates.push('user_id = ?');
      values.push(user_id || null);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title || null);
    }
    if (specialty !== undefined) {
      updates.push('specialty = ?');
      values.push(specialty || null);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city || null);
    }
    if (languages !== undefined) {
      updates.push('languages = ?');
      values.push(languages || null);
    }
    if (specialization !== undefined) {
      updates.push('specialization = ?');
      values.push(specialization || null);
    }
    if (company !== undefined) {
      updates.push('company = ?');
      values.push(company || null);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (whatsapp !== undefined) {
      updates.push('whatsapp = ?');
      values.push(whatsapp || null);
    }
    if (normalizedProfilePhoto !== undefined) {
      updates.push('profile_photo = ?');
      values.push(normalizedProfilePhoto);
    }
    if (normalizedImage !== undefined) {
      updates.push('image = ?');
      values.push(normalizedImage);
    }
    if (experience !== undefined) {
      updates.push('experience = ?');
      values.push(experience || 0);
    }
    if (rating !== undefined) {
      updates.push('rating = ?');
      values.push(rating || 0);
    }
    if (reviews !== undefined) {
      updates.push('reviews = ?');
      values.push(reviews || 0);
    }
    if (sales !== undefined) {
      updates.push('sales = ?');
      values.push(sales || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    await pool.query(`
      UPDATE agents 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);

    // If user_id was updated, also update users.agent_id
    if (req.body.user_id !== undefined) {
      const newUserId = req.body.user_id || null;
      // Remove old link
      await pool.query('UPDATE users SET agent_id = NULL WHERE agent_id = ?', [id]);
      // Create new link if user_id provided
      if (newUserId) {
        await pool.query('UPDATE users SET agent_id = ? WHERE id = ?', [id, newUserId]);
      }
    }

    // Get updated agent
    const [agents] = await pool.query('SELECT * FROM agents WHERE id = ?', [id]);

    res.json({
      success: true,
      data: agents[0],
      message: 'Agent updated successfully'
    });
  } catch (error) {
    console.error('Update agent error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update agent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get properties by agent
router.get('/:id/properties', async (req, res, next) => {
  try {
    const { id } = req.params;
    const agentId = parseInt(id);

    if (isNaN(agentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID'
      });
    }

    const [properties] = await pool.query(`
      SELECT 
        p.*,
        a.id AS agent_id,
        a.name AS agent_name,
        a.title AS agent_title,
        COALESCE(a.profile_photo, a.image) AS agent_photo,
        a.phone AS agent_phone,
        a.whatsapp AS agent_whatsapp,
        GROUP_CONCAT(pi.url ORDER BY pi.sort_order ASC SEPARATOR ',') as image_urls
      FROM properties p
      JOIN agents a ON a.id = p.agent_id
      LEFT JOIN property_images pi ON p.id = pi.property_id
      WHERE p.agent_id = ? AND p.is_published = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [agentId]);

    // Format properties
    const formattedProperties = properties.map(property => {
      const images = property.image_urls ? property.image_urls.split(',') : [];
      
      // Parse amenities JSON if it's a string
      let amenities = [];
      if (property.amenities) {
        if (typeof property.amenities === 'string') {
          try {
            amenities = JSON.parse(property.amenities);
          } catch (e) {
            amenities = [];
          }
        } else if (Array.isArray(property.amenities)) {
          amenities = property.amenities;
        }
      }

      return {
        id: property.id,
        slug: property.slug,
        title: property.title,
        type: property.type,
        purpose: property.purpose,
        price: parseFloat(property.price),
        currency: property.currency || 'USD',
        rent_period: property.rent_period,
        beds: property.beds,
        baths: property.baths,
        area: property.area ? parseFloat(property.area) : null,
        area_unit: property.area_unit || 'sqm',
        location: property.location,
        city: property.city,
        description: property.description,
        amenities: amenities,
        agent_id: property.agent_id,
        agent_name: property.agent_name,
        agent_title: property.agent_title,
        agent_photo: property.agent_photo,
        agent_phone: property.agent_phone,
        whatsapp: property.agent_whatsapp,
        latitude: property.latitude ? parseFloat(property.latitude) : null,
        longitude: property.longitude ? parseFloat(property.longitude) : null,
        is_featured: property.is_featured === 1,
        images: images,
      };
    });

    res.json({
      success: true,
      data: formattedProperties
    });
  } catch (error) {
    console.error('Get agent properties error:', error);
    next(error);
  }
});

// Delete agent (admin only)
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if agent exists
    const [existing] = await pool.query('SELECT id FROM agents WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Delete agent
    await pool.query('DELETE FROM agents WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    next(error);
  }
});

module.exports = router;
