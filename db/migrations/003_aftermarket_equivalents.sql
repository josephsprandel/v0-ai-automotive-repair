-- Aftermarket fluid equivalents
CREATE TABLE IF NOT EXISTS fluid_equivalents (
  id SERIAL PRIMARY KEY,
  
  -- OEM fluid reference
  oem_specification VARCHAR(200) NOT NULL,     -- "Honda HCF-2", "Ford Motorcraft XT-10-QLVC"
  oem_manufacturer VARCHAR(50) NOT NULL,       -- "Honda", "Ford", "Toyota"
  oem_part_number VARCHAR(100),                -- OEM part number
  
  -- Aftermarket equivalent
  aftermarket_brand VARCHAR(100) NOT NULL,     -- "Valvoline", "Mobil 1", "Castrol"
  aftermarket_product VARCHAR(200) NOT NULL,   -- "MaxLife CVT Fluid"
  aftermarket_part_number VARCHAR(100),        -- Aftermarket SKU
  
  -- Fluid type
  fluid_type VARCHAR(50) NOT NULL,             -- engine_oil, transmission_fluid, etc.
  
  -- Confidence & verification
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  certification_status VARCHAR(50),            -- "OEM_APPROVED", "MEETS_SPEC", "EQUIVALENT"
  verification_source TEXT,                    -- Where we got this info
  
  -- Technical specs (for AI matching)
  viscosity VARCHAR(50),
  api_rating VARCHAR(100),
  oem_approvals TEXT[],                        -- Array of OEM approval codes
  meets_specifications TEXT[],                 -- ["DEXRON VI", "MERCON LV"]
  
  -- Availability & pricing
  widely_available BOOLEAN DEFAULT false,      -- Is it at AutoZone/O'Reilly?
  avg_price_per_quart DECIMAL(6,2),
  
  -- Notes
  notes TEXT,                                  -- "Honda certified", "OEM supplier", etc.
  warnings TEXT,                               -- "Not for 2015-2016 models", etc.
  
  -- Metadata
  extracted_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  
  UNIQUE(oem_specification, aftermarket_brand, aftermarket_product)
);

-- Indexes
CREATE INDEX idx_equiv_oem_spec ON fluid_equivalents(oem_specification);
CREATE INDEX idx_equiv_fluid_type ON fluid_equivalents(fluid_type);
CREATE INDEX idx_equiv_confidence ON fluid_equivalents(confidence_score DESC);
CREATE INDEX idx_equiv_available ON fluid_equivalents(widely_available);

COMMENT ON TABLE fluid_equivalents IS 'AI-analyzed aftermarket equivalents for OEM fluids - THE MONEY TABLE';
COMMENT ON COLUMN fluid_equivalents.confidence_score IS '0-100: How confident we are this is equivalent';
COMMENT ON COLUMN fluid_equivalents.certification_status IS 'OEM_APPROVED > MEETS_SPEC > EQUIVALENT';
