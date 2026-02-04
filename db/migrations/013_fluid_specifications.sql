-- AI Inventory Normalization System
-- Migration 013: Fluid specifications with AI label extraction

-- Add spec tracking columns to existing parts_inventory
ALTER TABLE parts_inventory 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),           -- 'fluid', 'filter', 'part', 'supply'
  ADD COLUMN IF NOT EXISTS needs_spec_review BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS spec_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS label_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS has_detailed_specs BOOLEAN DEFAULT false;

-- Create fluid specifications table (detailed specs from label scanning)
CREATE TABLE IF NOT EXISTS fluid_specifications (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER UNIQUE REFERENCES parts_inventory(id) ON DELETE CASCADE,
  
  -- Basic classification
  fluid_type VARCHAR(50),        -- 'engine_oil', 'transmission_fluid', 'coolant', 'brake_fluid', etc.
  base_stock VARCHAR(50),         -- 'full_synthetic', 'synthetic_blend', 'conventional', 'mineral'
  
  -- Viscosity/Grade
  viscosity VARCHAR(20),          -- '0W20', '5W30', '75W90', 'DOT4', etc.
  
  -- Industry standards
  api_service_class VARCHAR(100), -- 'SP', 'SN-PLUS', 'CK-4'
  acea_class VARCHAR(100),        -- 'C3', 'C5', 'A3/B4'
  ilsac_class VARCHAR(50),        -- 'GF-6A', 'GF-6B'
  jaso_class VARCHAR(50),         -- 'MA', 'MA2' (for motorcycles)
  
  -- OEM approvals (JSONB array for multiple approvals)
  -- Example: ["GM-DEXOS1-G3", "VW-504.00", "VOLVO-VCC-RBS0-2AE"]
  oem_approvals JSONB DEFAULT '[]'::jsonb,
  
  -- Additional properties
  low_saps BOOLEAN DEFAULT false,
  high_mileage BOOLEAN DEFAULT false,
  temperature_range VARCHAR(50),   -- '-40°F to 400°F'
  
  -- Product details
  product_name VARCHAR(255),
  container_size VARCHAR(50),      -- '5 quarts', '1 gallon'
  
  -- Quality metadata
  confidence_score DECIMAL(3,2),   -- 0.95 = 95% confident in extraction
  extraction_method VARCHAR(50) DEFAULT 'ai_vision',  -- 'ai_vision', 'manual_entry', 'barcode_lookup'
  extraction_date TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  verified_by INTEGER,  -- FK to users(id) when auth system exists
  verified_at TIMESTAMP
);

-- Indexes for fast searching and matching
CREATE INDEX idx_fluid_specs_inventory ON fluid_specifications(inventory_id);
CREATE INDEX idx_fluid_specs_type ON fluid_specifications(fluid_type);
CREATE INDEX idx_fluid_specs_viscosity ON fluid_specifications(viscosity);
CREATE INDEX idx_fluid_specs_oem ON fluid_specifications USING gin(oem_approvals);
CREATE INDEX idx_fluid_specs_confidence ON fluid_specifications(confidence_score) WHERE confidence_score < 0.8;

-- Full-text search on product names
CREATE INDEX idx_fluid_specs_product_search ON fluid_specifications USING GIN(to_tsvector('english', product_name));

