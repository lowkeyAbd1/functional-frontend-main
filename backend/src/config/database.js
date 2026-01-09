const mysql = require('mysql2/promise');

// Support both DB_* (preferred) and Railway MYSQL* variables
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'faithstate_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Test connection at startup
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL connected successfully');
    console.log('📊 DB Config - Host:', dbConfig.host, '| Port:', dbConfig.port, '| DB:', dbConfig.database, '| User:', dbConfig.user);
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('📊 Failed DB Config - Host:', dbConfig.host, '| Port:', dbConfig.port, '| DB:', dbConfig.database);
    console.error('💡 Check Railway Variables: DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME or MYSQLHOST/MYSQLPORT/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE');
  });

module.exports = pool;
