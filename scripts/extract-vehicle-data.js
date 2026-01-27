const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function extractVehicleData(pdfPath, vehicleInfo) {
  console.log('=== VEHICLE DATA EXTRACTION START ===');
  console.log('PDF:', pdfPath);
  console.log('Vehicle:', vehicleInfo);
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString('base64');
  
  const prompt = `
You are analyzing an automotive owner's manual PDF to extract FOUR critical datasets:
1. Fluid specifications (with engine/transmission variants)
2. Maintenance schedules (normal and severe driving)
3. Tire specifications
4. Torque specifications

Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}

Return a JSON object with FOUR arrays: "fluid_specs", "maintenance_schedule", "tire_specs", "torque_specs"

## PART 1: FLUID SPECIFICATIONS

Look for: "Specifications", "Fluids and Capacities", "Technical Data"

CRITICAL: Extract SEPARATE entries for different engines/transmissions.
Look for qualifiers: "1.5L engine", "2.0L engine", "V6", "V8", "CVT", "Manual", "AWD"

For each fluid:
- fluid_type: engine_oil, transmission_fluid, coolant, brake_fluid, power_steering_fluid, differential_fluid, transfer_case_fluid, washer_fluid
- specification: Exact OEM spec (e.g., "Honda ATF-DW1")
- viscosity: "5W-30", "0W-20", "75W-90"
- capacity_quarts: FLOAT
- capacity_liters: FLOAT
- api_rating: "API SN PLUS", "DOT 3"
- oem_part_number: Part number if specified
- notes: Critical warnings ("DO NOT MIX")
- alternative_spec: Acceptable alternatives
- engine_displacement: "1.5L", "2.0L", "3.5L V6"
- engine_code: "K20C4", "Coyote" if specified
- transmission_type: "CVT", "6MT", "10AT"
- drivetrain: "FWD", "RWD", "AWD", "4WD"
- trim_level: If specs vary by trim
- variant_notes: "Turbo only", "AWD models"

## PART 2: MAINTENANCE SCHEDULES

Look for: "Maintenance Schedule", "Scheduled Maintenance", "Service Intervals"

Extract BOTH normal and severe schedules. Look for grid/table with mileage columns.

For each item:
- mileage_interval: INTEGER (7500, 15000, 30000)
- service_name: Brief name
- service_description: Full description
- service_category: oil_change, tire_service, brake_service, filter_replacement, fluid_service, inspection, battery_service, spark_plugs, belts_hoses, transmission_service, other
- driving_condition: "normal" or "severe"
- engine_displacement: If service varies by engine
- transmission_type: If service varies by transmission

## PART 3: TIRE SPECIFICATIONS

Look for: "Tire Information", "Specifications", "Tire Pressure"

For each tire configuration (may have multiple by trim):
- tire_size_front: "245/40R18"
- tire_size_rear: May differ from front
- pressure_front_psi: INTEGER (32)
- pressure_rear_psi: INTEGER (30)
- pressure_spare_psi: INTEGER (60)
- wheel_size: "18x8.5"
- wheel_offset: "+45mm"
- bolt_pattern: "5x114.3"
- tpms_sensor_part_number: Part number
- tpms_relearn_procedure: Brief procedure
- rotation_pattern: "Front-to-rear", "X-pattern"
- rotation_interval: 7500 (miles)
- trim_level: If varies by trim
- notes: Important warnings

## PART 4: TORQUE SPECIFICATIONS

Look for: "Torque Specifications", "Service Data", "Tightening Torque"

Common torques to find:
- Wheel lug nuts
- Oil drain plug
- Oil filter
- Spark plugs
- Transmission drain plug

For each:
- component_name: "Wheel lug nuts", "Oil drain plug"
- component_category: "wheels", "engine", "transmission", "suspension", "brakes"
- torque_value: INTEGER
- torque_unit: "ft-lbs" or "Nm"
- thread_size: "M12x1.5"
- procedure_notes: "Tighten in star pattern"
- engine_displacement: If varies by engine

## EXAMPLE OUTPUT:

{
  "fluid_specs": [
    {
      "fluid_type": "engine_oil",
      "specification": "Honda Genuine 0W-20",
      "viscosity": "0W-20",
      "capacity_quarts": 4.4,
      "capacity_liters": 4.2,
      "api_rating": "API SN PLUS",
      "oem_part_number": "08798-9036",
      "notes": "Do not mix brands",
      "alternative_spec": "Synthetic 0W-20 API SN PLUS",
      "engine_displacement": "2.0L",
      "engine_code": "K20C4",
      "transmission_type": null,
      "drivetrain": "FWD",
      "trim_level": "Sport",
      "variant_notes": "2.0T turbo engine"
    }
  ],
  "maintenance_schedule": [
    {
      "mileage_interval": 7500,
      "service_name": "Engine oil change",
      "service_description": "Replace oil and filter",
      "service_category": "oil_change",
      "driving_condition": "normal",
      "engine_displacement": null,
      "transmission_type": null
    }
  ],
  "tire_specs": [
    {
      "tire_size_front": "235/40R18",
      "tire_size_rear": "235/40R18",
      "pressure_front_psi": 32,
      "pressure_rear_psi": 30,
      "pressure_spare_psi": 60,
      "wheel_size": "18x8",
      "wheel_offset": "+50mm",
      "bolt_pattern": "5x114.3",
      "tpms_sensor_part_number": "42753-TBA-A830",
      "tpms_relearn_procedure": "Drive vehicle at 50+ mph for 10 minutes",
      "rotation_pattern": "Front-to-rear",
      "rotation_interval": 7500,
      "trim_level": "Sport",
      "notes": "Do not mix tire brands"
    }
  ],
  "torque_specs": [
    {
      "component_name": "Wheel lug nuts",
      "component_category": "wheels",
      "torque_value": 80,
      "torque_unit": "ft-lbs",
      "thread_size": "M12x1.5",
      "procedure_notes": "Tighten in star pattern",
      "engine_displacement": null
    },
    {
      "component_name": "Oil drain plug",
      "component_category": "engine",
      "torque_value": 29,
      "torque_unit": "ft-lbs",
      "thread_size": "M14x1.5",
      "procedure_notes": "Do not overtighten",
      "engine_displacement": "2.0L"
    }
  ]
}

CRITICAL RULES:
1. Create SEPARATE entries for each engine/transmission variant
2. Extract mileage as INTEGER, not string
3. Set to null if not specified (don't guess)
4. Capture exact OEM specifications and warnings
5. Note when specs vary by trim/engine/drivetrain

Return ONLY valid JSON. No markdown. No explanation.
`;

  console.log('Calling Gemini Flash...');
  console.log('⏱️  Starting API call timer...');
  const startTime = Date.now();
  
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Pdf
      }
    },
    { text: prompt }
  ]);
  
  const endTime = Date.now();
  const apiCallDuration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`⏱️  API call completed in ${apiCallDuration} seconds`);
  
  const response = await result.response;
  const text = response.text();
  
  console.log('Raw Gemini Response (first 500 chars):');
  console.log(text.substring(0, 500) + '...');
  console.log('---');
  
  let data = { 
    fluid_specs: [], 
    maintenance_schedule: [], 
    tire_specs: [],
    torque_specs: []
  };
  
  try {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    data = JSON.parse(cleanText);
    
    // Add vehicle info to all datasets
    data.fluid_specs = (data.fluid_specs || []).map(item => ({
      ...item,
      year: vehicleInfo.year,
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      source_pdf: vehicleInfo.source_pdf
    }));
    
    data.maintenance_schedule = (data.maintenance_schedule || []).map(item => ({
      ...item,
      year: vehicleInfo.year,
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      source_pdf: vehicleInfo.source_pdf,
      driving_condition: item.driving_condition || 'normal'
    }));
    
    data.tire_specs = (data.tire_specs || []).map(item => ({
      ...item,
      year: vehicleInfo.year,
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      source_pdf: vehicleInfo.source_pdf
    }));
    
    data.torque_specs = (data.torque_specs || []).map(item => ({
      ...item,
      year: vehicleInfo.year,
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      source_pdf: vehicleInfo.source_pdf
    }));
    
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Raw text:', text);
    return { fluid_specs: [], maintenance_schedule: [], tire_specs: [], torque_specs: [], api_call_duration: apiCallDuration };
  }
  
  console.log('Fluids:', data.fluid_specs.length);
  console.log('Maintenance:', data.maintenance_schedule.length);
  console.log('Tires:', data.tire_specs.length);
  console.log('Torque:', data.torque_specs.length);
  console.log('=== EXTRACTION COMPLETE ===');
  
  data.api_call_duration = apiCallDuration;
  return data;
}

