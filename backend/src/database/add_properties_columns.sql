-- Migration script to add Bayut-style columns to properties table
-- Run this if the properties table exists but is missing the new columns
-- Usage: mysql -u root -p faithstate_db < add_properties_columns.sql

USE faithstate_db;

-- Add slug column if it doesn't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS slug VARCHAR(120) NULL AFTER title;

-- Add type column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS type ENUM('Apartment','Villa','House','Land','Office','Shop') NULL AFTER slug;

-- Add purpose column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS purpose ENUM('Rent','Sale') NULL AFTER type;

-- Add currency column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD' AFTER price;

-- Add rent_period column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS rent_period ENUM('Monthly','Yearly','Weekly','Daily') NULL AFTER currency;

-- Add beds column (rename from bedrooms if exists)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS beds INT NULL AFTER rent_period;

-- Add baths column (rename from bathrooms if exists)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS baths INT NULL AFTER beds;

-- Add area column (rename from sqft if exists)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) NULL AFTER baths;

-- Add area_unit column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS area_unit ENUM('sqm','sqft') DEFAULT 'sqm' AFTER area;

-- Add city column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL AFTER location;

-- Add amenities column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS amenities JSON NULL AFTER description;

-- Add agent_name column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255) NULL AFTER amenities;

-- Add agent_phone column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS agent_phone VARCHAR(30) NULL AFTER agent_name;

-- Add whatsapp column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30) NULL AFTER agent_phone;

-- Add latitude column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7) NULL AFTER whatsapp;

-- Add longitude column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7) NULL AFTER latitude;

-- Add is_featured column (rename from featured if exists)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0 AFTER longitude;

-- Add is_published column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_published TINYINT(1) DEFAULT 1 AFTER is_featured;

-- Migrate data from old columns to new columns if they exist
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

-- Set default values for required columns
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

-- Add unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_slug_unique ON properties(slug);

-- Backfill slugs for existing properties
UPDATE properties
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(title, ' ', '-'),
        '''', ''
      ),
      '"', ''
    ),
    ',', ''
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

-- Make slug NOT NULL after backfilling
ALTER TABLE properties
MODIFY COLUMN slug VARCHAR(120) NOT NULL;

-- Make type NOT NULL after setting defaults
ALTER TABLE properties
MODIFY COLUMN type ENUM('Apartment','Villa','House','Land','Office','Shop') NOT NULL;

-- Make purpose NOT NULL after setting defaults
ALTER TABLE properties
MODIFY COLUMN purpose ENUM('Rent','Sale') NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_purpose ON properties(purpose);
CREATE INDEX IF NOT EXISTS idx_is_published ON properties(is_published);
CREATE INDEX IF NOT EXISTS idx_is_featured ON properties(is_featured);

-- Verify
DESCRIBE properties;
SELECT id, title, slug, type, purpose FROM properties LIMIT 5;

