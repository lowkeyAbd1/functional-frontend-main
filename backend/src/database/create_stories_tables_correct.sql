-- CORRECT SQL SCHEMA FOR STORIES
-- Run this in phpMyAdmin: http://localhost/phpmyadmin
-- Select database: faithstate_db
-- Click SQL tab, paste this, click Go

USE faithstate_db;

-- Drop old tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS agent_story_views;
DROP TABLE IF EXISTS agent_story_media;
DROP TABLE IF EXISTS agent_stories;

-- Create agent_stories table (CORRECT SCHEMA - NO media fields here)
CREATE TABLE agent_stories (
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

-- Create agent_story_media table (media goes here)
CREATE TABLE agent_story_media (
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

-- Verify tables were created
SELECT 'Tables created successfully' AS status;

