require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const connection = process.env.DATABASE_URL
  ? await mysql.createConnection(process.env.DATABASE_URL)
  : await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "faithstate_db",
    });

  try {
    // Seed categories
    await connection.query(`
      INSERT INTO categories (name, description, icon, color) VALUES
      ('Residential', 'Family homes, condos, and apartments', 'home', 'blue'),
      ('Commercial', 'Office spaces and retail locations', 'building', 'coral'),
      ('Land & Plots', 'Vacant land and development plots', 'tree', 'green'),
      ('Industrial', 'Warehouses and manufacturing spaces', 'factory', 'orange')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Admin', 'admin@faithstate.com', '${hashedPassword}', 'admin')
      ON DUPLICATE KEY UPDATE email = VALUES(email)
    `);

    // Seed agents
    await connection.query(`
      INSERT INTO agents (name, title, specialty, experience, rating, reviews, sales, image) VALUES
      ('Sarah Johnson', 'Senior Real Estate Agent', 'Luxury Homes', 8, 4.9, 127, '$12M+', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'),
      ('Michael Chen', 'Commercial Property Expert', 'Commercial Real Estate', 12, 4.8, 89, '$25M+', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'),
      ('Emily Rodriguez', 'First-Time Buyer Specialist', 'Residential Properties', 6, 4.9, 156, '$8M+', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);

    // Seed properties
    await connection.query(`
      INSERT INTO properties (title, description, price, location, region, bedrooms, bathrooms, sqft, image, featured, category_id) VALUES
      ('Modern Luxury Villa', 'Stunning modern villa with pool and panoramic views', 450000, 'Garowe', 'Puntland', 4, 3, 3200, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop', TRUE, 1),
      ('Contemporary Apartment', 'Sleek urban apartment in prime location', 280000, 'Garowe', 'Puntland', 3, 2, 2100, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', TRUE, 1),
      ('Seaside Paradise', 'Beachfront property with direct ocean access', 520000, 'Garowe', 'Puntland', 5, 4, 4500, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop', TRUE, 1),
      ('Urban Loft', 'Industrial-style loft in the heart of the city', 195000, 'Mogadishu', 'Banaadir', 2, 2, 1800, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop', FALSE, 1),
      ('Family Estate', 'Spacious family home with large garden', 350000, 'Hargeisa', 'Somaliland', 6, 4, 5200, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', FALSE, 1),
      ('Coastal Retreat', 'Tranquil coastal property perfect for relaxation', 480000, 'Bosaso', 'Puntland', 4, 3, 3800, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop', FALSE, 1)
      ON DUPLICATE KEY UPDATE title = VALUES(title)
    `);

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  } finally {
    await connection.end();
  }


seed();
