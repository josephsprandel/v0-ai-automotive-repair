const { extractVehicleData } = require('./extract-vehicle-data.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

function parseFilename(filename) {
  // Try to extract year, make, model from filename
  // Examples: "2020_honda_accord.pdf", "2021_bmw_x5.pdf"
  
  const clean = filename.replace('.pdf', '').replace('.PDF', '').toLowerCase();
  const parts = clean.split(/[_\s-]+/);
  
  let year = null;
  let make = null;
  let model = null;
  
  // Find year (4 digits starting with 19 or 20)
  for (const part of parts) {
    if (/^(19|20)\d{2}$/.test(part)) {
      year = parseInt(part);
      break;
    }
  }
  
  // Find make (common manufacturers)
  const makes = ['honda', 'toyota', 'ford', 'chevrolet', 'chevy', 'bmw', 'mercedes', 'benz',
                 'audi', 'volkswagen', 'vw', 'nissan', 'hyundai', 'kia', 'mazda', 'subaru', 
                 'volvo', 'lexus', 'acura', 'infiniti', 'jeep', 'ram', 'gmc', 'dodge'];
  
  for (const part of parts) {
    if (makes.includes(part)) {
      make = part.charAt(0).toUpperCase() + part.slice(1);
      if (make === 'Bmw') make = 'BMW';
      if (make === 'Gmc') make = 'GMC';
      if (make === 'Vw') make = 'Volkswagen';
      break;
    }
  }
  
  // Find model (remaining parts after make)
  if (make) {
    const makeIndex = parts.findIndex(p => makes.includes(p));
    if (makeIndex !== -1 && makeIndex + 1 < parts.length) {
      model = parts.slice(makeIndex + 1)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }
  
  // Fallback: use filename without year if we can't parse
  if (!make || !model) {
    const fallback = clean.replace(year ? year.toString() : '', '')
      .split(/[_\s-]+/)
      .filter(p => p)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    if (!make) make = fallback.split(' ')[0] || 'Unknown';
    if (!model) model = fallback.split(' ').slice(1).join(' ') || 'Unknown';
  }
  
  return {
    year: year || 2020,
    make: make,
    model: model,
    source_pdf: filename
  };
}

async function batchExtractAndCompare(manualsDir) {
  console.log('=== BATCH MANUAL EXTRACTION & COMPARISON ===\n');
  
  // Auto-discover all PDFs
  const pdfFiles = fs.readdirSync(manualsDir)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort();
  
  console.log(`Found ${pdfFiles.length} PDF files in ${manualsDir}:\n`);
  pdfFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log('');
  
  const results = [];
  
  for (const filename of pdfFiles) {
    const pdfPath = path.join(manualsDir, filename);
    const vehicleInfo = parseFilename(filename);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Processing: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`);
    console.log(`File: ${filename}`);
    console.log('='.repeat(70));
    
    const startTime = Date.now();
    
    try {
      const data = await extractVehicleData(pdfPath, vehicleInfo);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Analyze the data
      const fluidsByType = {};
      data.fluid_specs.forEach(f => {
        fluidsByType[f.fluid_type] = (fluidsByType[f.fluid_type] || 0) + 1;
      });
      
      const maintByCondition = {
        normal: data.maintenance_schedule.filter(m => m.driving_condition === 'normal').length,
        severe: data.maintenance_schedule.filter(m => m.driving_condition === 'severe').length
      };
      
      const maintByCategory = {};
      data.maintenance_schedule.forEach(m => {
        maintByCategory[m.service_category] = (maintByCategory[m.service_category] || 0) + 1;
      });
      
      results.push({
        filename,
        year: vehicleInfo.year,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        success: true,
        duration: parseFloat(duration),
        fluids: data.fluid_specs.length,
        fluids_by_type: fluidsByType,
        maintenance: data.maintenance_schedule.length,
        maint_normal: maintByCondition.normal,
        maint_severe: maintByCondition.severe,
        maint_by_category: maintByCategory,
        tires: data.tire_specs.length,
        torque: data.torque_specs.length,
        total: data.fluid_specs.length + data.maintenance_schedule.length + 
               data.tire_specs.length + data.torque_specs.length,
        data: data
      });
      
      console.log(`✅ Success in ${duration}s`);
      console.log(`   Fluids: ${data.fluid_specs.length}`);
      console.log(`   Maintenance: ${data.maintenance_schedule.length} (${maintByCondition.normal} normal, ${maintByCondition.severe} severe)`);
      console.log(`   Tires: ${data.tire_specs.length}`);
      console.log(`   Torque: ${data.torque_specs.length}`);
      
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      results.push({
        filename,
        year: vehicleInfo.year,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        success: false,
        error: error.message,
        duration: parseFloat(duration),
        fluids: 0,
        maintenance: 0,
        tires: 0,
        torque: 0,
        total: 0
      });
      
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  return results;
}

function printComparisonTable(results) {
  console.log('\n\n' + '='.repeat(130));
  console.log('EXTRACTION RESULTS - SIDE-BY-SIDE COMPARISON');
  console.log('='.repeat(130));
  
  // Summary table
  console.log('\n📊 SUMMARY TABLE:');
  console.log('-'.repeat(130));
  
  const header = [
    'Vehicle'.padEnd(30),
    'Status'.padEnd(10),
    'Time'.padEnd(8),
    'Fluids'.padEnd(8),
    'Maint'.padEnd(8),
    'Tires'.padEnd(7),
    'Torque'.padEnd(8),
    'Total'.padEnd(8)
  ].join(' | ');
  
  console.log(header);
  console.log('-'.repeat(130));
  
  for (const r of results) {
    const vehicle = `${r.year} ${r.make} ${r.model}`.padEnd(30);
    const status = (r.success ? '✅ Success' : '❌ Failed').padEnd(10);
    const time = `${r.duration}s`.padEnd(8);
    const fluids = String(r.fluids || 0).padEnd(8);
    const maint = String(r.maintenance || 0).padEnd(8);
    const tires = String(r.tires || 0).padEnd(7);
    const torque = String(r.torque || 0).padEnd(8);
    const total = String(r.total || 0).padEnd(8);
    
    console.log([vehicle, status, time, fluids, maint, tires, torque, total].join(' | '));
  }
  
  console.log('-'.repeat(130));
  
  // Totals row
  const totalFluids = results.reduce((sum, r) => sum + (r.fluids || 0), 0);
  const totalMaint = results.reduce((sum, r) => sum + (r.maintenance || 0), 0);
  const totalTires = results.reduce((sum, r) => sum + (r.tires || 0), 0);
  const totalTorque = results.reduce((sum, r) => sum + (r.torque || 0), 0);
  const totalAll = results.reduce((sum, r) => sum + (r.total || 0), 0);
  
  console.log([
    'TOTALS'.padEnd(30),
    ''.padEnd(10),
    ''.padEnd(8),
    String(totalFluids).padEnd(8),
    String(totalMaint).padEnd(8),
    String(totalTires).padEnd(7),
    String(totalTorque).padEnd(8),
    String(totalAll).padEnd(8)
  ].join(' | '));
  
  // Detailed breakdown
  console.log('\n\n📋 DETAILED BREAKDOWN BY VEHICLE:\n');
  
  for (const r of results) {
    if (!r.success) {
      console.log(`\n${r.year} ${r.make} ${r.model}: ❌ ${r.error}\n`);
      continue;
    }
    
    console.log(`\n${r.year} ${r.make} ${r.model}:`);
    console.log('─'.repeat(60));
    
    console.log('\n  Fluids by Type:');
    if (r.fluids_by_type && Object.keys(r.fluids_by_type).length > 0) {
      Object.entries(r.fluids_by_type)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([type, count]) => {
          console.log(`    ${type.padEnd(30)} : ${count}`);
        });
    } else {
      console.log(`    (none extracted)`);
    }
    
    console.log('\n  Maintenance by Category:');
    if (r.maint_by_category && Object.keys(r.maint_by_category).length > 0) {
      Object.entries(r.maint_by_category)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([cat, count]) => {
          console.log(`    ${cat.padEnd(30)} : ${count}`);
        });
    } else {
      console.log(`    (none extracted)`);
    }
    
    console.log('\n  Driving Conditions:');
    console.log(`    Normal                         : ${r.maint_normal || 0} items`);
    console.log(`    Severe                         : ${r.maint_severe || 0} items`);
    
    console.log('\n  Other Data:');
    console.log(`    Tire configurations            : ${r.tires}`);
    console.log(`    Torque specifications          : ${r.torque}`);
  }
  
  // Key differences
  console.log('\n\n🔍 KEY INSIGHTS:');
  console.log('─'.repeat(60));
  
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length > 0) {
    // Most/least detailed
    const byFluids = [...successfulResults].sort((a, b) => b.fluids - a.fluids);
    console.log(`\nMost fluid specs: ${byFluids[0].make} ${byFluids[0].model} (${byFluids[0].fluids} specs)`);
    console.log(`Least fluid specs: ${byFluids[byFluids.length - 1].make} ${byFluids[byFluids.length - 1].model} (${byFluids[byFluids.length - 1].fluids} specs)`);
    
    const byMaint = [...successfulResults].sort((a, b) => b.maintenance - a.maintenance);
    console.log(`\nMost maintenance items: ${byMaint[0].make} ${byMaint[0].model} (${byMaint[0].maintenance} items)`);
    console.log(`Least maintenance items: ${byMaint[byMaint.length - 1].make} ${byMaint[byMaint.length - 1].model} (${byMaint[byMaint.length - 1].maintenance} items)`);
    
    // Average extraction time
    const avgTime = (successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length).toFixed(1);
    console.log(`\nAverage extraction time: ${avgTime}s per manual`);
  }
  
  console.log('\n' + '='.repeat(130) + '\n');
}

async function main() {
  const manualsDir = process.argv[2] || '/home/jsprandel/test-manuals';
  
  const results = await batchExtractAndCompare(manualsDir);
  
  printComparisonTable(results);
  
  // Save individual JSON files
  const outputDir = '/home/jsprandel/roengine/extracted-vehicle-data';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const r of results) {
    if (r.success && r.data) {
      const filename = `${r.year}_${r.make}_${r.model}.json`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(r.data, null, 2));
      console.log(`💾 Saved: ${filename}`);
    }
  }
  
  // Save comparison summary
  const summaryPath = '/home/jsprandel/roengine/batch-extraction-summary.json';
  const summary = results.map(r => ({
    vehicle: `${r.year} ${r.make} ${r.model}`,
    filename: r.filename,
    success: r.success,
    duration: r.duration,
    counts: {
      fluids: r.fluids,
      maintenance: r.maintenance,
      tires: r.tires,
      torque: r.torque,
      total: r.total
    },
    error: r.error
  }));
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Summary saved to: ${summaryPath}\n`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { batchExtractAndCompare };
