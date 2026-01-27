require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAIManualFinder(year, make, model) {
  console.log(`\n=== Testing AI Manual Finder ===`);
  console.log(`Vehicle: ${year} ${make} ${model}\n`);

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
You have access to web search. Your task is to find the owner's manual PDF for this vehicle:

Vehicle: ${year} ${make} ${model}

Steps:
1. Search the web for "${year} ${make} ${model} owner's manual PDF"
2. Look for official manufacturer websites (owners.honda.com, toyota.com/owners, etc.)
3. Find the direct download link to the owner's manual PDF
4. Return the PDF URL

Return JSON:
{
  "manual_found": true,
  "pdf_url": "https://...",
  "source": "Honda Owners Site",
  "file_size_mb": 5.2,
  "pages": 450,
  "notes": "Official owner's manual from manufacturer"
}

If you cannot find it, return:
{
  "manual_found": false,
  "reason": "Explanation of what you tried"
}

CRITICAL: Return ONLY valid JSON. No markdown. No explanation outside JSON.
`;

  console.log('Sending request to Gemini...\n');
  
  const startTime = Date.now();
  
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('=== AI Response ===');
    console.log(text);
    console.log(`\nDuration: ${duration} seconds\n`);
    
    // Try to parse JSON
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanText);
      
      console.log('=== Parsed Result ===');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.manual_found) {
        console.log('\n✅ SUCCESS - Manual found!');
        console.log(`PDF URL: ${data.pdf_url}`);
        console.log(`Source: ${data.source}`);
        
        // Test if URL is accessible
        console.log('\nTesting PDF URL accessibility...');
        const testResponse = await fetch(data.pdf_url, { method: 'HEAD' });
        console.log(`HTTP Status: ${testResponse.status}`);
        console.log(`Content-Type: ${testResponse.headers.get('content-type')}`);
        console.log(`Content-Length: ${testResponse.headers.get('content-length')} bytes`);
        
        if (testResponse.ok) {
          console.log('✅ PDF URL is accessible!\n');
        } else {
          console.log('❌ PDF URL returned error\n');
        }
      } else {
        console.log('\n❌ Manual not found');
        console.log(`Reason: ${data.reason}\n`);
      }
      
      return data;
      
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', text);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  // Test cases
  const testVehicles = [
    { year: 2020, make: 'Honda', model: 'Accord' },
    { year: 2023, make: 'Toyota', model: 'Camry' },
    { year: 2021, make: 'Ford', model: 'F-150' },
  ];

  for (const vehicle of testVehicles) {
    await testAIManualFinder(vehicle.year, vehicle.make, vehicle.model);
    
    // Wait 5 seconds between requests to avoid rate limits
    if (testVehicles.indexOf(vehicle) < testVehicles.length - 1) {
      console.log('Waiting 5 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { testAIManualFinder };
