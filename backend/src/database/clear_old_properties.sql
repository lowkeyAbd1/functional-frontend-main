-- Clear old properties and keep only new ones
-- Run this in phpMyAdmin

USE faithstate_db;

-- Option 1: DELETE all old properties (keeps only properties with agent_id)
-- WARNING: This will delete properties without agent_id
DELETE FROM properties WHERE agent_id IS NULL;

-- Option 2: UNPUBLISH old properties instead of deleting (safer)
-- Uncomment this if you want to keep old properties but hide them:
-- UPDATE properties SET is_published = 0 WHERE agent_id IS NULL;

-- Option 3: DELETE properties with old image URLs (lovable, etc.)
-- This deletes properties that have image URLs containing "lovable" or other old sources
DELETE FROM properties 
WHERE image LIKE '%lovable%' 
   OR image LIKE '%placeholder%'
   OR image LIKE '%unsplash%'
   OR (image IS NULL AND id NOT IN (SELECT DISTINCT property_id FROM property_images WHERE property_id IS NOT NULL));

-- Clean up orphaned property images
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT id FROM properties);

-- Show remaining properties
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