async function main() {
  const pdfPath = process.argv[2] || '/home/jsprandel/test-manuals/2020_honda_accord.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found:', pdfPath);
    process.exit(1);
  }
  
  const vehicleInfo = {
    year: parseInt(process.argv[3]) || 2020,
    make: process.argv[4] || 'Honda',
    model: process.argv[5] || 'Accord',
    source_pdf: path.basename(pdfPath)
  };
  
  try {
    const data = await extractVehicleData(pdfPath, vehicleInfo);
    
    console.log('\n=== EXTRACTION SUMMARY ===');
    console.log('⏱️  API Call Duration:', data.api_call_duration, 'seconds');
    console.log('Fluid specs:', data.fluid_specs.length);
    console.log('Maintenance items:', data.maintenance_schedule.length);
    console.log('Tire specs:', data.tire_specs.length);
    console.log('Torque specs:', data.torque_specs.length);
    console.log('TOTAL ITEMS:', data.fluid_specs.length + data.maintenance_schedule.length + data.tire_specs.length + data.torque_specs.length);
    
    // Save combined data
    const outputDir = '/home/jsprandel/roengine/extracted-vehicle-data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = `${vehicleInfo.year}_${vehicleInfo.make}_${vehicleInfo.model}.json`;
    const outputPath = path.join(outputDir, outputFile);
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log('\nSaved to:', outputPath);
    
    // Show fluid summary
    console.log('\n=== FLUID SPECS BREAKDOWN ===');
    const byFluidType = data.fluid_specs.reduce((acc, item) => {
      acc[item.fluid_type] = (acc[item.fluid_type] || 0) + 1;
      return acc;
    }, {});
    console.log('By fluid type:', byFluidType);
    
    console.log('\nSample fluid specs:');
    data.fluid_specs.slice(0, 3).forEach(spec => {
      console.log(`  ${spec.fluid_type}: ${spec.specification} (${spec.capacity_quarts || 'N/A'}qt) ${spec.engine_displacement ? '[' + spec.engine_displacement + ']' : ''}`);
    });
    
    // Show maintenance summary
    console.log('\n=== MAINTENANCE BREAKDOWN ===');
    const byCondition = data.maintenance_schedule.reduce((acc, item) => {
      acc[item.driving_condition] = (acc[item.driving_condition] || 0) + 1;
      return acc;
    }, {});
    console.log('By driving condition:', byCondition);
    
    const byCategory = data.maintenance_schedule.reduce((acc, item) => {
      acc[item.service_category] = (acc[item.service_category] || 0) + 1;
      return acc;
    }, {});
    console.log('By category:', byCategory);
    
    const intervals = [...new Set(data.maintenance_schedule.map(s => s.mileage_interval))].sort((a,b) => a-b);
    console.log('Mileage intervals:', intervals);
    
    // Show tire summary
    console.log('\n=== TIRE SPECS BREAKDOWN ===');
    console.log('Total tire configurations:', data.tire_specs.length);
    if (data.tire_specs.length > 0) {
      console.log('\nSample tire specs:');
      data.tire_specs.slice(0, 2).forEach(spec => {
        console.log(`  ${spec.tire_size_front} - ${spec.pressure_front_psi}/${spec.pressure_rear_psi} PSI ${spec.trim_level ? '[' + spec.trim_level + ']' : ''}`);
      });
    }
    
    // Show torque summary
    console.log('\n=== TORQUE SPECS BREAKDOWN ===');
    const byTorqueCategory = data.torque_specs.reduce((acc, item) => {
      acc[item.component_category] = (acc[item.component_category] || 0) + 1;
      return acc;
    }, {});
    console.log('By category:', byTorqueCategory);
    
    if (data.torque_specs.length > 0) {
      console.log('\nSample torque specs:');
      data.torque_specs.slice(0, 3).forEach(spec => {
        console.log(`  ${spec.component_name}: ${spec.torque_value} ${spec.torque_unit}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractVehicleData };
