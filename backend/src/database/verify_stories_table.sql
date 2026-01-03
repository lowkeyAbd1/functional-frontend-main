-- Quick verification script for agent_stories table
-- Run this in phpMyAdmin to check if table exists

USE faithstate_db;

-- Check if table exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Table EXISTS ✅'
        ELSE 'Table DOES NOT EXIST ❌ - Run add_agent_stories.sql'
    END as table_status
FROM information_schema.tables 
WHERE table_schema = 'faithstate_db' 
AND table_name = 'agent_stories';

-- Show table structure if exists
DESCRIBE agent_stories;

-- Count stories
SELECT COUNT(*) as total_stories FROM agent_stories;

-- Show sample stories
SELECT * FROM agent_stories LIMIT 5;

