# NexLink API Integration Plan

**Document Version:** 1.0  
**API Version:** 4.61  
**Last Updated:** January 27, 2026

---

## Executive Summary

This document outlines the integration plan for WHI Solutions' NexLink SDK Interface (Version 4.61) with our ROEngine repair order management system. NexLink provides access to Nexpart's B2B eCommerce platform, enabling real-time parts lookup, pricing queries, and order placement across multiple aftermarket distributors and vendors.

---

## API Overview

### Base Information
- **API Name:** NexLink SDK Interface for Nexpart
- **Version:** 4.61 (March 17, 2025)
- **Provider:** WHI Solutions, Inc.
- **Base URL (Production):** `https://www.nexpart.com/webservices/nexlink/request.php`
- **Base URL (Staging/UAT):** `https://www.nexpartuat.com/webservices/nexlink/request.php`
- **Protocol:** HTTPS (Required)
- **Data Formats:** XML and JSON (Both supported)

### Authentication Method
- **Type:** Username/Password with Partner Provider Key
- **Components:**
  - `PartnerProviderKey`: Assigned by WHI Solutions to SMS/DMS providers
  - `Username`: Nexpart account username (single-vendor or Multi-Seller)
  - `Password`: Account password
  - `ApiTokenKey`: Session token returned after successful authentication

### Key Features
- Multi-vendor support (Multi-Seller and SourceIT)
- Real-time parts availability and pricing
- ACES (Automotive Catalog Exchange Standard) catalog integration
- VIN-based vehicle lookup
- Interchange and buyer's guide functionality
- Labor times and specifications lookup

---

## Integration Types

### Shop Management System (SMS) Integration
Our ROEngine system falls under the SMS category, which provides:
- Access to Nexpart eCommerce platform
- Multi-Seller and SourceIT support
- Part stock checking
- Order placement capabilities
- Cart management with push/pull methods

### Key Differences (SMS vs DMS)
- SMS: Used by repair shops (our use case)
- DMS: Used by distributors/counterpersons
- SMS supports ordering from multiple vendors
- DMS has additional counter-catalog features (NCC) we don't need

---

## Key Endpoints & Transactions

### 1. Launch (Login)
**Purpose:** Authenticate user and initiate session

**Endpoint:** POST to base URL  
**Request Type:** `Launch`  
**Method:** POST (XML or JSON payload)

**Required Parameters:**
- `Rev`: "4.61"
- `ClientVersion`: Our application version
- `RequestType`: "Launch"
- `PartnerProviderKey`: Provided by WHI
- `Username`: Nexpart username
- `Password`: User password
- `Identifier`: Unique identifier for cart items

**Optional Parameters:**
- `JumpTab`: Direct navigation (home, stock, amcat, ordercart, review, int, bg)
- `CatalogType`: "A" for ACES (default), "L" for Legacy
- `Language`: "en", "fr", "es" (default: "en")
- `PONumber`: Auto-populate PO number
- `ClearCart`: Clear existing cart (1/0)
- `WebPostURL`: URL for cart/order push notifications (HTTPS required)
- `WebPostBtnLabel`: Custom button label
- `WebPostClearCart`: Clear cart after posting (1/0)
- `ReturnURL`: URL for failed logins
- `LogoutURL`: URL for logout redirect

**Response:**
- `Success`: 1 or 0
- `ErrorCount`: Number of errors
- `LaunchURL`: URL to launch embedded browser
- `ApiTokenKey`: Session token for subsequent calls

**Example Launch for Part Search:**
```json
{
  "Request": {
    "Rev": "4.61",
    "ClientVersion": "1.0",
    "RequestType": "Launch",
    "PartnerProviderKey": "[PROVIDED_BY_WHI]",
    "Username": "shop_username",
    "Password": "shop_password",
    "Identifier": "RO-12345",
    "CatalogType": "A",
    "JumpTab": {
      "Type": "amcat",
      "Vin": "1G1PC5SBXE7253061",
      "SearchText": "Engine Oil Filter"
    }
  }
}
```

---

