# UI Audit: Non-Functional Interactive Elements

**Audit Date:** January 28, 2026  
**Auditor:** AI Assistant

---

## Dashboard Page
**Files:** `app/page.tsx`, `components/dashboard/*`

### Non-Functional Elements:

#### 1. **"Generate Estimate" Quick Action Button**
- **Location:** `components/dashboard/quick-actions.tsx` Line ~12
- **Current State:** No `onClick` handler defined in the actions array
- **Expected Behavior:** Open estimate generation wizard or navigate to /repair-orders/new with estimate mode
- **Priority:** HIGH

#### 2. **"Send SMS Update" Quick Action Button**
- **Location:** `components/dashboard/quick-actions.tsx` Line ~13
- **Current State:** No `onClick` handler defined
- **Expected Behavior:** Open SMS composition modal or navigate to communications page
- **Priority:** MEDIUM

#### 3. **"Edit Active RO" Quick Action Button**
- **Location:** `components/dashboard/quick-actions.tsx` Line ~14
- **Current State:** No `onClick` handler defined
- **Expected Behavior:** Navigate to most recent active RO, or show RO selector
- **Priority:** MEDIUM

#### 4. **Metric Stat Cards (4 cards)**
- **Location:** `components/dashboard/metrics-grid.tsx` Lines ~42-60
- **Current State:** Cards have no click handlers - just display
- **Expected Behavior:** 
  - "Total Revenue" → Navigate to /reports/revenue or show detailed breakdown
  - "Open Repair Orders" → Navigate to /repair-orders?filter=open
  - "Awaiting Customer Approval" → Navigate to /repair-orders?filter=awaiting_approval
  - "Avg Completion Time" → Show detailed analytics
- **Priority:** MEDIUM

#### 5. **AI Insights Cards (3 cards)**
- **Location:** `components/dashboard/ai-insights.tsx` Lines ~20-45
- **Current State:** Static display only, no click handlers
- **Expected Behavior:** 
  - "Follow up on RO #4521" → Navigate to that RO
  - Insights should be clickable to take action or view details
- **Priority:** MEDIUM

#### 6. **Repair Orders Table - Row Click**
- **Location:** `components/dashboard/repair-orders-table.tsx`
- **Current State:** Table rows are NOT clickable (no onClick on `<tr>`)
- **Expected Behavior:** Clicking row should navigate to `/repair-orders/{id}`
- **Priority:** HIGH

#### 7. **Repair Orders Table - Message Button**
- **Location:** `components/dashboard/repair-orders-table.tsx` Line ~112
- **Current State:** `<Button>` with `<MessageSquare>` icon, no onClick handler
- **Expected Behavior:** Open SMS composition modal for that customer
- **Priority:** MEDIUM

#### 8. **Repair Orders Table - More Options Button**
- **Location:** `components/dashboard/repair-orders-table.tsx` Line ~115
- **Current State:** `<Button>` with `<MoreVertical>` icon, no onClick handler
- **Expected Behavior:** Open dropdown menu with actions (Edit, Delete, Print, etc.)
- **Priority:** MEDIUM

---

## Global Navigation
**Files:** `components/layout/sidebar.tsx`, `components/layout/header.tsx`

### Non-Functional Elements:

