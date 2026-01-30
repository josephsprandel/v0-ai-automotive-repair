import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import pool from '@/lib/db'

/**
 * AI-Powered Natural Language Search API
 * 
 * Converts natural language queries into PostgreSQL SELECT statements using Gemini AI.
 * Includes safety checks to prevent destructive operations.
 */

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json()

    console.log('[AI Search] ===== NEW SEARCH =====')
    console.log('[AI Search] Query:', query)
    console.log('[AI Search] Context:', context)

    // Check for Gemini API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key not configured',
        interpretation: 'Search service unavailable'
      }, { status: 500 })
    }

    // Generate SQL using AI
    const sqlResult = await generateSQL(query, context)

    console.log('[AI Search] Interpretation:', sqlResult.interpretation)
    console.log('[AI Search] SQL:', sqlResult.sql)
    console.log('[AI Search] Params:', sqlResult.params)

    // Check for errors from AI
    if (sqlResult.error) {
      return NextResponse.json({
        success: false,
        error: sqlResult.error,
        interpretation: sqlResult.interpretation
      }, { status: 400 })
    }

    // Check for safety violations
    if (!sqlResult.sql || !isSafeQuery(sqlResult.sql)) {
      return NextResponse.json({
        success: false,
        error: 'Query contains unsafe operations or is invalid',
        interpretation: sqlResult.interpretation || 'Cannot process this query'
      }, { status: 400 })
    }

    // Execute the query
    const result = await pool.query(sqlResult.sql, sqlResult.params)

    console.log('[AI Search] Results:', result.rows.length, 'rows')

    return NextResponse.json({
      success: true,
      interpretation: sqlResult.interpretation,
      entity: sqlResult.entity,
      results: result.rows,
      estimated_results: sqlResult.estimated_results,
      sql: sqlResult.sql, // For debugging
      count: result.rows.length
    })

  } catch (error: any) {
    console.error('[AI Search] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      interpretation: 'Search failed'
    }, { status: 500 })
  }
}

async function generateSQL(query: string, context: any) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
You are an expert SQL query generator for RO Engine, an automotive repair shop management system.

Your job: Convert natural language search queries into PostgreSQL SELECT statements.

=== DATABASE SCHEMA ===

customers (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255),    -- Use customer_name NOT name!
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_primary VARCHAR(20),
  phone_secondary VARCHAR(20),
  phone_mobile VARCHAR(20),
  email VARCHAR(255),
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  customer_type VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

