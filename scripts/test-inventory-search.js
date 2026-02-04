#!/usr/bin/env node
/**
 * Test Inventory Search API
 * Tests if the inventory parts API works and has data
 */

const pool = require('../lib/db.ts').default;

async function testInventory() {
  try {
    console.log('🔍 Testing inventory database...\n');
    
    // Check total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM parts_inventory');
    const total = parseInt(countResult.rows[0].total);
    console.log(`✅ Total parts in inventory: ${total}`);
    
    if (total === 0) {
      console.log('\n⚠️  WARNING: No parts found in inventory!');
      console.log('You need to import parts data first.');
      return;
    }
    
    // Get sample parts
    const sampleResult = await pool.query('SELECT id, part_number, description, vendor FROM parts_inventory LIMIT 5');
    console.log('\n📦 Sample parts:');
    sampleResult.rows.forEach(part => {
      console.log(`  - ${part.part_number}: ${part.description} (${part.vendor || 'No vendor'})`);
    });
    
    // Test search
    const searchTerm = 'oil';
    const searchResult = await pool.query(`
      SELECT id, part_number, description, vendor
      FROM parts_inventory
      WHERE LOWER(part_number) LIKE LOWER($1)
         OR LOWER(description) LIKE LOWER($1)
         OR LOWER(vendor) LIKE LOWER($1)
      LIMIT 5
    `, [`%${searchTerm}%`]);
    
    console.log(`\n🔎 Search results for "${searchTerm}": ${searchResult.rows.length} found`);
    searchResult.rows.forEach(part => {
      console.log(`  - ${part.part_number}: ${part.description}`);
    });
    
    console.log('\n✅ Inventory database test complete!');
    
  } catch (error) {
    console.error('❌ Error testing inventory:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testInventory();
