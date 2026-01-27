# End-to-End Testing Guide: AI Recommendations → Database Persistence

## Step 1: Verify Server is Running

```bash
lsof -i :3000
```

**Expected output:** Should show node process listening on port 3000
**If not running:** Start with `cd roengine && npm run dev`

---

## Step 2: Test in Browser

1. **Navigate to:** https://arologik.com/repair-orders/19
2. **Open DevTools Console:** Press F12 → Console tab
3. **Click:** "AI Recommend Services" button (sparkle icon)
4. **Enter mileage:** 30000 (or any realistic mileage)
5. **Wait for AI response** to load recommendations
6. **Select services** and click "Add 4 Services to RO" (or however many you selected)

---

## Step 3: Watch Console Logs

### Frontend Logs (Browser Console)
Look for these logs in order:

```
[DEBUG] AI Recommend clicked
[DEBUG] Mileage entered: 30000
[DEBUG] Request body: {...}
[DEBUG] Calling API: /api/maintenance-recommendations
[DEBUG] Response status: 200
[DEBUG] Response data: {...}
[DEBUG] Services set: 4 services
[DEBUG] Saving recommendations to database...
[DEBUG] Save successful
=== SAVING AI SERVICES TO WORK ORDER ===
Selected services: 4
Saving service: Engine Oil & Filter Change
✓ Saved: Engine Oil & Filter Change - DB ID: [number]
Saving service: Tire Rotation
✓ Saved: Tire Rotation - DB ID: [number]
...
Reloading work order items...
✓ Reloaded [number] items
=== SAVE COMPLETE ===
```

### Backend Logs (Terminal running npm run dev)
Look for these logs:

```
=== POST /api/work-orders/[id]/items ===
Work Order ID: 19
Request body: { item_type: 'labor', description: 'Engine Oil & Filter Change', ... }
Inserting into database...
- item_type: labor
- description: Engine Oil & Filter Change
- line_total: [calculated value]
✓ Inserted successfully - ID: [number]
Updating work order totals...
✓ Totals updated
===================================
```

---

## Step 4: Verify Database

Run this query to see the newly added services:

```bash
psql -U shopops -d shopops3 -c "
SELECT 
  id,
  item_type,
  description,
  labor_hours,
  line_total,
  created_at
FROM work_order_items
WHERE work_order_id = 19
ORDER BY created_at DESC
LIMIT 10;
"
```

**Expected output:** Should show the 4 services you just added with:
- Unique IDs
- item_type = 'labor'
- description = service names
- Recent created_at timestamps

---

## Step 5: Verify Page Reload

After adding services:

✅ **Page should reload automatically**
✅ **Services should appear in the Services section**
✅ **Refresh the page** - services should persist (database-backed)

---

## Expected Results

### ✓ Success Criteria

1. **Console logs show complete flow:** API calls → Database saves → Success confirmations
2. **Database query returns new records:** 4+ new rows in work_order_items
3. **UI updates correctly:** Services visible after reload
4. **Data persists:** Page refresh maintains services
5. **No errors in console or terminal**

### ✗ Common Issues

**Issue:** "No mileage provided, aborting"
- **Fix:** Make sure to enter mileage in the prompt dialog

**Issue:** "Failed to save to database"
- **Fix:** Check database connection in terminal logs
- **Fix:** Verify work_order_id=19 exists in database

**Issue:** Services don't appear after reload
- **Fix:** Check backend logs for database errors
- **Fix:** Verify the fetch request completed successfully

---

## Database Verification (Alternative Queries)

### Check all work orders
```sql
SELECT id, ro_number, customer_name FROM work_orders ORDER BY id DESC LIMIT 10;
```

### Check items for specific RO
```sql
SELECT * FROM work_order_items WHERE work_order_id = 19;
```

### Check totals updated
```sql
SELECT 
  ro_number,
  labor_total,
  parts_total,
  total,
  updated_at
FROM work_orders 
WHERE id = 19;
```

### Check AI recommendations saved
```sql
SELECT 
  id,
  vehicle_id,
  service_name,
  status,
  created_at
FROM vehicle_recommendations
WHERE vehicle_id = (SELECT vehicle_id FROM work_orders WHERE id = 19)
ORDER BY created_at DESC
LIMIT 10;
```

---

## Troubleshooting Commands

### Check server logs
```bash
# Terminal should show real-time logs from Next.js server
# Look for POST /api/work-orders/19/items
```

### Restart server (if needed)
```bash
cd roengine
npm run dev
```

### Check database connection
```bash
psql -U shopops -d shopops3 -c "SELECT version();"
```

---

## What to Share

After testing, provide:

1. **Browser console logs** (copy/paste or screenshot)
2. **Database query results** (copy/paste output)
3. **Screenshot of RO page** showing the services
4. **Any errors** encountered during the process

This will help verify the complete end-to-end flow is working correctly!
