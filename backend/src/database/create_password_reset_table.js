/**
 * Quick script to create password_reset_tokens table
 * Run: node backend/src/database/create_password_reset_table.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');

const createPasswordResetTable = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'faithstate_db',
  });

  try {
    console.log('Creating password_reset_tokens table...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_password_reset_user (user_id),
        INDEX idx_password_reset_expires (expires_at),
        INDEX idx_password_reset_token_hash (token_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ password_reset_tokens table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Message:', error.sqlMessage);
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
};

createPasswordResetTable();

