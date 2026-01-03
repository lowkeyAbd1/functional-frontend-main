-- FAITHSTATE (MySQL-compatible) | Link Users ↔ Agents
-- Works on MySQL 5.7/8.0 and phpMyAdmin
-- Database: faithstate_db

USE faithstate_db;

-- ------------------------------------------------------------
-- STEP 1: Add agents.user_id column (if missing)
-- ------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'agents'
    AND COLUMN_NAME = 'user_id'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE agents ADD COLUMN user_id INT NULL AFTER id',
  'SELECT "agents.user_id already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- STEP 2: Add UNIQUE index on agents.user_id (if missing)
-- ------------------------------------------------------------
SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'agents'
    AND INDEX_NAME = 'uniq_agents_user_id'
);

SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE agents ADD UNIQUE KEY uniq_agents_user_id (user_id)',
  'SELECT "Unique index uniq_agents_user_id already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- STEP 3: Add FK agents.user_id → users.id (if missing)
-- ------------------------------------------------------------
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'agents'
    AND CONSTRAINT_NAME = 'fk_agents_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE agents ADD CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_agents_user already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- STEP 4: Auto-link by EMAIL (only if agents.email exists)
-- ------------------------------------------------------------
SET @agents_email_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'agents'
    AND COLUMN_NAME = 'email'
);

SET @sql := IF(
  @agents_email_exists = 1,
  'UPDATE agents a
   INNER JOIN users u ON LOWER(TRIM(a.email)) = LOWER(TRIM(u.email))
   SET a.user_id = u.id
   WHERE a.user_id IS NULL',
  'SELECT "agents.email column not found, skipping email auto-link" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- STEP 5: Auto-link by NAME (fallback)
-- ------------------------------------------------------------
UPDATE agents a
INNER JOIN users u ON LOWER(TRIM(a.name)) = LOWER(TRIM(u.name))
SET a.user_id = u.id
WHERE a.user_id IS NULL;

-- ------------------------------------------------------------
-- STEP 6: Status summary
-- ------------------------------------------------------------
SELECT
  'Linking Status' AS info,
  COUNT(*) AS total_agents,
  SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) AS linked_agents,
  SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS unlinked_agents
FROM agents;

-- ------------------------------------------------------------
-- STEP 7: Show first 10 unlinked agents
-- ------------------------------------------------------------
SELECT
  a.id,
  a.name,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'agents'
            AND COLUMN_NAME = 'email') = 1
    THEN a.email
    ELSE NULL
  END AS email,
  'Not linked to any user' AS status
FROM agents a
WHERE a.user_id IS NULL
LIMIT 10;
