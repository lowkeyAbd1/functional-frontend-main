-- Link a specific user to an agent
-- Replace 'USER_EMAIL_HERE' with the actual user email
-- Run this in phpMyAdmin

USE faithstate_db;

-- OPTION 1: Create new agent profile linked to user
-- (Use this if user doesn't have an agent profile yet)
INSERT INTO agents (user_id, name, email, is_active, created_at)
SELECT 
    id,
    name,
    email,
    1,
    NOW()
FROM users
WHERE email = 'USER_EMAIL_HERE'
AND NOT EXISTS (
    SELECT 1 FROM agents WHERE user_id = users.id
);

-- OPTION 2: Link existing agent to user
-- (Use this if agent profile exists but isn't linked)
UPDATE agents a
INNER JOIN users u ON u.email = 'USER_EMAIL_HERE'
SET a.user_id = u.id
WHERE a.user_id IS NULL
LIMIT 1;

-- OPTION 3: Link by user ID (if you know the user ID)
-- Replace USER_ID_HERE with actual user ID
UPDATE agents a
SET a.user_id = USER_ID_HERE
WHERE a.user_id IS NULL
LIMIT 1;

-- Verify the link
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    a.id AS agent_id,
    a.name AS agent_name,
    'Linked successfully' AS status
FROM users u
INNER JOIN agents a ON a.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE';

