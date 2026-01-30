#!/usr/bin/env node

/**
 * Test script for AI Assistant API
 */

const http = require('http');

const TEST_COMMANDS = [
  "go to customers",
  "what services are due",
  "create new repair order",
  "find customer Bob Johnson",
  "hello"
];

async function testCommand(command) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      command: command,
      context: {
        page: '/test',
        timestamp: new Date().toISOString()
      }
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai-assistant',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing command: "${command}"`);
    console.log(`${'='.repeat(80)}`);

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        try {
          const json = JSON.parse(responseData);
          console.log('Response:', JSON.stringify(json, null, 2));
          
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS');
          } else {
            console.log('❌ FAILED');
          }
          
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          console.log('Raw response:', responseData);
          console.log('❌ Parse Error:', error.message);
          resolve({ status: res.statusCode, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    AI Assistant API Test Suite                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const command of TEST_COMMANDS) {
    try {
      const result = await testCommand(command);
      if (result.status === 200) {
        passed++;
      } else {
        failed++;
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Test failed:', error.message);
      failed++;
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              Test Summary                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Tests: ${TEST_COMMANDS.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);
