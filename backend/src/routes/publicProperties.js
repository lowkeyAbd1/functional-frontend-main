const express = require('express');
const pool = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

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

// Get all properties (public - published only, OR admin sees all, OR agent sees their own)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { purpose, type, minPrice, maxPrice, beds, baths, location, city } = req.query;
    
    // Debug logging
    const userRole = req.user?.role || 'public';
    const userId = req.user?.id || null;
    console.log("USER ROLE:", userRole);
    console.log("USER ID:", userId);

    let query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.type,
        p.purpose,
        p.price,
        p.currency,
        p.rent_period,
        p.beds,
        p.baths,
        p.area,
        p.area_unit,
        p.location,
        p.city,
        p.description,
        p.amenities,
        p.latitude,
        p.longitude,
        p.is_featured,
        p.is_published,
        p.created_at,
        p.updated_at,
        GROUP_CONCAT(pi.url ORDER BY pi.sort_order ASC SEPARATOR ',') as image_urls,
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
    
    // Role-based filtering
    if (userRole === 'admin') {
      // Admin sees ALL properties (no filter)
      // No WHERE condition needed for admin
    } else if (userRole === 'agent') {
      // Agent sees their own properties OR published properties
      const [agentRows] = await pool.query(
        `SELECT id FROM agents WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      if (agentRows.length > 0) {
        // Agent can see their own properties (even if not published) OR published properties
        whereConditions.push(`(p.agent_id = ? OR p.is_published = 1)`);
        params.push(agentRows[0].id);
      } else {
        // Agent without profile sees only published
        whereConditions.push(`p.is_published = 1`);
      }
    } else {
      // Public users see only published properties
      whereConditions.push(`p.is_published = 1`);
    }
    
    // Add filter conditions
    if (purpose) {
      whereConditions.push(`p.purpose = ?`);
      params.push(purpose);
    }
    if (type) {
      whereConditions.push(`p.type = ?`);
      params.push(type);
    }
    if (minPrice) {
      whereConditions.push(`p.price >= ?`);
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereConditions.push(`p.price <= ?`);
      params.push(parseFloat(maxPrice));
    }
    if (beds) {
      whereConditions.push(`p.beds >= ?`);
      params.push(parseInt(beds));
    }
    if (baths) {
      whereConditions.push(`p.baths >= ?`);
      params.push(parseInt(baths));
    }
    if (location) {
      whereConditions.push(`p.location LIKE ?`);
      params.push(`%${location}%`);
    }
    if (city) {
      whereConditions.push(`p.city LIKE ?`);
      params.push(`%${city}%`);
    }
    
    // Add WHERE clause if we have any conditions
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` GROUP BY p.id ORDER BY p.is_featured DESC, p.created_at DESC`;

    // Detailed logging before query
    console.log('\n=== PROPERTIES REQUEST ===');
    console.log('USER ROLE:', userRole);
    console.log('USER ID:', userId);
    console.log('FINAL QUERY:', query);
    console.log('QUERY PARAMS:', JSON.stringify(params));
    
    const [properties] = await pool.query(query, params);
    
    // Debug logging after query
    console.log('PROPERTIES COUNT:', properties.length);
    console.log('==========================\n');

    // Format properties
    const formattedProperties = properties.map(property => {
      // Handle images - convert comma-separated string to array
      let images = [];
      if (property.image_urls) {
        if (typeof property.image_urls === 'string') {
          images = property.image_urls.split(',').map(url => url.trim()).filter(url => url);
        } else if (Array.isArray(property.image_urls)) {
          images = property.image_urls;
        }
      }
      
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
        agent_name: property.agent_name, // From JOIN agents table
        agent_title: property.agent_title, // From JOIN agents table
        agent_photo: property.agent_photo, // From JOIN agents table
        agent_phone: property.agent_phone, // From JOIN agents table
        agent_whatsapp: property.agent_whatsapp, // From JOIN agents table
        whatsapp: property.agent_whatsapp || null, // Legacy fallback for compatibility
        latitude: property.latitude ? parseFloat(property.latitude) : null,
        longitude: property.longitude ? parseFloat(property.longitude) : null,
        is_featured: property.is_featured === 1,
        images: images, // Always return as array
      };
    });

    // Return array directly (normalized response)
    res.json(formattedProperties);
  } catch (error) {
    console.error('Get properties error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Get property by slug or id (public)
router.get('/:slugOrId', async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const isId = /^\d+$/.test(slugOrId);

    console.log('[Property Details] Request:', { slugOrId, isId });

    // Use id if numeric, otherwise use slug - JOIN with agents
    // Try both ID and slug lookup for better compatibility
    const [properties] = await pool.query(
      isId
        ? `SELECT p.id,
                  p.title,
                  p.slug,
                  p.type,
                  p.purpose,
                  p.price,
                  p.currency,
                  p.rent_period,
                  p.beds,
                  p.baths,
                  p.area,
                  p.area_unit,
                  p.location,
                  p.city,
                  p.description,
                  p.amenities,
                  p.latitude,
                  p.longitude,
                  p.is_featured,
                  p.is_published,
                  p.created_at,
                  p.updated_at,
                  a.id AS agent_id,
                  a.name AS agent_name,
                  a.title AS agent_title,
                  COALESCE(a.profile_photo, a.image) AS agent_photo,
                  a.phone AS agent_phone,
                  a.whatsapp AS agent_whatsapp
           FROM properties p
           LEFT JOIN agents a ON a.id = p.agent_id
           WHERE (p.id = ? OR LOWER(p.slug) = LOWER(?)) AND p.is_published = 1
           ORDER BY p.id = ? DESC
           LIMIT 1`
        : `SELECT p.id,
                  p.title,
                  p.slug,
                  p.type,
                  p.purpose,
                  p.price,
                  p.currency,
                  p.rent_period,
                  p.beds,
                  p.baths,
                  p.area,
                  p.area_unit,
                  p.location,
                  p.city,
                  p.description,
                  p.amenities,
                  p.latitude,
                  p.longitude,
                  p.is_featured,
                  p.is_published,
                  p.created_at,
                  p.updated_at,
                  a.id AS agent_id,
                  a.name AS agent_name,
                  a.title AS agent_title,
                  COALESCE(a.profile_photo, a.image) AS agent_photo,
                  a.phone AS agent_phone,
                  a.whatsapp AS agent_whatsapp
           FROM properties p
           LEFT JOIN agents a ON a.id = p.agent_id
           WHERE LOWER(p.slug) = LOWER(?) AND p.is_published = 1
           LIMIT 1`,
      isId ? [slugOrId, slugOrId, slugOrId] : [slugOrId]
    );

    console.log('[Property Details] Query result:', { 
      found: properties.length, 
      slug: slugOrId,
      firstProperty: properties[0] ? { id: properties[0].id, slug: properties[0].slug, is_published: properties[0].is_published } : null
    });

    if (properties.length === 0) {
      // Debug: Check if property exists but not published
      const [checkExists] = await pool.query(
        `SELECT id, slug, is_published FROM properties WHERE LOWER(slug) = LOWER(?) OR id = ? LIMIT 1`,
        [slugOrId, slugOrId]
      );
      console.log('[Property Details] Exists check:', checkExists);
      
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        debug: {
          searched: slugOrId,
          exists: checkExists.length > 0,
          published: checkExists.length > 0 ? checkExists[0].is_published : null
        }
      });
    }

    const property = properties[0];

    // Get images
    const [images] = await pool.query(
      'SELECT id, url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC',
      [property.id]
    );
    property.images = images.map(img => img.url);

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

    // Format response
    const formattedProperty = {
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
      agent_name: property.agent_name, // From JOIN agents table
      agent_title: property.agent_title, // From JOIN agents table
      agent_photo: property.agent_photo, // From JOIN agents table
      agent_phone: property.agent_phone, // From JOIN agents table
      agent_whatsapp: property.agent_whatsapp, // From JOIN agents table
      whatsapp: property.agent_whatsapp || null, // Legacy fallback for compatibility
      latitude: property.latitude ? parseFloat(property.latitude) : null,
      longitude: property.longitude ? parseFloat(property.longitude) : null,
      is_featured: property.is_featured === 1,
      images: property.images,
    };

    // Return wrapped response for consistency
    res.json({
      success: true,
      data: formattedProperty
    });
  } catch (error) {
    console.error('Get property by slug error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

module.exports = router;

