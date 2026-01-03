-- Seed data for properties table
-- Run this after creating the properties table

USE faithstate_db;

-- Sample properties for Mogadishu, Garowe, and Bosaso
INSERT INTO properties (title, slug, type, purpose, price, currency, rent_period, beds, baths, area, area_unit, location, city, description, amenities, agent_name, agent_phone, whatsapp, is_featured, is_published) VALUES
(
  'Modern Villa in Hodan District',
  'modern-villa-hodan-district',
  'Villa',
  'Sale',
  450000,
  'USD',
  NULL,
  4,
  5,
  420,
  'sqm',
  'Hodan District',
  'Mogadishu',
  'Beautiful modern villa with garden, perfect for families. Features spacious rooms, modern kitchen, and private garden.',
  '["Swimming Pool", "Garden", "Parking", "Security", "Modern Kitchen"]',
  'Ahmed Hassan',
  '+252612345678',
  '+252612345678',
  1,
  1
),
(
  'Luxury Apartment Downtown',
  'luxury-apartment-downtown-mogadishu',
  'Apartment',
  'Rent',
  1200,
  'USD',
  'Monthly',
  3,
  4,
  180,
  'sqm',
  'Downtown',
  'Mogadishu',
  'Premium apartment in the heart of Mogadishu with stunning city views. Fully furnished and ready to move in.',
  '["Balcony", "Parking", "Elevator", "Security", "Furnished"]',
  'Fatima Ali',
  '+252612345679',
  '+252612345679',
  1,
  1
),
(
  'Spacious House in Garowe',
  'spacious-house-garowe',
  'House',
  'Sale',
  280000,
  'USD',
  NULL,
  5,
  4,
  350,
  'sqm',
  'Garowe City Center',
  'Garowe',
  'Large family house with multiple bedrooms, perfect for extended families. Includes large yard and parking space.',
  '["Large Yard", "Parking", "Security", "Multiple Floors"]',
  'Mohamed Abdi',
  '+252612345680',
  '+252612345680',
  0,
  1
),
(
  'Commercial Office Space',
  'commercial-office-space-bosaso',
  'Office',
  'Rent',
  800,
  'USD',
  'Monthly',
  NULL,
  2,
  150,
  'sqm',
  'Business District',
  'Bosaso',
  'Prime office space in Bosaso business district. Ideal for businesses looking for professional workspace.',
  '["Parking", "Security", "Reception Area", "Meeting Rooms"]',
  'Amina Mohamed',
  '+252612345681',
  '+252612345681',
  0,
  1
),
(
  'Beachfront Villa',
  'beachfront-villa-mogadishu',
  'Villa',
  'Sale',
  650000,
  'USD',
  NULL,
  6,
  5,
  500,
  'sqm',
  'Lido Beach',
  'Mogadishu',
  'Stunning beachfront villa with direct beach access. Features panoramic ocean views and luxury finishes throughout.',
  '["Beach Access", "Swimming Pool", "Garden", "Parking", "Ocean View"]',
  'Omar Hassan',
  '+252612345682',
  '+252612345682',
  1,
  1
);

-- Add images for the first property
SET @property1_id = (SELECT id FROM properties WHERE slug = 'modern-villa-hodan-district' LIMIT 1);
INSERT INTO property_images (property_id, url, sort_order) VALUES
(@property1_id, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', 0),
(@property1_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 1),
(@property1_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 2);

-- Add images for the second property
SET @property2_id = (SELECT id FROM properties WHERE slug = 'luxury-apartment-downtown-mogadishu' LIMIT 1);
INSERT INTO property_images (property_id, url, sort_order) VALUES
(@property2_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 0),
(@property2_id, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', 1);

-- Add images for the third property
SET @property3_id = (SELECT id FROM properties WHERE slug = 'spacious-house-garowe' LIMIT 1);
INSERT INTO property_images (property_id, url, sort_order) VALUES
(@property3_id, 'https://images.unsplash.com/photo-1568605114252-487b436dc4f1?w=800&q=80', 0),
(@property3_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 1);

-- Add images for the fourth property
SET @property4_id = (SELECT id FROM properties WHERE slug = 'commercial-office-space-bosaso' LIMIT 1);
INSERT INTO property_images (property_id, url, sort_order) VALUES
(@property4_id, 'https://images.unsplash.com/photo-1523217582562-09d2bd2f9430?w=800&q=80', 0);

-- Add images for the fifth property
SET @property5_id = (SELECT id FROM properties WHERE slug = 'beachfront-villa-mogadishu' LIMIT 1);
INSERT INTO property_images (property_id, url, sort_order) VALUES
(@property5_id, 'https://images.unsplash.com/photo-1501183638710-841dd99fd47b?w=800&q=80', 0),
(@property5_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 1),
(@property5_id, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', 2);

