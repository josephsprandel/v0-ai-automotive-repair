require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testFindAndExtract(year, make, model, mileage) {
  console.log(`\n=== Testing Combined Find + Extract ===`);
  console.log(`Vehicle: ${year} ${make} ${model}`);
  console.log(`Mileage: ${mileage} miles\n`);

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
You have access to web search and can read PDFs from the web.

Task: Find the owner's manual for this vehicle and extract maintenance services due.

Vehicle: ${year} ${make} ${model}
Current mileage: ${mileage} miles

Steps you should take:
1. Search the web for "${year} ${make} ${model} owner's manual PDF"
2. Locate the official manufacturer owner's manual PDF
3. Read the PDF directly from the web (you have access to read PDFs at URLs)
4. Find the "Maintenance Schedule" or "Service Intervals" section in the manual
5. Extract ALL services that are due at or before ${mileage} miles

Return JSON in this exact format:
{
  "manual_found": true,
  "manual_source": "Honda Owners Site",
  "pdf_url": "https://...",
  "services": [
    {
      "service_name": "Engine oil change",
      "mileage_interval": 7500,
      "service_category": "oil_change",
      "service_description": "Replace engine oil and filter",
      "driving_condition": "normal"
    },
    {
      "service_name": "Tire rotation",
      "mileage_interval": 7500,
      "service_category": "tire_service",
      "service_description": "Rotate tires and check pressure",
      "driving_condition": "normal"
    }
  ]
}

If you cannot find or access the manual, return:
{
  "manual_found": false,
  "reason": "Could not locate owner's manual for this vehicle"
}

Service categories to use: oil_change, tire_service, brake_service, filter_replacement,
fluid_service, inspection, battery_service, spark_plugs, belts_hoses,
transmission_service, other

Include both "normal" and "severe" driving schedules if the manual has both.

CRITICAL: Return ONLY valid JSON. No markdown. No explanation. No preamble.
`;

  console.log('Sending combined find + extract request to Gemini...\n');
  
  const startTime = Date.now();
  
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('=== Raw Response ===');
    console.log(text);
    console.log(`\nDuration: ${duration} seconds\n`);
    
    // Try to parse JSON
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanText);
      
      console.log('=== Parsed Result ===');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.manual_found && data.services && data.services.length > 0) {
        console.log(`\n✅ SUCCESS!`);
        console.log(`Manual source: ${data.manual_source}`);
        console.log(`PDF URL: ${data.pdf_url || 'Not provided'}`);
        console.log(`Services found: ${data.services.length}`);
        console.log(`Time taken: ${duration}s\n`);
        
        console.log('Services extracted:');
        data.services.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.service_name} @ ${s.mileage_interval} mi (${s.driving_condition})`);
        });
        
        return { success: true, data, duration: parseFloat(duration) };
      } else if (data.manual_found === false) {
        console.log(`\n❌ Manual not found`);
        console.log(`Reason: ${data.reason}\n`);
        return { success: false, reason: data.reason };
      } else {
        console.log(`\n⚠️ Unexpected response format\n`);
        return { success: false, reason: 'Unexpected response format' };
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
      console.error('Raw response (first 500 chars):', text.substring(0, 500));
      return { success: false, reason: 'Invalid JSON response' };
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('TESTING GEMINI COMBINED FIND + EXTRACT CAPABILITY');
  console.log('='.repeat(80));

  const testCases = [
    { year: 2020, make: 'Honda', model: 'Accord', mileage: 30000 },
    { year: 2023, make: 'Toyota', model: 'Camry', mileage: 25000 },
    { year: 2021, make: 'Ford', model: 'F-150', mileage: 45000 },
  ];

  const results = [];

  for (const test of testCases) {
    const result = await testFindAndExtract(
      test.year, 
      test.make, 
      test.model, 
      test.mileage
    );
    
    results.push({
      vehicle: `${test.year} ${test.make} ${test.model}`,
      mileage: test.mileage,
      ...result
    });
    
    // Wait 10 seconds between requests to avoid rate limits
    if (testCases.indexOf(test) < testCases.length - 1) {
      console.log('\n' + '='.repeat(80));
      console.log('Waiting 10 seconds before next test...');
      console.log('='.repeat(80));
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('FINAL RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach(r => {
    const status = r.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`\n${r.vehicle} @ ${r.mileage} mi: ${status}`);
    if (r.success) {
      console.log(`  Services extracted: ${r.data.services.length}`);
      console.log(`  Duration: ${r.duration}s`);
      console.log(`  Source: ${r.data.manual_source}`);
    } else {
      console.log(`  Reason: ${r.reason}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const avgDuration = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / successCount;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Success rate: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(0)}%)`);
  if (successCount > 0) {
    console.log(`Average duration: ${avgDuration.toFixed(1)}s per vehicle`);
  }
  console.log('='.repeat(80) + '\n');
  
  if (successCount === results.length) {
    console.log('🎉 CONCLUSION: Gemini can find AND extract in one request!');
    console.log('This eliminates the need for separate search + download steps.\n');
  } else if (successCount > 0) {
    console.log('⚠️  CONCLUSION: Gemini works for some vehicles but not all.');
    console.log('Recommend using as primary with Vehicle DB API as fallback.\n');
  } else {
    console.log('❌ CONCLUSION: Gemini cannot reliably find and extract.');
    console.log('Stick with Vehicle DB API as primary source.\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { testFindAndExtract };
