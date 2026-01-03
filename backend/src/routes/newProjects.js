const express = require('express');
const pool = require('../config/database');

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

// Get all projects (public)
router.get('/', async (req, res, next) => {
  try {
    const { location, status, category, beds, handover, paymentPlan, completion } = req.query;

    let query = `
      SELECT 
        np.*,
        GROUP_CONCAT(pi.url ORDER BY pi.sort_order ASC SEPARATOR ',') as image_urls
      FROM new_projects np
      LEFT JOIN project_images pi ON np.id = pi.project_id
      WHERE np.is_published = 1
    `;
    const params = [];

    if (location) {
      query += ` AND np.location LIKE ?`;
      params.push(`%${location}%`);
    }
    if (status) {
      query += ` AND np.status = ?`;
      params.push(status);
    }
    if (category) {
      query += ` AND np.category = ?`;
      params.push(category);
    }
    if (beds) {
      query += ` AND np.beds >= ?`;
      params.push(parseInt(beds));
    }
    if (handover) {
      query += ` AND np.handover LIKE ?`;
      params.push(`%${handover}%`);
    }
    if (paymentPlan) {
      query += ` AND np.payment_plan_label LIKE ?`;
      params.push(`%${paymentPlan}%`);
    }
    if (completion) {
      query += ` AND np.completion_percent >= ?`;
      params.push(parseInt(completion));
    }

    query += ` GROUP BY np.id ORDER BY np.created_at DESC`;

    const [projects] = await pool.query(query, params);

    // Format projects
    const formattedProjects = projects.map(project => {
      const images = project.image_urls ? project.image_urls.split(',') : [];
      return {
        id: project.id,
        slug: project.slug,
        name: project.name,
        developer: project.developer,
        location: project.location,
        status: project.status,
        handover: project.handover,
        launchPrice: project.launch_price,
        paymentPlanLabel: project.payment_plan_label,
        description: project.description,
        category: project.category,
        beds: project.beds,
        baths: project.baths,
        completionPercent: project.completion_percent,
        images: images,
        tags: project.status === 'Ready' ? ['Ready'] : ['Off-Plan']
      };
    });

    // Return array directly (normalized response)
    res.json(formattedProjects);
  } catch (error) {
    console.error('Get projects error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

// Get project by slug (public)
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [projects] = await pool.query(
      'SELECT * FROM new_projects WHERE slug = ? AND is_published = 1',
      [slug]
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
      [project.id]
    );
    project.images = images.map(img => img.url);

    // Get payment milestones
    const [milestones] = await pool.query(
      'SELECT label, percent, note FROM project_payment_milestones WHERE project_id = ? ORDER BY sort_order ASC',
      [project.id]
    );
    project.paymentPlan = milestones.map(m => ({
      label: m.label,
      percent: parseFloat(m.percent),
      note: m.note
    }));

    // Format response
    const formattedProject = {
      id: project.id,
      slug: project.slug,
      name: project.name,
      developer: project.developer,
      location: project.location,
      status: project.status,
      handover: project.handover,
      launchPrice: project.launch_price,
      paymentPlanLabel: project.payment_plan_label,
      description: project.description,
      category: project.category,
      beds: project.beds,
      baths: project.baths,
      completionPercent: project.completion_percent,
      images: project.images,
      paymentPlan: project.paymentPlan,
      tags: project.status === 'Ready' ? ['Ready'] : ['Off-Plan']
    };

    // Return object directly (normalized response)
    res.json(formattedProject);
  } catch (error) {
    console.error('Get project by slug error:', error);
    const tableError = handleTableError(error, res);
    if (tableError) return tableError;
    next(error);
  }
});

module.exports = router;