### 2. Cart Retrieval
**Purpose:** Get parts and pricing from cart (Pull Method)

**Request Type:** `Cart`  
**Method:** POST (XML or JSON payload)

**Required Parameters:**
- `Rev`: "4.61"
- `ClientVersion`: Application version
- `RequestType`: "Cart"
- `PartnerProviderKey`: WHI provider key
- `ApiTokenKey`: Session token from Launch

**Response Structure:**
```json
{
  "Response": {
    "RequestType": "Cart",
    "Success": "1",
    "Header": {
      "AccountId": "29",
      "CustomerName": "Shop Name",
      "OrderTotal": "22.70",
      "Identifier": "RO-12345"
    },
    "Cart": {
      "BranchCart": {
        "Name": "Distributor Branch",
        "Id": "100076",
        "VendorUsername": "vendor_login",
        "Total": "22.70",
        "ItemCount": "2",
        "Parts": {
          "Part": [{
            "PartNumber": "PF52",
            "LineCode": "ACD",
            "SellerPartDesc": "Oil Filter",
            "MfgCode": "DCC",
            "OrderQty": "2",
            "AvailableQty": "20",
            "Mdse": "11.35",
            "List": "16.80",
            "Core": "0.00",
            "Uom": "ea",
            "PackQty": "1",
            "PartType": "6192",
            "VehicleId": "128070",
            "VehicleDesc": "2014 Ford F-150 3.7L V6"
          }]
        }
      }
    }
  }
}
```

**Key Response Fields:**
- `PartNumber`: Part number
- `LineCode`: Distributor's line code (required for ordering)
- `SellerPartDesc`: Vendor's part description
- `CatalogPartDesc`: Catalog description
- `MfgCode`: WHI manufacturer code
- `OrderQty`: Quantity requested
- `AvailableQty`: Stock available
- `Mdse`: Cost/wholesale price
- `List`: List/retail price
- `Core`: Core charge
- `Uom`: Unit of measure (ea, bx, cs, etc.)
- `PackQty`: Parts per package
- `VehicleId`: ACES Base Vehicle ID
- `VehicleDesc`: Vehicle description

---

### 3. Order Confirmation
**Purpose:** Retrieve order confirmation after placement

**Request Type:** `Order`  
**Method:** POST (XML or JSON payload)

**Required Parameters:**
- Same as Cart request, but `RequestType`: "Order"

**Additional Response Fields:**
- `OrderHeader`: Order confirmation details
  - `OrderNumber`: Distributor's order number
  - `State`: ordered, cancel, or backord
  - `Discount`: Order discount amount
  - `Taxes`: Tax breakdown
  - `PONumber`: Purchase order number
  - `Comments`: Order comments
- `OrderDetails` (per part):
  - `ShipQty`: Quantity shipped
  - `ErrorCode`: Part-level error code
  - `ErrorMsg`: Error message if any

---

### 4. Smart Page API (Optional)
**Purpose:** Get detailed part information URLs

**Request Type:** `SmartPage`  
**Method:** POST

**Use Case:** Retrieve links to detailed part information pages for specific parts.

---

### 5. Logout
**Purpose:** End session

**Request Type:** `Logout`  
**Method:** POST

**Note:** Only required if using Pull method. Push method auto-posts logout.

---

## Data Retrieval Methods

### Push Method (Recommended)
**How it works:**
1. Pass `WebPostURL` during Launch
2. User adds parts to cart in Nexpart interface
3. When user clicks transfer button, Nexpart automatically POSTs cart data to WebPostURL
4. Our system receives cart/order data in real-time

**Advantages:**
- Real-time data transfer
- No polling required
- Better user experience
- Automatic on user action

**Requirements:**
- WebPostURL must be HTTPS
- HTTP Basic Authentication supported
- Endpoint must accept Cart/Order response format

### Pull Method
**How it works:**
1. User completes cart in Nexpart
2. User closes/exits Nexpart interface
3. Our system detects window close
4. Our system makes Cart request to retrieve data

**Advantages:**
- More control over timing
- Can validate before retrieval

**Disadvantages:**
- Requires polling or event detection
- Slight delay in data availability