-- Create OEM specification mapping/normalization table
-- Maps common variations to standardized codes
CREATE TABLE IF NOT EXISTS oem_spec_mappings (
  id SERIAL PRIMARY KEY,
  raw_text VARCHAR(255) NOT NULL,      -- What appears on bottle: "dexos1™ Gen 3"
  normalized_code VARCHAR(100) NOT NULL, -- Standardized: "GM-DEXOS1-G3"
  manufacturer VARCHAR(100),            -- "General Motors"
  spec_type VARCHAR(50),                -- "oil", "coolant", "transmission", "brake"
  supersedes VARCHAR(100),              -- If this replaces an older spec
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast normalization lookups (case-insensitive)
CREATE INDEX idx_oem_mappings_raw_text ON oem_spec_mappings(LOWER(raw_text));
CREATE INDEX idx_oem_mappings_normalized ON oem_spec_mappings(normalized_code);
CREATE INDEX idx_oem_mappings_manufacturer ON oem_spec_mappings(manufacturer);

-- Seed common OEM specification mappings
-- General Motors (GM) - dexos specifications
INSERT INTO oem_spec_mappings (raw_text, normalized_code, manufacturer, spec_type, notes) VALUES
  ('dexos1 Gen 3', 'GM-DEXOS1-G3', 'General Motors', 'oil', 'Latest GM gasoline engine oil spec'),
  ('dexos1™ Gen 3', 'GM-DEXOS1-G3', 'General Motors', 'oil', 'Latest GM gasoline engine oil spec'),
  ('dexos1 Generation 3', 'GM-DEXOS1-G3', 'General Motors', 'oil', 'Latest GM gasoline engine oil spec'),
  ('dexos1 Gen 2', 'GM-DEXOS1-G2', 'General Motors', 'oil', 'Older GM gasoline spec'),
  ('dexos1™ Gen 2', 'GM-DEXOS1-G2', 'General Motors', 'oil', 'Older GM gasoline spec'),
  ('dexos2', 'GM-DEXOS2', 'General Motors', 'oil', 'GM diesel engine oil spec'),
  ('dexos2™', 'GM-DEXOS2', 'General Motors', 'oil', 'GM diesel engine oil spec'),
  ('dexos-D', 'GM-DEXOS-D', 'General Motors', 'oil', 'GM diesel oil specification'),
  
  -- Ford specifications
  ('WSS-M2C947-B1', 'FORD-WSS-M2C947-B1', 'Ford', 'oil', 'Ford 0W-20 oil spec'),
  ('WSS-M2C947-A', 'FORD-WSS-M2C947-A', 'Ford', 'oil', 'Previous Ford 0W-20 spec'),
  ('WSS-M2C946-A', 'FORD-WSS-M2C946-A', 'Ford', 'oil', 'Ford 5W-20 oil spec'),
  ('WSS-M2C930-A', 'FORD-WSS-M2C930-A', 'Ford', 'oil', 'Ford 5W-30 oil spec'),
  ('WSS-M2C945-B1', 'FORD-WSS-M2C945-B1', 'Ford', 'oil', 'Ford diesel oil spec'),
  ('MERCON V', 'FORD-MERCON-V', 'Ford', 'transmission', 'Ford transmission fluid'),
  ('MERCON LV', 'FORD-MERCON-LV', 'Ford', 'transmission', 'Ford low-viscosity ATF'),
  ('MERCON ULV', 'FORD-MERCON-ULV', 'Ford', 'transmission', 'Ford ultra-low viscosity ATF'),
  
  -- Honda/Acura
  ('Honda HTO-06', 'HONDA-HTO-06', 'Honda', 'oil', 'Honda gasoline engine oil'),
  ('Acura HTO-06', 'HONDA-HTO-06', 'Acura', 'oil', 'Same as Honda HTO-06'),
  
  -- Toyota/Lexus
  ('Toyota Certified', 'TOYOTA-CERTIFIED', 'Toyota', 'oil', 'Toyota certified engine oil'),
  
  -- Volkswagen/Audi
  ('VW 502 00', 'VW-502.00', 'Volkswagen', 'oil', 'VW gasoline engine oil'),
  ('VW 504 00', 'VW-504.00', 'Volkswagen', 'oil', 'VW longlife oil (gasoline)'),
  ('VW 505 00', 'VW-505.00', 'Volkswagen', 'oil', 'VW diesel engine oil'),
  ('VW 505 01', 'VW-505.01', 'Volkswagen', 'oil', 'VW TDI diesel with DPF'),
  ('VW 507 00', 'VW-507.00', 'Volkswagen', 'oil', 'VW longlife oil (diesel)'),
  ('VW 508 00', 'VW-508.00', 'Volkswagen', 'oil', 'Latest VW low-SAPS oil'),
  ('VW 509 00', 'VW-509.00', 'Volkswagen', 'oil', 'Latest VW low-SAPS oil'),
  
  -- BMW
  ('BMW LL-01', 'BMW-LL-01', 'BMW', 'oil', 'BMW Longlife-01 gasoline'),
  ('BMW LL-04', 'BMW-LL-04', 'BMW', 'oil', 'BMW Longlife-04 (diesel/gas)'),
  ('BMW LL-14', 'BMW-LL-14', 'BMW', 'oil', 'Latest BMW low-SAPS spec'),
  ('BMW LL-17', 'BMW-LL-17', 'BMW', 'oil', 'BMW hybrid/electric spec'),
  
  -- Mercedes-Benz
  ('MB 229.3', 'MB-229.3', 'Mercedes-Benz', 'oil', 'MB older gasoline spec'),
  ('MB 229.5', 'MB-229.5', 'Mercedes-Benz', 'oil', 'MB longlife gasoline'),
  ('MB 229.31', 'MB-229.31', 'Mercedes-Benz', 'oil', 'MB low-SAPS diesel'),
  ('MB 229.51', 'MB-229.51', 'Mercedes-Benz', 'oil', 'MB low-SAPS longlife'),
  ('MB 229.52', 'MB-229.52', 'Mercedes-Benz', 'oil', 'Latest MB low-SAPS'),
  ('MB 229.71', 'MB-229.71', 'Mercedes-Benz', 'oil', 'MB latest gasoline spec'),
  
  -- Porsche
  ('Porsche A40', 'PORSCHE-A40', 'Porsche', 'oil', 'Porsche gasoline engine oil'),
  ('Porsche C30', 'PORSCHE-C30', 'Porsche', 'oil', 'Porsche diesel engine oil'),
  
  -- Volvo
  ('VCC RBS0-2AE', 'VOLVO-VCC-RBS0-2AE', 'Volvo', 'oil', 'Volvo gasoline/diesel oil'),
  ('Volvo VCC RBS0-2AE', 'VOLVO-VCC-RBS0-2AE', 'Volvo', 'oil', 'Volvo gasoline/diesel oil'),
  
  -- FCA/Stellantis (Chrysler, Dodge, Jeep, Ram)
  ('MS-6395', 'FCA-MS-6395', 'FCA/Stellantis', 'oil', 'Chrysler/Dodge/Jeep/Ram spec'),
  ('MS-12991', 'FCA-MS-12991', 'FCA/Stellantis', 'oil', 'FCA diesel oil spec'),
  
  -- Nissan/Infiniti
  ('Nissan Certified', 'NISSAN-CERTIFIED', 'Nissan', 'oil', 'Nissan certified oil'),
  
  -- Mazda
  ('Mazda Certified', 'MAZDA-CERTIFIED', 'Mazda', 'oil', 'Mazda certified oil'),
  
  -- Subaru
  ('Subaru Certified', 'SUBARU-CERTIFIED', 'Subaru', 'oil', 'Subaru certified oil')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE fluid_specifications IS 'Detailed specifications extracted from product labels using AI vision';
COMMENT ON COLUMN fluid_specifications.oem_approvals IS 'JSON array of normalized OEM approval codes';
COMMENT ON COLUMN fluid_specifications.confidence_score IS 'AI extraction confidence (0.0-1.0), <0.8 needs review';
COMMENT ON TABLE oem_spec_mappings IS 'Maps label text variations to standardized OEM specification codes';
