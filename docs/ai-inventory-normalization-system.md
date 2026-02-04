# AI Inventory Normalization System

## Overview
The AI Inventory Normalization System enables scanning product labels (oil bottles, fluid containers) with Gemini 3.0 vision to extract technical specifications and store them in a searchable format. This enables intelligent spec-based parts matching during service order creation.

## Implementation Components

### Part 1: Database Schema ✅
**File:** `db/migrations/013_fluid_specifications.sql`

**Tables Created:**
1. **`fluid_specifications`** - Stores detailed specs extracted from labels
   - Product info: name, brand, container size
   - Technical specs: viscosity, API, ACEA, ILSAC, JASO
   - OEM approvals: JSONB array of normalized codes
   - Quality metadata: confidence score, extraction method
   - Links to `parts_inventory` via `inventory_id`

2. **`oem_spec_mappings`** - Normalizes OEM spec variations
   - Maps raw text (e.g., "dexos1™ Gen 3") to normalized codes (e.g., "GM-DEXOS1-G3")
   - Seeded with 40+ common specs from GM, Ford, VW, BMW, Mercedes, Volvo, etc.

3. **Enhanced `parts_inventory`** - Added spec tracking columns
   - `category`, `spec_verified`, `needs_spec_review`, `has_detailed_specs`, `label_photo_url`

### Part 2: Label Scanner API ✅
**File:** `app/api/inventory/scan-label/route.ts`

**Endpoint:** `POST /api/inventory/scan-label`

**Features:**
- Accepts multiple photos via FormData (front/back of bottle)
- Uses **Gemini 3.0 Flash** (`gemini-3-flash-preview`) with structured JSON output
- Extracts comprehensive specs:
  - Product identification (name, brand, container size)
  - Fluid classification (type, base stock)
  - Industry standards (API, ACEA, ILSAC, JASO)
  - OEM approvals with status (licensed/approved/meets/exceeds)
  - Special properties (low SAPS, high mileage)
- Normalizes OEM approvals using `oem_spec_mappings` table
- Returns confidence score (0-1) for quality control
- Flags items needing review if confidence < 0.8

**Response Format:**
```json
{
  "success": true,
  "extracted": {
    "product_name": "Mobil 1 Advanced Full Synthetic",
    "brand": "Mobil",
    "fluid_type": "engine_oil",
    "base_stock": "full_synthetic",
    "viscosity": "0W20",
    "api_service_class": "SP",
    "ilsac_class": "GF-6A",
    "oem_approvals": [
      {
        "raw_text": "dexos1 Gen 3",
        "normalized_code": "GM-DEXOS1-G3",
        "manufacturer": "General Motors",
        "status": "licensed",
        "was_normalized": true
      }
    ],
    "confidence_score": 0.95
  },
  "needs_review": false
}
```

### Part 3: Spec Update Endpoint ✅
**File:** `app/api/inventory/[id]/specs/route.ts`

**Endpoints:**
- `POST /api/inventory/[id]/specs` - Save extracted specs
- `GET /api/inventory/[id]/specs` - Retrieve specs for an item
- `DELETE /api/inventory/[id]/specs` - Remove specs

**Save Logic:**
1. Validates inventory item exists
2. Updates `parts_inventory` with verification flags
3. Inserts/updates `fluid_specifications` (ON CONFLICT DO UPDATE)
4. Uses database transaction for atomicity
5. Returns updated item with full spec data

### Part 4: Scanner UI Page ✅
**File:** `app/inventory/scan-specs/page.tsx`

**Route:** `/inventory/scan-specs`

**Features:**
- Photo upload interface (supports multiple images)
- Real-time image preview with remove capability
- AI extraction progress indicator
- Extracted specs display with confidence scoring
- Color-coded warnings (green ≥80%, yellow 70-80%, red <70%)
- Inventory search and linking
- Save to database functionality

**User Flow:**
1. Upload photos of product label
2. Click "Scan Labels" → Gemini 3.0 extracts specs
3. Review extracted data (editable if needed)
4. Search and select inventory item to link
5. Save specifications to database

### Part 5: Parts Generation Integration ✅
**Files Modified:**
- `app/api/services/generate-parts-list/route.ts`
- `components/repair-orders/parts-selection-modal.tsx`

**Enhanced Matching Logic:**

**Priority 1: Spec-Matched Inventory**
- Queries `fluid_specifications` table for verified items
- Filters by viscosity match (e.g., 0W-20 = 0W-20)
- Checks OEM approval matches (e.g., GM vehicle → dexos oil)
- Scores items: OEM match = 100, verified specs = 80
- Sorts by: OEM match → confidence → price

**Priority 2: Legacy AI Matching**
- Fallback if no spec-matched items found
- Uses Gemini 3.0 to compare inventory to needed specs
- Matches by specification, not brand

**Priority 3: Regular Inventory**
- Part-number matched items from existing logic

**Priority 4: PartsTech Vendors**
- External ordering options

**UI Enhancements:**
- Blue border/highlight for spec-matched items
- "✅ OEM Approved" badge for items meeting vehicle OEM specs
- "✓ Verified Specs" badge for spec-matched items
- Detailed spec info box showing:
  - Match reason (e.g., "Meets GM OEM specs: GM-DEXOS1-G3")
  - Viscosity, API class, ACEA class
  - OEM approval badges

## Usage Workflow