---

## Vehicle Identification

### VIN-Based Lookup
Pass VIN in Launch request:
```json
"JumpTab": {
  "Type": "amcat",
  "Vin": "1G1PC5SBXE7253061"
}
```

### ACES Vehicle Selection
Pass specific vehicle identifiers:
```json
"JumpTab": {
  "Type": "amcat",
  "VehicleType": "C",
  "VehicleId": "2571",
  "EngineConfigId": "1200",
  "SubmodelId": "123"
}
```

---

## Vendor & Pricing Information

### Multi-Vendor Support
- Single-vendor accounts: Direct access to one distributor
- Multi-Seller: Aggregates multiple vendor credentials
- SourceIT: Enterprise-level multi-vendor solution

### Vendor Identification
Each part response includes:
- `VendorUsername`: Identifies the vendor/seller
- `BranchId`: Physical branch identifier
- `Id`: Branch code from distributor system

### Pricing Structure
- `Mdse`: Your cost (wholesale price)
- `List`: Retail/list price
- `Core`: Core charge (if applicable)
- `Total`: (Mdse × Qty) + (Core × Qty)

### Price Filtering by Vendor
- Response contains `BranchCart` array
- Each branch represents different vendor/location
- Filter and compare prices across branches

---

## Rate Limits & Best Practices

### Rate Limits
**Not explicitly documented in specification.**  
Recommendation: Implement conservative rate limiting:
- Maximum 10 requests per second
- Implement exponential backoff on errors
- Cache session tokens for reuse

### Best Practices (from Specification)

#### 1. Session Management
- Store and reuse `ApiTokenKey` for session duration
- End sessions properly with Logout request
- Don't create multiple sessions unnecessarily

#### 2. Browser Requirements
- **Recommended:** Google Chrome (per specification)
- Embedded browser support available
- Set `EmbeddedBrowser: 1` when embedding

#### 3. Data Handling
- Use ACES catalog type ("A") for modern vehicles
- Always include `Identifier` to track cart items
- Validate part data before inserting into repair orders

#### 4. Error Handling
- Check `Success` field in all responses
- Handle `ErrorCount > 0` scenarios
- Parse `ErrorCode` and `ErrorDesc` for details

#### 5. Security
- **WebPostURL must use HTTPS**
- Store credentials securely
- Never log passwords or sensitive data
- Use environment variables for PartnerProviderKey

---

## Error Handling

### Login Error Codes
| Code | Description |
|------|-------------|
| 1 | Invalid User |
| 2 | Supplier Account Verification Failed |
| 3 | Account is Expired |
| 4 | Communication with supplier failed |
| 9 | Invalid Partner Provider Key |
| 20 | Required Element Missing |
| 21 | Account has restricted access |

### Error Response Format
```json
{
  "Response": {
    "Success": "0",
    "ErrorCount": "1",
    "Errors": {
      "Error": [{
        "ErrorCode": "1",
        "ErrorDesc": "Invalid User"
      }]
    }
  }
}
```

### Handling Strategy
1. **Authentication Errors (1-4, 9, 21):** Show user-friendly message, log detailed error
2. **Validation Errors (20):** Fix request and retry
3. **Network Errors:** Implement retry with exponential backoff
4. **Timeout Errors:** Set reasonable timeout (30-60 seconds), inform user

---

## Integration Phases

### Phase 1: Manual Part Search (MVP)
**Goal:** Enable advisors to search for parts and retrieve pricing manually.

**User Flow:**
```
Advisor enters part number or description
  ↓
System launches NexLink with search parameters
  ↓
Advisor searches in NexLink interface
  ↓
Advisor adds parts to cart
  ↓
Advisor clicks "Transfer" button
  ↓
Parts pushed to ROEngine via WebPostURL
  ↓
System displays parts with pricing
  ↓
Advisor reviews and confirms
  ↓
Parts added to repair order
```

