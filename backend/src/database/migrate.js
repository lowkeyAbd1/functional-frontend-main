require('dotenv').config();
const mysql = require('mysql2/promise');

const migrate = async () => {
  // Prefer DATABASE_URL (Railway), fallback to DB_* for local development
  let connection;
  
  if (process.env.DATABASE_URL) {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("✅ Using DATABASE_URL for migration");
  } else {
    // Local development fallback
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
      port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306", 10),
      user: process.env.DB_USER || process.env.MYSQLUSER || "root",
      password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
      database: process.env.DB_NAME || process.env.MYSQLDATABASE || "faithstate_db",
    });
    console.log("✅ Using DB_HOST/MYSQLHOST for migration");
  }


  try {
    // // Create database if not exists
    // await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'faithstate_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    // await connection.query(`USE ${process.env.DB_NAME || 'faithstate_db'}`);

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'agent', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(255) NULL,
        color VARCHAR(50),
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add slug and is_active columns if they don't exist (for existing databases)
    try {
      await connection.query(`
        ALTER TABLE categories 
        ADD COLUMN slug VARCHAR(100) NULL AFTER name
      `);
    } catch (err) {
      // Column may already exist, ignore
      if (!err.message.includes('Duplicate column name')) {
        console.warn('Warning adding slug column:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE categories 
        ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER icon
      `);
    } catch (err) {
      // Column may already exist, ignore
      if (!err.message.includes('Duplicate column name')) {
        console.warn('Warning adding is_active column:', err.message);
      }
    }

    // Update slug to be unique if not already
    try {
      await connection.query(`
        ALTER TABLE categories 
        ADD UNIQUE INDEX idx_slug (slug)
      `);
    } catch (err) {
      // Index may already exist, ignore
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding slug index:', err.message);
      }
    }

    // Add indexes on properties table if they don't exist
    try {
      await connection.query(`
        ALTER TABLE properties 
        ADD INDEX idx_category_id (category_id)
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding category_id index:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE properties 
        ADD INDEX idx_featured (featured)
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding featured index:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE properties 
        ADD INDEX idx_location (location(100))
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding location index:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE properties 
        ADD INDEX idx_region (region)
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding region index:', err.message);
      }
    }

    // Properties table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12, 2) NOT NULL,
        location VARCHAR(255) NOT NULL,
        region VARCHAR(100) NOT NULL,
        bedrooms INT DEFAULT 0,
        bathrooms INT DEFAULT 0,
        sqft INT DEFAULT 0,
        image VARCHAR(500),
        featured BOOLEAN DEFAULT FALSE,
        category_id INT,
        agent_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Agents table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        specialty VARCHAR(255),
        experience INT DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 0,
        reviews INT DEFAULT 0,
        sales VARCHAR(50),
        image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Contact submissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(191) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        property_id INT,
        status ENUM('new', 'contacted', 'closed') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add index on contacts status if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE contacts 
        ADD INDEX idx_status (status)
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding status index:', err.message);
      }
    }

    // Favorites table (for user property favorites)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        property_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        UNIQUE KEY unique_favorite (user_id, property_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Services table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(255) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add index on services is_active if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE services 
        ADD INDEX idx_is_active (is_active)
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding is_active index:', err.message);
      }
    }

    // Projects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        price_from DECIMAL(12, 2) NULL,
        developer VARCHAR(255),
        description TEXT,
        image VARCHAR(500),
        status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add indexes on projects table if they don't exist
    try {
      await connection.query(`
        ALTER TABLE projects 
        ADD INDEX idx_status (status)
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding status index:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE projects 
        ADD INDEX idx_is_featured (is_featured)
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding is_featured index:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE projects 
        ADD INDEX idx_location (location(100))
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) {
        console.warn('Warning adding location index:', err.message);
      }
    }

    // New Projects table (for Bayut-style projects)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS new_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        developer VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        status ENUM('Under Construction', 'Ready') DEFAULT 'Under Construction',
        handover VARCHAR(50),
        launch_price VARCHAR(50),
        payment_plan_label VARCHAR(20),
        description TEXT,
        category VARCHAR(50),
        beds INT,
        baths INT,
        completion_percent INT,
        is_published TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_status (status),
        INDEX idx_location (location(100)),
        INDEX idx_is_published (is_published)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Project images table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES new_projects(id) ON DELETE CASCADE,
        INDEX idx_project_id (project_id),
        INDEX idx_sort_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Project payment milestones table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_payment_milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        label VARCHAR(255) NOT NULL,
        percent DECIMAL(5, 2) NOT NULL,
        note VARCHAR(255),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES new_projects(id) ON DELETE CASCADE,
        INDEX idx_project_id (project_id),
        INDEX idx_sort_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Properties table (enhanced Bayut-style)
    // First, check if table exists and add missing columns
    try {
      const [existingColumns] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties'
      `);
      const columnNames = existingColumns.map((col) => col.COLUMN_NAME);
      const tableExists = columnNames.length > 0;

      if (tableExists) {
        console.log('📋 Properties table exists, checking for missing columns...');
        
        // Add slug if missing
        if (!columnNames.includes('slug')) {
          try {
            await connection.query(`ALTER TABLE properties ADD COLUMN slug VARCHAR(120) NULL AFTER title`);
            console.log('✅ Added slug column');
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
          }
        }
        
        // Add type if missing (CRITICAL - this is causing the error)
        // Use VARCHAR instead of ENUM for flexibility
        if (!columnNames.includes('type')) {
          try {
            await connection.query(`ALTER TABLE properties ADD COLUMN type VARCHAR(50) NULL AFTER slug`);
            await connection.query(`UPDATE properties SET type = 'Apartment' WHERE type IS NULL`);
            await connection.query(`ALTER TABLE properties MODIFY COLUMN type VARCHAR(50) NOT NULL`);
            console.log('✅ Added type column');
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
          }
        }
        
        // Add purpose if missing
        if (!columnNames.includes('purpose')) {
          try {
            await connection.query(`ALTER TABLE properties ADD COLUMN purpose ENUM('Rent','Sale') NULL AFTER type`);
            await connection.query(`UPDATE properties SET purpose = 'Sale' WHERE purpose IS NULL`);
            await connection.query(`ALTER TABLE properties MODIFY COLUMN purpose ENUM('Rent','Sale') NOT NULL`);
            console.log('✅ Added purpose column');
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
          }
        }
        
        // Add other missing columns
        const columnsToAdd = [
          { name: 'currency', sql: `VARCHAR(10) DEFAULT 'USD' AFTER price` },
          { name: 'rent_period', sql: `ENUM('Daily','Weekly','Monthly','Yearly') NULL AFTER currency` },
          { name: 'beds', sql: `INT NULL AFTER rent_period` },
          { name: 'baths', sql: `INT NULL AFTER beds` },
          { name: 'area', sql: `DECIMAL(10,2) NULL AFTER baths` },
          { name: 'area_unit', sql: `ENUM('sqm','sqft') DEFAULT 'sqm' AFTER area` },
          { name: 'city', sql: `VARCHAR(100) NULL AFTER location` },
          { name: 'amenities', sql: `JSON NULL AFTER description` },
          { name: 'agent_name', sql: `VARCHAR(255) NULL AFTER amenities` },
          { name: 'agent_phone', sql: `VARCHAR(30) NULL AFTER agent_name` },
          { name: 'whatsapp', sql: `VARCHAR(30) NULL AFTER agent_phone` },
          { name: 'latitude', sql: `DECIMAL(10,7) NULL AFTER whatsapp` },
          { name: 'longitude', sql: `DECIMAL(10,7) NULL AFTER latitude` },
          { name: 'is_featured', sql: `TINYINT(1) DEFAULT 0 AFTER longitude` },
          { name: 'is_published', sql: `TINYINT(1) DEFAULT 1 AFTER is_featured` },
        ];
        
        for (const col of columnsToAdd) {
          if (!columnNames.includes(col.name)) {
            try {
              await connection.query(`ALTER TABLE properties ADD COLUMN ${col.name} ${col.sql}`);
              console.log(`✅ Added ${col.name} column`);
            } catch (e) {
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.warn(`⚠️  Could not add ${col.name}:`, e.message);
              }
            }
          }
        }
        
        // Migrate data from old columns to new columns
        if (columnNames.includes('bedrooms') && columnNames.includes('beds')) {
          await connection.query(`UPDATE properties SET beds = bedrooms WHERE beds IS NULL AND bedrooms IS NOT NULL`);
        }
        if (columnNames.includes('bathrooms') && columnNames.includes('baths')) {
          await connection.query(`UPDATE properties SET baths = bathrooms WHERE baths IS NULL AND bathrooms IS NOT NULL`);
        }
        if (columnNames.includes('sqft') && columnNames.includes('area')) {
          await connection.query(`UPDATE properties SET area = sqft WHERE area IS NULL AND sqft IS NOT NULL`);
        }
        if (columnNames.includes('featured') && columnNames.includes('is_featured')) {
          await connection.query(`UPDATE properties SET is_featured = CASE WHEN featured = TRUE THEN 1 ELSE 0 END WHERE is_featured = 0 AND featured IS NOT NULL`);
        }
        
        // Set defaults for new columns
        if (columnNames.includes('currency')) {
          await connection.query(`UPDATE properties SET currency = 'USD' WHERE currency IS NULL OR currency = ''`);
        }
        if (columnNames.includes('is_published')) {
          await connection.query(`UPDATE properties SET is_published = 1 WHERE is_published IS NULL`);
        }
        
        // Add indexes (with error handling)
        const indexesToAdd = [
          { name: 'idx_type', sql: `CREATE INDEX idx_type ON properties(type)` },
          { name: 'idx_purpose', sql: `CREATE INDEX idx_purpose ON properties(purpose)` },
          { name: 'idx_is_published', sql: `CREATE INDEX idx_is_published ON properties(is_published)` },
          { name: 'idx_is_featured', sql: `CREATE INDEX idx_is_featured ON properties(is_featured)` },
        ];
        
        for (const idx of indexesToAdd) {
          try {
            await connection.query(idx.sql);
            console.log(`✅ Added ${idx.name} index`);
          } catch (idxError) {
            if (idxError.code !== 'ER_DUP_KEYNAME') {
              console.warn(`⚠️  Could not add ${idx.name}:`, idxError.message);
            }
          }
        }
      }
    } catch (alterError) {
      console.warn('⚠️  Error checking/altering properties table:', alterError.message);
    }

    // Create properties table if it doesn't exist (with all new columns)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(120) NULL,
        type VARCHAR(50) NOT NULL,
        purpose ENUM('Rent','Sale') NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        rent_period ENUM('Daily','Weekly','Monthly','Yearly') NULL,
        beds INT NULL,
        baths INT NULL,
        area DECIMAL(10,2) NULL,
        area_unit ENUM('sqm','sqft') DEFAULT 'sqm',
        location VARCHAR(255) NOT NULL,
        city VARCHAR(100) NULL,
        description TEXT,
        amenities JSON NULL,
        agent_name VARCHAR(255) NULL,
        agent_phone VARCHAR(30) NULL,
        whatsapp VARCHAR(30) NULL,
        latitude DECIMAL(10,7) NULL,
        longitude DECIMAL(10,7) NULL,
        is_featured TINYINT(1) DEFAULT 0,
        is_published TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_purpose (purpose),
        INDEX idx_type (type),
        INDEX idx_location (location(100)),
        INDEX idx_is_published (is_published),
        INDEX idx_is_featured (is_featured)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Property images table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS property_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        INDEX idx_property_id (property_id),
        INDEX idx_sort_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add slug column if it doesn't exist (for existing tables)
    try {
      await connection.query(`
        ALTER TABLE properties
        ADD COLUMN slug VARCHAR(120) NULL AFTER title
      `);
      console.log('✅ Added slug column to properties table');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.warn('⚠️  Slug column may already exist:', error.message);
      }
    }

    // Add UNIQUE constraint to slug if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE properties
        ADD UNIQUE INDEX idx_slug_unique (slug)
      `);
      console.log('✅ Added unique index on slug');
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        console.warn('⚠️  Unique index on slug may already exist:', error.message);
      }
    }

    // Backfill slugs for existing properties
    try {
      const [propertiesWithoutSlug] = await connection.query(`
        SELECT id, title FROM properties WHERE slug IS NULL OR slug = ''
      `);
      
      if (propertiesWithoutSlug.length > 0) {
        console.log(`📝 Backfilling slugs for ${propertiesWithoutSlug.length} properties...`);
        for (const prop of propertiesWithoutSlug) {
          const slug = prop.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          // Ensure uniqueness by appending id if needed
          let uniqueSlug = slug;
          let counter = 1;
          while (true) {
            const [existing] = await connection.query(
              'SELECT id FROM properties WHERE slug = ? AND id != ?',
              [uniqueSlug, prop.id]
            );
            if (existing.length === 0) break;
            uniqueSlug = `${slug}-${counter}`;
            counter++;
          }
          
          await connection.query(
            'UPDATE properties SET slug = ? WHERE id = ?',
            [uniqueSlug, prop.id]
          );
        }
        console.log('✅ Backfilled slugs for existing properties');
      }
    } catch (error) {
      console.warn('⚠️  Error backfilling slugs:', error.message);
    }

    // Make slug NOT NULL after backfilling
    try {
      await connection.query(`
        ALTER TABLE properties
        MODIFY COLUMN slug VARCHAR(120) NOT NULL
      `);
      console.log('✅ Made slug column NOT NULL');
    } catch (error) {
      console.warn('⚠️  Could not make slug NOT NULL:', error.message);
    }

    // Add missing columns to agents table for Find My Agent
    try {
      const [agentColumns] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agents'
      `);
      const agentColumnNames = agentColumns.map((col) => col.COLUMN_NAME);

      const agentColumnsToAdd = [
        { name: 'city', sql: `VARCHAR(100) NULL` },
        { name: 'languages', sql: `VARCHAR(255) NULL` },
        { name: 'specialization', sql: `VARCHAR(100) NULL` },
        { name: 'profile_photo', sql: `VARCHAR(255) NULL` },
        { name: 'company', sql: `VARCHAR(150) NULL` },
        { name: 'phone', sql: `VARCHAR(50) NULL` },
        { name: 'whatsapp', sql: `VARCHAR(50) NULL` },
      ];

      for (const col of agentColumnsToAdd) {
        if (!agentColumnNames.includes(col.name)) {
          try {
            await connection.query(`ALTER TABLE agents ADD COLUMN ${col.name} ${col.sql}`);
            console.log(`✅ Added ${col.name} column to agents table`);
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') {
              console.warn(`⚠️  Could not add ${col.name} to agents:`, e.message);
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Error updating agents table:', error.message);
    }

    // Agent stories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agent_stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT NOT NULL,
        title VARCHAR(255) NULL,
        project_name VARCHAR(255) NULL,
        caption TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        INDEX idx_stories_active (is_active, expires_at, created_at),
        INDEX idx_stories_agent (agent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Story media items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agent_story_media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        story_id INT NOT NULL,
        media_type ENUM('image','video') NOT NULL,
        media_url VARCHAR(500) NOT NULL,
        thumb_url VARCHAR(500) NULL,
        duration_sec INT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES agent_stories(id) ON DELETE CASCADE,
        INDEX idx_story_media_story (story_id, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Story views table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agent_story_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        story_id INT NOT NULL,
        viewer_user_id INT NULL,
        viewer_ip VARCHAR(80) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES agent_stories(id) ON DELETE CASCADE,
        INDEX idx_story_views_story (story_id),
        INDEX idx_story_views_user_ip (story_id, viewer_user_id, viewer_ip)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await connection.end();
  }
};

migrate();
