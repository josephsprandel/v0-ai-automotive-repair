-- ShopWare Parts Inventory Integration
-- Migration 006: Create parts_inventory table for daily CSV imports

CREATE TABLE IF NOT EXISTS parts_inventory (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  vendor VARCHAR(100),
  cost DECIMAL(10,2),
  price DECIMAL(10,2),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_available INTEGER DEFAULT 0,
  quantity_allocated INTEGER DEFAULT 0,
  reorder_point INTEGER,
  location VARCHAR(100),
  bin_location VARCHAR(50),
  category VARCHAR(100),
  notes TEXT,
  shopware_id VARCHAR(100),
  last_synced_at TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX idx_parts_inventory_number ON parts_inventory(part_number);
CREATE INDEX idx_parts_inventory_description ON parts_inventory USING GIN(to_tsvector('english', description));
CREATE INDEX idx_parts_inventory_vendor ON parts_inventory(vendor);
CREATE INDEX idx_parts_inventory_category ON parts_inventory(category);
CREATE INDEX idx_parts_inventory_qty_available ON parts_inventory(quantity_available) WHERE quantity_available > 0;

-- Full-text search index combining multiple fields
CREATE INDEX idx_parts_inventory_search ON parts_inventory USING GIN(
  to_tsvector('english', 
    COALESCE(part_number, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(vendor, '')
  )
);

-- Comments for documentation
COMMENT ON TABLE parts_inventory IS 'Parts inventory imported from ShopWare - synced daily';
COMMENT ON COLUMN parts_inventory.part_number IS 'Unique part number from ShopWare';
COMMENT ON COLUMN parts_inventory.quantity_allocated IS 'Quantity reserved for work orders';
COMMENT ON COLUMN parts_inventory.bin_location IS 'Specific shelf/bin location for faster picking';
COMMENT ON COLUMN parts_inventory.shopware_id IS 'Original ShopWare database ID for reference';
COMMENT ON COLUMN parts_inventory.last_synced_at IS 'Last time this part was updated from ShopWare export';
