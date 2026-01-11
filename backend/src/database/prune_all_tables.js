require('dotenv').config();
const mysql = require('mysql2/promise');

const dropAllTables = async () => {
  let connection;

  // Connection logic mirroring your migration file
  try {
    if (process.env.DATABASE_URL) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
      console.log("🚀 Connected via DATABASE_URL");
    } else {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306", 10),
        user: process.env.DB_USER || process.env.MYSQLUSER || "root",
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || "faithstate_db",
      });
      console.log("🚀 Connected via Local/Environment Config");
    }

    console.log("⚠️  Starting destructive drop operation...");

    // 1. Disable Foreign Key Checks (Crucial for linked tables)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Fetch all table names from the current database
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);

    if (tables.length === 0) {
      console.log("ℹ️  No tables found in the database.");
    } else {
      // 3. Construct and execute DROP statements
      for (let table of tables) {
        const tableName = table.TABLE_NAME || table.table_name;
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`  - Deleted: ${tableName}`);
      }
      console.log(`✅ Success: ${tables.length} tables removed.`);
    }

    // 4. Re-enable Foreign Key Checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  } catch (error) {
    console.error("❌ Error during drop operation:", error.message);
    // Try to re-enable checks even if it fails
    if (connection) await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Connection closed.");
    }
    process.exit();
  }
};

dropAllTables();