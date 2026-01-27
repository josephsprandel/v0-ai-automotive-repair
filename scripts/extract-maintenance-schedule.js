const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function extractMaintenanceSchedule(pdfPath, vehicleInfo) {
  console.log('=== PDF EXTRACTION START ===');
  console.log('PDF:', pdfPath);
  console.log('Vehicle:', vehicleInfo);
  
  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  
  // Read PDF file
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString('base64');
  
  // Prompt for extraction
  const prompt = `
You are analyzing an automotive owner's manual PDF to extract the COMPLETE maintenance schedule.

Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}

CRITICAL: Most Honda/Toyota/Nissan manuals have TWO maintenance schedules:
1. NORMAL driving conditions (typical intervals: 7500, 10000, 15000, 20000 miles)
2. SEVERE driving conditions (shorter intervals: 3750, 5000, 7500 miles)

Look for BOTH schedules and extract ALL items from each.

For each item, extract:
- mileage_interval: INTEGER - Exact mileage (e.g., 7500, 15000)
- service_name: STRING - Brief name
- service_description: STRING - Full description
- service_category: STRING - oil_change, tire_service, brake_service, filter_replacement, 
  fluid_service, inspection, battery_service, spark_plugs, belts_hoses, transmission_service, other
- driving_condition: STRING - "normal" or "severe" (if manual doesn't specify, use "normal")

EXAMPLE OUTPUT:
[
  {
    "mileage_interval": 7500,
    "service_name": "Engine oil and filter change",
    "service_description": "Replace engine oil and oil filter",
    "service_category": "oil_change",
    "driving_condition": "normal"
  },
  {
    "mileage_interval": 3750,
    "service_name": "Engine oil and filter change",
    "service_description": "Replace engine oil and oil filter - severe driving",
    "service_category": "oil_change",
    "driving_condition": "severe"
  },
  {
    "mileage_interval": 15000,
    "service_name": "Air filter replacement",
    "service_description": "Replace air cleaner element",
    "service_category": "filter_replacement",
    "driving_condition": "severe"
  }
]

IMPORTANT:
1. Extract items from BOTH normal AND severe schedules if present
2. Create separate entries for each condition
3. If only one schedule exists, mark all as "normal"
4. Look for phrases like: "severe driving conditions", "special operating conditions", 
   "if you drive in dusty conditions", "frequent short trips", "trailer towing"

Return ONLY valid JSON array. No markdown. No explanation.
`;

  console.log('Calling Gemini Flash...');
  
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Pdf
      }
    },
    { text: prompt }
  ]);
  
  const response = await result.response;
  const text = response.text();
  
  console.log('Raw Gemini Response:');
  console.log(text);
  console.log('---');
  
  // Parse JSON response
  let schedule = [];
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    schedule = JSON.parse(cleanText);
    
    // Add vehicle info to each item
    schedule = schedule.map(item => ({
      ...item,
      year: vehicleInfo.year,
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      source_pdf: vehicleInfo.source_pdf,
      driving_condition: item.driving_condition || 'normal' // Default to normal if not specified
    }));
    
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Raw text:', text);
    return [];
  }
  
  console.log('Found', schedule.length, 'maintenance items');
  console.log('=== EXTRACTION COMPLETE ===');
  
  return schedule;
}

// Test execution
async function main() {
  const pdfPath = process.argv[2] || '/home/jsprandel/test-manuals/2020_honda_accord.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found:', pdfPath);
    console.error('Usage: node extract-maintenance-schedule.js <path-to-pdf>');
    process.exit(1);
  }
  
  const vehicleInfo = {
    year: parseInt(process.argv[3]) || 2020,
    make: process.argv[4] || 'Honda',
    model: process.argv[5] || 'Accord',
    source_pdf: path.basename(pdfPath)
  };
  
  try {
    const schedule = await extractMaintenanceSchedule(pdfPath, vehicleInfo);
    
    // Output as JSON
    console.log('\n=== EXTRACTED SCHEDULE ===');
    console.log(JSON.stringify(schedule, null, 2));
    
    // Save to file
    const outputDir = '/home/jsprandel/roengine/extracted-schedules';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = `${vehicleInfo.year}_${vehicleInfo.make}_${vehicleInfo.model}.json`;
    const outputPath = path.join(outputDir, outputFile);
    
    fs.writeFileSync(outputPath, JSON.stringify(schedule, null, 2));
    console.log('\nSaved to:', outputPath);
    
    // Show summary
    console.log('\n=== SUMMARY ===');
    console.log('Total items:', schedule.length);
    
    const byCategory = schedule.reduce((acc, item) => {
      acc[item.service_category] = (acc[item.service_category] || 0) + 1;
      return acc;
    }, {});
    
    console.log('By category:', byCategory);
    
    const mileages = [...new Set(schedule.map(s => s.mileage_interval))].sort((a,b) => a-b);
    console.log('Mileage intervals:', mileages);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractMaintenanceSchedule };
