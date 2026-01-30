/**
 * Test script for PartsTech Automation Module
 * 
 * Tests the full workflow:
 * 1. Login to PartsTech
 * 2. Load vehicle by VIN
 * 3. Search for parts
 * 4. Extract multi-vendor results
 * 
 * Usage: 
 *   node scripts/test-partstech-automation.js
 *   DEBUG_SCREENSHOTS=true node scripts/test-partstech-automation.js
 */

const { 
  searchPartsTech,
  loginToPartsTech,
  loadVehicleByVIN,
  searchParts,
  extractAllVendorResults,
  cleanup,
  isSessionActive 
} = require('../backend/services/partstech-automation');

// Test parameters
const TEST_VIN = '3FAHP0JG3CR449015';  // 2012 Ford Fusion
const TEST_SEARCH = 'Oil Filter';
const TEST_MODE = 'manual';  // 'manual' or 'ai'

async function runFullTest() {
  console.log('\n' + '='.repeat(70));
  console.log('PARTSTECH AUTOMATION - FULL WORKFLOW TEST');
  console.log('='.repeat(70));
  console.log(`VIN: ${TEST_VIN}`);
  console.log(`Search: ${TEST_SEARCH}`);
  console.log(`Mode: ${TEST_MODE}`);
  console.log('='.repeat(70) + '\n');

  const startTime = Date.now();

  try {
    // Run the full search
    const result = await searchPartsTech(TEST_VIN, TEST_SEARCH, { mode: TEST_MODE });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(70));
    console.log('RESULTS');
    console.log('='.repeat(70));
    
    if (result.success) {
      console.log('✅ SUCCESS!\n');
      
      // Vehicle info
      if (result.vehicle) {
        console.log('🚗 Vehicle:');
        console.log(`   ${result.vehicle.year} ${result.vehicle.make} ${result.vehicle.model}`);
        if (result.vehicle.engine) {
          console.log(`   Engine: ${result.vehicle.engine}`);
        }
        console.log('');
      }
      
      // Summary
      console.log(`📊 Summary:`);
      console.log(`   Search Term: ${result.search_term}`);
      console.log(`   Mode: ${result.mode}`);
      console.log(`   Vendors Found: ${result.total_vendors}`);
      console.log(`   Total Parts: ${result.total_parts_found}`);
      console.log(`   Duration: ${result.duration_seconds}s`);
      console.log('');
      
      // Vendor breakdown
      if (result.vendors && result.vendors.length > 0) {
        console.log('🏪 Vendors:');
        result.vendors.forEach((v, i) => {
          console.log(`\n   ${i + 1}. ${v.vendor} (${v.vendor_location || 'N/A'})`);
          console.log(`      Parts: ${v.parts.length}`);
          
          // Show first 3 parts from each vendor
          v.parts.slice(0, 3).forEach((p, j) => {
            console.log(`      ${j + 1}. ${p.brand} ${p.part_number}`);
            console.log(`         ${p.description || 'No description'}`);
            console.log(`         Price: $${p.price} | List: $${p.list_price} | Stock: ${p.stock_status}`);
          });
          
          if (v.parts.length > 3) {
            console.log(`      ... and ${v.parts.length - 3} more parts`);
          }
        });
      }
      
      console.log('\n');
      
      // Full JSON output for debugging
      console.log('📝 Full JSON Response:');
      console.log(JSON.stringify(result, null, 2));
      
    } else {
      console.log('❌ FAILED');
      console.log(`   Message: ${result.message}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`Total test duration: ${duration}s`);
    console.log('='.repeat(70) + '\n');
    
    return result;

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
    return { success: false, message: error.message };
  } finally {
    await cleanup();
  }
}

async function runStepByStepTest() {
  console.log('\n' + '='.repeat(70));
  console.log('PARTSTECH AUTOMATION - STEP-BY-STEP TEST');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Login
    console.log('\n📋 Step 1: Login');
    console.log('-'.repeat(40));
    const loginResult = await loginToPartsTech();
    console.log('Result:', loginResult);
    
    if (!loginResult.success) {
      console.log('❌ Login failed, stopping test');
      return;
    }

    // Step 2: Load Vehicle
    console.log('\n📋 Step 2: Load Vehicle by VIN');
    console.log('-'.repeat(40));
    const vehicleResult = await loadVehicleByVIN(TEST_VIN);
    console.log('Result:', vehicleResult);
    
    if (!vehicleResult.success) {
      console.log('❌ Vehicle loading failed, stopping test');
      return;
    }

    // Step 3: Search Parts
    console.log('\n📋 Step 3: Search for Parts');
    console.log('-'.repeat(40));
    const searchResult = await searchParts(TEST_SEARCH);
    console.log('Result:', searchResult);
    
    if (!searchResult.success) {
      console.log('❌ Search failed, stopping test');
      return;
    }

    // Step 4: Extract Results
    console.log('\n📋 Step 4: Extract All Vendor Results');
    console.log('-'.repeat(40));
    const extractResult = await extractAllVendorResults(TEST_MODE);
    console.log('Vendors found:', extractResult.total_vendors);
    console.log('Parts found:', extractResult.total_parts);
    
    if (extractResult.vendors && extractResult.vendors.length > 0) {
      console.log('\nVendor Summary:');
      extractResult.vendors.forEach(v => {
        console.log(`  - ${v.vendor}: ${v.parts.length} parts`);
      });
    }

    console.log('\n✅ All steps completed successfully!');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await cleanup();
  }
}

// Parse command line args
const args = process.argv.slice(2);
const stepByStep = args.includes('--step-by-step') || args.includes('-s');

// Run test
if (stepByStep) {
  runStepByStepTest();
} else {
  runFullTest();
}
