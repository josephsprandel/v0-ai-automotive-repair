# VIN-to-Maintenance Architecture

## Overview
Single Gemini API call transforms VIN + mileage into engine-specific, severe-schedule maintenance recommendations with OEM parts and labor estimates.

## System Flow

```
┌─────────────────┐
│ User Input      │
├─────────────────┤
│ VIN: 1HGCV...   │
│ Mileage: 30000  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│ Step 1: Gemini VIN Decode + Manual Extract      │
│ Single API call (~16 seconds):                   │
│   1. Decode VIN → engine variant                 │
│   2. Search web for owner's manual               │
│   3. Read PDF from manufacturer URL              │
│   4. Extract SEVERE schedule services            │
│   5. Filter by mileage (≤ 30000)                 │
│   6. Include OEM part numbers                    │
│   7. Estimate labor hours                        │
│   8. Calculate urgency (overdue/due/soon)        │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Step 2: Post-Processing             │
│ - Fill missing labor hours          │
│ - Validate service categories       │
│ - Calculate urgency badges          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Step 3: Return to UI                │
│ - Show checkboxes (all selected)   │
│ - Display urgency badges            │
│ - Show OEM part numbers             │
│ - "Add Selected to RO" button       │
└─────────────────────────────────────┘
```

## Why VIN Instead of Year/Make/Model?

### VIN Decoding Provides:
- Engine displacement (1.5L vs 2.0L)
- Engine code (L15BE vs K20C4)
- Transmission type (CVT vs Manual)
- Drivetrain (FWD vs AWD)
- Trim level (Sport vs Touring)

### Example: Same Vehicle, Different Specs

**2020 Honda Accord LX (1.5L CVT)**
- Oil capacity: 3.7 quarts with filter
- Transmission: Honda HCF-2 CVT fluid

**2020 Honda Accord Sport (2.0L Manual)**
- Oil capacity: 5.0 quarts with filter
- Transmission: Honda MTF manual fluid

**Without VIN decode, we can't determine which specification to use.**

## Severe Service Schedule

**Default: ALWAYS use severe schedule**

### Why?
- 95% of vehicles qualify as severe
- Better to over-maintain than under-maintain
- Severe conditions include:
  - Short trips (<5 miles)
  - Stop-and-go traffic
  - Extreme temperatures (>90°F or <32°F)
  - Dusty conditions
  - Towing
  - Mountainous terrain

### Only "normal" driving:
- Highway-only commute
- Moderate climate year-round
- No towing
- No dusty conditions

**Decision: Remove checkbox, default to severe**

## Oil Capacity - With Filter

**Always use capacity WITH FILTER (larger amount)**

### Reason
We ALWAYS replace filter, so we need the larger capacity.

### Example
❌ Wrong: "4.7 quarts" (drain-and-fill only)  
✅ Correct: "5.0 quarts with filter"

### Gemini Prompt Instruction
"When extracting oil change services, ALWAYS use the capacity that includes a new filter."

## OEM Part Numbers

### Structure
```json
{
  "service_name": "Engine oil change",
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
      "qty": 5,
      "unit": "quart"
    }
  ]
}
```

### Benefits
- Auto-populate parts on RO
- Look up aftermarket equivalents
- Show customer OEM vs aftermarket pricing
- Inventory management

## Labor Hour Estimation

### Strategy
Gemini tries, fallback to standards

### Labor Standards (fallback)
```javascript
{
  "oil_change": 0.5,
  "transmission_service": 0.5,
  "differential_service": 0.5,
  "coolant_service": 0.5,
  "air_filter": 0.25,
  "cabin_filter": 0.25,
  "tire_rotation": 0.25,
  "brake_service": 1.0,
  "spark_plugs": 1.0,
  "inspection": 0.5
}
```

### Process
1. Gemini attempts to estimate from manual
2. If Gemini returns 0, use fallback standard
3. Advisor can override on RO if needed

## Service Name Standardization

### Problem
Owner's manuals use inconsistent terminology:
- "Replace engine oil and filter"
- "Engine oil service"
- "Lube, oil, and filter"
- "Oil change"

### Solution
Standardize in Gemini prompt

### Standard Service Names
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

## Urgency Levels

### Calculation
```javascript
const mileage_overdue = current_mileage - interval

if (mileage_overdue > 5000) {
  urgency = "OVERDUE"  // Red badge
  priority = 1
} else if (mileage_overdue >= 0) {
  urgency = "DUE_NOW"  // Orange badge
  priority = 2
} else if (interval - current_mileage <= 3000) {
  urgency = "COMING_SOON"  // Yellow badge
  priority = 3
} else {
  // Don't show - not due yet
}
```

### UI Display
- **OVERDUE:** Red badge, top of list, "Overdue by X miles"
- **DUE_NOW:** Orange badge, "Due now"
- **COMING_SOON:** Yellow badge, "Due in X miles"

## Service Card Structure

**Each service becomes an individual RO line item:**

```
┌─────────────────────────────────────────────────────┐
│ ☑ Engine Oil Change                    OVERDUE     │
├─────────────────────────────────────────────────────┤
│ Due at: 3,750 miles (severe schedule)               │
│ Current: 30,000 miles                               │
│ Overdue by: 26,250 miles                            │
├─────────────────────────────────────────────────────┤
│ Parts:                                              │
│   • Oil filter (15400-PLM-A02)           $8.99      │
│   • 0W-20 oil x5 qt (08798-9036)        $37.45      │
│ Labor: 0.5 hrs @ $120/hr                $60.00      │
│ Waste disposal fee                       $3.00      │
├─────────────────────────────────────────────────────┤
│ Total:                                  $109.44     │
└─────────────────────────────────────────────────────┘
```

