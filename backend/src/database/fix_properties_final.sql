-- FINAL FIX: Ensure properties table has all required columns
-- Run this in phpMyAdmin to fix schema issues

USE faithstate_db;

-- Step 1: Add agent_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'agent_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN agent_id INT NULL AFTER id',
  'SELECT "Column agent_id already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add index for agent_id
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);

-- Step 3: Ensure all other required columns exist
-- Run the complete schema fix
SOURCE fix_properties_schema_complete.sql;

-- Step 4: Backfill slugs for ALL properties (critical for property details page)
UPDATE properties 
SET slug = LOWER(
  REPLACE(
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
    ),
    '/', '-'
  )
)
WHERE slug IS NULL OR slug = '';

-- Step 5: Handle duplicate slugs by appending ID
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug AND p2.id < p1.id
);

-- Step 6: Ensure all properties are published (if you want them visible)
-- Uncomment the next line if you want all properties visible:
-- UPDATE properties SET is_published = 1 WHERE is_published IS NULL OR is_published = 0;

-- Step 7: Show current properties with their slugs
SELECT 
  id, 
  title, 
  slug, 
  agent_id, 
  is_published,
  CASE 
    WHEN slug IS NULL OR slug = '' THEN 'MISSING SLUG'
    WHEN is_published = 0 THEN 'NOT PUBLISHED'
    ELSE 'OK'
  END as status
FROM properties 
ORDER BY id DESC 
LIMIT 20;

