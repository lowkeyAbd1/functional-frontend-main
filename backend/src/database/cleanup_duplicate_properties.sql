-- Cleanup duplicate properties
-- Run this in phpMyAdmin to find and remove duplicates

USE faithstate_db;

-- Step 1: Find duplicate properties (by title + location)
-- This shows properties that have the same title and location
SELECT 
    title,
    location,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as property_ids
FROM properties
GROUP BY title, location
HAVING COUNT(*) > 1;

-- Step 2: Find duplicates with same slug
SELECT 
    slug,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as property_ids
FROM properties
WHERE slug IS NOT NULL AND slug != ''
GROUP BY slug
HAVING COUNT(*) > 1;

-- Step 3: DELETE duplicates - KEEP THE NEWEST ONE (highest id)
-- WARNING: This will delete older duplicates. Review the results above first!

-- Delete duplicates by title+location (keeps the newest)
DELETE p1 FROM properties p1
INNER JOIN properties p2 
WHERE p1.title = p2.title 
  AND p1.location = p2.location
  AND p1.id < p2.id;

-- Delete duplicates by slug (keeps the newest)
DELETE p1 FROM properties p1
INNER JOIN properties p2 
WHERE p1.slug = p2.slug 
  AND p1.slug IS NOT NULL 
  AND p1.slug != ''
  AND p1.id < p2.id;

-- Step 4: Verify no duplicates remain
SELECT 
    title,
    location,
    COUNT(*) as count
FROM properties
GROUP BY title, location
HAVING COUNT(*) > 1;

SELECT 
    slug,
    COUNT(*) as count
FROM properties
WHERE slug IS NOT NULL AND slug != ''
GROUP BY slug
HAVING COUNT(*) > 1;

