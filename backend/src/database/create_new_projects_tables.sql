-- Migration script to create new_projects tables
-- Run this script if the tables don't exist yet
-- Usage: mysql -u root -p faithstate_db < create_new_projects_tables.sql

USE faithstate_db;

-- New Projects table (for Bayut-style projects)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project images table
CREATE TABLE IF NOT EXISTS project_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES new_projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project payment milestones table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

