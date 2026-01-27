# Why We Don't Store Maintenance Schedules in Database

## Philosophy: "We Don't Need to Print the Internet"

**Core Principle:** AI queries reference data in real-time. Database only stores transactions we own.

## What We DON'T Store

### ❌ Maintenance Schedules
- Service intervals (oil change at 3,750 miles)
- Mileage-based recommendations
- Driving condition variants (normal vs severe)

**Why not?**
- This is reference data (like a book)
- We don't own it
- Changes when manufacturer updates manuals
- Would require constant synchronization

### ❌ VIN Decode Data
- Year, make, model from VIN
- Engine displacement (1.5L, 2.0L)
- Transmission type (CVT, Manual)
- Trim level (LX, Sport)

**Why not?**
- This is lookup data (like a dictionary)
- Available on-demand from Gemini
- Would become stale
- No benefit to caching

### ❌ Vehicle Specifications
- Oil capacity (3.7qt vs 5.0qt)
- Filter part numbers (15400-PLM-A02)
- Fluid types (Honda HCF-2 CVT fluid)
- Belt sizes, spark plug specs

**Why not?**
- This is specification data (like an encyclopedia)
- Varies by exact engine variant
- Better to query fresh each time

### ❌ OEM Part Numbers
- Oil filters
- Air filters
- Spark plugs
- Batteries

**Why not?**
- Manufacturers change part numbers
- Supersessions happen frequently
- Not our inventory
- Query when needed

### ❌ Service Intervals
- 3,750 miles (severe)
- 7,500 miles (normal)
- Time-based (every 12 months)

**Why not?**
- These are recommendations, not facts
- Manufacturers update recommendations
- TSBs can change intervals
- Fresh lookup ensures accuracy

## What We DO Store

### ✅ Customers
- Names, phone numbers, emails
- Addresses
- Vehicle history (which cars they own)
- Payment information

**Why?**
- This is OUR data
- We own these relationships
- Not available elsewhere
- Core to our business

### ✅ Repair Orders
- RO number, date created
- Services performed
- Parts used
- Labor hours actual
- Total amount

**Why?**
- This is OUR transaction data
- Legal requirement to maintain
- Historical record
- Financial reporting

### ✅ Invoices
- Invoice numbers
- Payment received
- Payment method
- Date paid

**Why?**
- Financial records
- Tax purposes
- Legal requirement
- Our business data

### ✅ Parts Inventory
- Parts we physically have
- Quantities on hand
- Cost basis
- Shelf locations

**Why?**
- Our physical inventory
- Real-time stock levels
- We paid for these
- Need to track value

### ✅ Labor Rates
- Our shop labor rate ($120/hr)
- Technician skill levels
- Flat rate vs actual

**Why?**
- Our pricing structure
- Business decision
- Changes over time
- Need historical records

## The Cache Hit Rate Problem

### Math: Why Caching Doesn't Work Here

**Assumptions:**
- 100 ROs created per month
- Each uses VIN-to-maintenance lookup
- Diverse customer base (not fleet)

**Scenario 1: No Repeat Customers (Worst Case)**
- 100 unique VINs
- Cache hit rate: 0%
- All 100 lookups require Gemini call

**Scenario 2: 50% Repeat Customers (Realistic)**
- But with different mileages!
- Customer 1 at 30k miles → Gemini lookup
- Same customer 6 months later at 35k miles → **Different results needed**
- Cache miss because mileage changed
- Effective cache hit rate: <5%

**Scenario 3: Same VIN, Same Mileage (Rare)**
- Customer creates RO
- Realizes mistake, deletes RO
- Creates new RO same day
- This would be a cache hit
- Happens ~5 times per 100 ROs = 5% hit rate

### Cache Hit Rate Calculation

```
Cache hits per month: 5
Time saved per hit: 16 seconds
Total time saved: 80 seconds = 1.3 minutes

Complexity added:
- Database schema migrations
- Cache invalidation logic
- Stale data handling
- Query optimization
- Index maintenance

Worth it? NO
```

## The "Fresh Data" Advantage

### Manufacturer Updates

**Without Caching (Our Approach):**
1. Honda issues TSB changing oil interval
2. Next Gemini query gets updated manual
3. Customers get correct recommendation
4. No action needed by us

**With Caching (Traditional):**
1. Honda issues TSB
2. Our cache now has wrong data
3. Must detect the update somehow
4. Manually invalidate cache for affected vehicles
5. Re-populate with correct data
6. Hope we caught all affected vehicles

### Real-World Example

**2020 Honda Accord 1.5L Turbo:**

