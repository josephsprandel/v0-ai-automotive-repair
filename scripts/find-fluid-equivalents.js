const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function findFluidEquivalents(oemSpec, fluidType, oemManufacturer) {
  console.log('=== FINDING AFTERMARKET EQUIVALENTS ===');
  console.log(`OEM Spec: ${oemSpec}`);
  console.log(`Fluid Type: ${fluidType}`);
  console.log(`Manufacturer: ${oemManufacturer}`);
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `
You are an automotive fluid specification analyst. Your job is to find aftermarket equivalents for OEM fluids.

OEM Specification: ${oemSpec}
Fluid Type: ${fluidType}
Manufacturer: ${oemManufacturer}

Find aftermarket fluids that are:
- Widely available (AutoZone, O'Reilly, NAPA, RockAuto, Walmart)
- From reputable brands (Valvoline, Mobil, Castrol, Amsoil, Pennzoil, Idemitsu, etc.)
- Either OEM-approved OR meet exact specifications

Return a JSON array of equivalents with confidence scoring:

[
  {
    "aftermarket_brand": "Valvoline",
    "aftermarket_product": "MaxLife CVT Fluid",
    "aftermarket_part_number": "VV370",
    "confidence_score": 95,
    "certification_status": "OEM_APPROVED",
    "verification_source": "Listed on Honda approved fluids list",
    "viscosity": "Same as OEM",
    "oem_approvals": ["Honda HCF-2"],
    "meets_specifications": ["Honda CVT"],
    "widely_available": true,
    "avg_price_per_quart": 8.99,
    "notes": "Honda officially approves this fluid as HCF-2 equivalent",
    "warnings": null
  },
  {
    "aftermarket_brand": "Idemitsu",
    "aftermarket_product": "CVT Fluid Type H",
    "aftermarket_part_number": "30301201-75000P020",
    "confidence_score": 90,
    "certification_status": "MEETS_SPEC",
    "verification_source": "Idemitsu is OEM supplier to Honda",
    "viscosity": "7.5 cSt @ 100C",
    "oem_approvals": [],
    "meets_specifications": ["Honda HCF-2"],
    "widely_available": true,
    "avg_price_per_quart": 7.49,
    "notes": "OEM supplier - makes Honda's fluid",
    "warnings": null
  }
]

CRITICAL RULES:
1. Only include fluids you can find through your knowledge base
2. Confidence score based on: OEM approval (95-100), OEM supplier (85-94), Meets spec (75-84), Likely equivalent (60-74)
3. Include verification source - where did you get this info?
4. Mark widely_available = true ONLY if sold at major auto parts stores
5. Include realistic pricing (check current market prices)
6. If you cannot find equivalents, return empty array []

Return ONLY valid JSON array. No markdown. No explanation.
`;

  console.log('\nSearching for equivalents...');
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  console.log('\nRaw AI Response:');
  console.log(text.substring(0, 500) + '...\n');
  
  let equivalents = [];
  
  try {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    equivalents = JSON.parse(cleanText);
    
    // Add metadata
    equivalents = equivalents.map(eq => ({
      ...eq,
      oem_specification: oemSpec,
      oem_manufacturer: oemManufacturer,
      fluid_type: fluidType
    }));
    
  } catch (error) {
    console.error('Failed to parse response:', error);
    console.error('Raw text:', text);
    return [];
  }
  
  console.log(`Found ${equivalents.length} equivalents\n`);
  
  return equivalents;
}

async function main() {
  const oemSpec = process.argv[2] || 'Honda HCF-2';
  const fluidType = process.argv[3] || 'transmission_fluid';
  const oemManufacturer = process.argv[4] || 'Honda';
  
  const equivalents = await findFluidEquivalents(oemSpec, fluidType, oemManufacturer);
  
  console.log('=== EQUIVALENTS FOUND ===\n');
  console.log(JSON.stringify(equivalents, null, 2));
  
  // Show summary
  if (equivalents.length > 0) {
    console.log('\n=== SUMMARY ===');
    equivalents.forEach((eq, i) => {
      console.log(`\n${i + 1}. ${eq.aftermarket_brand} ${eq.aftermarket_product}`);
      console.log(`   Confidence: ${eq.confidence_score}%`);
      console.log(`   Status: ${eq.certification_status}`);
      console.log(`   Price: $${eq.avg_price_per_quart}/qt`);
      console.log(`   Available: ${eq.widely_available ? 'YES' : 'NO'}`);
      console.log(`   Source: ${eq.verification_source}`);
      if (eq.warnings) {
        console.log(`   ⚠️  WARNING: ${eq.warnings}`);
      }
    });
    
    // Calculate savings
    console.log('\n=== POTENTIAL SAVINGS ===');
    const oem_price = equivalents.find(e => e.aftermarket_brand === oemManufacturer)?.avg_price_per_quart || 15.00;
    const cheapest = equivalents.reduce((min, eq) => 
      eq.avg_price_per_quart < min.avg_price_per_quart ? eq : min
    );
    const savings_per_quart = oem_price - cheapest.avg_price_per_quart;
    const savings_percent = ((savings_per_quart / oem_price) * 100).toFixed(0);
    
    console.log(`OEM Price (estimated): $${oem_price.toFixed(2)}/qt`);
    console.log(`Cheapest equivalent: ${cheapest.aftermarket_brand} @ $${cheapest.avg_price_per_quart}/qt`);
    console.log(`Savings: $${savings_per_quart.toFixed(2)}/qt (${savings_percent}%)`);
    console.log(`\nFor typical 4qt service: Save $${(savings_per_quart * 4).toFixed(2)}`);
  } else {
    console.log('No equivalents found. OEM fluid may be required.');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { findFluidEquivalents };
