-- Migration: Create shop_profile table for shop settings
-- Created: 2026-02-01

-- Create shop_profile table (single row table for shop settings)
CREATE TABLE IF NOT EXISTS shop_profile (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  dba_name VARCHAR(255),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  services_description TEXT,
  tags TEXT[], -- Array of specialty tags
  parts_markup_percent DECIMAL(5,2) DEFAULT 35.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create operating_hours table
CREATE TABLE IF NOT EXISTS shop_operating_hours (
  id SERIAL PRIMARY KEY,
  day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday, etc.
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Seed with AutoHouse defaults
INSERT INTO shop_profile (
  shop_name, 
  address_line1, 
  city, 
  state, 
  zip, 
  phone, 
  email, 
  website,
  services_description,
  tags,
  parts_markup_percent
) VALUES (
  'AutoHouse NWA',
  '1234 Main Street, Suite 100',
  'Bentonville',
  'AR',
  '72712',
  '(479) 555-0123',
  'service@autohousenwa.com',
  'https://autohousenwa.com',
  'Full-service auto repair specializing in domestic and Asian vehicles. ASE-certified technicians. Services include engine diagnostics, brake repair, transmission service, AC repair, electrical systems, and routine maintenance. Factory-scheduled maintenance for all makes and models.',
  ARRAY['ASE Certified', 'AAA Approved', 'Domestic', 'Asian', 'European', 'Hybrid/EV'],
  35.00
) ON CONFLICT DO NOTHING;

-- Seed operating hours
INSERT INTO shop_operating_hours (day_of_week, is_open, open_time, close_time) VALUES
  ('Monday', true, '07:00', '18:00'),
  ('Tuesday', true, '07:00', '18:00'),
  ('Wednesday', true, '07:00', '18:00'),
  ('Thursday', true, '07:00', '18:00'),
  ('Friday', true, '07:00', '18:00'),
  ('Saturday', true, '08:00', '14:00'),
  ('Sunday', false, NULL, NULL)
ON CONFLICT (day_of_week) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_profile_id ON shop_profile(id);
CREATE INDEX IF NOT EXISTS idx_shop_hours_day ON shop_operating_hours(day_of_week);

-- Comments
COMMENT ON TABLE shop_profile IS 'Shop profile and contact information';
COMMENT ON TABLE shop_operating_hours IS 'Shop operating hours by day of week';