**Implementation Tasks:**
1. ✅ Set up WHI Solutions account and obtain credentials
2. ✅ Create API service module (`/lib/nexlink-api.ts`)
3. ✅ Implement Launch endpoint integration
4. ✅ Create embedded browser component for NexLink interface
5. ✅ Implement WebPostURL endpoint to receive cart data
6. ✅ Create UI for part selection and confirmation
7. ✅ Implement cart data parsing and validation
8. ✅ Add parts to repair order line items
9. ✅ Test with single vendor
10. ✅ Error handling and user feedback

**Deliverables:**
- Working part search from repair order screen
- Price display with vendor information
- Manual part addition to RO

---

### Phase 2: VIN-Based Part Recommendations
**Goal:** Auto-populate searches based on vehicle VIN.

**User Flow:**
```
Advisor selects vehicle (VIN decoded)
  ↓
System launches NexLink with VIN
  ↓
NexLink auto-selects vehicle
  ↓
Advisor searches by category (oil filter, brake pads, etc.)
  ↓
[Continue from Phase 1]
```

**Implementation Tasks:**
1. ✅ Integrate VIN decoder with NexLink Launch
2. ✅ Pass VIN in JumpTab parameter
3. ✅ Test vehicle selection accuracy
4. ✅ Handle VIN decode failures gracefully

---

### Phase 3: Multi-Vendor Price Comparison
**Goal:** Display prices from multiple vendors for comparison.

**User Flow:**
```
[After cart is pushed to system]
  ↓
System displays parts grouped by vendor
  ↓
Show price comparison table:
  - Vendor A: $10.50 (10 available)
  - Vendor B: $9.75 (5 available)
  - Vendor C: $11.00 (20 available)
  ↓
Advisor selects preferred vendor
  ↓
Add to RO with vendor information
```

**Implementation Tasks:**
1. ✅ Parse multiple BranchCart entries
2. ✅ Create price comparison UI component
3. ✅ Display availability and lead times
4. ✅ Allow vendor selection per part
5. ✅ Track vendor for order placement
6. ✅ Set up Multi-Seller account (optional)

---

### Phase 4: Automated Order Placement
**Goal:** Place orders directly through NexLink.

**User Flow:**
```
Advisor finalizes repair order
  ↓
System generates parts list with vendor selections
  ↓
System launches NexLink with ordercart
  ↓
Parts pre-populated in cart
  ↓
Advisor reviews and places order
  ↓
Order confirmation pushed to system
  ↓
Update RO with order numbers and tracking
```

**Implementation Tasks:**
1. ✅ Implement ordercart JumpTab functionality
2. ✅ Pass parts with BranchId and Price from previous cart
3. ✅ Handle order confirmation response
4. ✅ Store order numbers in database
5. ✅ Create order tracking interface
6. ✅ Implement order status updates

---

### Phase 5: Advanced Features (Future)
**Potential Enhancements:**

1. **Labor Times Integration**
   - Retrieve labor hours from NexLink
   - Auto-populate labor line items
   - Calculate labor costs

2. **Specifications Lookup**
   - Fluid capacities
   - Torque specifications
   - Technical service bulletins (TSBs)

3. **Preventive Maintenance**
   - Mileage-based recommendations
   - Service interval tracking

4. **Interchange Lookup**
   - Find alternate/aftermarket parts
   - Price comparison across brands

5. **Tire Integration**
   - Tire-specific search
   - Tire details (size, speed rating, etc.)
   - Warranty information

---

## Technical Implementation Details

### API Service Module Structure
```typescript
// /lib/nexlink-api.ts

interface NexLinkConfig {
  baseUrl: string;
  partnerProviderKey: string;
  clientVersion: string;
  format: 'json' | 'xml';
}

interface LaunchRequest {
  username: string;
  password: string;
  identifier: string;
  jumpTab?: JumpTabConfig;
  webPostUrl?: string;
  // ... other parameters
}

interface CartResponse {
  success: boolean;
  header: {
    accountId: string;
    customerName: string;
    orderTotal: number;
    identifier: string;
  };
  cart: {
    branchCart: BranchCart[];
  };
}

class NexLinkAPIService {
  async launch(request: LaunchRequest): Promise<LaunchResponse>
  async getCart(apiTokenKey: string): Promise<CartResponse>
  async getOrder(apiTokenKey: string): Promise<OrderResponse>
  async logout(apiTokenKey: string): Promise<LogoutResponse>
}
```

