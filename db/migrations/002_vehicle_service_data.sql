-- ============================================================================
-- FLUID SPECIFICATIONS (Primary Value - Source of Truth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fluid_specifications (
  id SERIAL PRIMARY KEY,
  
  -- Vehicle identification
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  
  -- Powertrain specificity (CRITICAL for accuracy)
  engine_displacement VARCHAR(20),        -- "1.5L", "2.0L", "3.5L V6", "5.0L V8"
  engine_code VARCHAR(50),                -- "K20C4", "Coyote", "LS3", "2JZ-GTE"
  transmission_type VARCHAR(50),          -- "CVT", "6MT", "10AT", "8-speed auto"
  drivetrain VARCHAR(20),                 -- "FWD", "RWD", "AWD", "4WD"
  trim_level VARCHAR(100),                -- "LX", "Sport", "Touring", "Limited"
  
  -- Fluid details
  fluid_type VARCHAR(50) NOT NULL,        -- engine_oil, transmission_fluid, coolant, etc.
  specification VARCHAR(200) NOT NULL,    -- "Honda ATF-DW1", "Mobil 1 0W-20"
  viscosity VARCHAR(50),                  -- "5W-30", "75W-90", "DOT 3"
  
  -- Capacities
  capacity_quarts DECIMAL(5,2),           -- US quarts
  capacity_liters DECIMAL(5,2),           -- Liters
  
  -- Standards & ratings
  api_rating VARCHAR(100),                -- "API SN PLUS", "DOT 3", "ACEA C3"
  oem_part_number VARCHAR(100),           -- "08798-9036"
  
  -- Critical info
  notes TEXT,                             -- "DO NOT MIX", "Use only genuine Honda"
  alternative_spec VARCHAR(200),          -- Acceptable alternatives
  variant_notes TEXT,                     -- "Turbo models only", "AWD only"
  
  -- Metadata
  source_pdf VARCHAR(255),
  extracted_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicates while allowing engine variants
  UNIQUE(year, make, model, fluid_type, engine_displacement, transmission_type)
);

-- ============================================================================
-- MAINTENANCE SCHEDULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id SERIAL PRIMARY KEY,
  
  -- Vehicle identification
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  
  -- Powertrain (some services vary by engine)
  engine_displacement VARCHAR(20),
  transmission_type VARCHAR(50),
  
  -- Service details
  mileage_interval INTEGER NOT NULL,      -- 7500, 15000, 30000, etc.
  service_name VARCHAR(200) NOT NULL,
  service_description TEXT,
  service_category VARCHAR(50) NOT NULL,  -- oil_change, tire_service, belts_hoses, etc.
  
  -- Driving conditions
  driving_condition VARCHAR(20) DEFAULT 'normal',  -- "normal" or "severe"
  
  -- Metadata
  source_pdf VARCHAR(255),
  extracted_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(year, make, model, mileage_interval, service_name, driving_condition, engine_displacement)
);

-- ============================================================================
-- TIRE SPECIFICATIONS (High value for service advisors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tire_specifications (
  id SERIAL PRIMARY KEY,
  
  -- Vehicle identification
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim_level VARCHAR(100),
  
  -- Tire specs
  tire_size_front VARCHAR(50) NOT NULL,   -- "245/40R18"
  tire_size_rear VARCHAR(50),             -- May differ on RWD/AWD
  
  -- Pressure (PSI)
  pressure_front_psi INTEGER,             -- 32
  pressure_rear_psi INTEGER,              -- 30
  pressure_spare_psi INTEGER,             -- 60
  
  -- Additional specs
  wheel_size VARCHAR(20),                 -- "18x8.5"
  wheel_offset VARCHAR(20),               -- "+45mm"
  bolt_pattern VARCHAR(20),               -- "5x114.3"
  
  -- TPMS
  tpms_sensor_part_number VARCHAR(100),
  tpms_relearn_procedure TEXT,
  
  -- Rotation
  rotation_pattern VARCHAR(50),           -- "Front-to-rear", "X-pattern", "Side-to-side"
  rotation_interval INTEGER,              -- 7500 miles
  
  -- Notes
  notes TEXT,                             -- "Do not mix tire types", "Winter tire approved"
  
  -- Metadata
  source_pdf VARCHAR(255),
  extracted_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(year, make, model, trim_level, tire_size_front)
);

-- ============================================================================
-- TORQUE SPECIFICATIONS (Valuable for technicians)
-- ============================================================================
CREATE TABLE IF NOT EXISTS torque_specifications (
  id SERIAL PRIMARY KEY,
  
  -- Vehicle identification
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  engine_displacement VARCHAR(20),
  
  -- Component & torque
  component_name VARCHAR(200) NOT NULL,   -- "Wheel lug nuts", "Oil drain plug"
  component_category VARCHAR(50),         -- "wheels", "engine", "transmission"
  torque_value INTEGER,                   -- Torque in ft-lbs (or Nm)
  torque_unit VARCHAR(10) DEFAULT 'ft-lbs', -- "ft-lbs" or "Nm"
  
  -- Additional specs
  thread_size VARCHAR(20),                -- "M12x1.5"
  procedure_notes TEXT,                   -- "Tighten in star pattern", "Hand tight + 3/4 turn"
  
  -- Metadata
  source_pdf VARCHAR(255),
  extracted_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(year, make, model, component_name, engine_displacement)
);

-- ============================================================================
-- INDEXES FOR FAST LOOKUPS
-- ============================================================================

-- Fluid specifications indexes
CREATE INDEX idx_fluid_vehicle ON fluid_specifications(year, make, model);
CREATE INDEX idx_fluid_type ON fluid_specifications(fluid_type);
CREATE INDEX idx_fluid_engine ON fluid_specifications(engine_displacement);
CREATE INDEX idx_fluid_lookup ON fluid_specifications(year, make, model, fluid_type);

-- Maintenance schedules indexes
CREATE INDEX idx_maint_vehicle ON maintenance_schedules(year, make, model);
CREATE INDEX idx_maint_mileage ON maintenance_schedules(mileage_interval);
CREATE INDEX idx_maint_condition ON maintenance_schedules(driving_condition);
CREATE INDEX idx_maint_category ON maintenance_schedules(service_category);

-- Tire specifications indexes
CREATE INDEX idx_tire_vehicle ON tire_specifications(year, make, model);
CREATE INDEX idx_tire_trim ON tire_specifications(trim_level);

-- Torque specifications indexes
CREATE INDEX idx_torque_vehicle ON torque_specifications(year, make, model);
CREATE INDEX idx_torque_component ON torque_specifications(component_name);
CREATE INDEX idx_torque_category ON torque_specifications(component_category);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE fluid_specifications IS 'OEM fluid specifications - THE source of truth for fluid types, capacities, and part numbers';
COMMENT ON TABLE maintenance_schedules IS 'OEM maintenance schedules from owner manuals - includes belt/chain intervals';
COMMENT ON TABLE tire_specifications IS 'OEM tire sizes, pressures, and TPMS specs';
COMMENT ON TABLE torque_specifications IS 'OEM torque values for common service operations';

COMMENT ON COLUMN fluid_specifications.engine_displacement IS 'Critical for accuracy - same model may have different specs by engine';
COMMENT ON COLUMN fluid_specifications.notes IS 'Critical warnings like "DO NOT MIX" or "Use only genuine OEM"';
COMMENT ON COLUMN maintenance_schedules.service_category IS 'Includes: oil_change, tire_service, belts_hoses, brake_service, filter_replacement, fluid_service, inspection, spark_plugs, transmission_service, battery_service, other';
