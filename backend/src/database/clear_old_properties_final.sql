-- Clear old properties with lovable images and keep only new agent/admin properties
-- Run this in phpMyAdmin

USE faithstate_db;

-- Step 1: DELETE properties with old image URLs (lovable, placeholder, unsplash)
DELETE FROM properties 
WHERE image LIKE '%lovable%' 
   OR image LIKE '%placeholder%'
   OR image LIKE '%unsplash%'
   OR image LIKE '%example.com%'
   OR (image IS NULL AND id NOT IN (SELECT DISTINCT property_id FROM property_images WHERE property_id IS NOT NULL));

-- Step 2: DELETE properties without agent_id (old properties)
DELETE FROM properties WHERE agent_id IS NULL;

-- Step 3: Clean up orphaned property images
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT id FROM properties);

-- Step 4: Ensure all remaining properties are published
UPDATE properties SET is_published = 1 WHERE is_published IS NULL OR is_published = 0;

-- Step 5: Show remaining properties
SELECT 
  id, 
  title, 
  slug, 
  agent_id,
  is_published,
  CASE 
    WHEN agent_id IS NULL THEN 'NO AGENT'
    ELSE 'HAS AGENT'
  END as status
FROM properties 
ORDER BY id DESC;

