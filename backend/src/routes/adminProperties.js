const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/properties');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to handle missing table errors
const handleTableError = (error, res) => {
  if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
    return res.status(500).json({
      success: false,
      message: 'Database table missing. Please run database migration: npm run db:migrate',
      error: error.message
    });
  }
  return null;
};

// Get all properties (admin) OR agent's own properties (agent)
router.get('/', authenticate, authorizeRoles('admin', 'agent'), async (req, res, next) => {
  try {
    const { search } = req.query;
    
    // Debug logging
    console.log("USER ROLE:", req.user?.role);
    console.log("USER ID:", req.user?.id);
    
    let query = `
      SELECT 
        p.*,
        COUNT(DISTINCT pi.id) as image_count,
        a.id AS agent_id,
        a.name AS agent_name,
        a.title AS agent_title,
        COALESCE(a.profile_photo, a.image) AS agent_photo,
        a.phone AS agent_phone,
        a.whatsapp AS agent_whatsapp
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      LEFT JOIN agents a ON a.id = p.agent_id
    `;
    const params = [];
    const whereConditions = [];

    // Agents can see their own properties OR published properties
    // Admin sees ALL properties (including those without agent_id)
    if (req.user?.role === 'agent') {
      // Try to find agent by user_id first
      const [agentRows] = await pool.query(
        `SELECT id, name FROM agents WHERE user_id = ? LIMIT 1`,
        [req.user.id]
      );
      
      console.log("=== AGENT PROPERTY VISIBILITY CHECK ===");
      console.log("USER ID:", req.user.id);
      console.log("USER NAME:", req.user.name);
      console.log("USER EMAIL:", req.user.email);
      console.log("AGENT LOOKUP BY USER_ID:", req.user.id, "Found:", agentRows.length);
      
      if (agentRows.length > 0) {
        // Agent has profile - can see their own properties (even if not published) OR published properties
        whereConditions.push('(p.agent_id = ? OR p.is_published = 1)');
        params.push(agentRows[0].id);
        console.log("Using agent_id from user_id match:", agentRows[0].id, "Agent name:", agentRows[0].name);
        console.log("Query will show: properties with agent_id=" + agentRows[0].id + " OR is_published=1");
      } else {
        // Try to find by matching user name with agent name (with better matching)
        // Try exact match first
        let [agentByName] = await pool.query(
          `SELECT id, name FROM agents WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1`,
          [req.user.name]
        );
        
        // If not found, try partial match (contains)
        if (agentByName.length === 0) {
          [agentByName] = await pool.query(
            `SELECT id, name FROM agents WHERE LOWER(TRIM(name)) LIKE LOWER(TRIM(?)) OR LOWER(TRIM(?)) LIKE LOWER(TRIM(name)) LIMIT 1`,
            [`%${req.user.name}%`, `%${req.user.name}%`]
          );
        }
        
        console.log("AGENT LOOKUP BY NAME:", req.user.name, "Found:", agentByName.length);
        if (agentByName.length > 0) {
          console.log("Matched agent:", agentByName[0].name, "ID:", agentByName[0].id);
        }
        
        if (agentByName.length > 0) {
          // Agent found by name - auto-link for future requests
          const agentId = agentByName[0].id;
          try {
            await pool.query('UPDATE agents SET user_id = ? WHERE id = ?', [req.user.id, agentId]);
            await pool.query('UPDATE users SET agent_id = ? WHERE id = ?', [agentId, req.user.id]);
            console.log("Auto-linked agent profile to user:", agentId, "->", req.user.id);
          } catch (linkError) {
            console.warn("Could not auto-link agent profile:", linkError.message);
          }
          
          // Agent found by name - can see their own properties (even if not published) OR published properties
          whereConditions.push('(p.agent_id = ? OR p.is_published = 1)');
          params.push(agentId);
          console.log("Using agent_id from name match:", agentId);
          console.log("Query will show: properties with agent_id=" + agentId + " OR is_published=1");
        } else {
          // Agent has no profile - still show published properties
          console.log("WARNING: Agent user has no agent profile linked");
          console.log("User name:", req.user.name);
          console.log("Showing published properties only (agent's own unpublished properties will not appear)");
          
          // Debug: Check what properties exist
          const [allProperties] = await pool.query(
            `SELECT id, title, agent_id, is_published FROM properties LIMIT 10`
          );
          console.log("Sample properties in DB:", allProperties);
          
          whereConditions.push('p.is_published = 1');
        }
      }
      console.log("========================================");
    }
    // Admin sees all properties - no filter needed

    if (search) {
      whereConditions.push(`(p.title LIKE ? OR p.location LIKE ? OR p.city LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` GROUP BY p.id ORDER BY p.updated_at DESC`;

    console.log('\n=== EXECUTING ADMIN PROPERTIES QUERY ===');
    console.log('FINAL QUERY:', query);
    console.log('QUERY PARAMS:', JSON.stringify(params));
    const [properties] = await pool.query(query, params);
    console.log("PROPERTIES COUNT:", properties.length);
    if (properties.length > 0) {
      console.log("Sample property IDs:", properties.slice(0, 5).map(p => ({ id: p.id, title: p.title, agent_id: p.agent_id, is_published: p.is_published })));
    } else {
      // Debug: Check what properties exist for this agent
      if (req.user?.role === 'agent') {
        const [agentCheck] = await pool.query(
          `SELECT id, name FROM agents WHERE user_id = ? OR LOWER(TRIM(name)) LIKE LOWER(TRIM(?)) LIMIT 1`,
          [req.user.id, `%${req.user.name}%`]
        );
        if (agentCheck.length > 0) {
          const [agentProperties] = await pool.query(
            `SELECT id, title, agent_id, is_published FROM properties WHERE agent_id = ?`,
            [agentCheck[0].id]
          );
          console.log("DEBUG: Properties for agent", agentCheck[0].name, "ID", agentCheck[0].id, ":", agentProperties.length);
          if (agentProperties.length > 0) {
            console.log("DEBUG: Agent's properties:", agentProperties);
          }
        }
      }
    }
    console.log("==========================================\n");

    // Get images for each property
    for (const property of properties) {
      const [images] = await pool.query(
        'SELECT id, url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC',
        [property.id]
      );
      // Format images as array of URLs (strings)
      property.images = images.map(img => img.url);
      // Also keep full image objects for compatibility
      property.imageObjects = images;
    }

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('=== GET ADMIN PROPERTIES ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    console.error('Stack:', error.stack);
    
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch properties',
      error: error.sqlMessage || error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get single property (admin) OR agent's own property (agent)
router.get('/:id', authenticate, authorizeRoles('admin', 'agent'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const [properties] = await pool.query(
      `SELECT p.*,
              a.id AS agent_id,
              a.name AS agent_name,
              a.title AS agent_title,
              COALESCE(a.profile_photo, a.image) AS agent_photo,
              a.phone AS agent_phone,
              a.whatsapp AS agent_whatsapp
       FROM properties p
       LEFT JOIN agents a ON a.id = p.agent_id
       WHERE p.id = ?`,
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Agents can only access their own properties
    if (req.user?.role === 'agent') {
      const [agentRows] = await pool.query(
        `SELECT id FROM agents WHERE user_id = ? LIMIT 1`,
        [req.user.id]
      );
      if (agentRows.length === 0 || properties[0].agent_id !== agentRows[0].id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own properties.'
        });
      }
    }

    const property = properties[0];

    // Get images
    const [images] = await pool.query(
      'SELECT id, url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC',
      [id]
    );
    property.images = images.map(img => img.url);

    // Parse amenities JSON if it's a string
    if (property.amenities && typeof property.amenities === 'string') {
      try {
        property.amenities = JSON.parse(property.amenities);
      } catch (e) {
        property.amenities = [];
      }
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Get property error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Create property (AGENT ONLY)
router.post('/', authenticate, authorizeRoles('agent'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['Apartment','Villa','House','Land','Office','Shop']),
  body('purpose').isIn(['Rent','Sale']),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('location').trim().notEmpty().withMessage('Location is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      slug,
      type,
      purpose,
      price,
      currency,
      rent_period,
      beds,
      baths,
      area,
      area_unit,
      location,
      city,
      description,
      amenities,
      latitude,
      longitude,
      is_featured,
      is_published,
      images
    } = req.body;

    // Validate required fields
    if (!title || !type || !purpose || !price || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, type, purpose, price, and location are required'
      });
    }

    // Generate slug if not provided
    const propertySlug = slug || generateSlug(title);
    if (!propertySlug) {
      return res.status(400).json({
        success: false,
        message: 'Unable to generate slug from property title'
      });
    }

    // Validate and normalize numeric fields (handle both string and number types)
    const normalizedPrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
    if (isNaN(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price value. Must be a positive number.'
      });
    }

    let normalizedBeds = null;
    if (beds !== undefined && beds !== null && beds !== '') {
      normalizedBeds = typeof beds === 'string' ? parseInt(beds) : beds;
      if (isNaN(normalizedBeds) || normalizedBeds < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid beds value. Must be a positive number.'
        });
      }
    }

    let normalizedBaths = null;
    if (baths !== undefined && baths !== null && baths !== '') {
      normalizedBaths = typeof baths === 'string' ? parseInt(baths) : baths;
      if (isNaN(normalizedBaths) || normalizedBaths < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid baths value. Must be a positive number.'
        });
      }
    }

    let normalizedArea = null;
    if (area !== undefined && area !== null && area !== '') {
      normalizedArea = typeof area === 'string' ? parseFloat(area) : area;
      if (isNaN(normalizedArea) || normalizedArea < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid area value. Must be a positive number.'
        });
      }
    }

    // Validate rent_period if purpose is Rent
    if (purpose === 'Rent' && rent_period && !['Monthly','Yearly','Weekly','Daily'].includes(rent_period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rent_period. Must be Monthly, Yearly, Weekly, or Daily.'
      });
    }

    // Check if slug already exists
    const [existing] = await pool.query(
      'SELECT id FROM properties WHERE slug = ?',
      [propertySlug]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A property with this slug already exists'
      });
    }

    // Handle amenities (convert array to JSON string)
    let amenitiesJson = null;
    if (amenities) {
      if (Array.isArray(amenities)) {
        amenitiesJson = JSON.stringify(amenities);
      } else if (typeof amenities === 'string') {
        try {
          JSON.parse(amenities); // Validate JSON
          amenitiesJson = amenities;
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Invalid amenities format. Must be a valid JSON array.'
          });
        }
      }
    }

    // Auto-assign agent_id: if user is agent, derive from user_id; if admin, allow from payload
    let agentId = req.body.agent_id || null;
    
    if (req.user?.role === 'agent') {
      // Agent users: DO NOT trust payload agent_id, derive from token
      const [agentRows] = await pool.query(
        `SELECT id FROM agents WHERE user_id = ? LIMIT 1`,
        [req.user.id]
      );
      if (agentRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No agent profile linked to this user. Please create an agent profile first.'
        });
      }
      agentId = agentRows[0].id;
    } else if (req.user?.role === 'admin' && req.body.agent_id) {
      // Admin users: validate agent_id exists if provided
      const [agentRows] = await pool.query(
        `SELECT id FROM agents WHERE id = ? LIMIT 1`,
        [req.body.agent_id]
      );
      if (agentRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid agent_id'
        });
      }
    }

    // Insert property with agent_id (NO legacy agent columns)
    // Handle case where agent_id column might not exist
    let propertyId;
    try {
      // Try INSERT with agent_id first
      const [result] = await pool.query(`
        INSERT INTO properties (
          agent_id, title, slug, type, purpose, price, currency, rent_period, beds, baths,
          area, area_unit, location, city, description, amenities,
          latitude, longitude, is_featured, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        agentId,
        title,
        propertySlug,
        type,
        purpose,
        normalizedPrice,
        currency || 'USD',
        purpose === 'Rent' ? (rent_period || null) : null,
        normalizedBeds,
        normalizedBaths,
        normalizedArea,
        area_unit || 'sqm',
        location,
        city || null,
        description || null,
        amenitiesJson,
        latitude ? (typeof latitude === 'string' ? parseFloat(latitude) : latitude) : null,
        longitude ? (typeof longitude === 'string' ? parseFloat(longitude) : longitude) : null,
        is_featured ? 1 : 0,
        is_published !== undefined ? (is_published ? 1 : 0) : 1
      ]);
      propertyId = result.insertId;
    } catch (insertError) {
      // If agent_id column doesn't exist, insert without it and update later
      if (insertError.code === 'ER_BAD_FIELD_ERROR' && insertError.sqlMessage?.includes('agent_id')) {
        console.warn('agent_id column not found, inserting without it');
        const [result] = await pool.query(`
          INSERT INTO properties (
            title, slug, type, purpose, price, currency, rent_period, beds, baths,
            area, area_unit, location, city, description, amenities,
            latitude, longitude, is_featured, is_published
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          title,
          propertySlug,
          type,
          purpose,
          normalizedPrice,
          currency || 'USD',
          purpose === 'Rent' ? (rent_period || null) : null,
          normalizedBeds,
          normalizedBaths,
          normalizedArea,
          area_unit || 'sqm',
          location,
          city || null,
          description || null,
          amenitiesJson,
          latitude ? (typeof latitude === 'string' ? parseFloat(latitude) : latitude) : null,
          longitude ? (typeof longitude === 'string' ? parseFloat(longitude) : longitude) : null,
          is_featured ? 1 : 0,
          is_published !== undefined ? (is_published ? 1 : 0) : 1
        ]);
        propertyId = result.insertId;
        
        // Try to update agent_id if column exists
        if (agentId) {
          try {
            await pool.query('UPDATE properties SET agent_id = ? WHERE id = ?', [agentId, propertyId]);
          } catch (updateErr) {
            console.warn('Could not update agent_id:', updateErr.message);
          }
        }
      } else {
        // Re-throw if it's a different error
        throw insertError;
      }
    }

    // Insert images (handle empty array)
    if (images && Array.isArray(images) && images.length > 0) {
      const imageValues = images
        .filter(img => img && (img.url || img)) // Filter out null/undefined
        .map((img, index) => [
          propertyId,
          img.url || img,
          index
        ]);
      
      if (imageValues.length > 0) {
        await pool.query(
          'INSERT INTO property_images (property_id, url, sort_order) VALUES ?',
          [imageValues]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: { id: propertyId },
      message: 'Property created successfully'
    });
  } catch (error) {
    console.error('Create property error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Handle MySQL column errors
    if (error.code === 'ER_BAD_FIELD_ERROR' || error.message?.includes("Unknown column")) {
      return res.status(500).json({
        success: false,
        message: `Database schema mismatch: ${error.sqlMessage || error.message}. Please run migration: backend/src/database/fix_properties_schema_complete.sql`,
        error: error.sqlMessage || error.message,
        code: error.code
      });
    }
    
    // Handle MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'A property with this slug or title already exists'
      });
    }
    
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${error.sqlMessage || 'Unknown field'}`
      });
    }

    // Handle missing table error
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: error.sqlMessage || error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Update property (agent only)
router.put('/:id', authenticate, authorizeRoles('agent'), [
  body('title').optional().trim().notEmpty(),
  body('type').optional().isIn(['Apartment','Villa','House','Land','Office','Shop']),
  body('purpose').optional().isIn(['Rent','Sale']),
  body('price').optional().isNumeric(),
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
    const {
      title,
      slug,
      type,
      purpose,
      price,
      currency,
      rent_period,
      beds,
      baths,
      area,
      area_unit,
      location,
      city,
      description,
      amenities,
      latitude,
      longitude,
      is_featured,
      is_published,
      images
    } = req.body;

    // Check if property exists and verify ownership (if agent)
    const [existing] = await pool.query(
      'SELECT id, agent_id FROM properties WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Security: Agents can only edit their own properties
    const [agentRows] = await pool.query(
      `SELECT id FROM agents WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );
    if (agentRows.length === 0 || existing[0].agent_id !== agentRows[0].id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own properties'
      });
    }

    // Auto-assign agent_id if agent user (cannot change ownership)
    let finalAgentId = existing[0].agent_id;
    if (req.user?.role === 'agent') {
      const [agentRows] = await pool.query(
        `SELECT id FROM agents WHERE user_id = ? LIMIT 1`,
        [req.user.id]
      );
      if (agentRows.length > 0) {
        finalAgentId = agentRows[0].id;
      }
    } else if (req.user?.role === 'admin' && req.body.agent_id) {
      // Admin can change agent_id
      const [agentRows] = await pool.query(
        `SELECT id FROM agents WHERE id = ? LIMIT 1`,
        [req.body.agent_id]
      );
      if (agentRows.length > 0) {
        finalAgentId = req.body.agent_id;
      }
    }

    // Update property
    const updateFields = [];
    const updateValues = [];
    
    // Add agent_id to update if changed
    if (finalAgentId !== existing[0].agent_id) {
      updateFields.push('agent_id = ?');
      updateValues.push(finalAgentId);
    }

    // Generate slug if not provided and title is being updated
    let finalSlug = slug;
    if (!finalSlug && title) {
      finalSlug = generateSlug(title);
    }
    
    // If still no slug, get existing property to generate from current title
    if (!finalSlug) {
      const [current] = await pool.query('SELECT title FROM properties WHERE id = ?', [id]);
      if (current.length > 0 && current[0].title) {
        finalSlug = generateSlug(current[0].title);
      }
    }

    // Check slug uniqueness if slug is provided or generated
    if (finalSlug) {
      const [slugCheck] = await pool.query(
        'SELECT id FROM properties WHERE slug = ? AND id != ?',
        [finalSlug, id]
      );
      if (slugCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'A property with this slug already exists'
        });
      }
      updateFields.push('slug = ?');
      updateValues.push(finalSlug);
    }

    if (title !== undefined) updateFields.push('title = ?'), updateValues.push(title);
    if (type !== undefined) updateFields.push('type = ?'), updateValues.push(type);
    if (purpose !== undefined) updateFields.push('purpose = ?'), updateValues.push(purpose);
    if (price !== undefined) {
      const normalizedPrice = parseFloat(price);
      if (isNaN(normalizedPrice) || normalizedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid price value. Must be a positive number.'
        });
      }
      updateFields.push('price = ?'), updateValues.push(normalizedPrice);
    }
    if (currency !== undefined) updateFields.push('currency = ?'), updateValues.push(currency);
    if (rent_period !== undefined) updateFields.push('rent_period = ?'), updateValues.push(rent_period);
    if (beds !== undefined) {
      const normalizedBeds = beds === null || beds === '' ? null : parseInt(beds);
      updateFields.push('beds = ?'), updateValues.push(normalizedBeds);
    }
    if (baths !== undefined) {
      const normalizedBaths = baths === null || baths === '' ? null : parseInt(baths);
      updateFields.push('baths = ?'), updateValues.push(normalizedBaths);
    }
    if (area !== undefined) {
      const normalizedArea = area === null || area === '' ? null : parseFloat(area);
      updateFields.push('area = ?'), updateValues.push(normalizedArea);
    }
    if (area_unit !== undefined) updateFields.push('area_unit = ?'), updateValues.push(area_unit);
    if (location !== undefined) updateFields.push('location = ?'), updateValues.push(location);
    if (city !== undefined) updateFields.push('city = ?'), updateValues.push(city);
    if (description !== undefined) updateFields.push('description = ?'), updateValues.push(description);
    if (amenities !== undefined) {
      let amenitiesJson = null;
      if (amenities) {
        if (Array.isArray(amenities)) {
          amenitiesJson = JSON.stringify(amenities);
        } else if (typeof amenities === 'string') {
          try {
            JSON.parse(amenities);
            amenitiesJson = amenities;
          } catch (e) {
            return res.status(400).json({
              success: false,
              message: 'Invalid amenities format. Must be a valid JSON array.'
            });
          }
        }
      }
      updateFields.push('amenities = ?'), updateValues.push(amenitiesJson);
    }
    // DO NOT update legacy agent columns (agent_name, agent_phone, whatsapp)
    // Agent info comes from JOIN agents table only
    if (latitude !== undefined) updateFields.push('latitude = ?'), updateValues.push(latitude ? parseFloat(latitude) : null);
    if (longitude !== undefined) updateFields.push('longitude = ?'), updateValues.push(longitude ? parseFloat(longitude) : null);
    if (is_featured !== undefined) updateFields.push('is_featured = ?'), updateValues.push(is_featured ? 1 : 0);
    if (is_published !== undefined) updateFields.push('is_published = ?'), updateValues.push(is_published ? 1 : 0);

    if (updateFields.length > 0) {
      await pool.query(
        `UPDATE properties SET ${updateFields.join(', ')} WHERE id = ?`,
        [...updateValues, id]
      );
    }

    // Update images if provided (only update if explicitly provided in request)
    // This allows us to replace all images with the new set
    if (images !== undefined && Array.isArray(images)) {
      // Get existing images before deleting
      const [existingImages] = await pool.query(
        'SELECT url FROM property_images WHERE property_id = ?',
        [id]
      );
      
      // Delete physical files
      existingImages.forEach(img => {
        if (img.url && img.url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '../..', img.url);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (err) {
              console.error('Error deleting image file:', err);
            }
          }
        }
      });
      
      // Delete from database
      await pool.query('DELETE FROM property_images WHERE property_id = ?', [id]);
      
      // Insert new images
      if (images.length > 0) {
        const imageValues = images
          .filter(img => img && (typeof img === 'string' ? img : (img.url || img)))
          .map((img, index) => [
            id,
            typeof img === 'string' ? img : (img.url || img),
            index
          ]);
        await pool.query(
          'INSERT INTO property_images (property_id, url, sort_order) VALUES ?',
          [imageValues]
        );
      }
    }

    res.json({
      success: true,
      message: 'Property updated successfully'
    });
  } catch (error) {
    console.error('Update property error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Delete property (agent only)
router.delete('/:id', authenticate, authorizeRoles('agent'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id, agent_id FROM properties WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Security: Agents can only delete their own properties
    const [agentRows] = await pool.query(
      `SELECT id FROM agents WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );
    if (agentRows.length === 0 || existing[0].agent_id !== agentRows[0].id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own properties'
      });
    }

    // Delete property (cascade will delete images)
    await pool.query('DELETE FROM properties WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Upload images (agent only)
router.post('/:id/images', authenticate, authorizeRoles('agent'), upload.array('images', 10), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Security: Agents can only upload images to their own properties
    if (req.user?.role === 'agent') {
      const [property] = await pool.query(
        'SELECT agent_id FROM properties WHERE id = ?',
        [id]
      );
      if (property.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      const [agentRows] = await pool.query(
        `SELECT id FROM agents WHERE user_id = ? LIMIT 1`,
        [req.user.id]
      );
      if (agentRows.length === 0 || property[0].agent_id !== agentRows[0].id) {
        return res.status(403).json({
          success: false,
          message: 'You can only upload images to your own properties'
        });
      }
    }

    const imageUrls = req.files.map(file => `/uploads/properties/${file.filename}`);

    // Get current max sort_order
    const [currentImages] = await pool.query(
      'SELECT MAX(sort_order) as max_order FROM property_images WHERE property_id = ?',
      [id]
    );
    const nextOrder = (currentImages[0]?.max_order ?? -1) + 1;

    // Insert images
    const imageValues = imageUrls.map((url, index) => [
      id,
      url,
      nextOrder + index
    ]);
    await pool.query(
      'INSERT INTO property_images (property_id, url, sort_order) VALUES ?',
      [imageValues]
    );

    res.json({
      success: true,
      data: imageUrls,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Upload images error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Delete image (admin)
router.delete('/images/:imageId', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { imageId } = req.params;

    // Get image URL to delete file
    const [images] = await pool.query(
      'SELECT url, property_id FROM property_images WHERE id = ?',
      [imageId]
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete file if it exists locally
    const imageUrl = images[0].url;
    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../..', imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    await pool.query(
      'DELETE FROM property_images WHERE id = ?',
      [imageId]
    );

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

module.exports = router;

