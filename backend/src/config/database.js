const mysql = require("mysql2/promise");

// ✅ Prefer Railway connection string when available (private network)
let pool;

if (process.env.DATABASE_URL) {
  pool = mysql.createPool(process.env.DATABASE_URL);
  console.log("✅ Using DATABASE_URL for MySQL connection");
} else {
  // Fallback for local development
  const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306", 10),
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || "faithstate_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  pool = mysql.createPool(dbConfig);
  console.log("✅ Using DB_HOST/MYSQLHOST config for MySQL connection");
}

// Test connection at startup
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ MySQL connected successfully");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
    console.error(
      "💡 Ensure Railway backend has DATABASE_URL={{ MySQL.MYSQL_URL }} (private) OR DB_HOST/MYSQLHOST vars set"
    );
  });

module.exports = pool;
