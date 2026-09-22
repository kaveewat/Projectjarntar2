/**
 * Phase 4 Automated Verification Test Script
 */
const http = require('http');
const mysql = require('mysql2/promise');

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
        Accept: 'application/json',
        ...headers,
      },
    };

    let bodyStr = null;
    if (body !== null) {
      bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
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

    if (bodyStr !== null) {
      req.write(bodyStr);
    }

    req.end();
  });
};

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 4 Verification Tests...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const testEmail = `buyer_test_${Date.now()}@example.com`;
  const testPassword = 'Password@12345';
  let buyerToken = null;

  // AC 1: POST /api/v1/auth/register → creates user + returns JWT
  try {
    const res = await request('POST', '/api/v1/auth/register', {
      email: testEmail,
      password: testPassword,
      display_name: 'Test Buyer User',
      role: 'BUYER',
      phone: '0812345678',
    });

    if (
      res.status === 201 &&
      res.body.success === true &&
      res.body.data.user &&
      res.body.data.access_token &&
      res.body.data.user.role === 'BUYER' &&
      res.body.data.user.password_hash === undefined
    ) {
      buyerToken = res.body.data.access_token;
      console.log('✅ PASS [AC 1]: POST /api/v1/auth/register creates user and returns JWT');
      console.log(`   Registered User: ${res.body.data.user.email} (Role: ${res.body.data.user.role})`);
      passed++;
    } else {
      console.error('❌ FAIL [AC 1]: POST /api/v1/auth/register unexpected response:', res.status, res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 1]: Error in register:', err.message);
    failed++;
  }

  // AC 2: POST /api/v1/auth/login → return { access_token, user } or 401
  try {
    // Valid login
    const validRes = await request('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: testPassword,
    });

    // Invalid login
    const invalidRes = await request('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: 'WrongPassword999',
    });

    if (
      validRes.status === 200 &&
      validRes.body.success === true &&
      validRes.body.data.access_token &&
      validRes.body.data.user.email === testEmail &&
      invalidRes.status === 401 &&
      invalidRes.body.success === false &&
      invalidRes.body.error.code === 'INVALID_CREDENTIALS'
    ) {
      console.log('✅ PASS [AC 2]: POST /api/v1/auth/login returns token and user on success, and 401 on wrong password');
      passed++;
    } else {
      console.error('❌ FAIL [AC 2]: Login response unexpected:', { validRes, invalidRes });
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 2]: Error in login test:', err.message);
    failed++;
  }

  // AC 3: GET /api/v1/auth/me with valid token → return user data
  try {
    const res = await request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${buyerToken}`,
    });

    if (
      res.status === 200 &&
      res.body.success === true &&
      res.body.data.user &&
      res.body.data.user.email === testEmail
    ) {
      console.log('✅ PASS [AC 3]: GET /api/v1/auth/me with valid token returns user data');
      passed++;
    } else {
      console.error('❌ FAIL [AC 3]: GET /api/v1/auth/me unexpected response:', res.status, res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 3]: Error in GET /me test:', err.message);
    failed++;
  }

  // AC 4: GET /api/v1/auth/me without token → 401
  try {
    const res = await request('GET', '/api/v1/auth/me');
    if (
      res.status === 401 &&
      res.body.success === false &&
      res.body.error.code === 'UNAUTHORIZED'
    ) {
      console.log('✅ PASS [AC 4]: GET /api/v1/auth/me without token returns 401 UNAUTHORIZED');
      passed++;
    } else {
      console.error('❌ FAIL [AC 4]: GET /api/v1/auth/me without token unexpected response:', res.status, res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 4]: Error in GET /me without token test:', err.message);
    failed++;
  }

  // AC 5: Route requiring ADMIN role accessed with BUYER token → 403
  try {
    // Attempt with BUYER token
    const buyerRes = await request('GET', '/api/v1/users/admin/check', null, {
      Authorization: `Bearer ${buyerToken}`,
    });

    // Login as seeded Admin to verify admin can access
    const adminLoginRes = await request('POST', '/api/v1/auth/login', {
      email: 'admin@efootball-market.com',
      password: 'Admin@123456',
    });

    const adminToken = adminLoginRes.body.data.access_token;
    const adminRes = await request('GET', '/api/v1/users/admin/check', null, {
      Authorization: `Bearer ${adminToken}`,
    });

    if (
      buyerRes.status === 403 &&
      buyerRes.body.success === false &&
      buyerRes.body.error.code === 'FORBIDDEN' &&
      adminRes.status === 200 &&
      adminRes.body.success === true
    ) {
      console.log('✅ PASS [AC 5]: Role guard denies BUYER with 403 FORBIDDEN and allows ADMIN with 200');
      passed++;
    } else {
      console.error('❌ FAIL [AC 5]: Role guard unexpected response:', {
        buyerStatus: buyerRes.status,
        buyerBody: buyerRes.body,
        adminStatus: adminRes.status,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 5]: Error in role guard test:', err.message);
    failed++;
  }

  // AC 6: Password hash with bcrypt >= 10 rounds (no plain text in DB)
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'efootball_user',
      password: 'efootball_pass',
      database: 'efootball_db',
    });

    const [rows] = await conn.query('SELECT password_hash FROM users WHERE email = ?', [testEmail]);
    await conn.end();

    if (rows.length > 0) {
      const hash = rows[0].password_hash;
      const isBcrypt = /^\$2[aby]\$10\$/.test(hash);
      const isNotPlainText = hash !== testPassword;

      if (isBcrypt && isNotPlainText) {
        console.log('✅ PASS [AC 6]: Password hash verified in DB (bcrypt 10 rounds, no plain text)');
        console.log(`   Sample Hash Prefix: ${hash.substring(0, 10)}...`);
        passed++;
      } else {
        console.error('❌ FAIL [AC 6]: Password hash invalid:', hash);
        failed++;
      }
    } else {
      console.error('❌ FAIL [AC 6]: Test user not found in DB');
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 6]: Error verifying DB hash:', err.message);
    failed++;
  }

  // AC 7: Login with wrong password > 10 times in 15 minutes → 429
  try {
    console.log('   Testing login rate limiter (sending 11 failed login requests)...');
    let hitRateLimit = false;
    let rateLimitStatus = null;
    let rateLimitBody = null;

    for (let i = 1; i <= 12; i++) {
      const res = await request(
        'POST',
        '/api/v1/auth/login',
        {
          email: testEmail,
          password: `WrongPassword_${i}`,
        },
        {
          'x-test-client-id': 'ac7-rate-limit-test-user',
        }
      );

      if (res.status === 429) {
        hitRateLimit = true;
        rateLimitStatus = res.status;
        rateLimitBody = res.body;
        break;
      }
    }

    if (hitRateLimit && rateLimitStatus === 429 && rateLimitBody.error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log('✅ PASS [AC 7]: Login rate limit exceeded returns 429 RATE_LIMIT_EXCEEDED');
      console.log('   Rate Limit Response:', JSON.stringify(rateLimitBody.error));
      passed++;
    } else {
      console.error('❌ FAIL [AC 7]: Login rate limit did not trigger 429:', rateLimitStatus);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 7]: Error in rate limit test:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 4 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
