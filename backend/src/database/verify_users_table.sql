-- Quick verification script for users table
-- Run this in phpMyAdmin to check if table structure is correct

USE faithstate_db;

-- Check if table exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Table EXISTS ✅'
        ELSE 'Table DOES NOT EXIST ❌'
    END as table_status
FROM information_schema.tables 
WHERE table_schema = 'faithstate_db' 
AND table_name = 'users';

-- Show table structure
DESCRIBE users;

-- Show column names (required columns)
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'faithstate_db'
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Check if agent_id column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'agent_id column EXISTS ✅'
        ELSE 'agent_id column DOES NOT EXIST ⚠️ (optional, will use fallback query)'
    END as agent_id_status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'faithstate_db'
AND TABLE_NAME = 'users'
AND COLUMN_NAME = 'agent_id';

-- Show sample users (without passwords)
SELECT id, name, email, role, agent_id FROM users LIMIT 5;

