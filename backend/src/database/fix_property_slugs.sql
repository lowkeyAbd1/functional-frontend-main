-- Fix missing slugs in properties table
-- Run this SQL script to generate slugs for properties that don't have them

USE faithstate_db;

-- Generate slugs from title for properties without slugs
UPDATE properties
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(title, ' ', '-'),
        '''', ''
      ),
      ',', ''
    ),
    '.', ''
  )
)
WHERE slug IS NULL OR slug = '';

-- Ensure slugs are unique by appending id if duplicate
UPDATE properties p1
SET p1.slug = CONCAT(p1.slug, '-', p1.id)
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug
  AND p2.id < p1.id
);

-- Verify all properties have slugs
SELECT id, title, slug FROM properties WHERE slug IS NULL OR slug = '';

