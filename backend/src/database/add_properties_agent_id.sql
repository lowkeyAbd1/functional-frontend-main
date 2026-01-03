-- Add agent_id column to properties table and link to agents
-- Run this in phpMyAdmin or MySQL CLI

USE faithstate_db;

-- Add agent_id column if it doesn't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS agent_id INT NULL AFTER id;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);

-- Add foreign key constraint (drop first if exists to avoid errors)
-- Note: MySQL doesn't support IF EXISTS for foreign keys, so we'll use a stored procedure approach
SET @dbname = DATABASE();
SET @tablename = 'properties';
SET @constraintname = 'fk_properties_agent';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND CONSTRAINT_NAME = @constraintname
  ) > 0,
  'SELECT "Foreign key already exists"',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @constraintname, ' FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

