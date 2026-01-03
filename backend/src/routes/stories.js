const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorizeRoles, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/uploadStories');
const path = require('path');

// Get all active stories (public - for Home and Find Agent pages)
router.get('/', async (req, res, next) => {
  try {
    console.log('[Stories API] GET /api/stories called');
    
    // Join agent_stories with agent_story_media and agents
    const [stories] = await pool.query(`
      SELECT 
        s.id as story_id,
        s.agent_id,
        s.created_at,
        s.expires_at,
        m.media_type,
        m.media_url,
        m.thumb_url as thumbnail_url,
        m.duration_sec as duration,
        a.name as agent_name,
        a.title as agent_title,
        a.phone,
        a.whatsapp,
        a.profile_photo,
        a.image
      FROM agent_stories s
      INNER JOIN agent_story_media m ON m.story_id = s.id
      INNER JOIN agents a ON s.agent_id = a.id
      WHERE s.is_active = 1 
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
      ORDER BY s.created_at DESC, m.sort_order ASC
      LIMIT 100
    `);

    // Format response (flatten structure for frontend)
    const formattedStories = stories.map(story => ({
      id: story.story_id,
      story_id: story.story_id,
      agent_id: story.agent_id,
      agent_name: story.agent_name,
      agent_title: story.agent_title,
      phone: story.phone,
      whatsapp: story.whatsapp,
      media_type: story.media_type,
      media_url: story.media_url,
      thumbnail_url: story.thumbnail_url || story.media_url,
      duration: story.duration || 30,
      created_at: story.created_at,
      expires_at: story.expires_at,
      agent_photo: story.profile_photo || story.image
    }));

    console.log(`[Stories API] Returning ${formattedStories.length} stories`);

    res.json({
      success: true,
      data: formattedStories
    });
  } catch (error) {
    // If table doesn't exist, return empty array with helpful message
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('[Stories API] Table does not exist. Run migration: backend/src/database/add_agent_stories.sql');
      return res.json({
        success: true,
        data: [],
        message: 'Database table not found. Please run migration script.'
      });
    }
    console.error('[Stories API] Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get stories for a specific agent (or current logged-in agent if agentId is 0)
router.get('/agent/:agentId', optionalAuth, async (req, res, next) => {
  try {
    let { agentId } = req.params;
    let actualAgentId = parseInt(agentId);

    // If agentId is 0 or not provided, use current logged-in agent
    if (actualAgentId === 0 || !actualAgentId) {
      if (req.user && req.user.role === 'agent') {
        // Try users.agent_id first
        let agentId = req.user.agentId || req.user.agent_id;
        
        // Fallback to agents.user_id
        if (!agentId) {
          const [agents] = await pool.query('SELECT id FROM agents WHERE user_id = ?', [req.user.id]);
          if (agents.length > 0) {
            agentId = agents[0].id;
          }
        }
        
        // Fallback to name match
        if (!agentId) {
          const [agentsByName] = await pool.query(
            'SELECT id FROM agents WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
            [req.user.name]
          );
          if (agentsByName.length > 0) {
            agentId = agentsByName[0].id;
            // Auto-link
            await pool.query('UPDATE users SET agent_id = ? WHERE id = ?', [agentId, req.user.id]);
            await pool.query('UPDATE agents SET user_id = ? WHERE id = ?', [req.user.id, agentId]);
          }
        }
        
        if (!agentId) {
          return res.json({
            success: true,
            data: []
          });
        }
        actualAgentId = agentId;
      } else {
        return res.json({
          success: true,
          data: []
        });
      }
    }

    const [stories] = await pool.query(`
      SELECT 
        s.id as story_id,
        s.agent_id,
        s.created_at,
        s.expires_at,
        m.media_type,
        m.media_url,
        m.thumb_url as thumbnail_url,
        m.duration_sec as duration,
        a.name as agent_name,
        a.title as agent_title,
        a.phone,
        a.whatsapp,
        a.profile_photo,
        a.image
      FROM agent_stories s
      INNER JOIN agent_story_media m ON m.story_id = s.id
      INNER JOIN agents a ON s.agent_id = a.id
      WHERE s.agent_id = ? 
        AND s.is_active = 1
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
      ORDER BY s.created_at DESC, m.sort_order ASC
    `, [actualAgentId]);

    const formattedStories = stories.map(story => ({
      id: story.story_id,
      story_id: story.story_id,
      agent_id: story.agent_id,
      agent_name: story.agent_name,
      agent_title: story.agent_title,
      phone: story.phone,
      whatsapp: story.whatsapp,
      media_type: story.media_type,
      media_url: story.media_url,
      thumbnail_url: story.thumbnail_url || story.media_url,
      duration: story.duration || 30,
      created_at: story.created_at,
      expires_at: story.expires_at,
      agent_photo: story.profile_photo || story.image
    }));

    res.json({
      success: true,
      data: formattedStories
    });
  } catch (error) {
    console.error('Get agent stories error:', error);
    next(error);
  }
});

// Create story (AGENT ONLY - no admin)
router.post('/', authenticate, authorizeRoles('agent'), upload.fields([
  { name: 'media', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { title, project_name, caption, duration, media_type, media_url, thumbnail_url } = req.body;
    
    // Get file from either 'media' or 'file' field
    const files = req.files || {};
    const file = files.media?.[0] || files.file?.[0] || null;

    // Auto-derive agent_id from logged-in user (DO NOT require frontend to send agent_id)
    // Priority: 1) req.user.agentId, 2) req.user.agent_id, 3) lookup by user_id
    let agent_id = req.user.agentId || req.user.agent_id || null;
    
    if (!agent_id) {
      // Lookup agent by user_id (most reliable method)
      const [agentsByUserId] = await conn.query(
        'SELECT id FROM agents WHERE user_id = ? AND is_active = 1 LIMIT 1',
        [req.user.id]
      );
      
      if (agentsByUserId.length > 0) {
        agent_id = agentsByUserId[0].id;
      }
    }

    // Validate agent_id - return 403 if missing
    // Users without linked agent profiles cannot create stories
    if (!agent_id) {
      conn.release();
      return res.status(403).json({
        success: false,
        message: 'No agent profile linked to this user. Please contact admin to create your agent profile.',
        code: 'AGENT_PROFILE_REQUIRED'
      });
    }

    agent_id = parseInt(agent_id);
    if (isNaN(agent_id) || agent_id <= 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID'
      });
    }

    // Determine media URL and type
    let mediaUrl = media_url || null;
    let mediaType = media_type || 'image';
    
    if (file) {
      mediaUrl = `/uploads/stories/${file.filename}`;
      mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    if (!mediaUrl) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Provide media file or URL'
      });
    }

    const finalDuration = Math.min(30, Math.max(1, parseInt(duration) || 30));
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await conn.beginTransaction();

    // Insert ONLY valid columns into agent_stories
    const [storyRes] = await conn.query(
      `INSERT INTO agent_stories (agent_id, title, project_name, caption, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [agent_id, title || null, project_name || null, caption || null, expiresAt]
    );

    const storyId = storyRes.insertId;

    if (!storyId) {
      throw new Error('Failed to get story ID after insert');
    }

    // Insert media into agent_story_media
    await conn.query(
      `INSERT INTO agent_story_media (story_id, media_type, media_url, thumb_url, duration_sec, sort_order)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [storyId, mediaType, mediaUrl, thumbnail_url || null, finalDuration]
    );

    await conn.commit();

    // Get created story with agent info
    const [stories] = await conn.query(`
      SELECT 
        s.id as story_id,
        s.agent_id,
        s.created_at,
        s.expires_at,
        m.media_type,
        m.media_url,
        m.thumb_url as thumbnail_url,
        m.duration_sec as duration,
        a.name as agent_name,
        a.title as agent_title,
        a.phone,
        a.whatsapp,
        a.profile_photo,
        a.image
      FROM agent_stories s
      INNER JOIN agent_story_media m ON m.story_id = s.id
      INNER JOIN agents a ON s.agent_id = a.id
      WHERE s.id = ?
    `, [storyId]);

    const story = stories[0];

    if (conn) {
      conn.release();
    }

    return res.status(201).json({
      success: true,
      data: {
        id: story.story_id,
        story_id: story.story_id,
        agent_id: story.agent_id,
        agent_name: story.agent_name,
        agent_title: story.agent_title,
        phone: story.phone,
        whatsapp: story.whatsapp,
        media_type: story.media_type,
        media_url: story.media_url,
        thumbnail_url: story.thumbnail_url || story.media_url,
        duration: story.duration || 30,
        created_at: story.created_at,
        expires_at: story.expires_at,
        agent_photo: story.profile_photo || story.image
      },
      message: 'Story created successfully'
    });

  } catch (err) {
    // Rollback transaction if it was started
    if (conn && typeof conn.rollback === 'function') {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error('ROLLBACK ERROR:', rollbackErr.message);
      }
    }
    
    // Release connection
    if (conn && typeof conn.release === 'function') {
      conn.release();
    }
    
    // LOG ERROR TO TERMINAL - VERY CLEAR (NOT A COMMAND, JUST LOG TEXT)
    console.error('');
    console.error('========================================');
    console.error('ERROR CREATING STORY');
    console.error('========================================');
    if (err.sqlMessage) {
      console.error('SQL ERROR:', err.sqlMessage);
    }
    if (err.code) {
      console.error('ERROR CODE:', err.code);
    }
    if (err.message) {
      console.error('ERROR MESSAGE:', err.message);
    }
    console.error('========================================');
    console.error('');
    
    // Determine status code
    const statusCode = err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_NO_DEFAULT_FOR_FIELD' ? 400 :
                       err.code === 'ER_DUP_ENTRY' ? 409 : 500;
    
    // RETURN ERROR TO FRONTEND - ALWAYS INCLUDE SQL MESSAGE
    return res.status(statusCode).json({
      success: false,
      message: err.sqlMessage || err.message || 'Failed to create story',
      code: err.code || 'UNKNOWN_ERROR',
      sqlState: err.sqlState || null
    });
  }
});

