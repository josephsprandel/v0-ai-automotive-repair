require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiPDFUrl(pdfUrl) {
  console.log(`\n=== Testing Gemini PDF URL Access ===`);
  console.log(`PDF URL: ${pdfUrl}\n`);

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
Analyze the owner's manual PDF at this URL and extract the maintenance schedule.

PDF URL: ${pdfUrl}

Extract all maintenance services listed in the manual.

Return JSON array:
[
  {
    "service_name": "Engine oil change",
    "mileage_interval": 7500,
    "service_category": "oil_change",
    "service_description": "Replace engine oil and filter",
    "driving_condition": "normal"
  }
]

Return ONLY valid JSON array. No markdown. No explanation.
`;

  console.log('Attempting Method 1: URL in prompt text...\n');
  
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Response:');
    console.log(text.substring(0, 500));
    console.log('\n');
    
    // Try to parse
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanText);
      console.log('✅ SUCCESS - Gemini read the PDF from URL!');
      console.log(`Found ${data.length} services\n`);
      return { method: 'url_in_prompt', success: true, services: data };
    } catch (e) {
      console.log('❌ Could not parse as JSON - likely Gemini cannot access the URL\n');
    }
  } catch (error) {
    console.error('Method 1 failed:', error.message, '\n');
  }

  // Method 2: Try file URI format
  console.log('Attempting Method 2: File URI format...\n');
  
  try {
    const result = await geminiModel.generateContent([
      { text: 'Extract maintenance schedule from this PDF. Return JSON array of services.' },
      { 
        fileData: {
          mimeType: 'application/pdf',
          fileUri: pdfUrl
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('Response:');
    console.log(text.substring(0, 500));
    console.log('\n');
    
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanText);
      console.log('✅ SUCCESS - File URI method worked!');
      console.log(`Found ${data.length} services\n`);
      return { method: 'file_uri', success: true, services: data };
    } catch (e) {
      console.log('❌ Could not parse as JSON\n');
    }
  } catch (error) {
    console.error('Method 2 failed:', error.message, '\n');
  }

  console.log('❌ CONCLUSION: Gemini cannot access PDFs at URLs directly');
  console.log('We must download and encode as base64 first.\n');
  
  return { success: false };
}

async function main() {
  // Test with a publicly accessible PDF
  const publicPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  
  console.log('First testing with a known-public PDF to verify method works...');
  await testGeminiPDFUrl(publicPdfUrl);
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  // Now test with the Honda URL that returned 404
  const hondaPdfUrl = 'https://techinfo.honda.com/rjanline/pubs/MG/A2A2020OM.PDF';
  
  console.log('Now testing with Honda URL (that returned 404 for us)...');
  await testGeminiPDFUrl(hondaPdfUrl);
}

if (require.main === module) {
  main();
}

module.exports = { testGeminiPDFUrl };
