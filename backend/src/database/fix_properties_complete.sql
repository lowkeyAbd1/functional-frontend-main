-- Complete fix for properties table
-- Run this in phpMyAdmin to ensure all columns exist including agent_id

USE faithstate_db;

-- Step 1: Add agent_id column if it doesn't exist
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

-- Step 3: Add foreign key constraint (if it doesn't exist)
-- Note: We'll check and add it safely
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND CONSTRAINT_NAME = 'fk_properties_agent');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE properties ADD CONSTRAINT fk_properties_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_properties_agent already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Ensure all required columns exist (run the complete schema fix)
-- This ensures slug, type, purpose, etc. all exist
SOURCE fix_properties_schema_complete.sql;

-- Step 5: Backfill slugs for properties that don't have them
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

-- Step 6: Handle duplicate slugs by appending ID
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug AND p2.id < p1.id
);

-- Step 7: Ensure all properties have is_published = 1 (if you want them visible)
-- UPDATE properties SET is_published = 1 WHERE is_published IS NULL;

-- Step 8: Verify schema
SELECT 'Schema verification:' as status;
DESCRIBE properties;

-- Step 9: Show current properties with their slugs
SELECT id, title, slug, agent_id, is_published FROM properties ORDER BY id DESC LIMIT 20;

