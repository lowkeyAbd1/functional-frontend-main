-- Add agent_id column to users table for user-agent mapping
-- Run this in phpMyAdmin

USE faithstate_db;

-- Add agent_id column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agent_id INT NULL AFTER role;

-- Add index if it doesn't exist
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_agent_id (agent_id);

-- Add foreign key constraint (drop first if exists to avoid errors)
ALTER TABLE users
DROP FOREIGN KEY IF EXISTS fk_user_agent;

ALTER TABLE users
ADD CONSTRAINT fk_user_agent 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Auto-map existing agents to users by name match (since agents table doesn't have email)
UPDATE users u
INNER JOIN agents a ON LOWER(TRIM(a.name)) = LOWER(TRIM(u.name))
SET u.agent_id = a.id
WHERE u.role = 'agent' AND u.agent_id IS NULL;

-- Also map if user_id already exists in agents table (reverse mapping)
UPDATE users u
INNER JOIN agents a ON a.user_id = u.id
SET u.agent_id = a.id
WHERE u.agent_id IS NULL;
