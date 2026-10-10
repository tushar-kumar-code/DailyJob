/**
 * Test: Dual-Purpose Profile Creation & Switching Verification
 * Tests:
 * 1. User creates account (Email + Username + Password)
 * 2. User creates 1st profile as Job Seeker ("मुझे जॉब चाहिए")
 * 3. User creates 2nd profile as Employer ("मुझे जॉब करने वाला चाहिए")
 * 4. User account stores BOTH profiles simultaneously
 * 5. User switches between worker and employer roles via /api/user/switch-role
 * 6. Subsequent login preserves both profiles
 */

const http = require('http');

const BASE_URL = 'http://localhost:8000';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          raw: data
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runDualProfileTests() {
  console.log('\n======================================================');
  console.log('  DUAL PROFILE (JOB SEEKER & EMPLOYER) TEST SUITE');
  console.log('======================================================\n');

  const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
  const email = `dual_${randomSuffix}@dailyjob.com`;
  const username = `dual_user_${randomSuffix}`;
  const password = 'Password123!';

  // Step 1: Create Account
  console.log('[Step 1] Creating New User Account');
  const signupRes = await makeRequest('POST', '/api/auth/signup', {
    email,
    username,
    password,
    confirmPassword: password
  });

  assert(signupRes.statusCode === 201, 'Signup returns 201 Created');
  const token = signupRes.data.token;
  assert(!!token, 'Auth token returned');
  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // Step 2: Create 1st Profile -> Job Seeker ("मुझे जॉब चाहिए")
  console.log('\n[Step 2] Creating 1st Profile: Job Seeker (मुझे जॉब चाहिए)');
  const workerProfileRes = await makeRequest('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    age: 25,
    profession: 'Plumber'
  }, authHeaders);

  assert(workerProfileRes.statusCode === 200, 'Worker profile saved (200 OK)');
  const userAfterWorker = workerProfileRes.data.user;
  assert(userAfterWorker.role === 'worker', 'Active role set to worker');
  assert(!!userAfterWorker.worker_profile, 'worker_profile exists on user');
  assert(userAfterWorker.worker_profile.profession === 'Plumber', 'Worker profession is Plumber');
  assert(userAfterWorker.worker_profile.age === 25, 'Worker age is 25');

  // Step 3: Create 2nd Profile -> Employer ("मुझे जॉब करने वाला चाहिए")
  console.log('\n[Step 3] Creating 2nd Profile: Employer (मुझे जॉब करने वाला चाहिए)');
  const employerProfileRes = await makeRequest('POST', '/api/user/profile', {
    user_type: 'employer',
    age: 25,
    profession: 'Shop & Retail'
  }, authHeaders);

  assert(employerProfileRes.statusCode === 200, 'Employer profile saved (200 OK)');
  const userAfterEmployer = employerProfileRes.data.user;
  assert(userAfterEmployer.role === 'employer', 'Active role updated to employer');
  assert(!!userAfterEmployer.employer_profile, 'employer_profile exists on user');
  assert(userAfterEmployer.employer_profile.profession === 'Shop & Retail', 'Employer profession is Shop & Retail');
  assert(!!userAfterEmployer.worker_profile, 'worker_profile STILL exists (dual profile active!)');
  assert(userAfterEmployer.worker_profile.profession === 'Plumber', 'Original worker profile remained intact');

  // Step 4: Switch Active Role back to Worker ("मुझे जॉब चाहिए")
  console.log('\n[Step 4] Switching Role to Worker (मुझे जॉब चाहिए)');
  const switchToWorkerRes = await makeRequest('POST', '/api/user/switch-role', {
    role: 'worker'
  }, authHeaders);

  assert(switchToWorkerRes.statusCode === 200, 'Switched to worker role successfully (200 OK)');
  const userSwitchedWorker = switchToWorkerRes.data.user;
  assert(userSwitchedWorker.role === 'worker', 'User active role is now worker');
  assert(userSwitchedWorker.profile.profession === 'Plumber', 'Active profile is Plumber');
  assert(!!userSwitchedWorker.employer_profile, 'Employer profile still retained');

  // Step 5: Switch Active Role to Employer ("मुझे जॉब करने वाला चाहिए")
  console.log('\n[Step 5] Switching Role to Employer (मुझे जॉब करने वाला चाहिए)');
  const switchToEmployerRes = await makeRequest('POST', '/api/user/switch-role', {
    role: 'employer'
  }, authHeaders);

  assert(switchToEmployerRes.statusCode === 200, 'Switched to employer role successfully (200 OK)');
  const userSwitchedEmployer = switchToEmployerRes.data.user;
  assert(userSwitchedEmployer.role === 'employer', 'User active role is now employer');
  assert(userSwitchedEmployer.profile.profession === 'Shop & Retail', 'Active profile is Shop & Retail');

  // Step 6: Log out and Log back in -> Verify both profiles persist
  console.log('\n[Step 6] Verification on Subsequent Login');
  const loginRes = await makeRequest('POST', '/api/auth/signin', {
    email,
    username,
    password
  });

  assert(loginRes.statusCode === 200, 'Login returns 200 OK');
  const loggedInUser = loginRes.data.user;
  assert(!!loggedInUser.worker_profile, 'worker_profile preserved on subsequent login');
  assert(loggedInUser.worker_profile.profession === 'Plumber', 'worker_profile profession is Plumber');
  assert(!!loggedInUser.employer_profile, 'employer_profile preserved on subsequent login');
  assert(loggedInUser.employer_profile.profession === 'Shop & Retail', 'employer_profile profession is Shop & Retail');

  console.log('\n======================================================');
  console.log('  ALL DUAL PROFILE TESTS PASSED SUCCESSFULLY! ✓');
  console.log('======================================================\n');
}

runDualProfileTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