// Delete story (AGENT ONLY - only owner can delete)
router.delete('/:id', authenticate, authorizeRoles('agent'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get agent ID from user - try multiple methods (same as POST)
    let agentId = req.user.agentId || null;

    // Method 1: Use users.agent_id if set
    if (!agentId && req.user.agent_id) {
      agentId = req.user.agent_id;
    }

    // Method 2: Find agent by agents.user_id
    if (!agentId) {
      const [agentsByUserId] = await pool.query('SELECT id FROM agents WHERE user_id = ?', [req.user.id]);
      if (agentsByUserId.length > 0) {
        agentId = agentsByUserId[0].id;
      }
    }

    // Method 3: Auto-map by name match
    if (!agentId) {
      const [agentsByName] = await pool.query(
        `SELECT id FROM agents 
         WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
         LIMIT 1`,
        [req.user.name]
      );
      if (agentsByName.length > 0) {
        agentId = agentsByName[0].id;
      }
    }

    if (!agentId) {
      return res.status(403).json({
        success: false,
        message: 'Agent profile not found'
      });
    }

    // Check if story exists and belongs to agent
    const [stories] = await pool.query(
      'SELECT id, agent_id FROM agent_stories WHERE id = ?',
      [id]
    );

    if (stories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    if (stories[0].agent_id !== agentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own stories'
      });
    }

    // Get media files to delete
    const [mediaFiles] = await pool.query(
      'SELECT media_url, thumb_url FROM agent_story_media WHERE story_id = ?',
      [id]
    );

    // Delete media files if they're local uploads
    const fs = require('fs');
    for (const media of mediaFiles) {
      if (media.media_url && media.media_url.startsWith('/uploads/stories/')) {
        const filePath = path.join(__dirname, '../..', media.media_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      if (media.thumb_url && media.thumb_url.startsWith('/uploads/stories/') && media.thumb_url !== media.media_url) {
        const thumbPath = path.join(__dirname, '../..', media.thumb_url);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
    }

    // Delete story (CASCADE will delete media automatically, but we delete explicitly for file cleanup)
    await pool.query('DELETE FROM agent_story_media WHERE story_id = ?', [id]);
    await pool.query('DELETE FROM agent_stories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    next(error);
  }
});

module.exports = router;
