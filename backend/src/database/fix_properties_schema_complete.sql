-- Complete migration to fix properties table schema
-- Run this in phpMyAdmin to ensure all columns exist
-- This script checks for each column and adds it if missing

USE faithstate_db;

-- Function to safely add column (MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
-- We'll use a stored procedure approach or check manually

-- Step 1: Add slug column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'slug');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN slug VARCHAR(120) NULL AFTER title',
  'SELECT "Column slug already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add type column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'type');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN type VARCHAR(50) NULL AFTER slug',
  'SELECT "Column type already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add purpose column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'purpose');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN purpose ENUM(\'Rent\',\'Sale\') NULL AFTER type',
  'SELECT "Column purpose already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add currency column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'currency');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN currency VARCHAR(10) DEFAULT \'USD\' AFTER price',
  'SELECT "Column currency already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add rent_period column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'rent_period');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN rent_period ENUM(\'Daily\',\'Weekly\',\'Monthly\',\'Yearly\') NULL AFTER currency',
  'SELECT "Column rent_period already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add beds column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'beds');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN beds INT NULL AFTER rent_period',
  'SELECT "Column beds already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add baths column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'baths');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN baths INT NULL AFTER beds',
  'SELECT "Column baths already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 8: Add area column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'area');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN area DECIMAL(10,2) NULL AFTER baths',
  'SELECT "Column area already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 9: Add area_unit column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'area_unit');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN area_unit ENUM(\'sqm\',\'sqft\') DEFAULT \'sqm\' AFTER area',
  'SELECT "Column area_unit already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 10: Add city column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'city');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN city VARCHAR(100) NULL AFTER location',
  'SELECT "Column city already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 11: Add amenities column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'amenities');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN amenities JSON NULL AFTER description',
  'SELECT "Column amenities already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 12: Add agent_name column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'agent_name');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN agent_name VARCHAR(255) NULL AFTER amenities',
  'SELECT "Column agent_name already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 13: Add agent_phone column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'agent_phone');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN agent_phone VARCHAR(30) NULL AFTER agent_name',
  'SELECT "Column agent_phone already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 14: Add whatsapp column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'whatsapp');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN whatsapp VARCHAR(30) NULL AFTER agent_phone',
  'SELECT "Column whatsapp already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 15: Add latitude column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'latitude');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN latitude DECIMAL(10,7) NULL AFTER whatsapp',
  'SELECT "Column latitude already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 16: Add longitude column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'longitude');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude',
  'SELECT "Column longitude already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 17: Add is_featured column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'is_featured');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER longitude',
  'SELECT "Column is_featured already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 18: Add is_published column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'is_published');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE properties ADD COLUMN is_published TINYINT(1) DEFAULT 1 AFTER is_featured',
  'SELECT "Column is_published already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 19: Migrate data from old columns if they exist
UPDATE properties SET beds = bedrooms WHERE beds IS NULL AND bedrooms IS NOT NULL;
UPDATE properties SET baths = bathrooms WHERE baths IS NULL AND bathrooms IS NOT NULL;
UPDATE properties SET area = sqft WHERE area IS NULL AND sqft IS NOT NULL;
UPDATE properties SET is_featured = CASE WHEN featured = TRUE THEN 1 ELSE 0 END WHERE is_featured = 0 AND featured IS NOT NULL;

-- Step 20: Set default values
UPDATE properties SET type = 'Apartment' WHERE type IS NULL;
UPDATE properties SET purpose = 'Sale' WHERE purpose IS NULL;
UPDATE properties SET currency = 'USD' WHERE currency IS NULL OR currency = '';
UPDATE properties SET is_published = 1 WHERE is_published IS NULL;

-- Step 21: Backfill slugs
UPDATE properties SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '''', ''), '"', ''), ',', '')) WHERE slug IS NULL OR slug = '';

-- Step 22: Handle duplicate slugs
UPDATE properties p1 SET p1.slug = CONCAT(p1.slug, '-', p1.id) WHERE EXISTS (SELECT 1 FROM properties p2 WHERE p2.slug = p1.slug AND p2.id < p1.id);

-- Step 23: Create property_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_property_id (property_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 24: Add indexes
CREATE INDEX IF NOT EXISTS idx_slug_unique ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_purpose ON properties(purpose);
CREATE INDEX IF NOT EXISTS idx_is_published ON properties(is_published);
CREATE INDEX IF NOT EXISTS idx_is_featured ON properties(is_featured);

-- Verify
SELECT 'Migration complete! Columns added:' as status;
DESCRIBE properties;