### Database Schema Requirements

**Table: `nexlink_sessions`**
```sql
CREATE TABLE nexlink_sessions (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES work_orders(id),
  api_token_key VARCHAR(255) NOT NULL,
  identifier VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  launch_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active'
);
```

**Table: `nexlink_cart_items`**
```sql
CREATE TABLE nexlink_cart_items (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES nexlink_sessions(id),
  work_order_id INTEGER REFERENCES work_orders(id),
  part_number VARCHAR(100) NOT NULL,
  line_code VARCHAR(50) NOT NULL,
  mfg_code VARCHAR(50),
  seller_part_desc TEXT,
  catalog_part_desc TEXT,
  order_qty INTEGER NOT NULL,
  available_qty INTEGER,
  mdse_price DECIMAL(10,2),
  list_price DECIMAL(10,2),
  core_price DECIMAL(10,2),
  uom VARCHAR(20),
  branch_id VARCHAR(50),
  branch_name VARCHAR(255),
  vendor_username VARCHAR(100),
  vehicle_id INTEGER,
  vehicle_desc TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `nexlink_orders`**
```sql
CREATE TABLE nexlink_orders (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES nexlink_sessions(id),
  work_order_id INTEGER REFERENCES work_orders(id),
  order_number VARCHAR(100) NOT NULL,
  branch_id VARCHAR(50),
  branch_name VARCHAR(255),
  vendor_username VARCHAR(100),
  order_total DECIMAL(10,2),
  po_number VARCHAR(100),
  order_state VARCHAR(50),
  placed_at TIMESTAMP DEFAULT NOW(),
  order_data JSONB
);
```

### API Endpoint Structure

**POST `/api/nexlink/launch`**
```typescript
// Launch NexLink session
POST /api/nexlink/launch
Body: {
  workOrderId: number;
  username: string;
  password: string;
  vin?: string;
  searchText?: string;
}
Response: {
  launchUrl: string;
  apiTokenKey: string;
  identifier: string;
}
```

**POST `/api/nexlink/webhook/cart`**
```typescript
// Receive cart data from NexLink (WebPostURL)
POST /api/nexlink/webhook/cart
Body: <CartResponse from NexLink>
Response: {
  success: boolean;
  message: string;
}
```

**GET `/api/nexlink/cart/:sessionId`**
```typescript
// Retrieve cart items for display
GET /api/nexlink/cart/:sessionId
Response: {
  items: CartItem[];
  total: number;
}
```

---

## Security Considerations

### Credential Storage
- Store NexLink credentials encrypted in database
- Use environment variables for `PartnerProviderKey`
- Never expose credentials in client-side code
- Implement per-user or per-shop credential storage

### WebPostURL Security
- Implement HTTPS endpoint
- Use HTTP Basic Authentication
- Validate webhook signatures (if provided)
- Rate limit webhook endpoint
- Log all incoming requests

### Session Management
- Store `ApiTokenKey` server-side only
- Implement session timeout (1-hour recommended)
- Clean up expired sessions
- Associate sessions with authenticated users

### Data Privacy
- Ensure compliance with PCI DSS for pricing data
- Implement audit logging for all orders
- Restrict access to pricing information
- Sanitize all input data

---

## Testing Strategy

### Development Environment
1. Use UAT URL: `https://www.nexpartuat.com/webservices/nexlink/request.php`
2. Obtain test credentials from WHI Solutions
3. Test with non-production data only

### Test Cases

#### Authentication Tests
- [ ] Valid credentials login
- [ ] Invalid credentials rejection
- [ ] Expired account handling
- [ ] Invalid partner key handling
- [ ] Session token persistence

#### Part Search Tests
- [ ] VIN-based vehicle lookup
- [ ] Part number search
- [ ] Keyword/description search
- [ ] Multi-result handling
- [ ] No results handling

