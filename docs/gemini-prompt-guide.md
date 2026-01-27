# Gemini Prompt Engineering Guide

## Complete VIN-to-Maintenance Prompt

```javascript
const prompt = `
You have access to web search and can read PDFs from the web.

Task: Using this VIN, find the owner's manual and extract maintenance recommendations.

VIN: ${vin}
Current mileage: ${mileage} miles
Driving conditions: SEVERE (dusty, towing, short trips, extreme temps)

Steps:
1. Decode the VIN to determine:
   - Year, Make, Model
   - Engine displacement and type (1.5L, 2.0L, V6, etc.)
   - Engine code (L15BE, K20C4, etc.)
   - Transmission type (CVT, manual, automatic, 10AT, etc.)
   - Drivetrain (FWD, RWD, AWD)
   - Trim level if possible
   
2. Search the web for the owner's manual PDF for this EXACT vehicle configuration

3. Read the owner's manual PDF directly from the web (you can access PDFs at URLs)

4. Find the "Maintenance Schedule" or "Service Intervals" section in the manual

5. Extract services due at or before ${mileage} miles for SEVERE driving conditions
   - Always use SEVERE schedule if manual has both normal and severe
   - Short trips, stop-and-go traffic, extreme temps, dusty, towing qualify as severe

6. Match services to the SPECIFIC ENGINE variant
   - Oil capacity varies by engine (1.5L = 3.7qt, 2.0L = 5.0qt)
   - Filter types vary by engine
   - Belt sizes vary by engine

7. For oil changes, ALWAYS use capacity WITH FILTER (larger amount)
   - Reason: We always replace filter, so need the larger capacity
   - Example: "3.7 quarts with filter" NOT "3.4 quarts"

8. Include OEM part numbers WHEN AVAILABLE in the manual
   - Oil filters, air filters, spark plugs often have part numbers
   - Format: "15400-PLM-A02"

9. Estimate labor hours if manual provides timing
   - If not in manual, return 0 (we will fill with standards)

10. Use these EXACT service names (standardize terminology):
    - "Engine oil change"
    - "Transmission fluid drain and fill"
    - "Engine air filter replacement"
    - "Cabin air filter replacement"
    - "Tire rotation"
    - "Brake fluid flush"
    - "Coolant drain and fill"
    - "Differential fluid service"
    - "Spark plug replacement"
    - "Battery service"
    - "Brake inspection"

Return JSON in this EXACT format:
{
  "vehicle_info": {
    "vin": "${vin}",
    "year": 2020,
    "make": "Honda",
    "model": "Accord",
    "engine_displacement": "1.5L",
    "engine_type": "Turbocharged I4",
    "engine_code": "L15BE",
    "transmission_type": "CVT",
    "drivetrain": "FWD",
    "trim": "LX"
  },
  "manual_found": true,
  "manual_source": "Honda Owners Site",
  "pdf_url": "https://...",
  "services": [
    {
      "service_name": "Engine oil change",
      "mileage_interval": 3750,
      "service_category": "oil_change",
      "service_description": "Replace engine oil and filter - 3.7 quarts 0W-20 with filter",
      "driving_condition": "severe",
      "parts": [
        {
          "part_number": "15400-PLM-A02",
          "description": "Oil filter",
          "qty": 1,
          "unit": "each"
        },
        {
          "part_number": "08798-9036",
          "description": "Honda 0W-20 oil",
          "qty": 4,
          "unit": "quart"
        }
      ],
      "estimated_labor_hours": 0.5,
      "notes": "Use Honda Genuine 0W-20 or API SN PLUS equivalent"
    }
  ]
}

If you cannot decode the VIN or find the manual:
{
  "vehicle_info": null,
  "manual_found": false,
  "reason": "Could not decode VIN" OR "Owner's manual not found for this vehicle"
}

Service categories (use exact match):
- oil_change
- tire_service
- brake_service
- filter_replacement
- fluid_service
- inspection
- battery_service
- spark_plugs
- belts_hoses
- transmission_service
- differential_service
- coolant_service
- other

CRITICAL RULES:
1. Match services to the SPECIFIC ENGINE variant from VIN decode
2. Include engine-specific notes (oil capacity, filter size, fluid types)
3. For oil: use capacity WITH FILTER (larger amount)
4. Use standardized service names from list above
5. Return ONLY valid JSON. No markdown. No explanation. No preamble.
6. If part numbers available in manual, include them
7. If labor hours in manual, include them (otherwise return 0)
8. Do NOT cache or store these results - they are reference data only
`;
```

## Prompt Design Principles

