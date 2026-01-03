-- QUICK FIX: Add agent_id and fix slugs
-- Copy and paste this ENTIRE block into phpMyAdmin SQL tab

USE faithstate_db;

-- Add agent_id column (ignore error if exists)
ALTER TABLE properties ADD COLUMN agent_id INT NULL AFTER id;

-- Add index
CREATE INDEX idx_properties_agent_id ON properties(agent_id);

-- Backfill ALL missing slugs
UPDATE properties 
SET slug = CONCAT(
  LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '''', ''), '"', ''), ',', ''), '.', '')),
  '-',
  id
)
WHERE slug IS NULL OR slug = '';

-- Fix duplicate slugs
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug AND p2.id < p1.id
);

-- Show results
SELECT id, title, slug, agent_id, is_published 
FROM properties 
ORDER BY id DESC 
LIMIT 20;

