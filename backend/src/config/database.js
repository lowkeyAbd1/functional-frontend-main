const mysql = require("mysql2/promise");

// ✅ Prefer Railway connection string when available (private network)
let pool;

if (process.env.DATABASE_URL) {
  // Railway production: use DATABASE_URL
  pool = mysql.createPool(process.env.DATABASE_URL);
  console.log("✅ Using DATABASE_URL for MySQL connection");
} else {
  // Local development: fallback to DB_* or MYSQL* env vars
  const dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
  const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || "3306";
  const dbUser = process.env.DB_USER || process.env.MYSQLUSER || "root";
  const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "";
  const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || "faithstate_db";

  // Prevent localhost from being used in production
  if (process.env.NODE_ENV === "production" && (!dbHost || dbHost === "localhost")) {
    throw new Error(
      "❌ Production environment requires DATABASE_URL or DB_HOST/MYSQLHOST (not localhost)"
    );
  }

  const dbConfig = {
    host: dbHost || "localhost",
    port: parseInt(dbPort, 10),
    user: dbUser,
    password: dbPassword,
    database: dbName,
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
