/**
 * Phase 3 Automated Verification Test Script
 */
const http = require('http');

const BASE_URL = 'http://localhost:5001';

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    };

    if (body !== null) {
      if (typeof body === 'string') {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(body);
      } else {
        const bodyStr = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      }
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body !== null) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
};

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 3 Verification Tests...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: GET /api/v1/health
  try {
    const res = await request('GET', '/api/v1/health');
    if (
      res.status === 200 &&
      res.body.success === true &&
      res.body.data &&
      res.body.data.db === 'connected' &&
      typeof res.body.data.uptime === 'number'
    ) {
      console.log('✅ PASS: GET /api/v1/health returns 200 with DB status "connected" and uptime');
      console.log('   Response Data:', JSON.stringify(res.body.data));
      passed++;
    } else {
      console.error('❌ FAIL: GET /api/v1/health unexpected response:', res);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL: GET /api/v1/health error:', err.message);
    failed++;
  }

  // Test 2: GET /health (legacy shortcut)
  try {
    const res = await request('GET', '/health');
    if (res.status === 200 && res.body.success === true && res.body.data.db === 'connected') {
      console.log('✅ PASS: GET /health (shortcut) returns 200');
      passed++;
    } else {
      console.error('❌ FAIL: GET /health shortcut failed:', res);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL: GET /health shortcut error:', err.message);
    failed++;
  }

  // Test 3: 404 Route Not Found
  try {
    const res = await request('GET', '/api/v1/non-existent-endpoint');
    if (
      res.status === 404 &&
      res.body.success === false &&
      res.body.error &&
      res.body.error.code === 'NOT_FOUND'
    ) {
      console.log('✅ PASS: 404 Not Found returns standard JSON error envelope');
      console.log('   Error Object:', JSON.stringify(res.body.error));
      passed++;
    } else {
      console.error('❌ FAIL: 404 handler unexpected response:', res);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL: 404 handler error:', err.message);
    failed++;
  }

  // Test 4: Invalid JSON Body Handling (Express SyntaxError -> 400 with INVALID_JSON code)
  try {
    const res = await request('POST', '/api/v1/health', '{invalid_json_payload:');
    if (
      res.status === 400 &&
      res.body.success === false &&
      res.body.error &&
      res.body.error.code === 'INVALID_JSON'
    ) {
      console.log('✅ PASS: Invalid JSON body returns 400 with code "INVALID_JSON"');
      console.log('   Error Object:', JSON.stringify(res.body.error));
      passed++;
    } else {
      console.error('❌ FAIL: Invalid JSON handler unexpected response:', res);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL: Invalid JSON handler error:', err.message);
    failed++;
  }

  // Test 5: Security Headers (Helmet check)
  try {
    const res = await request('GET', '/api/v1/health');
    const hasHelmetHeaders =
      res.headers['x-dns-prefetch-control'] !== undefined ||
      res.headers['x-frame-options'] !== undefined ||
      res.headers['x-content-type-options'] !== undefined;

    if (hasHelmetHeaders) {
      console.log('✅ PASS: Helmet security headers verified on response');
      passed++;
    } else {
      console.error('❌ FAIL: Helmet security headers missing:', res.headers);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL: Security headers check error:', err.message);
    failed++;
  }

  // Test 6: Request without token (should NOT redirect, returns normally)
  try {
    const res = await request('GET', '/api/v1/health', null, {});
    if (res.status === 200 && res.headers.location === undefined) {
      console.log('✅ PASS: Request without token returns response without redirect');
      passed++;
    } else {
      console.error('❌ FAIL: Request without token failed:', res);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL: Request without token error:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
