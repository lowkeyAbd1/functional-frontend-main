-- Remove problematic properties that are blocking admin view
-- Run this in phpMyAdmin

USE faithstate_db;

-- Step 1: Show all properties with their agent info (BEFORE cleanup)
SELECT 
  p.id,
  p.title,
  p.slug,
  p.agent_id,
  a.name AS agent_name,
  p.is_published,
  p.is_featured,
  COUNT(pi.id) AS image_count
FROM properties p
LEFT JOIN agents a ON a.id = p.agent_id
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id
ORDER BY p.id DESC;

-- Step 2: Delete properties without agent_id (orphaned properties)
-- Only delete if they're not published or have no images
DELETE FROM properties 
WHERE agent_id IS NULL 
  AND (is_published = 0 OR id NOT IN (SELECT DISTINCT property_id FROM property_images WHERE property_id IS NOT NULL));

-- Step 3: Delete properties with problematic titles/slugs (like "wrwfhh")
-- Be careful - only delete if you're sure these are test properties
DELETE FROM properties WHERE (title LIKE '%wrwfhh%' OR slug LIKE '%wrwfhh%') AND agent_id IS NULL;

-- Step 4: Clean up orphaned property images
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT id FROM properties);

-- Step 5: Show remaining properties (AFTER cleanup)
SELECT 
  p.id,
  p.title,
  p.slug,
  p.agent_id,
  a.name AS agent_name,
  p.is_published,
  COUNT(pi.id) AS image_count
FROM properties p
LEFT JOIN agents a ON a.id = p.agent_id
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id
ORDER BY p.id DESC;
