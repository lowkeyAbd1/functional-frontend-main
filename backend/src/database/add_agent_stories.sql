-- Create agent_stories table for TruBroker™ Stories
-- Run this SQL script to create the stories table

USE faithstate_db;

-- Drop existing table if it exists (to recreate with new schema)
DROP TABLE IF EXISTS agent_story_views;
DROP TABLE IF EXISTS agent_story_media;
DROP TABLE IF EXISTS agent_stories;

-- Create agent_stories table (simplified schema)
CREATE TABLE IF NOT EXISTS agent_stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id INT NOT NULL,
  media_type ENUM('image','video') NOT NULL,
  media_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  duration INT NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  INDEX idx_agent_id (agent_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert demo/placeholder stories (if no stories exist)
INSERT INTO agent_stories (agent_id, media_type, media_url, thumbnail_url, duration, expires_at)
SELECT 
  a.id,
  'image',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
  30,
  DATE_ADD(NOW(), INTERVAL 7 DAY)
FROM agents a
WHERE NOT EXISTS (SELECT 1 FROM agent_stories WHERE agent_id = a.id)
LIMIT 3;

