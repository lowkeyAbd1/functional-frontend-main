-- FaithState Real Estate Database Schema
-- Run this script to create/update the database structure

CREATE DATABASE IF NOT EXISTS faithstate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE faithstate_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'agent', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255) NULL,
  color VARCHAR(50),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  sqft INT DEFAULT 0,
  image VARCHAR(500),
  featured BOOLEAN DEFAULT FALSE,
  category_id INT NULL,
  agent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_category_id (category_id),
  INDEX idx_featured (featured),
  INDEX idx_location (location(100)),
  INDEX idx_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  specialty VARCHAR(255),
  experience INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews INT DEFAULT 0,
  sales VARCHAR(50),
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  property_id INT NULL,
  status ENUM('new', 'contacted', 'closed') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites table (for user property favorites)
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  price_from DECIMAL(12, 2) NULL,
  developer VARCHAR(255),
  description TEXT,
  image VARCHAR(500),
  status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_is_featured (is_featured),
  INDEX idx_location (location(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New Projects table (for Bayut-style projects)
CREATE TABLE IF NOT EXISTS new_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  developer VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status ENUM('Under Construction', 'Ready') DEFAULT 'Under Construction',
  handover VARCHAR(50),
  launch_price VARCHAR(50),
  payment_plan_label VARCHAR(20),
  description TEXT,
  category VARCHAR(50),
  beds INT,
  baths INT,
  completion_percent INT,
  is_published TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_location (location(100)),
  INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project images table
CREATE TABLE IF NOT EXISTS project_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES new_projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project payment milestones table
CREATE TABLE IF NOT EXISTS project_payment_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  percent DECIMAL(5, 2) NOT NULL,
  note VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES new_projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration notes:
-- If you're updating an existing database, run these ALTER statements:
-- ALTER TABLE categories ADD COLUMN slug VARCHAR(100) NULL AFTER name;
-- ALTER TABLE categories ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER icon;
-- ALTER TABLE categories ADD UNIQUE INDEX idx_slug (slug);
-- ALTER TABLE properties ADD INDEX idx_category_id (category_id);
-- ALTER TABLE properties ADD INDEX idx_location (location(100));
-- ALTER TABLE projects ADD INDEX idx_location (location(100));

-- IMPORTANT: Add slug column to properties table (for Bayut-style properties)
-- Run this migration script: backend/src/database/add_slug_to_properties.sql
-- Or run these commands manually:
-- ALTER TABLE properties ADD COLUMN slug VARCHAR(120) NULL AFTER title;
-- ALTER TABLE properties ADD UNIQUE INDEX idx_slug_unique (slug);
-- UPDATE properties SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '''', ''), '"', ''), ',', '')) WHERE slug IS NULL OR slug = '';
-- UPDATE properties p1 SET p1.slug = CONCAT(p1.slug, '-', p1.id) WHERE EXISTS (SELECT 1 FROM properties p2 WHERE p2.slug = p1.slug AND p2.id < p1.id);
-- ALTER TABLE properties MODIFY COLUMN slug VARCHAR(120) NOT NULL;

-- Add columns to agents table for Find My Agent
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS languages VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS specialization VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS company VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50) NULL;

-- Agent stories table (Bayut-style Instagram stories)
CREATE TABLE IF NOT EXISTS agent_stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id INT NOT NULL,
  title VARCHAR(255) NULL,
  project_name VARCHAR(255) NULL,
  caption TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  INDEX idx_stories_active (is_active, expires_at, created_at),
  INDEX idx_stories_agent (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Story media items (image/video)
CREATE TABLE IF NOT EXISTS agent_story_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  media_type ENUM('image','video') NOT NULL,
  media_url VARCHAR(500) NOT NULL,
  thumb_url VARCHAR(500) NULL,
  duration_sec INT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES agent_stories(id) ON DELETE CASCADE,
  INDEX idx_story_media_story (story_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Story views (track unique views)
CREATE TABLE IF NOT EXISTS agent_story_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  viewer_user_id INT NULL,
  viewer_ip VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES agent_stories(id) ON DELETE CASCADE,
  INDEX idx_story_views_story (story_id),
  INDEX idx_story_views_user_ip (story_id, viewer_user_id, viewer_ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