vehicles (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR(100),
  model VARCHAR(100),
  submodel VARCHAR(100),
  engine VARCHAR(100),
  transmission VARCHAR(100),
  color VARCHAR(50),
  mileage INTEGER,
  license_plate VARCHAR(20),
  license_plate_state VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

work_orders (
  id SERIAL PRIMARY KEY,
  ro_number VARCHAR(50) UNIQUE,
  customer_id INTEGER REFERENCES customers(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  state VARCHAR(50),  -- values: estimate, in_progress, completed, invoiced, paid
  date_opened DATE,
  date_promised DATE,
  date_closed DATE,
  customer_concern TEXT,
  label VARCHAR(255),
  needs_attention BOOLEAN,
  labor_total DECIMAL(10,2),
  parts_total DECIMAL(10,2),
  sublets_total DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  payment_status VARCHAR(50),
  amount_paid DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

work_order_items (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES work_orders(id),
  item_type VARCHAR(20),  -- values: labor, part, sublet
  description TEXT,
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  part_number VARCHAR(100),
  technician_id INTEGER,
  created_at TIMESTAMP
)

=== CURRENT CONTEXT ===

Current page: ${context?.page || 'unknown'}
Current RO ID: ${context?.workOrderId || context?.workOrder?.id || 'none'}
Current RO Number: ${context?.workOrder?.ro_number || 'none'}
Current customer ID: ${context?.customerId || context?.customer?.id || 'none'}
Current customer name: ${context?.customer?.name || 'none'}
Current vehicle ID: ${context?.vehicleId || context?.vehicle?.id || 'none'}

=== USER QUERY ===

"${query}"

=== YOUR TASK ===

Generate a PostgreSQL query to find what the user wants.

Rules:
1. ONLY generate SELECT queries (never UPDATE, DELETE, DROP)
2. Use parameterized queries ($1, $2, etc) for values
3. Use ILIKE for case-insensitive text matching with % wildcards
4. Join tables when needed for related data
5. Use context when query references "this RO", "this customer", "current", etc
6. Limit results to 50 unless user specifies more
7. If query is ambiguous, make best guess but explain in 'interpretation'

Return JSON in this EXACT format (no markdown, just JSON):
{
  "interpretation": "Brief explanation of what you're searching for",
  "entity": "primary table being queried (customers|vehicles|work_orders|work_order_items)",
  "sql": "SELECT statement with $1, $2 placeholders",
  "params": [array of parameter values],
  "estimated_results": "rough estimate of result count"
}

=== EXAMPLES ===

Query: "Bob Johnson"
→ {
  "interpretation": "Searching for customer named Bob Johnson",
  "entity": "customers",
  "sql": "SELECT * FROM customers WHERE customer_name ILIKE $1 AND is_active = true LIMIT 50",
  "params": ["%Bob Johnson%"],
  "estimated_results": "1-5 customers"
}

Query: "the parts for this RO"
Context: Current RO ID = 19
→ {
  "interpretation": "Finding parts on current repair order #19",
  "entity": "work_order_items",
  "sql": "SELECT * FROM work_order_items WHERE work_order_id = $1 AND item_type = 'part' ORDER BY id",
  "params": [19],
  "estimated_results": "5-10 items"
}

Query: "JT6BU5JR6A5011415"
→ {
  "interpretation": "Searching for vehicle with VIN JT6BU5JR6A5011415",
  "entity": "vehicles",
  "sql": "SELECT v.*, c.customer_name FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id WHERE v.vin = $1",
  "params": ["JT6BU5JR6A5011415"],
  "estimated_results": "0-1 vehicles"
}

Query: "customers who came in last week"
→ {
  "interpretation": "Finding customers with repair orders created in the last 7 days",
  "entity": "customers",
  "sql": "SELECT DISTINCT c.*, COUNT(wo.id) as visit_count FROM customers c JOIN work_orders wo ON c.id = wo.customer_id WHERE wo.created_at > NOW() - INTERVAL '7 days' GROUP BY c.id ORDER BY visit_count DESC LIMIT 50",
  "params": [],
  "estimated_results": "dozens of customers"
}

Query: "open repair orders"
→ {
  "interpretation": "Finding open/in-progress repair orders",
  "entity": "work_orders",
  "sql": "SELECT wo.*, c.customer_name, v.year, v.make, v.model FROM work_orders wo LEFT JOIN customers c ON wo.customer_id = c.id LEFT JOIN vehicles v ON wo.vehicle_id = v.id WHERE wo.state IN ('estimate', 'in_progress') AND wo.is_active = true ORDER BY wo.date_opened DESC LIMIT 50",
  "params": [],
  "estimated_results": "varies"
}

Query: "all customers"
→ {
  "interpretation": "Listing all active customers",
  "entity": "customers",
  "sql": "SELECT * FROM customers WHERE is_active = true ORDER BY customer_name ASC LIMIT 50",
  "params": [],
  "estimated_results": "50 customers"
}

=== SAFETY RULES ===

NEVER generate queries that:
- Use DELETE, UPDATE, INSERT, DROP, ALTER, TRUNCATE
- Access tables not in the schema above
- Execute functions that could modify data
- Use ; to chain multiple queries

If user asks for something destructive or too vague, return:
{
  "interpretation": "Cannot process this query",
  "entity": null,
  "sql": null,
  "params": [],
  "estimated_results": "0",
  "error": "Query is too vague or would modify data"
}

Now generate the SQL for: "${query}"

Return ONLY valid JSON, no markdown fences.
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // Clean up the response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    console.log('[AI Search] Raw AI response:', cleaned.substring(0, 500))
    
    return JSON.parse(cleaned)
  } catch (error: any) {
    console.error('[AI Search] AI generation error:', error.message)
    
    // Fallback to rule-based search for common patterns
    return fallbackSearch(query, context)
  }
}

/**
 * Fallback rule-based search when AI is unavailable
 */
function fallbackSearch(query: string, context: any): any {
  const lowerQuery = query.toLowerCase()
  
  // VIN pattern (17 alphanumeric)
  const vinMatch = query.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i)
  if (vinMatch) {
    return {
      interpretation: `Searching for vehicle with VIN ${vinMatch[0]}`,
      entity: 'vehicles',
      sql: "SELECT v.*, c.customer_name FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id WHERE v.vin ILIKE $1 AND v.is_active = true",
      params: [vinMatch[0]],
      estimated_results: "0-1 vehicles"
    }
  }
  
  // Phone number pattern
  const phoneMatch = query.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/\D/g, '')
    return {
      interpretation: `Searching for customer with phone ${phoneMatch[0]}`,
      entity: 'customers',
      sql: "SELECT * FROM customers WHERE (phone_primary LIKE $1 OR phone_secondary LIKE $1) AND is_active = true LIMIT 50",
      params: [`%${digits}%`],
      estimated_results: "0-5 customers"
    }
  }
  
  // RO number pattern
  const roMatch = query.match(/RO[-\s]?\d+/i)
  if (roMatch) {
    return {
      interpretation: `Searching for repair order ${roMatch[0]}`,
      entity: 'work_orders',
      sql: "SELECT wo.*, c.customer_name, v.year, v.make, v.model FROM work_orders wo LEFT JOIN customers c ON wo.customer_id = c.id LEFT JOIN vehicles v ON wo.vehicle_id = v.id WHERE wo.ro_number ILIKE $1 AND wo.is_active = true",
      params: [`%${roMatch[0]}%`],
      estimated_results: "0-1 work orders"
    }
  }
  
  // Default: search customer names
  return {
    interpretation: `Searching for customer: ${query}`,
    entity: 'customers',
    sql: "SELECT * FROM customers WHERE customer_name ILIKE $1 AND is_active = true LIMIT 50",
    params: [`%${query}%`],
    estimated_results: "varies"
  }
}

/**
 * Validate SQL query is safe (SELECT only, no destructive operations)
 */
function isSafeQuery(sql: string): boolean {
  if (!sql) return false
  
  const lowerSQL = sql.toLowerCase().trim()
  
  // Block destructive operations
  const forbidden = [
    'delete', 'update', 'insert', 'drop', 
    'alter', 'truncate', 'create', 'grant',
    'revoke', 'exec', 'execute', 'call'
  ]
  
  for (const keyword of forbidden) {
    // Check for keyword as a separate word
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(lowerSQL)) {
      console.error('[AI Search] Blocked unsafe keyword:', keyword)
      return false
    }
  }
  
  // Only allow SELECT
  if (!lowerSQL.startsWith('select')) {
    console.error('[AI Search] Query does not start with SELECT')
    return false
  }
  
  // Block multiple statements
  if (sql.includes(';') && sql.indexOf(';') < sql.length - 1) {
    console.error('[AI Search] Multiple statements detected')
    return false
  }
  
  return true
}
