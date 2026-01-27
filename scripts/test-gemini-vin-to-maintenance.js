require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testVINToMaintenance(vin, mileage, severeService = false) {
  console.log(`\n=== Testing VIN → Maintenance (Single Request) ===`);
  console.log(`VIN: ${vin}`);
  console.log(`Mileage: ${mileage} miles`);
  console.log(`Severe service: ${severeService ? 'Yes' : 'No'}\n`);

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
You have access to web search and can read PDFs from the web.

Task: Using this VIN, find the owner's manual and extract maintenance recommendations.

VIN: ${vin}
Current mileage: ${mileage} miles
Driving conditions: ${severeService ? 'SEVERE (dusty, towing, short trips, extreme temps)' : 'NORMAL'}

Steps:
1. Decode the VIN to determine:
   - Year, Make, Model
   - Engine displacement and type (1.5L, 2.0L, V6, etc.)
   - Transmission type (CVT, manual, automatic)
   - Drivetrain (FWD, RWD, AWD)
   
2. Search the web for the owner's manual PDF for this EXACT vehicle configuration

3. Read the owner's manual PDF directly from the web

4. Find the maintenance schedule section

5. Extract services due at or before ${mileage} miles for ${severeService ? 'SEVERE' : 'NORMAL'} driving

6. Make sure to match services to the SPECIFIC ENGINE variant (e.g., 1.5L vs 2.0L may have different oil capacities)

Return JSON:
{
  "vehicle_info": {
    "vin": "${vin}",
    "year": 2020,
    "make": "Honda",
    "model": "Accord",
    "engine_displacement": "2.0L",
    "engine_type": "Turbocharged I4",
    "engine_code": "K20C4",
    "transmission_type": "CVT",
    "drivetrain": "FWD",
    "trim": "Sport"
  },
  "manual_found": true,
  "manual_source": "Honda Owners Site",
  "pdf_url": "https://...",
  "services": [
    {
      "service_name": "Engine oil change",
      "mileage_interval": 7500,
      "service_category": "oil_change",
      "service_description": "Replace engine oil and filter - 2.0L engine requires 5.0 quarts of 0W-20",
      "driving_condition": "normal",
      "engine_specific": true,
      "notes": "Capacity varies by engine: 1.5L=3.7qt, 2.0L=5.0qt"
    }
  ]
}

If you cannot decode the VIN or find the manual:
{
  "vehicle_info": null,
  "manual_found": false,
  "reason": "Explanation"
}

Service categories: oil_change, tire_service, brake_service, filter_replacement,
fluid_service, inspection, battery_service, spark_plugs, belts_hoses,
transmission_service, other

CRITICAL: 
- Match services to the SPECIFIC engine variant from the VIN
- Include engine-specific notes (oil capacity, filter size, etc.)
- Return ONLY valid JSON. No markdown. No explanation.
`;

  console.log('Sending VIN → Maintenance request to Gemini...\n');
  
  const startTime = Date.now();
  
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('=== Raw Response ===');
    console.log(text);
    console.log(`\nDuration: ${duration} seconds\n`);
    
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanText);
      
      console.log('=== Parsed Result ===');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.vehicle_info && data.manual_found && data.services) {
        console.log(`\n✅ SUCCESS!`);
        console.log(`\nVehicle Decoded:`);
        console.log(`  ${data.vehicle_info.year} ${data.vehicle_info.make} ${data.vehicle_info.model}`);
        console.log(`  Engine: ${data.vehicle_info.engine_displacement} ${data.vehicle_info.engine_type}`);
        console.log(`  Transmission: ${data.vehicle_info.transmission_type}`);
        console.log(`  Trim: ${data.vehicle_info.trim}`);
        
        console.log(`\nManual Source: ${data.manual_source}`);
        console.log(`PDF URL: ${data.pdf_url || 'Not provided'}`);
        console.log(`Services found: ${data.services.length}`);
        console.log(`Time taken: ${duration}s\n`);
        
        console.log('Services Due:');
        data.services.forEach((s, i) => {
          const engineTag = s.engine_specific ? ' [ENGINE-SPECIFIC]' : '';
          console.log(`  ${i + 1}. ${s.service_name} @ ${s.mileage_interval} mi${engineTag}`);
          if (s.notes) {
            console.log(`     Note: ${s.notes}`);
          }
        });
        
        return { success: true, data, duration: parseFloat(duration) };
      } else if (data.manual_found === false) {
        console.log(`\n❌ Failed`);
        console.log(`Reason: ${data.reason}\n`);
        return { success: false, reason: data.reason };
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
      console.error('Raw response (first 500 chars):', text.substring(0, 500));
      return { success: false, reason: 'Invalid JSON' };
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('TESTING VIN → MAINTENANCE RECOMMENDATIONS (SINGLE REQUEST)');
  console.log('='.repeat(80));

  const testCases = [
    { 
      vin: '1HGCV1F30LA123456',  // 2020 Honda Accord 2.0L Turbo
      mileage: 30000, 
      severe: false 
    },
    { 
      vin: '1HGCV1F30LA123456',  // Same VIN
      mileage: 30000, 
      severe: true  // Test severe service difference
    },
    { 
      vin: '4T1BF1FK5CU123456',  // 2012 Toyota Camry (different era)
      mileage: 50000, 
      severe: false 
    },
  ];

  const results = [];

  for (const test of testCases) {
    const result = await testVINToMaintenance(test.vin, test.mileage, test.severe);
    
    results.push({
      vin: test.vin,
      mileage: test.mileage,
      severe: test.severe,
      ...result
    });
    
    if (testCases.indexOf(test) < testCases.length - 1) {
      console.log('\n' + '='.repeat(80));
      console.log('Waiting 10 seconds before next test...');
      console.log('='.repeat(80));
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('FINAL RESULTS');
  console.log('='.repeat(80));
  
  results.forEach(r => {
    const status = r.success ? '✅ SUCCESS' : '❌ FAILED';
    const severeTag = r.severe ? ' [SEVERE]' : ' [NORMAL]';
    console.log(`\nVIN: ${r.vin}${severeTag}: ${status}`);
    if (r.success) {
      console.log(`  Vehicle: ${r.data.vehicle_info.year} ${r.data.vehicle_info.make} ${r.data.vehicle_info.model}`);
      console.log(`  Engine: ${r.data.vehicle_info.engine_displacement}`);
      console.log(`  Services: ${r.data.services.length}`);
      console.log(`  Duration: ${r.duration}s`);
    } else {
      console.log(`  Reason: ${r.reason}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Success rate: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(0)}%)`);
  console.log('='.repeat(80) + '\n');
  
  if (successCount === results.length) {
    console.log('🎉 CONCLUSION: VIN → Maintenance works perfectly!');
    console.log('This eliminates the need for:');
    console.log('  - Separate VIN decode step');
    console.log('  - Database storage (if 15s is acceptable)');
    console.log('  - Vehicle Databases API');
    console.log('  - Manual engine variant selection\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { testVINToMaintenance };