### 1. Be Explicit About Data Sources

✅ **Good:** "Read the PDF directly from the web (you can access PDFs at URLs)"  
❌ **Bad:** "Get the maintenance schedule"

**Why:** Gemini needs to know it has special PDF access

### 2. Specify Output Format Exactly

✅ **Good:** "Return ONLY valid JSON. No markdown. No explanation."  
❌ **Bad:** "Return the results in JSON format"

**Why:** Prevents markdown wrapping and explanatory text

### 3. Handle Edge Cases in Prompt

✅ **Good:** "For oil: use capacity WITH FILTER (larger amount)"  
❌ **Bad:** "Include oil capacity"

**Why:** Manuals list both drain-and-fill AND with-filter capacities

### 4. Standardize Terminology

✅ **Good:** "Use these EXACT service names: [list]"  
❌ **Bad:** "Extract service names from manual"

**Why:** Manuals use inconsistent terminology

### 5. Include Complete Examples

✅ **Good:** Show full JSON example with all fields populated  
❌ **Bad:** Just describe the structure

**Why:** Examples serve as schema validation

### 6. Explain Why Not Just What

✅ **Good:** "ALWAYS use SEVERE schedule because 95% of vehicles qualify"  
❌ **Bad:** "Use severe schedule"

**Why:** Helps Gemini make correct decisions when ambiguous

### 7. Provide Fallback Instructions

✅ **Good:** "If part numbers not in manual, return empty array"  
❌ **Bad:** "Include part numbers"

**Why:** Prevents hallucination when data unavailable

## Common Prompt Issues

### Issue 1: Gemini Returns Markdown

**Problem:** Response wrapped in \`\`\`json ... \`\`\`

**Solution in Prompt:**
```
"Return ONLY valid JSON. No markdown. No explanation."
```

**Post-processing Solution:**
```javascript
const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
```

---

### Issue 2: Inconsistent Service Names

**Problem:** Same service returns different names:
- "Oil change"
- "Replace engine oil"
- "Lube, oil, and filter"

**Solution in Prompt:**
```
"Use these EXACT service names (standardize terminology):
- 'Engine oil change'
- 'Transmission fluid drain and fill'
..."
```

**Validation in Code:**
```javascript
const validNames = [
  "Engine oil change",
  "Transmission fluid drain and fill",
  // ...
];

if (!validNames.includes(service.service_name)) {
  console.warn(`Non-standard service name: ${service.service_name}`);
}
```

---

### Issue 3: Missing Part Numbers

**Problem:** Parts array empty even when manual contains part numbers

**Solution in Prompt:**
```
"Include OEM part numbers WHEN AVAILABLE in the manual.
Oil filters, air filters, spark plugs often have part numbers.
Format: '15400-PLM-A02'

