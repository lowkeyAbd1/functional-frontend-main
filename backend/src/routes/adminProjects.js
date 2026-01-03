const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/projects');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
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
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Get all projects (admin)
router.get('/', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        np.*,
        COUNT(DISTINCT pi.id) as image_count
      FROM new_projects np
      LEFT JOIN project_images pi ON np.id = pi.project_id
    `;
    const params = [];

    if (search) {
      query += ` WHERE np.name LIKE ? OR np.developer LIKE ? OR np.location LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY np.id ORDER BY np.updated_at DESC`;

    const [projects] = await pool.query(query, params);

    // Get images for each project
    for (const project of projects) {
      const [images] = await pool.query(
        'SELECT id, url, sort_order FROM project_images WHERE project_id = ? ORDER BY sort_order ASC',
        [project.id]
      );
      project.images = images;
    }

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('=== GET ADMIN PROJECTS ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    console.error('Stack:', error.stack);
    
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch projects',
      error: error.sqlMessage || error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get single project (admin)
router.get('/:id', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const [projects] = await pool.query(
      'SELECT * FROM new_projects WHERE id = ?',
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Get images
    const [images] = await pool.query(
      'SELECT id, url, sort_order FROM project_images WHERE project_id = ? ORDER BY sort_order ASC',
      [id]
    );
    project.images = images.map(img => img.url);

    // Get payment milestones
    const [milestones] = await pool.query(
      'SELECT id, label, percent, note, sort_order FROM project_payment_milestones WHERE project_id = ? ORDER BY sort_order ASC',
      [id]
    );
    project.paymentPlan = milestones;

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Create project (admin)
router.post('/', authenticate, authorizeRoles('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('developer').trim().notEmpty().withMessage('Developer is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('status').optional().isIn(['Under Construction', 'Ready']),
  body('handover').optional().isLength({ max: 50 }),
  body('launch_price').optional().isLength({ max: 50 }),
  body('payment_plan_label').optional().isLength({ max: 20 }),
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
      name,
      slug,
      developer,
      location,
      status,
      handover,
      launch_price,
      payment_plan_label,
      description,
      category,
      beds,
      baths,
      completion_percent,
      is_published,
      paymentPlan,
      images
    } = req.body;

    // Validate required fields
    if (!name || !developer || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, developer, and location are required'
      });
    }

    // Generate slug if not provided
    const projectSlug = slug || generateSlug(name);
    if (!projectSlug) {
      return res.status(400).json({
        success: false,
        message: 'Unable to generate slug from project name'
      });
    }

    // Validate and normalize numeric fields
    let normalizedBeds = null;
    if (beds !== undefined && beds !== null && beds !== '') {
      normalizedBeds = parseInt(beds);
      if (isNaN(normalizedBeds) || normalizedBeds < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid beds value. Must be a positive number.'
        });
      }
    }

    let normalizedBaths = null;
    if (baths !== undefined && baths !== null && baths !== '') {
      normalizedBaths = parseInt(baths);
      if (isNaN(normalizedBaths) || normalizedBaths < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid baths value. Must be a positive number.'
        });
      }
    }

    let normalizedCompletion = null;
    if (completion_percent !== undefined && completion_percent !== null && completion_percent !== '') {
      normalizedCompletion = parseInt(completion_percent);
      if (isNaN(normalizedCompletion) || normalizedCompletion < 0 || normalizedCompletion > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid completion_percent value. Must be a number between 0 and 100.'
        });
      }
    }

    // Validate status
    const validStatus = status || 'Under Construction';
    if (!['Under Construction', 'Ready'].includes(validStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Under Construction" or "Ready".'
      });
    }

    // Check if slug already exists
    const [existing] = await pool.query(
      'SELECT id FROM new_projects WHERE slug = ?',
      [projectSlug]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A project with this slug already exists'
      });
    }

    // Validate payment plan before inserting project
    if (paymentPlan && Array.isArray(paymentPlan) && paymentPlan.length > 0) {
      // Validate payment plan milestones
      for (const m of paymentPlan) {
        if (!m.label || m.label.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'Payment plan milestone label is required'
          });
        }
        const p = Number(m.percent);
        if (!Number.isFinite(p) || p < 0 || p > 100) {
          return res.status(400).json({
            success: false,
            message: `Invalid payment plan percent: ${m.percent}. Must be between 0 and 100.`
          });
        }
        m.percent = p;
      }

      // Validate total equals 100
      const total = paymentPlan.reduce((s, m) => s + m.percent, 0);
      if (total !== 100) {
        return res.status(400).json({
          success: false,
          message: `Payment plan must total 100%. Current total: ${total}%`
        });
      }
    }

    // Insert project
    const [result] = await pool.query(`
      INSERT INTO new_projects (
        name, slug, developer, location, status, handover, launch_price,
        payment_plan_label, description, category, beds, baths, completion_percent, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      projectSlug,
      developer,
      location,
      validStatus,
      handover || null,
      launch_price || null,
      payment_plan_label || null,
      description || null,
      category || null,
      normalizedBeds,
      normalizedBaths,
      normalizedCompletion,
      is_published !== undefined ? (is_published ? 1 : 0) : 1
    ]);

    const projectId = result.insertId;

    // Insert images (handle empty array)
    if (images && Array.isArray(images) && images.length > 0) {
      const imageValues = images
        .filter(img => img && (img.url || img)) // Filter out null/undefined
        .map((img, index) => [
          projectId,
          img.url || img,
          index
        ]);
      
      if (imageValues.length > 0) {
        await pool.query(
          'INSERT INTO project_images (project_id, url, sort_order) VALUES ?',
          [imageValues]
        );
      }
    }

    // Insert payment milestones
    if (paymentPlan && Array.isArray(paymentPlan) && paymentPlan.length > 0) {
      const milestoneValues = paymentPlan.map((milestone, index) => [
        projectId,
        milestone.label,
        milestone.percent,
        milestone.note || null,
        index
      ]);
      await pool.query(
        'INSERT INTO project_payment_milestones (project_id, label, percent, note, sort_order) VALUES ?',
        [milestoneValues]
      );
    }

    res.status(201).json({
      success: true,
      data: { id: projectId },
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project error:', error);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Handle MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'A project with this slug or name already exists'
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
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Update project (admin)
router.put('/:id', authenticate, authorizeRoles('admin'), [
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['Under Construction', 'Ready']),
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
      name,
      slug,
      developer,
      location,
      status,
      handover,
      launch_price,
      payment_plan_label,
      description,
      category,
      beds,
      baths,
      completion_percent,
      is_published,
      paymentPlan,
      images
    } = req.body;

    // Check if project exists
    const [existing] = await pool.query(
      'SELECT id FROM new_projects WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check slug uniqueness if changed
    if (slug) {
      const [slugCheck] = await pool.query(
        'SELECT id FROM new_projects WHERE slug = ? AND id != ?',
        [slug, id]
      );
      if (slugCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'A project with this slug already exists'
        });
      }
    }

    // Update project
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) updateFields.push('name = ?'), updateValues.push(name);
    if (slug !== undefined) updateFields.push('slug = ?'), updateValues.push(slug);
    if (developer !== undefined) updateFields.push('developer = ?'), updateValues.push(developer);
    if (location !== undefined) updateFields.push('location = ?'), updateValues.push(location);
    if (status !== undefined) updateFields.push('status = ?'), updateValues.push(status);
    if (handover !== undefined) updateFields.push('handover = ?'), updateValues.push(handover);
    if (launch_price !== undefined) updateFields.push('launch_price = ?'), updateValues.push(launch_price);
    if (payment_plan_label !== undefined) updateFields.push('payment_plan_label = ?'), updateValues.push(payment_plan_label);
    if (description !== undefined) updateFields.push('description = ?'), updateValues.push(description);
    if (category !== undefined) updateFields.push('category = ?'), updateValues.push(category);
    if (beds !== undefined) updateFields.push('beds = ?'), updateValues.push(beds);
    if (baths !== undefined) updateFields.push('baths = ?'), updateValues.push(baths);
    if (completion_percent !== undefined) updateFields.push('completion_percent = ?'), updateValues.push(completion_percent);
    if (is_published !== undefined) updateFields.push('is_published = ?'), updateValues.push(is_published);

    if (updateFields.length > 0) {
      await pool.query(
        `UPDATE new_projects SET ${updateFields.join(', ')} WHERE id = ?`,
        [...updateValues, id]
      );
    }

    // Update images if provided
    if (images !== undefined && Array.isArray(images)) {
      // Delete existing images
      await pool.query('DELETE FROM project_images WHERE project_id = ?', [id]);
      // Insert new images
      if (images.length > 0) {
        const imageValues = images.map((img, index) => [
          id,
          typeof img === 'string' ? img : (img.url || img),
          index
        ]);
        await pool.query(
          'INSERT INTO project_images (project_id, url, sort_order) VALUES ?',
          [imageValues]
        );
      }
    }

    // Update payment milestones if provided
    if (paymentPlan !== undefined && Array.isArray(paymentPlan)) {
      // Delete existing milestones
      await pool.query('DELETE FROM project_payment_milestones WHERE project_id = ?', [id]);
      // Insert new milestones
      if (paymentPlan.length > 0) {
        // Validate payment plan milestones
        for (const m of paymentPlan) {
          const p = Number(m.percent);
          if (!Number.isFinite(p) || p < 0 || p > 100) {
            return res.status(400).json({
              success: false,
              message: `Invalid payment plan percent: ${m.percent}. Must be between 0 and 100.`
            });
          }
          m.percent = p;
        }

        // Validate total equals 100
        const total = paymentPlan.reduce((s, m) => s + m.percent, 0);
        if (total !== 100) {
          return res.status(400).json({
            success: false,
            message: `Payment plan must total 100%. Current total: ${total}%`
          });
        }

        const milestoneValues = paymentPlan.map((milestone, index) => [
          id,
          milestone.label,
          milestone.percent,
          milestone.note || null,
          index
        ]);
        await pool.query(
          'INSERT INTO project_payment_milestones (project_id, label, percent, note, sort_order) VALUES ?',
          [milestoneValues]
        );
      }
    }

    res.json({
      success: true,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Update project error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Delete project (admin)
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM new_projects WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete project (cascade will delete images and milestones)
    await pool.query('DELETE FROM new_projects WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Upload images (admin)
router.post('/:id/images', authenticate, authorizeRoles('admin'), upload.array('images', 10), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const imageUrls = req.files.map(file => `/uploads/projects/${file.filename}`);

    // Get current max sort_order
    const [currentImages] = await pool.query(
      'SELECT MAX(sort_order) as max_order FROM project_images WHERE project_id = ?',
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
      'INSERT INTO project_images (project_id, url, sort_order) VALUES ?',
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
router.delete('/:id/images/:imageId', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    // Get image URL to delete file
    const [images] = await pool.query(
      'SELECT url FROM project_images WHERE id = ? AND project_id = ?',
      [imageId, id]
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
      'DELETE FROM project_images WHERE id = ? AND project_id = ?',
      [imageId, id]
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

