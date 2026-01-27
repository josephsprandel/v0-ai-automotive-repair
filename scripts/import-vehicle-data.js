const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://shopops:shopops_dev@localhost:5432/shopops3',
  max: 20,
});

async function importVehicleData(jsonFilePath) {
  console.log('=== IMPORTING COMPLETE VEHICLE DATA ===');
  console.log('File:', jsonFilePath);
  
  const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  
  const stats = {
    fluids: { imported: 0, skipped: 0, errors: 0 },
    maintenance: { imported: 0, skipped: 0, errors: 0 },
    tires: { imported: 0, skipped: 0, errors: 0 },
    torque: { imported: 0, skipped: 0, errors: 0 }
  };
  
  // ========== IMPORT FLUID SPECIFICATIONS ==========
  console.log('\n1. Importing fluid specifications...');
  for (const item of data.fluid_specs || []) {
    try {
      if (!item.fluid_type || !item.specification) {
        stats.fluids.skipped++;
        continue;
      }
      
      const query = `
        INSERT INTO fluid_specifications (
          year, make, model, engine_displacement, engine_code,
          transmission_type, drivetrain, trim_level,
          fluid_type, specification, viscosity,
          capacity_quarts, capacity_liters,
          api_rating, oem_part_number, notes,
          alternative_spec, variant_notes, source_pdf
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (year, make, model, fluid_type, engine_displacement, transmission_type)
        DO UPDATE SET
          specification = EXCLUDED.specification,
          viscosity = EXCLUDED.viscosity,
          capacity_quarts = EXCLUDED.capacity_quarts,
          capacity_liters = EXCLUDED.capacity_liters,
          api_rating = EXCLUDED.api_rating,
          oem_part_number = EXCLUDED.oem_part_number,
          notes = EXCLUDED.notes,
          alternative_spec = EXCLUDED.alternative_spec,
          variant_notes = EXCLUDED.variant_notes,
          extracted_at = NOW()
      `;
      
      await pool.query(query, [
        item.year, item.make, item.model, item.engine_displacement, item.engine_code,
        item.transmission_type, item.drivetrain, item.trim_level,
        item.fluid_type, item.specification, item.viscosity,
        item.capacity_quarts, item.capacity_liters,
        item.api_rating, item.oem_part_number, item.notes,
        item.alternative_spec, item.variant_notes, item.source_pdf
      ]);
      
      stats.fluids.imported++;
    } catch (error) {
      console.error('Fluid error:', error.message);
      stats.fluids.errors++;
    }
  }
  
  // ========== IMPORT MAINTENANCE SCHEDULES ==========
  console.log('\n2. Importing maintenance schedules...');
  for (const item of data.maintenance_schedule || []) {
    try {
      if (!item.mileage_interval || !item.service_name) {
        stats.maintenance.skipped++;
        continue;
      }
      
      const query = `
        INSERT INTO maintenance_schedules (
          year, make, model, engine_displacement, transmission_type,
          mileage_interval, service_name, service_description,
          service_category, driving_condition, source_pdf
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (year, make, model, mileage_interval, service_name, driving_condition, engine_displacement)
        DO UPDATE SET
          service_description = EXCLUDED.service_description,
          service_category = EXCLUDED.service_category,
          transmission_type = EXCLUDED.transmission_type,
          extracted_at = NOW()
      `;
      
      await pool.query(query, [
        item.year, item.make, item.model, item.engine_displacement, item.transmission_type,
        item.mileage_interval, item.service_name, item.service_description,
        item.service_category, item.driving_condition || 'normal', item.source_pdf
      ]);
      
      stats.maintenance.imported++;
    } catch (error) {
      console.error('Maintenance error:', error.message);
      stats.maintenance.errors++;
    }
  }
  
  // ========== IMPORT TIRE SPECIFICATIONS ==========
  console.log('\n3. Importing tire specifications...');
  for (const item of data.tire_specs || []) {
    try {
      if (!item.tire_size_front) {
        stats.tires.skipped++;
        continue;
      }
      
      const query = `
        INSERT INTO tire_specifications (
          year, make, model, trim_level,
          tire_size_front, tire_size_rear,
          pressure_front_psi, pressure_rear_psi, pressure_spare_psi,
          wheel_size, wheel_offset, bolt_pattern,
          tpms_sensor_part_number, tpms_relearn_procedure,
          rotation_pattern, rotation_interval, notes, source_pdf
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (year, make, model, trim_level, tire_size_front)
        DO UPDATE SET
          tire_size_rear = EXCLUDED.tire_size_rear,
          pressure_front_psi = EXCLUDED.pressure_front_psi,
          pressure_rear_psi = EXCLUDED.pressure_rear_psi,
          pressure_spare_psi = EXCLUDED.pressure_spare_psi,
          wheel_size = EXCLUDED.wheel_size,
          tpms_sensor_part_number = EXCLUDED.tpms_sensor_part_number,
          tpms_relearn_procedure = EXCLUDED.tpms_relearn_procedure,
          rotation_pattern = EXCLUDED.rotation_pattern,
          notes = EXCLUDED.notes,
          extracted_at = NOW()
      `;
      
      await pool.query(query, [
        item.year, item.make, item.model, item.trim_level,
        item.tire_size_front, item.tire_size_rear,
        item.pressure_front_psi, item.pressure_rear_psi, item.pressure_spare_psi,
        item.wheel_size, item.wheel_offset, item.bolt_pattern,
        item.tpms_sensor_part_number, item.tpms_relearn_procedure,
        item.rotation_pattern, item.rotation_interval, item.notes, item.source_pdf
      ]);
      
      stats.tires.imported++;
    } catch (error) {
      console.error('Tire error:', error.message);
      stats.tires.errors++;
    }
  }
  
  // ========== IMPORT TORQUE SPECIFICATIONS ==========
  console.log('\n4. Importing torque specifications...');
  for (const item of data.torque_specs || []) {
    try {
      if (!item.component_name) {
        stats.torque.skipped++;
        continue;
      }
      
      const query = `
        INSERT INTO torque_specifications (
          year, make, model, engine_displacement,
          component_name, component_category,
          torque_value, torque_unit,
          thread_size, procedure_notes, source_pdf
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (year, make, model, component_name, engine_displacement)
        DO UPDATE SET
          component_category = EXCLUDED.component_category,
          torque_value = EXCLUDED.torque_value,
          torque_unit = EXCLUDED.torque_unit,
          thread_size = EXCLUDED.thread_size,
          procedure_notes = EXCLUDED.procedure_notes,
          extracted_at = NOW()
      `;
      
      await pool.query(query, [
        item.year, item.make, item.model, item.engine_displacement,
        item.component_name, item.component_category,
        item.torque_value, item.torque_unit || 'ft-lbs',
        item.thread_size, item.procedure_notes, item.source_pdf
      ]);
      
      stats.torque.imported++;
    } catch (error) {
      console.error('Torque error:', error.message);
      stats.torque.errors++;
    }
  }
  
  // ========== SUMMARY ==========
  console.log('\n=== IMPORT SUMMARY ===');
  console.log('Fluids:       imported', stats.fluids.imported, '/ skipped', stats.fluids.skipped, '/ errors', stats.fluids.errors);
  console.log('Maintenance:  imported', stats.maintenance.imported, '/ skipped', stats.maintenance.skipped, '/ errors', stats.maintenance.errors);
  console.log('Tires:        imported', stats.tires.imported, '/ skipped', stats.tires.skipped, '/ errors', stats.tires.errors);
  console.log('Torque:       imported', stats.torque.imported, '/ skipped', stats.torque.skipped, '/ errors', stats.torque.errors);
  
  return stats;
}

async function showDatabaseStats() {
  console.log('\n=== DATABASE STATISTICS ===');
  
  const fluidCount = await pool.query('SELECT COUNT(*) FROM fluid_specifications');
  const maintCount = await pool.query('SELECT COUNT(*) FROM maintenance_schedules');
  const tireCount = await pool.query('SELECT COUNT(*) FROM tire_specifications');
  const torqueCount = await pool.query('SELECT COUNT(*) FROM torque_specifications');
  
  console.log('Total fluid specs:', fluidCount.rows[0].count);
  console.log('Total maintenance items:', maintCount.rows[0].count);
  console.log('Total tire configs:', tireCount.rows[0].count);
  console.log('Total torque specs:', torqueCount.rows[0].count);
  
  const vehicles = await pool.query(`
    SELECT DISTINCT year, make, model
    FROM fluid_specifications
    ORDER BY year DESC, make, model
  `);
  
  console.log('\nVehicles in database:');
  vehicles.rows.forEach(v => {
    console.log(`  ${v.year} ${v.make} ${v.model}`);
  });
}

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: node import-vehicle-data.js <json-file>');
    process.exit(1);
  }
  
  try {
    await importVehicleData(filePath);
    await showDatabaseStats();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { importVehicleData };
