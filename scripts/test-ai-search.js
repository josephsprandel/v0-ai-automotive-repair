#!/usr/bin/env node

/**
 * Test script for AI-Powered Natural Language Search
 * Tests the /api/search/ai-search endpoint directly
 */

const http = require('http')

const TEST_QUERIES = [
  // 1. Simple name search
  { query: "Bob Johnson", context: {} },
  
  // 2. VIN search
  { query: "JT6BU5JR6A5011415", context: {} },
  
  // 3. Context-aware search (parts for RO)
  { query: "the parts ordered for this RO", context: { workOrderId: 19 } },
  
  // 4. Time-based search
  { query: "customers who came in last week", context: {} },
  
  // 5. Ambiguous search
  { query: "brake jobs", context: {} },
  
  // 6. Phone number
  { query: "512-555-1234", context: {} },
  
  // 7. All customers
  { query: "all customers", context: {} },
  
  // 8. Open repair orders
  { query: "open repair orders", context: {} },
]

async function testSearch(testCase, index) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      query: testCase.query,
      context: testCase.context
    })

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/search/ai-search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`TEST ${index + 1}: "${testCase.query}"`)
    console.log(`Context: ${JSON.stringify(testCase.context)}`)
    console.log(`${'='.repeat(80)}`)

    const req = http.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(responseData)
          
          console.log(`Status: ${res.statusCode}`)
          console.log(`Success: ${json.success ? '✅ YES' : '❌ NO'}`)
          console.log(`Interpretation: ${json.interpretation}`)
          console.log(`Entity: ${json.entity || 'N/A'}`)
          console.log(`Results: ${json.count || 0} rows`)
          
          if (json.sql) {
            console.log(`\n📝 Generated SQL:`)
            console.log(json.sql)
          }
          
          if (json.error) {
            console.log(`\n❌ Error: ${json.error}`)
          }
          
          if (json.results && json.results.length > 0) {
            console.log(`\n📊 Sample Results (first 3):`)
            json.results.slice(0, 3).forEach((r, i) => {
              console.log(`  ${i + 1}. ${JSON.stringify(r, null, 2).substring(0, 200)}...`)
            })
          }
          
          resolve({
            query: testCase.query,
            success: json.success,
            count: json.count || 0,
            interpretation: json.interpretation,
            sql: json.sql,
            error: json.error
          })
        } catch (parseError) {
          console.log(`❌ Parse Error:`, parseError.message)
          console.log(`Raw response:`, responseData.substring(0, 500))
          resolve({
            query: testCase.query,
            success: false,
            error: parseError.message
          })
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message)
      resolve({
        query: testCase.query,
        success: false,
        error: error.message
      })
    })

    req.write(data)
    req.end()
  })
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗')
  console.log('║              AI-Powered Natural Language Search Test Suite                    ║')
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n')

  // Wait for server to be ready
  console.log('⏳ Waiting 3 seconds for server...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  const results = []

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const result = await testSearch(TEST_QUERIES[i], i)
    results.push(result)
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗')
  console.log('║                              Test Summary                                      ║')
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n')
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('')
  
  console.log('Details:')
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌'
    const count = r.success ? `(${r.count} results)` : `(Error: ${r.error?.substring(0, 50)}...)`
    console.log(`  ${status} ${i + 1}. "${r.query}" ${count}`)
  })

  console.log('')
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch(console.error)
