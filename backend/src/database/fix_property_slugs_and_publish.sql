-- Fix property slugs and ensure they're published
-- Run this in phpMyAdmin

USE faithstate_db;

-- Step 1: Show current properties status
SELECT 
  id, 
  title, 
  slug, 
  is_published,
  agent_id,
  CASE 
    WHEN slug IS NULL OR slug = '' THEN 'MISSING SLUG'
    WHEN is_published = 0 THEN 'NOT PUBLISHED'
    WHEN agent_id IS NULL THEN 'NO AGENT'
    ELSE 'OK'
  END as status
FROM properties 
ORDER BY id DESC 
LIMIT 20;

-- Step 2: Generate slugs for properties missing them
UPDATE properties 
SET slug = CONCAT(
  LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '''', ''), '"', ''), ',', ''), '.', '')),
  '-',
  id
)
WHERE slug IS NULL OR slug = '';

-- Step 3: Fix duplicate slugs by appending ID
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug AND p2.id < p1.id
);

-- Step 4: Ensure all properties with agent_id are published
UPDATE properties 
SET is_published = 1 
WHERE agent_id IS NOT NULL AND (is_published = 0 OR is_published IS NULL);

-- Step 5: Show final status
SELECT 
  id, 
  title, 
  slug, 
  is_published,
  agent_id,
  CASE 
    WHEN slug IS NULL OR slug = '' THEN 'MISSING SLUG'
    WHEN is_published = 0 THEN 'NOT PUBLISHED'
    WHEN agent_id IS NULL THEN 'NO AGENT'
    ELSE 'OK'
  END as status
FROM properties 
ORDER BY id DESC 
LIMIT 20;

