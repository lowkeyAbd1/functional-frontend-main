-- Migration script to add slug column to properties table
-- Run this if the properties table exists but doesn't have a slug column
-- Usage: mysql -u root -p faithstate_db < add_slug_to_properties.sql

USE faithstate_db;

-- Step 1: Add slug column (nullable first)
ALTER TABLE properties
ADD COLUMN slug VARCHAR(120) NULL AFTER title;

-- Step 2: Add unique index on slug
ALTER TABLE properties
ADD UNIQUE INDEX idx_slug_unique (slug);

-- Step 3: Backfill slugs for existing properties
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

-- Step 4: Handle any duplicate slugs by appending id
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug AND p2.id < p1.id
);

-- Step 5: Make slug NOT NULL after backfilling
ALTER TABLE properties
MODIFY COLUMN slug VARCHAR(120) NOT NULL;

-- Verify
SELECT id, title, slug FROM properties LIMIT 10;

