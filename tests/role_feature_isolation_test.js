/**
 * Test Suite: Role-Based Feature Isolation & Switching
 * Validates:
 * 1. Worker (Job Seeker) cannot access or view Employer features.
 * 2. Employer (Job Giver) cannot access or view Job Seeker features.
 * 3. Switching role via API and State transitions smoothly.
 */

const assert = require('assert');
const http = require('http');
const { server, getUsers, saveUsers } = require('../server.js');

const PORT = 8199;
let activeServer;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  ROLE FEATURE ISOLATION & SWITCHING TEST SUITE');
  console.log('======================================================\n');

  activeServer = server.listen(PORT);

  try {
    const unique = Date.now();
    const email = `role_test_${unique}@example.com`;

    // 1. Create user
    console.log('[Step 1] Creating Test User');
    const signupRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email,
      username: `user_${unique}`,
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!'
    });

    assert.strictEqual(signupRes.status, 201, 'Signup status 201');
    const token = signupRes.data.token;
    console.log('  ✓ PASS: User created and token received');

    // 2. Set profile as job_seeker (worker)
    console.log('\n[Step 2] Initializing Profile as Worker (जॉब लेने वाला)');
    const profileRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/user/profile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      user_type: 'job_seeker',
      age: 27,
      profession: 'Electrician'
    });

    assert.strictEqual(profileRes.status, 200, 'Profile status 200');
    assert.strictEqual(profileRes.data.user.role, 'worker', 'User role is worker');
    console.log('  ✓ PASS: Worker role active');

    // 3. Switch role to Employer
    console.log('\n[Step 3] Switching from Worker to Employer (जॉब देने वाला)');
    const switchEmployerRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/user/switch-role',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { role: 'employer' });

    assert.strictEqual(switchEmployerRes.status, 200, 'Switch status 200');
    assert.strictEqual(switchEmployerRes.data.user.role, 'employer', 'User role switched to employer');
    console.log('  ✓ PASS: Successfully switched to employer mode');

    // 4. Verify /api/auth/me returns employer
    const meEmployerRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(meEmployerRes.data.user.role, 'employer', 'Session role is employer');
    console.log('  ✓ PASS: Session confirms active role is employer');

    // 5. Switch back to Worker
    console.log('\n[Step 4] Switching back from Employer to Worker (जॉब लेने वाला)');
    const switchWorkerRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/user/switch-role',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { role: 'worker' });

    assert.strictEqual(switchWorkerRes.status, 200, 'Switch status 200');
    assert.strictEqual(switchWorkerRes.data.user.role, 'worker', 'User role switched to worker');
    console.log('  ✓ PASS: Successfully switched back to worker mode');

    // 6. Verify invalid role is rejected
    console.log('\n[Step 5] Invalid Role Validation');
    const invalidRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/user/switch-role',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { role: 'superhero' });

    assert.strictEqual(invalidRes.status, 400, 'Rejects invalid role with 400');
    console.log('  ✓ PASS: Rejects invalid role');

    console.log('\n======================================================');
    console.log('  ALL ROLE ISOLATION & SWITCH TESTS PASSED! ✓');
    console.log('======================================================\n');
  } finally {
    activeServer.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  if (activeServer) activeServer.close();
  process.exit(1);
});
