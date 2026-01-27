const { Pool } = require('pg');
const { findFluidEquivalents } = require('./find-fluid-equivalents.js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://shopops:shopops_dev@localhost:5432/shopops3',
});

async function batchFindEquivalents() {
  console.log('=== BATCH FINDING FLUID EQUIVALENTS ===\n');
  
  // Get all unique OEM fluid specs from database
  const result = await pool.query(`
    SELECT DISTINCT 
      specification as oem_spec,
      fluid_type,
      make as oem_manufacturer
    FROM fluid_specifications
    WHERE specification IS NOT NULL
      AND specification != ''
    ORDER BY make, fluid_type, specification
  `);
  
  console.log(`Found ${result.rows.length} unique OEM fluid specs\n`);
  
  let processed = 0;
  let found = 0;
  let notFound = 0;
  
  for (const row of result.rows) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${row.oem_manufacturer} ${row.oem_spec} (${row.fluid_type})`);
    console.log('='.repeat(70));
    
    try {
      const equivalents = await findFluidEquivalents(
        row.oem_spec,
        row.fluid_type,
        row.oem_manufacturer
      );
      
      if (equivalents.length > 0) {
        // Insert into database
        for (const eq of equivalents) {
          try {
            await pool.query(`
              INSERT INTO fluid_equivalents (
                oem_specification, oem_manufacturer, fluid_type,
                aftermarket_brand, aftermarket_product, aftermarket_part_number,
                confidence_score, certification_status, verification_source,
                viscosity, oem_approvals, meets_specifications,
                widely_available, avg_price_per_quart, notes, warnings
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
              ON CONFLICT (oem_specification, aftermarket_brand, aftermarket_product)
              DO UPDATE SET
                confidence_score = EXCLUDED.confidence_score,
                avg_price_per_quart = EXCLUDED.avg_price_per_quart,
                extracted_at = NOW()
            `, [
              eq.oem_specification,
              eq.oem_manufacturer,
              eq.fluid_type,
              eq.aftermarket_brand,
              eq.aftermarket_product,
              eq.aftermarket_part_number,
              eq.confidence_score,
              eq.certification_status,
              eq.verification_source,
              eq.viscosity,
              eq.oem_approvals,
              eq.meets_specifications,
              eq.widely_available,
              eq.avg_price_per_quart,
              eq.notes,
              eq.warnings
            ]);
          } catch (dbError) {
            console.error('DB insert error:', dbError.message);
          }
        }
        
        found++;
        console.log(`✅ Found ${equivalents.length} equivalents`);
      } else {
        notFound++;
        console.log(`⚠️  No equivalents found`);
      }
      
      processed++;
      
      // Rate limit: 10 seconds between API calls
      if (processed < result.rows.length) {
        console.log('\nWaiting 10 seconds before next lookup...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      notFound++;
      processed++;
    }
  }
  
  console.log('\n\n' + '='.repeat(70));
  console.log('BATCH PROCESSING COMPLETE');
  console.log('='.repeat(70));
  console.log(`Total processed: ${processed}`);
  console.log(`Equivalents found: ${found}`);
  console.log(`No equivalents: ${notFound}`);
  
  // Show database stats
  const statsResult = await pool.query(`
    SELECT 
      COUNT(DISTINCT oem_specification) as unique_oem_specs,
      COUNT(*) as total_equivalents,
      AVG(confidence_score)::INTEGER as avg_confidence,
      COUNT(*) FILTER (WHERE widely_available = true) as available_count
    FROM fluid_equivalents
  `);
  
  console.log('\n=== DATABASE STATISTICS ===');
  console.log(`Unique OEM specs covered: ${statsResult.rows[0].unique_oem_specs}`);
  console.log(`Total equivalents: ${statsResult.rows[0].total_equivalents}`);
  console.log(`Average confidence: ${statsResult.rows[0].avg_confidence}%`);
  console.log(`Widely available: ${statsResult.rows[0].available_count}`);
  
  // Show top savings opportunities
  const savingsResult = await pool.query(`
    SELECT 
      oem_specification,
      oem_manufacturer,
      MIN(avg_price_per_quart) as cheapest_price,
      15.00 - MIN(avg_price_per_quart) as savings_per_qt
    FROM fluid_equivalents
    WHERE avg_price_per_quart IS NOT NULL
    GROUP BY oem_specification, oem_manufacturer
    ORDER BY savings_per_qt DESC
    LIMIT 5
  `);
  
  console.log('\n=== TOP SAVINGS OPPORTUNITIES ===');
  savingsResult.rows.forEach(row => {
    console.log(`${row.oem_manufacturer} ${row.oem_specification}: Save $${row.savings_per_qt.toFixed(2)}/qt (cheapest: $${row.cheapest_price}/qt)`);
  });
  
  await pool.end();
}

if (require.main === module) {
  batchFindEquivalents().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { batchFindEquivalents };