- **Original:** Oil change every 7,500 miles
- **TSB Update:** Oil change every 3,750 miles (dilution issue)

**Without cache:** Next lookup gets 3,750 miles ✅  
**With cache:** Still returns 7,500 miles ❌

## The Complexity Cost

### What Caching Would Require

**Database:**
```sql
CREATE TABLE maintenance_schedules (
  id SERIAL PRIMARY KEY,
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR(50),
  model VARCHAR(50),
  engine_displacement VARCHAR(20),
  transmission_type VARCHAR(50),
  mileage_interval INTEGER,
  service_name VARCHAR(200),
  service_description TEXT,
  service_category VARCHAR(50),
  driving_condition VARCHAR(20),
  source_pdf TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_maint_vin ON maintenance_schedules(vin);
CREATE INDEX idx_maint_vehicle ON maintenance_schedules(year, make, model);
CREATE INDEX idx_maint_engine ON maintenance_schedules(year, make, model, engine_displacement);
CREATE UNIQUE INDEX idx_maint_unique ON maintenance_schedules(
  vin, mileage_interval, service_name, driving_condition, engine_displacement
) WHERE vin IS NOT NULL;
```

**Code:**
- Cache check logic
- Cache population logic
- Cache invalidation logic
- Stale data detection
- Conflict resolution
- Migration scripts
- Backup procedures

**Operations:**
- Monitor cache hit rate
- Watch for TSB updates
- Manual cache clearing
- Query performance tuning
- Index maintenance
- Disk space monitoring

### What NO Caching Requires

**Code:**
```javascript
// Call Gemini
const result = await geminiModel.generateContent(prompt);

// Return to UI
return result;
```

**Operations:**
- Monitor Gemini response times
- Log failed lookups
- That's it.

## When Caching WOULD Make Sense

### High Cache Hit Rate Scenarios

**Fleet Vehicles:**
- 100 Ford F-150s (same VIN prefix)
- Same maintenance schedule
- Looked up repeatedly
- Cache hit rate: 80%+

**Subscription Service:**
- Customer pays monthly fee
- Look up same vehicle every month
- Same VIN, same intervals
- Cache hit rate: 90%+

**Quick Lube Chain:**
- Only oil changes
- Limited vehicle types
- Same service repeatedly
- Cache hit rate: 70%+

### Our Use Case: General Repair Shop

- Diverse vehicle types
- Infrequent repeats
- Different mileages each visit
- Full service range
- **Cache hit rate: <5%**

**Decision: Don't cache**

## AI as Reference Layer vs Database as Transaction Layer

### Mental Model

**Database = Filing Cabinet**
- Store things we created
- Store things we own
- Store things we're legally required to keep
- Store things that change (our data)

**AI = Library**
- Reference authoritative sources
- Query when needed
- Always get current information
- Don't cache books - read them

### Examples

**Customer Name:**
- Database ✅ (we own this relationship)

**Oil Change Interval:**
- AI ✅ (manufacturer's recommendation, changes)

**RO Number:**
- Database ✅ (we assigned this)

**VIN Decode:**
- AI ✅ (lookup service, standardized)

**Invoice Total:**
- Database ✅ (our transaction)

**Part Number:**
- AI ✅ (manufacturer's spec, supersedes)

## Cost Comparison

### NO Caching (Our Approach)

**Costs:**
- Gemini API: $1.50/month (100 lookups)
- Database: $0 (no additional tables)
- Developer time: $0 (no cache logic)
- Operations: $0 (no cache maintenance)

**Total: $1.50/month**

### WITH Caching (Traditional)

**Costs:**
- Gemini API: $1.50/month (100 first lookups, 5 cache misses)
- Database: $5/month (additional storage, indexes)
- Developer time: $2,000 (initial implementation)
- Operations: $50/month (monitoring, maintenance, manual invalidations)

**Total: $56.50/month + $2,000 upfront**

**ROI:** Never breaks even (5% hit rate × 16 seconds = negligible benefit)

## Summary

**We store transactions, we reference specs.**

**Database:** Customers, ROs, invoices, inventory, payments  
**AI:** Maintenance schedules, VIN decodes, specs, part numbers

**Why?**
- Transactions are ours (we created them)
- Specs are theirs (manufacturers own them)
- Transactions don't change (historical record)
- Specs do change (updates, TSBs)
- Transactions have legal requirements (must keep)
- Specs are reference (query when needed)

**Result:**
- Simpler system
- Always fresh data
- No cache complexity
- No stale data issues
- Lower operational cost
- Faster development

**Trade-off:**
- 16-second lookup time (acceptable)
- Gemini API cost (minimal: $1.50/month)

**Decision:** Worth it.