#### 9. **Sidebar - "Communications" Nav Link**
- **Location:** `components/layout/sidebar.tsx` Line ~14
- **Current State:** `href: "#"` - goes nowhere
- **Expected Behavior:** Navigate to /communications page (page doesn't exist)
- **Priority:** LOW (future feature)

#### 10. **Sidebar - "Analytics" Nav Link**
- **Location:** `components/layout/sidebar.tsx` Line ~15
- **Current State:** `href: "#"` - goes nowhere
- **Expected Behavior:** Navigate to /analytics page (page doesn't exist)
- **Priority:** LOW (future feature)

#### 11. **Header - Notifications Bell Button**
- **Location:** `components/layout/header.tsx` Line ~24
- **Current State:** Button exists with red notification dot, no onClick handler
- **Expected Behavior:** Open notifications dropdown or navigate to /notifications
- **Priority:** MEDIUM

#### 12. **Header - "3 Alerts" Button**
- **Location:** `components/layout/header.tsx` Line ~29
- **Current State:** Button styled as alert, no onClick handler
- **Expected Behavior:** Open alerts panel or navigate to /alerts
- **Priority:** MEDIUM

---

## Customers Page
**Files:** `app/customers/page.tsx`, `components/customers/*`

### Non-Functional Elements:

#### 13. **Customer Profile - Edit Button (icon only)**
- **Location:** `components/customers/customer-profile.tsx` Line ~84
- **Current State:** `<Button size="icon">` with Edit2 icon, no onClick handler
- **Expected Behavior:** Open customer edit modal or toggle inline editing
- **Priority:** HIGH

#### 14. **Customer Profile - "Send SMS" Button**
- **Location:** `components/customers/customer-profile.tsx` Line ~128
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Open SMS composition modal
- **Priority:** MEDIUM

#### 15. **Customer Profile - "Call" Button**
- **Location:** `components/customers/customer-profile.tsx` Line ~131
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Initiate phone call (tel: link) or show phone number to copy
- **Priority:** LOW

#### 16. **Customer Profile - "Email" Button**
- **Location:** `components/customers/customer-profile.tsx` Line ~134
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Open email client (mailto: link) or email composition
- **Priority:** LOW

#### 17. **Customer Profile - "Create New RO" Button**
- **Location:** `components/customers/customer-profile.tsx` Line ~152
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Navigate to /repair-orders/new with customer pre-selected
- **Priority:** HIGH

#### 18. **Customer Profile - "View History" Button**
- **Location:** `components/customers/customer-profile.tsx` Line ~153
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Navigate to customer history page or expand history section
- **Priority:** MEDIUM

#### 19. **Customer Profile - "Schedule Appointment" Button**
- **Location:** `components/customers/customer-profile.tsx` Line ~156
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Open appointment scheduling modal
- **Priority:** MEDIUM (future feature)

---

## Repair Orders Page
**Files:** `app/repair-orders/page.tsx`, `components/repair-orders/*`

### Non-Functional Elements:

#### 20. **RO List - "Export" Button**
- **Location:** `components/repair-orders/ro-list-view.tsx` Line ~98
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Export filtered RO list to CSV/PDF
- **Priority:** LOW

#### 21. **RO Detail - "Print" Button**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Line ~436
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Open print dialog with formatted RO
- **Priority:** MEDIUM

#### 22. **RO Detail - "Approve & Complete" Button**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Line ~536
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Move RO to "completed" state, process payment
- **Priority:** HIGH

#### 23. **RO Detail - "Request More Info" Button**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Line ~537
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Send message to customer requesting more information
- **Priority:** MEDIUM

#### 24. **RO Detail - "Cancel RO" Button**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Line ~541
- **Current State:** Button exists, no onClick handler (destructive styled)
- **Expected Behavior:** Confirm and cancel the RO (set state to "cancelled")
- **Priority:** HIGH

#### 25. **RO Detail - "SMS" Footer Button**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Line ~552
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Open SMS composition modal for this customer
- **Priority:** MEDIUM

#### 26. **RO Detail - "Call" Footer Button**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Line ~555
- **Current State:** Button exists, no onClick handler
- **Expected Behavior:** Initiate call or show phone number
- **Priority:** LOW

#### 27. **RO Detail - Workflow Stage Buttons**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Lines ~409-423
- **Current State:** Stages display only, not clickable
- **Expected Behavior:** Clicking a stage should allow advancing/reverting workflow
- **Priority:** MEDIUM

#### 28. **RO Detail - Status Dropdown (Edit Mode)**
- **Location:** `components/repair-orders/ro-detail-view.tsx` Line ~464
- **Current State:** `<select>` exists but onChange doesn't save to database
- **Expected Behavior:** Changing status should update work order in database
- **Priority:** HIGH

---

## Search Results Page
**Files:** `app/search/page.tsx`

### Non-Functional Elements:

#### 29. **Vehicle Result Cards - Not Clickable**
- **Location:** `app/search/page.tsx` Lines ~196-220
- **Current State:** Vehicle cards have no click handler
- **Expected Behavior:** Click to navigate to vehicle detail page (page doesn't exist)
- **Priority:** LOW (page needs to be created first)

#### 30. **Line Item Result Cards - Not Clickable**
- **Location:** `app/search/page.tsx` Lines ~253-283
- **Current State:** Line item cards have no click handler
- **Expected Behavior:** Click to navigate to parent RO or show item details
- **Priority:** LOW

---

## Summary by Priority

### HIGH Priority (8 items) - Blocks Core Workflows
1. Generate Estimate Quick Action
2. Repair Orders Table - Row Click (dashboard)
3. Customer Profile - Edit Button
4. Customer Profile - Create New RO
5. RO Detail - Approve & Complete
6. RO Detail - Cancel RO
7. RO Detail - Status Dropdown Save

### MEDIUM Priority (15 items) - Improves Usability
8. Send SMS Update Quick Action
9. Edit Active RO Quick Action
10. Metric Stat Cards (4)
11. AI Insights Cards (3)
12. Message Button (table)
13. More Options Button (table)
14. Notifications Bell
15. 3 Alerts Button
16. Customer - Send SMS
17. Customer - View History
18. Customer - Schedule Appointment
19. RO Detail - Print
20. RO Detail - Request More Info
21. RO Detail - SMS/Call Footer
22. RO Detail - Workflow Stages

### LOW Priority (6 items) - Nice-to-Have / Future Features
23. Communications Nav Link (needs page)
24. Analytics Nav Link (needs page)
25. Customer - Call Button
26. Customer - Email Button
27. RO List - Export
28. Vehicle/Item Search Cards

---

## Recommended Fix Order

1. **Phase 1 - Critical Workflows:**
   - Dashboard RO table row click → RO detail
   - Customer Profile edit functionality
   - Customer Profile → Create New RO (pre-fill customer)
   - RO Detail status dropdown save
   - RO Detail Approve/Complete/Cancel buttons

2. **Phase 2 - Communication:**
   - SMS buttons throughout
   - Notifications system
   - Quick Action buttons

3. **Phase 3 - Analytics/Reporting:**
   - Metric card click navigation
   - Export functionality
   - Analytics page creation

