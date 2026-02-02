-- Migration 012: Soft Delete System
-- Adds recoverable delete functionality to work_orders, customers, and vehicles

-- Add soft delete columns to work_orders
ALTER TABLE work_orders 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);

-- Add soft delete columns to customers
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);

-- Add soft delete columns to vehicles
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);

-- Add indexes for performance (partial indexes for non-null deleted_at)
CREATE INDEX IF NOT EXISTS idx_work_orders_deleted ON work_orders(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted ON vehicles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Also index for active records (deleted_at IS NULL) for faster queries
CREATE INDEX IF NOT EXISTS idx_work_orders_active ON work_orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(deleted_at) WHERE deleted_at IS NULL;

-- View for items pending permanent deletion (>30 days old)
CREATE OR REPLACE VIEW items_pending_purge AS
  SELECT 'work_order' as item_type, id, deleted_at, deleted_by,
         EXTRACT(DAY FROM (NOW() - deleted_at)) as days_deleted
  FROM work_orders 
  WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'customer' as item_type, id, deleted_at, deleted_by,
         EXTRACT(DAY FROM (NOW() - deleted_at)) as days_deleted
  FROM customers 
  WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'vehicle' as item_type, id, deleted_at, deleted_by,
         EXTRACT(DAY FROM (NOW() - deleted_at)) as days_deleted
  FROM vehicles 
  WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';

-- View for all deleted items (recycle bin view)
CREATE OR REPLACE VIEW deleted_items AS
  SELECT 
    'work_order' as item_type, 
    wo.id, 
    wo.ro_number as identifier,
    COALESCE(wo.customer_name, c.customer_name) as customer_name,
    CONCAT(wo.vehicle_year, ' ', wo.vehicle_make, ' ', wo.vehicle_model) as description,
    wo.deleted_at, 
    wo.deleted_by,
    u.full_name as deleted_by_name,
    EXTRACT(DAY FROM (NOW() - wo.deleted_at)) as days_deleted
  FROM work_orders wo
  LEFT JOIN customers c ON wo.customer_id = c.id
  LEFT JOIN users u ON wo.deleted_by = u.id
  WHERE wo.deleted_at IS NOT NULL
  UNION ALL
  SELECT 
    'customer' as item_type, 
    c.id, 
    c.customer_name as identifier,
    c.customer_name,
    COALESCE(c.phone_primary, c.email) as description,
    c.deleted_at, 
    c.deleted_by,
    u.full_name as deleted_by_name,
    EXTRACT(DAY FROM (NOW() - c.deleted_at)) as days_deleted
  FROM customers c
  LEFT JOIN users u ON c.deleted_by = u.id
  WHERE c.deleted_at IS NOT NULL
  UNION ALL
  SELECT 
    'vehicle' as item_type, 
    v.id, 
    v.vin as identifier,
    c.customer_name,
    CONCAT(v.year, ' ', v.make, ' ', v.model) as description,
    v.deleted_at, 
    v.deleted_by,
    u.full_name as deleted_by_name,
    EXTRACT(DAY FROM (NOW() - v.deleted_at)) as days_deleted
  FROM vehicles v
  LEFT JOIN customers c ON v.customer_id = c.id
  LEFT JOIN users u ON v.deleted_by = u.id
  WHERE v.deleted_at IS NOT NULL;