If part numbers not in manual, return empty parts array []"
```

**Don't expect part numbers for:**
- Fluids (oil, coolant, brake fluid) - use generic
- Tires
- Wiper blades

**Do expect for:**
- Filters (oil, air, cabin)
- Spark plugs
- Batteries (sometimes)

---

### Issue 4: Wrong Oil Capacity

**Problem:** Returns 3.4qt when should be 3.7qt (drain-and-fill vs with filter)

**Root Cause:** Manuals list BOTH capacities:
- Drain-and-fill only: 3.4 quarts
- With filter change: 3.7 quarts

**Solution in Prompt:**
```
"For oil changes, ALWAYS use capacity WITH FILTER (larger amount).
Reason: We always replace filter, so need the larger capacity.
Example: '3.7 quarts with filter' NOT '3.4 quarts'"
```

**Validation in Code:**
```javascript
if (service.service_category === 'oil_change') {
  if (!service.service_description.toLowerCase().includes('with filter')) {
    console.warn('Oil capacity may not include filter');
  }
}
```

---

### Issue 5: Hallucinated Engine Code

**Problem:** Returns engine code not from VIN (makes it up)

**Solution in Prompt:**
```
"Decode the VIN to determine engine code (L15BE, K20C4, etc.)
If engine code cannot be determined from VIN, return null"
```

**Note:** Engine code often not decodable from VIN alone. That's okay.

---

### Issue 6: Normal vs Severe Confusion

**Problem:** Returns normal schedule when should be severe

**Solution in Prompt:**
```
"Extract services for SEVERE driving conditions.
Always use SEVERE schedule if manual has both normal and severe.
Severe conditions include:
- Short trips (<5 miles)
- Stop-and-go traffic
- Extreme temperatures
- Dusty conditions
- Towing"
```

**Why we always use severe:**
- 95% of vehicles qualify
- Better to over-maintain than under-maintain
- Customers won't complain about more frequent service

## Testing Your Prompts

### Always Test With

1. **Common vehicle** - 2020 Honda Accord
   - Should succeed easily
   - Validates happy path

2. **Uncommon vehicle** - 2012 Suzuki Kizashi
   - Tests manual availability
   - Validates error handling

3. **Same model, different engines** - 1.5L vs 2.0L Accord
   - Tests engine-specific extraction
   - Validates oil capacity varies (3.7qt vs 5.0qt)

4. **Invalid VIN** - "INVALID123456789"
   - Tests error handling
   - Should return `manual_found: false`

5. **Old vehicle** - 1995 Honda Accord
   - May not have PDF manual
   - Tests fallback behavior

### Validation Checklist

For each test, verify:

- [ ] JSON parses correctly (no syntax errors)
- [ ] All required fields present
- [ ] VIN decoded correctly (year, make, model)
- [ ] Engine displacement matches VIN
- [ ] Service names standardized
- [ ] Oil capacity includes "with filter"
- [ ] Part numbers present (if available in manual)
- [ ] Labor hours reasonable (0-2 hours for most services)
- [ ] Mileage intervals make sense (not 100,000 miles for oil)
- [ ] Service category matches service name

### Example Test Code

```javascript
async function testPrompt(vin, mileage) {
  const result = await getMaintenanceRecommendations(vin, mileage);
  
  // Validation
  assert(result.vehicle_info, 'Missing vehicle_info');
  assert(result.vehicle_info.year >= 1990, 'Invalid year');
  assert(result.services, 'Missing services array');
  
  result.services.forEach(service => {
    assert(service.service_name, 'Missing service name');
    assert(service.mileage_interval > 0, 'Invalid interval');
    
    if (service.service_category === 'oil_change') {
      assert(
        service.service_description.includes('with filter'),
        'Oil capacity must include filter'
      );
    }
  });
  
  console.log('✅ Test passed');
}
```

## Iterative Prompt Improvement

### Process

1. **Run test** with current prompt
2. **Identify issue** in output
3. **Add specific instruction** to prompt
4. **Re-test** same vehicle
5. **Validate fix** didn't break other cases

### Example: Fixing Oil Capacity

**Initial prompt:** "Extract oil capacity"

**Test result:** Returns "3.4 quarts" (wrong)

**Root cause:** Manual lists both 3.4qt (drain) and 3.7qt (with filter)

**Improved prompt:** "For oil: use capacity WITH FILTER (larger amount)"

**Re-test:** Returns "3.7 quarts with filter" (correct)

**Validate:** Test with different vehicle → still works

### Log Everything

```javascript
console.log('=== Gemini Request ===');
console.log('VIN:', vin);
console.log('Mileage:', mileage);
console.log('Prompt length:', prompt.length);

console.log('=== Gemini Response ===');
console.log('Duration:', duration);
console.log('Response length:', text.length);
console.log('First 500 chars:', text.substring(0, 500));

console.log('=== Parsed Result ===');
console.log('Services found:', result.services.length);
result.services.forEach(s => {
  console.log(`- ${s.service_name} @ ${s.mileage_interval}mi`);
});
```

## Prompt Versioning

**Track prompt changes over time:**

```javascript
const PROMPT_VERSION = '2.0.0';

const CHANGELOG = {
  '2.0.0': 'Added OEM part numbers extraction',
  '1.5.0': 'Fixed oil capacity to use with-filter amount',
  '1.0.0': 'Initial VIN-to-maintenance prompt'
};
```

**Include in API response:**
```json
{
  "prompt_version": "2.0.0",
  "services": [...]
}
```

**Why:** Debug issues by knowing which prompt version was used

## Best Practices Summary

1. ✅ Be explicit about what Gemini can do ("you can read PDFs from URLs")
2. ✅ Provide complete JSON examples with all fields
3. ✅ Handle edge cases explicitly ("use with-filter capacity")
4. ✅ Standardize output ("use these exact service names")
5. ✅ Include fallback instructions ("if not available, return null")
6. ✅ Explain reasoning ("because we always replace filter")
7. ✅ Test with diverse vehicles (common, uncommon, different engines)
8. ✅ Validate output structure and content
9. ✅ Log everything for debugging
10. ✅ Version your prompts

## Resources

- [Google AI Studio](https://aistudio.google.com/) - Test prompts interactively
- [Gemini API Docs](https://ai.google.dev/docs) - Official documentation
- Test results in `/scripts/test-gemini-vin-to-maintenance.js`
