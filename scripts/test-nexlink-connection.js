#!/usr/bin/env node

/**
 * Test script for Nexlink API connection
 * Tests both staging and production endpoints
 */

const https = require('https');

// Test configuration
const TEST_CONFIG = {
  username: 'TSE-17275',
  password: 'AutoHouse432..',
  apiTokenKey: 'dsfggleddirt#rifgj9EaF',
  partnerProviderKey: 'ProviderKey', // May need to be updated with actual key
  staging: 'www.nexpartuat.com',
  production: 'www.nexpart.com',
  path: '/webservices/nexlink/request.php'
};

/**
 * Create XML request for Launch
 */
function createLaunchRequestXML() {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<Request>
  <Rev>4.61</Rev>
  <ClientVersion>1.0.0</ClientVersion>
  <RequestType>Launch</RequestType>
  <PartnerProviderKey>${TEST_CONFIG.partnerProviderKey}</PartnerProviderKey>
  <Username>${TEST_CONFIG.username}</Username>
  <Password>${TEST_CONFIG.password}</Password>
  <Identifier>TEST_001</Identifier>
  <ClearCart>1</ClearCart>
</Request>`;
}

/**
 * Create JSON request for Launch
 */
function createLaunchRequestJSON() {
  return JSON.stringify({
    Request: {
      Rev: "4.61",
      ClientVersion: "1.0.0",
      RequestType: "Launch",
      PartnerProviderKey: TEST_CONFIG.partnerProviderKey,
      Username: TEST_CONFIG.username,
      Password: TEST_CONFIG.password,
      Identifier: "TEST_001",
      ClearCart: "1"
    }
  });
}

/**
 * Make HTTPS POST request
 */
function makeRequest(hostname, xmlData, format = 'XML') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      path: TEST_CONFIG.path,
      method: 'POST',
      headers: {
        'Content-Type': format === 'XML' ? 'application/xml' : 'application/json',
        'Content-Length': Buffer.byteLength(xmlData)
      }
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing ${hostname} with ${format} format`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Username: ${TEST_CONFIG.username}`);
    console.log(`Endpoint: https://${hostname}${TEST_CONFIG.path}`);
    console.log(`\nRequest Body:\n${xmlData}\n`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`\nResponse:\n${data}\n`);
        
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
      reject(error);
    });

    req.write(xmlData);
    req.end();
  });
}

/**
 * Test Cart Request (Pull Method)
 */
function createCartRequestXML() {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<Request>
  <Rev>4.61</Rev>
  <ClientVersion>1.0.0</ClientVersion>
  <RequestType>Cart</RequestType>
  <PartnerProviderKey>${TEST_CONFIG.partnerProviderKey}</PartnerProviderKey>
  <ApiTokenKey>${TEST_CONFIG.apiTokenKey}</ApiTokenKey>
</Request>`;
}

/**
 * Parse XML response for key information
 */
function parseResponse(responseData, format = 'XML') {
  try {
    if (format === 'JSON') {
      const json = JSON.parse(responseData);
      return {
        success: json.Response?.Success === '1' || json.Response?.Success === 1,
        errorCount: json.Response?.ErrorCount || 0,
        errors: json.Response?.Errors?.Error || [],
        launchURL: json.Response?.LaunchURL,
        apiTokenKey: json.Response?.ApiTokenKey
      };
    } else {
      // Simple XML parsing
      const success = responseData.includes('<Success>1</Success>');
      const errorMatch = responseData.match(/<ErrorCount>(\d+)<\/ErrorCount>/);
      const errorCount = errorMatch ? parseInt(errorMatch[1]) : 0;
      const launchURLMatch = responseData.match(/<LaunchURL>(.*?)<\/LaunchURL>/);
      const apiTokenMatch = responseData.match(/<ApiTokenKey>(.*?)<\/ApiTokenKey>/);
      
      return {
        success: success,
        errorCount: errorCount,
        launchURL: launchURLMatch ? launchURLMatch[1] : null,
        apiTokenKey: apiTokenMatch ? apiTokenMatch[1] : null
      };
    }
  } catch (error) {
    console.error('Error parsing response:', error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    Nexlink API Connection Test                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const results = {
    staging: { xml: null, json: null },
    production: { xml: null, json: null }
  };

  // Test 1: Staging with XML
  try {
    const xmlRequest = createLaunchRequestXML();
    const response = await makeRequest(TEST_CONFIG.staging, xmlRequest, 'XML');
    results.staging.xml = parseResponse(response.data, 'XML');
    
    if (results.staging.xml?.success) {
      console.log('✅ STAGING XML: SUCCESS');
      if (results.staging.xml.launchURL) {
        console.log(`   Launch URL: ${results.staging.xml.launchURL}`);
      }
      if (results.staging.xml.apiTokenKey) {
        console.log(`   API Token: ${results.staging.xml.apiTokenKey}`);
      }
    } else {
      console.log('❌ STAGING XML: FAILED');
      console.log(`   Error Count: ${results.staging.xml?.errorCount || 'unknown'}`);
    }
  } catch (error) {
    console.log('❌ STAGING XML: ERROR -', error.message);
  }

  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Staging with JSON
  try {
    const jsonRequest = createLaunchRequestJSON();
    const response = await makeRequest(TEST_CONFIG.staging, jsonRequest, 'JSON');
    results.staging.json = parseResponse(response.data, 'JSON');
    
    if (results.staging.json?.success) {
      console.log('✅ STAGING JSON: SUCCESS');
    } else {
      console.log('❌ STAGING JSON: FAILED');
    }
  } catch (error) {
    console.log('❌ STAGING JSON: ERROR -', error.message);
  }

  // Test 3: Test with documented API token (Cart request)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('Testing Cart Request with documented API Token');
  console.log(`${'='.repeat(80)}`);
  
  try {
    const cartRequest = createCartRequestXML();
    const response = await makeRequest(TEST_CONFIG.staging, cartRequest, 'XML');
    const cartResult = parseResponse(response.data, 'XML');
    
    if (cartResult?.success) {
      console.log('✅ CART REQUEST: SUCCESS (Token is valid!)');
    } else {
      console.log('❌ CART REQUEST: FAILED (Token may be invalid or expired)');
    }
  } catch (error) {
    console.log('❌ CART REQUEST: ERROR -', error.message);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              Test Summary                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('STAGING ENVIRONMENT:');
  console.log(`  XML Launch:  ${results.staging.xml?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  JSON Launch: ${results.staging.json?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  console.log('\nNOTE: Production testing skipped to avoid unnecessary API calls.');
  console.log('      If staging works, production should work with production credentials.\n');
}

// Run tests
runTests().catch(console.error);
