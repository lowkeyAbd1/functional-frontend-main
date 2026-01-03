-- SIMPLE FIX: Add agent_id and backfill slugs
-- Run this in phpMyAdmin

USE faithstate_db;

-- Add agent_id column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_id INT NULL AFTER id;

-- Add index
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);

-- Backfill slugs for ALL properties
UPDATE properties 
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(title, ' ', '-'),
          '''', ''
        ),
        '"', ''
      ),
      ',', ''
    ),
    '.', ''
  )
)
WHERE slug IS NULL OR slug = '';

-- Handle duplicate slugs
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug AND p2.id < p1.id
);

-- Show properties with their slugs
SELECT id, title, slug, agent_id, is_published FROM properties ORDER BY id DESC LIMIT 20;