### Customer Can
- See each service separately
- Understand what's included
- Approve/decline individually
- See pricing breakdown

## Why No Caching Strategy

**Philosophy: "We don't need to print the internet"**

AI queries reference data in real-time. Database only stores transactions we own.

### What We DON'T Store
- ❌ Maintenance schedules
- ❌ VIN decode data
- ❌ Vehicle specifications
- ❌ OEM part numbers
- ❌ Service intervals

### What We DO Store
- ✅ Customers (we own this)
- ✅ Repair orders (we own this)
- ✅ Invoices (we own this)
- ✅ Parts inventory (we own this)
- ✅ Labor rates (we own this)

### Why No Caching?

**1. Low Cache Hit Rate (<5%)**
- Most lookups are different VINs
- Same VIN often has different mileage
- VIN + mileage combinations rarely repeat
- Example: 100 ROs/month × 0.05 hit rate = 5 cache hits
- 5 cache hits × 16 seconds saved = 80 seconds saved/month
- Not worth the complexity

**2. 16 Seconds is Acceptable**
- Faster than manual lookup in Mitchell/AllData
- Faster than calling parts department
- Advisor can review with customer during wait
- One-time delay per RO creation

**3. Always Fresh Data**
- Get current OEM recommendations
- No stale data from old manuals
- Manufacturer updates immediately available
- No cache invalidation complexity

**4. Reduced Complexity**
- No database migrations
- No cache invalidation logic
- No duplicate data management
- No sync issues
- Simpler codebase

**5. Storage Costs**
- No database growth over time
- No index maintenance
- No backup overhead
- No query optimization needed

**6. AI as Reference Layer**
- Gemini accesses authoritative sources
- Like looking up a fact in a book
- We don't cache books, we reference them
- Same principle applies here

### When Caching WOULD Make Sense

Only if cache hit rate > 50%:
- Fleet vehicles (same VINs repeatedly)
- Subscription service (same customer monthly)
- High-volume quick lube (limited models)

**Our use case:** Diverse VINs, infrequent repeats → No cache

## API Response Structure

```json
{
  "source": "gemini_ai",
  "duration": 16.4,
  "vehicle_info": {
    "vin": "1HGCV1F30LA123456",
    "year": 2020,
    "make": "Honda",
    "model": "Accord",
    "engine_displacement": "1.5L",
    "engine_code": "L15BE",
    "transmission_type": "CVT",
    "drivetrain": "FWD",
    "trim": "LX"
  },
  "manual_source": "Honda Owners Site",
  "pdf_url": "https://...",
  "services": [
    {
      "service_name": "Engine oil change",
      "mileage_interval": 3750,
      "service_category": "oil_change",
      "service_description": "Replace oil and filter - 3.7qt 0W-20 (with filter)",
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
      "urgency": "OVERDUE",
      "mileage_until_due": -26250,
      "priority": 1,
      "reason": "Overdue by 26,250 miles",
      "notes": "Use Honda Genuine 0W-20 or API SN PLUS equivalent"
    }
  ]
}
```

## Error Handling

### Possible Failures
1. **VIN decode fails** → Fallback to Y/M/M manual entry
2. **Manual not found** → Return 404, suggest manual upload
3. **Gemini timeout** → Retry once, then return error
4. **Parse error** → Log and retry once

### User Experience
- Never show raw errors
- Always provide actionable next step
- Show loading state during 16-second wait

## Cost Analysis

### Per Lookup
- **Gemini API:** ~$0.01-0.02 (16 second processing)
- **No database costs** (no caching)

### Monthly Estimate (100 ROs)
- **Lookups:** 100 × $0.015 = $1.50
- **Total:** ~$1.50/month

### Comparison to Alternatives
- **Vehicle Databases API:** $50-100/month subscription
- **Mitchell/AllData:** $100-300/month subscription
- **Savings:** $50-300/month ($600-3,600/year)

## Testing Strategy

### Test Cases
1. 2020 Honda Accord 1.5L CVT @ 30k (common vehicle)
2. 2020 Honda Accord 2.0L Manual @ 30k (same model, different engine)
3. 2012 Toyota Camry @ 50k (older vehicle)
4. Invalid VIN (error handling)
5. Vehicle with no manual (error handling)
6. Extremely high mileage (200k+ miles)

### Validation Criteria
- ✅ VIN decodes correctly
- ✅ Correct engine variant identified
- ✅ Oil capacity matches engine (with filter)
- ✅ Part numbers included when available
- ✅ Labor hours reasonable or 0
- ✅ Services sorted by urgency (OVERDUE → DUE_NOW → COMING_SOON)

## Future Enhancements

### Potential Additions
1. **Fluid equivalents integration** - Show aftermarket options
2. **Parts pricing lookup** - Real-time distributor prices
3. **Labor time learning** - Track actual vs estimated
4. **Service bundling** - Recommend doing multiple services together
5. **Customer history** - Remember declined services, remind next visit
6. **Predictive maintenance** - Based on driving patterns
7. **Recall/TSB integration** - Auto-add if applicable
8. **Multi-language support** - Spanish owner's manuals

## Performance Metrics

### Target Benchmarks
- **Lookup time:** < 20 seconds (Gemini processing)
- **Success rate:** > 95% (manual found and parsed)
- **Accuracy:** > 99% (VIN decode correct)
- **Uptime:** > 99.9%

### Monitoring
- Track Gemini response times
- Log failed VIN decodes
- Log failed manual retrievals
- Alert on success rate < 90%
- Alert on average response time > 25 seconds
