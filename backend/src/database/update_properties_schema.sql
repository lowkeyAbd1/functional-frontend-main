-- Migration script to update properties table schema
-- Adds new Bayut-style columns while preserving existing data
-- Usage: mysql -u root -p faithstate_db < update_properties_schema.sql

USE faithstate_db;

-- Helper function to add column only if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS for ADD COLUMN, so we use a workaround

-- Step 1: Add slug column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'slug') > 0,
  'SELECT "Column slug already exists"',
  'ALTER TABLE properties ADD COLUMN slug VARCHAR(120) NULL AFTER title'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add type column (VARCHAR for flexibility)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'type') > 0,
  'SELECT "Column type already exists"',
  'ALTER TABLE properties ADD COLUMN type VARCHAR(50) NULL AFTER slug'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add purpose column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'purpose') > 0,
  'SELECT "Column purpose already exists"',
  'ALTER TABLE properties ADD COLUMN purpose ENUM(\'Rent\',\'Sale\') NULL AFTER type'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add currency column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'currency') > 0,
  'SELECT "Column currency already exists"',
  'ALTER TABLE properties ADD COLUMN currency VARCHAR(10) DEFAULT \'USD\' AFTER price'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add rent_period column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'rent_period') > 0,
  'SELECT "Column rent_period already exists"',
  'ALTER TABLE properties ADD COLUMN rent_period ENUM(\'Daily\',\'Weekly\',\'Monthly\',\'Yearly\') NULL AFTER currency'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add beds column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'beds') > 0,
  'SELECT "Column beds already exists"',
  'ALTER TABLE properties ADD COLUMN beds INT NULL AFTER rent_period'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add baths column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'baths') > 0,
  'SELECT "Column baths already exists"',
  'ALTER TABLE properties ADD COLUMN baths INT NULL AFTER beds'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 8: Add area column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'area') > 0,
  'SELECT "Column area already exists"',
  'ALTER TABLE properties ADD COLUMN area DECIMAL(10,2) NULL AFTER baths'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 9: Add area_unit column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'area_unit') > 0,
  'SELECT "Column area_unit already exists"',
  'ALTER TABLE properties ADD COLUMN area_unit ENUM(\'sqm\',\'sqft\') DEFAULT \'sqm\' AFTER area'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 10: Add city column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'city') > 0,
  'SELECT "Column city already exists"',
  'ALTER TABLE properties ADD COLUMN city VARCHAR(100) NULL AFTER location'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 11: Add amenities column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'amenities') > 0,
  'SELECT "Column amenities already exists"',
  'ALTER TABLE properties ADD COLUMN amenities JSON NULL AFTER description'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 12: Add agent_name column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'agent_name') > 0,
  'SELECT "Column agent_name already exists"',
  'ALTER TABLE properties ADD COLUMN agent_name VARCHAR(255) NULL AFTER amenities'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 13: Add agent_phone column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'agent_phone') > 0,
  'SELECT "Column agent_phone already exists"',
  'ALTER TABLE properties ADD COLUMN agent_phone VARCHAR(30) NULL AFTER agent_name'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 14: Add whatsapp column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'whatsapp') > 0,
  'SELECT "Column whatsapp already exists"',
  'ALTER TABLE properties ADD COLUMN whatsapp VARCHAR(30) NULL AFTER agent_phone'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 15: Add latitude column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'latitude') > 0,
  'SELECT "Column latitude already exists"',
  'ALTER TABLE properties ADD COLUMN latitude DECIMAL(10,7) NULL AFTER whatsapp'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 16: Add longitude column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'longitude') > 0,
  'SELECT "Column longitude already exists"',
  'ALTER TABLE properties ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 17: Add is_featured column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'is_featured') > 0,
  'SELECT "Column is_featured already exists"',
  'ALTER TABLE properties ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER longitude'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 18: Add is_published column
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'is_published') > 0,
  'SELECT "Column is_published already exists"',
  'ALTER TABLE properties ADD COLUMN is_published TINYINT(1) DEFAULT 1 AFTER is_featured'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 19: Migrate data from old columns to new columns
UPDATE properties
SET beds = bedrooms
WHERE beds IS NULL AND bedrooms IS NOT NULL;

UPDATE properties
SET baths = bathrooms
WHERE baths IS NULL AND bathrooms IS NOT NULL;

UPDATE properties
SET area = sqft
WHERE area IS NULL AND sqft IS NOT NULL;

UPDATE properties
SET is_featured = CASE WHEN featured = TRUE THEN 1 ELSE 0 END
WHERE is_featured = 0 AND featured IS NOT NULL;

-- Step 20: Set default values for new columns
UPDATE properties
SET type = 'Apartment'
WHERE type IS NULL;

UPDATE properties
SET purpose = 'Sale'
WHERE purpose IS NULL;

UPDATE properties
SET currency = 'USD'
WHERE currency IS NULL OR currency = '';

UPDATE properties
SET is_published = 1
WHERE is_published IS NULL;

-- Step 21: Backfill slugs for existing properties
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

-- Step 22: Handle duplicate slugs by appending id
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug AND p2.id < p1.id
);

-- Step 23: Make required columns NOT NULL after setting defaults
ALTER TABLE properties
MODIFY COLUMN slug VARCHAR(120) NOT NULL;

ALTER TABLE properties
MODIFY COLUMN type VARCHAR(50) NOT NULL;

ALTER TABLE properties
MODIFY COLUMN purpose ENUM('Rent','Sale') NOT NULL;

-- Step 24: Add unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_slug_unique ON properties(slug);

-- Step 25: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_purpose ON properties(purpose);
CREATE INDEX IF NOT EXISTS idx_is_published ON properties(is_published);
CREATE INDEX IF NOT EXISTS idx_is_featured ON properties(is_featured);

-- Step 26: Verify the migration
DESCRIBE properties;

-- Show sample data
SELECT id, title, slug, type, purpose, price, currency, beds, baths, area, is_published 
FROM properties 
LIMIT 5;