#### Cart Management Tests
- [ ] Single part addition
- [ ] Multiple parts addition
- [ ] Quantity updates
- [ ] Part removal
- [ ] Cart total calculation
- [ ] Push method webhook reception
- [ ] Pull method cart retrieval

#### Multi-Vendor Tests
- [ ] Multiple branch results
- [ ] Price comparison accuracy
- [ ] Vendor selection
- [ ] Availability display

#### Order Placement Tests
- [ ] Order submission
- [ ] Order confirmation receipt
- [ ] Order number storage
- [ ] Error handling during order

#### Integration Tests
- [ ] End-to-end flow from RO to order
- [ ] Data accuracy validation
- [ ] Error recovery scenarios
- [ ] Session timeout handling

### Performance Tests
- [ ] Response time under load
- [ ] Concurrent session handling
- [ ] Large cart handling (50+ items)
- [ ] Webhook endpoint performance

---

## Monitoring & Maintenance

### Logging Requirements
- All API requests and responses
- Session creation and expiration
- Cart push/pull events
- Order placements
- Error occurrences
- Performance metrics

### Metrics to Track
- API response times
- Success/failure rates
- Number of active sessions
- Parts searched per day
- Orders placed per day
- Average cart value
- Vendor usage distribution

### Alerts
- API authentication failures
- Webhook endpoint failures
- Session timeout issues
- Order placement failures
- Unusual error rate spikes

---

## Support & Resources

### WHI Solutions Support
- **Email:** support@whisolutions.com
- **Phone:** +1 (914) 697 9417
- **Address:** Suite 210, 5 International Drive, Rye Brook, NY 10573

### Documentation
- NexLink Specification v4.61
- ACES Standard documentation
- Nexpart user guides

### Account Setup
1. Contact WHI Solutions sales team
2. Complete integration certification
3. Obtain production credentials
4. Configure vendor accounts

---

## Appendices

### Appendix A: Unit of Measure Codes
| Code | Description |
|------|-------------|
| EA   | Each |
| BX   | Box |
| BG   | Bag |
| CS   | Case |
| CT   | Carton |
| GL   | Gallon |
| QT   | Quart |
| PT   | Pint |
| LB   | Pound |
| PR   | Pair |
| ST   | Set |
| KT   | Kit |

### Appendix B: Specification Types
| Type  | Description |
|-------|-------------|
| 10001 | Brakes |
| 10002 | Underhood Lubrication Guide |
| 10003 | Cooling/Miscellaneous |
| 10004 | Quicklube Capacities |
| 10005 | Service Intervals |
| 10006 | Steering and Suspension Torques |
| 10007 | Technical Service Bulletins (TSB) |
| 10008 | Tire Data |
| 10009 | Tune Up |
| 10010 | Wheel Alignment |
| 10011 | Wiring Diagrams |
| 10012 | Component Locator |

### Appendix C: Language Codes
| Language | Code |
|----------|------|
| English  | en   |
| French   | fr   |
| Spanish  | es   |

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Jan 27, 2026 | Initial integration plan created | AI Assistant |

---

## Next Steps

1. **Immediate Actions:**
   - [ ] Contact WHI Solutions for account setup
   - [ ] Obtain UAT credentials
   - [ ] Request PartnerProviderKey
   - [ ] Set up development environment

2. **Week 1-2:**
   - [ ] Implement API service module
   - [ ] Create database schema
   - [ ] Build Launch endpoint integration
   - [ ] Set up WebPostURL webhook

3. **Week 3-4:**
   - [ ] Develop embedded browser component
   - [ ] Create part selection UI
   - [ ] Implement cart data parsing
   - [ ] Build testing suite

4. **Week 5-6:**
   - [ ] Integration testing
   - [ ] User acceptance testing
   - [ ] Performance optimization
   - [ ] Documentation completion

5. **Production Deployment:**
   - [ ] Obtain production credentials
   - [ ] Deploy to production
   - [ ] Monitor and validate
   - [ ] Train users

---

**Document Status:** Draft - Ready for Review  
**Approval Required:** Technical Lead, Product Manager