### Scanning a New Product
1. Navigate to `/inventory/scan-specs`
2. Upload photos of the product label
3. Click "Scan Labels with AI"
4. Review extracted specifications
5. Search for the inventory item by part number
6. Save specs to link them to the item

### Using Specs in Service Orders
1. Create a repair order with maintenance services
2. Select services requiring fluids (e.g., oil change)
3. AI generates parts list with spec requirements
4. System automatically prioritizes spec-matched inventory:
   - Items meeting OEM requirements appear first
   - Blue highlighting indicates verified compatibility
   - OEM approval badges show certification status
5. Select preferred option and add to RO

## Success Metrics

✅ **Can scan oil bottle label and extract all specs**
- Gemini 3.0 vision extracts: viscosity, API, ACEA, OEM approvals
- Confidence scoring ensures quality (>80% verified, <80% flagged)

✅ **OEM approvals normalized to standard codes**
- "dexos1™ Gen 3" → "GM-DEXOS1-G3"
- "VW 504 00" → "VW-504.00"
- 40+ mappings seeded in database

✅ **Specs stored in searchable format**
- `fluid_specifications` table with full-text indexes
- JSONB for flexible OEM approval storage
- GIN indexes for fast querying

✅ **Parts generation matches by OEM requirements**
- GM vehicle → prioritizes dexos-certified oils
- VW vehicle → prioritizes VW 504/507 approved fluids
- Display match status in selection modal

✅ **Confidence scoring flags uncertain extractions**
- < 80% = needs manual review
- ≥ 80% = auto-verified
- Warnings array for specific issues

## Technical Architecture

### Data Flow
```
Label Photo(s) 
  → Gemini 3.0 Vision API 
  → Structured JSON Extraction
  → OEM Normalization (oem_spec_mappings)
  → fluid_specifications table
  → parts_inventory (indexed fields)
```

### Matching Flow
```
Service Request (e.g., "0W-20 oil change on 2023 Chevy Silverado")
  → Check fluid_specifications for 0W-20 oils
  → Filter by OEM approvals (GM-DEXOS*)
  → Sort by: OEM match → confidence → price
  → Display with "✅ OEM Approved" badge
```

### Database Relationships
```
parts_inventory (1) ←→ (1) fluid_specifications
                     ↓
              has_detailed_specs flag

oem_spec_mappings (lookup table)
  → Used during extraction to normalize specs
```

## Key Design Decisions

1. **Gemini 3.0 Flash** - Fast, cost-effective for vision tasks
2. **JSONB for OEM approvals** - Flexible for multiple certifications per product
3. **Two-level storage** - Full specs in `fluid_specifications`, indexed fields in `parts_inventory`
4. **Confidence scoring** - Ensures quality control with manual review fallback
5. **Normalization table** - Handles spelling/formatting variations automatically
6. **Prioritized matching** - Spec-matched → AI-matched → Part-number → Vendor

## Future Enhancements

### Potential Additions:
1. **Barcode/QR code scanning** - Extract specs via UPC lookup
2. **Batch scanning** - Process multiple products at once
3. **Photo storage** - Save label photos to cloud storage
4. **Manual spec entry** - Form-based input for items without labels
5. **Spec conflict detection** - Warn if rescanning changes verified specs
6. **OEM requirement lookup** - Auto-determine needed specs from vehicle VIN
7. **Inventory reorder suggestions** - Based on spec popularity and usage

## API Reference

### Scan Label
```typescript
POST /api/inventory/scan-label
Content-Type: multipart/form-data

Body: FormData with 'photos' field (File[])

Response: {
  success: boolean
  extracted: ExtractedSpec
  needs_review: boolean
  metadata: {
    photos_processed: number
    extraction_date: string
    model: string
  }
}
```

### Save Specs
```typescript
POST /api/inventory/[id]/specs
Content-Type: application/json

Body: {
  extracted: ExtractedSpec
  photoUrl?: string
}

Response: {
  success: boolean
  message: string
  needs_review: boolean
  confidence_score: number
  inventory_item: InventoryItemWithSpecs
}
```

### Get Specs
```typescript
GET /api/inventory/[id]/specs

Response: {
  success: boolean
  data: InventoryItemWithSpecs
}
```

## Maintenance

### Adding New OEM Specs
```sql
INSERT INTO oem_spec_mappings (raw_text, normalized_code, manufacturer, spec_type, notes)
VALUES 
  ('Ford WSS-M2C960-A1', 'FORD-WSS-M2C960-A1', 'Ford', 'oil', 'New Ford spec'),
  ('BMW LL-23', 'BMW-LL-23', 'BMW', 'oil', 'Latest BMW spec');
```

### Running Migration
```bash
psql -d your_database -f db/migrations/013_fluid_specifications.sql
```

### Monitoring Extraction Quality
```sql
-- Find items needing review
SELECT p.part_number, p.description, f.confidence_score, f.extraction_date
FROM parts_inventory p
JOIN fluid_specifications f ON p.id = f.inventory_id
WHERE p.needs_spec_review = true
ORDER BY f.confidence_score ASC;

-- Average confidence by fluid type
SELECT 
  fluid_type,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) as count
FROM fluid_specifications
GROUP BY fluid_type
ORDER BY avg_confidence DESC;
```

## Conclusion

The AI Inventory Normalization System successfully unblocks the maintenance service writer by enabling intelligent spec-based parts matching. The system uses Gemini 3.0 vision for accurate extraction, maintains a normalized OEM spec database, and seamlessly integrates with the existing parts generation workflow to prioritize compatible, in-stock inventory.
