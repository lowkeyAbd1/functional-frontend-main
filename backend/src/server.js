/**
 * backend/src/server.js
 * Safe version:
 * - serves /uploads correctly
 * - avoids duplicate /api/properties mounting
 * - keeps your existing routes + jobs
 * - CORS works for localhost dev + optional CORS_ORIGIN list
 */

const path = require('path');

// Temporary: Log server entry point
console.log("SERVER ENTRY:", __filename);

const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const agentRoutes = require('./routes/agents');
const categoryRoutes = require('./routes/categories');
const contactRoutes = require('./routes/contact');
const serviceRoutes = require('./routes/services');
const projectRoutes = require('./routes/projects');
const newProjectsRoutes = require('./routes/newProjects');
const adminProjectsRoutes = require('./routes/adminProjects');
const publicPropertiesRoutes = require('./routes/publicProperties');
const adminPropertiesRoutes = require('./routes/adminProperties');
const adminAgentsRoutes = require('./routes/adminAgents');
const storiesRoutes = require('./routes/stories');

const app = express();

/**
 * Middleware
 */
const allowedOrigins =  [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      process.env.VITE_API_URL
    ]

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);

    // Allow localhost with any port in development
    if (
      process.env.NODE_ENV !== 'production' &&
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    ) {
      return callback(null, true);
    }

    // Allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // In dev, allow everything (so you don't get blocked)
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    // In production, block unknown origins
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * ✅ Serve static files (uploads)
 * This makes URLs like:
 *   http://localhost:5000/uploads/agents/ayub.jpg
 * work (must exist in backend/uploads/agents/ayub.jpg)
 */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/**
 * Routes
 */
app.use('/api/auth', authRoutes);

// IMPORTANT: mount properties only ONCE.
// Use publicPropertiesRoutes for public-facing property endpoints
app.use('/api/properties', publicPropertiesRoutes);
// Keep propertyRoutes for admin/internal use if needed:
// app.use('/api/internal/properties', propertyRoutes);

app.use('/api/agents', agentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/new-projects', newProjectsRoutes);
app.use('/api/admin/projects', adminProjectsRoutes);
app.use('/api/admin/properties', adminPropertiesRoutes);
app.use('/api/admin', adminAgentsRoutes);
app.use('/api/stories', storiesRoutes);

/**
 * Auto-expire stories job (run every 10 minutes)
 */
const expireStories = async () => {
  try {
    const pool = require('./config/database');
    await pool.query(
      'UPDATE agent_stories SET is_active = 0 WHERE expires_at < NOW() AND is_active = 1'
    );
    console.log('✅ Expired old stories');
  } catch (error) {
    console.error('❌ Error expiring stories:', error.message);
  }
};

// Run immediately, then every 10 minutes
expireStories();
setInterval(expireStories, 10 * 60 * 1000);

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FaithState API is running' });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 FaithState API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});
