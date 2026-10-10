/**
 * CGNeeti / कामसाथी - Authentication System Comprehensive Test Suite
 * Validates all 16 requirements specified in the authentication plan
 */

const http = require('http');

const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = {
      ...headers
    };
    if (postData && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(url, {
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  STARTING CGNEETI AUTHENTICATION TEST SUITE');
  console.log('======================================================\n');

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';
  let authToken = null;
  let sessionCookie = null;
  let testUserId = null;

  // 1. Static asset serving
  console.log('[Test 1] Static Asset Serving');
  const indexRes = await request('GET', '/');
  assert(indexRes.statusCode === 200, 'GET / returns 200 OK');
  assert(indexRes.body.includes('CGNeeti (कामसाथी)'), 'index.html contains app title');

  // 2. Signup - Missing / Invalid email
  console.log('\n[Test 2] Signup Validation - Invalid Email');
  const invalidEmailRes = await request('POST', '/api/auth/signup', {
    fullName: 'Test User',
    email: 'not-an-email',
    password: testPassword,
    confirmPassword: testPassword,
    role: 'worker'
  });
  assert(invalidEmailRes.statusCode === 400, 'Rejects invalid email with status 400');
  assert(invalidEmailRes.json?.error, 'Error message provided for invalid email');

  // 3. Signup - Weak Password (< 8 chars)
  console.log('\n[Test 3] Signup Validation - Weak Password');
  const weakPwdRes = await request('POST', '/api/auth/signup', {
    fullName: 'Test User',
    email: `valid_${Date.now()}@example.com`,
    password: 'weak',
    confirmPassword: 'weak',
    role: 'worker'
  });
  assert(weakPwdRes.statusCode === 400, 'Rejects weak password with status 400');

  // 4. Signup - Password Mismatch
  console.log('\n[Test 4] Signup Validation - Password Mismatch');
  const mismatchRes = await request('POST', '/api/auth/signup', {
    fullName: 'Test User',
    email: `valid_${Date.now()}@example.com`,
    password: testPassword,
    confirmPassword: 'DifferentPassword123!',
    role: 'worker'
  });
  assert(mismatchRes.statusCode === 400, 'Rejects mismatched passwords with status 400');

  // 5. Signup - Successful Registration
  console.log('\n[Test 5] Signup - Valid Registration');
  const signupRes = await request('POST', '/api/auth/signup', {
    fullName: 'Tushar Sharma',
    email: testEmail,
    password: testPassword,
    confirmPassword: testPassword,
    role: 'worker'
  });
  assert(signupRes.statusCode === 201, 'Signup returns 201 Created');
  assert(signupRes.json?.token, 'JWT token returned in signup body');
  assert(signupRes.json?.user?.email === testEmail, 'User profile returned with matching email');
  assert(signupRes.json?.user?.passwordHash === undefined, 'Password hash is NOT exposed in response');
  assert(signupRes.json?.user?.salt === undefined, 'Salt is NOT exposed in response');

  testUserId = signupRes.json?.user?.id;
  authToken = signupRes.json?.token;

  // Check Set-Cookie header for HttpOnly cookie
  const setCookie = signupRes.headers['set-cookie'];
  assert(setCookie && setCookie.some(c => c.includes('cgneeti_session') && c.includes('HttpOnly')), 'Set-Cookie contains HttpOnly cgneeti_session cookie');
  if (setCookie) {
    sessionCookie = setCookie.find(c => c.includes('cgneeti_session')).split(';')[0];
  }

  // 6. Signup - Duplicate Email Rejection
  console.log('\n[Test 6] Signup - Duplicate Email');
  const dupRes = await request('POST', '/api/auth/signup', {
    fullName: 'Duplicate User',
    email: testEmail,
    password: testPassword,
    confirmPassword: testPassword,
    role: 'worker'
  });
  assert(dupRes.statusCode === 409, 'Rejects duplicate registration with 409 Conflict');

  // 7. Sign In - Invalid Credentials (Generic Error)
  console.log('\n[Test 7] Sign In - Invalid Credentials');
  const badLoginRes = await request('POST', '/api/auth/signin', {
    email: testEmail,
    password: 'WrongPassword999!'
  });
  assert(badLoginRes.statusCode === 401, 'Rejects incorrect password with 401 Unauthorized');
  assert(badLoginRes.json?.error?.startsWith('Invalid email'), 'Returns generic timing-safe error message');

  // 8. Sign In - Successful Login
  console.log('\n[Test 8] Sign In - Successful Credentials');
  const loginRes = await request('POST', '/api/auth/signin', {
    email: testEmail,
    password: testPassword
  });
  assert(loginRes.statusCode === 200, 'Sign in returns 200 OK');
  assert(loginRes.json?.token, 'Token returned on successful login');
  assert(loginRes.json?.user?.fullName === 'Tushar Sharma', 'User details correctly attached');
  assert(loginRes.json?.user?.passwordHash === undefined, 'Password hash safely stripped');

  // 9. Protected Endpoint / Session Verification via Cookie
  console.log('\n[Test 9] Protected Endpoint /api/auth/me via Cookie');
  const meCookieRes = await request('GET', '/api/auth/me', null, {
    'Cookie': sessionCookie
  });
  assert(meCookieRes.statusCode === 200, 'Authenticated via HttpOnly cookie (200 OK)');
  assert(meCookieRes.json?.user?.id === testUserId, 'Correct user identity verified via cookie');

  // 10. Protected Endpoint / Session Verification via Bearer Header
  console.log('\n[Test 10] Protected Endpoint /api/auth/me via Authorization Header');
  const meHeaderRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  assert(meHeaderRes.statusCode === 200, 'Authenticated via Authorization Bearer token (200 OK)');
  assert(meHeaderRes.json?.user?.id === testUserId, 'Correct user identity verified via Bearer header');

  // 11. Protected Endpoint without credentials (401)
  console.log('\n[Test 11] Protected Endpoint Unauthenticated Rejection');
  const meUnauthRes = await request('GET', '/api/auth/me');
  assert(meUnauthRes.statusCode === 401, 'Rejects unauthenticated request with 401 Unauthorized');

  // 12. User Isolation & Access Control (User A cannot access User B data)
  console.log('\n[Test 12] User Isolation / Authorization Check');
  // Target user is seed user 'usr_seed_worker_01'
  const crossUserRes = await request('GET', '/api/protected/user-data/usr_seed_worker_01', null, {
    'Authorization': `Bearer ${authToken}`
  });
  assert(crossUserRes.statusCode === 403, 'User A accessing User B private record receives 403 Forbidden');

  const ownUserRes = await request('GET', `/api/protected/user-data/${testUserId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  assert(ownUserRes.statusCode === 200, 'User accessing their own record receives 200 OK');

  // 13. Forgot Password Request
  console.log('\n[Test 13] Forgot Password');
  const forgotRes = await request('POST', '/api/auth/forgot-password', {
    email: testEmail
  });
  assert(forgotRes.statusCode === 200, 'Forgot password returns 200 OK');
  assert(forgotRes.json?.message, 'Returns safe confirmation message');
  // In non-production test mode, token is returned in debugToken for automated testing
  const resetToken = forgotRes.json?.debugToken;
  assert(typeof resetToken === 'string' && resetToken.length > 20, 'Generates secure cryptographic reset token');

  // 14. Reset Password with Invalid Token
  console.log('\n[Test 14] Reset Password with Invalid Token');
  const invalidResetRes = await request('POST', '/api/auth/reset-password', {
    token: 'fake-invalid-token-12345',
    newPassword: 'BrandNewPassword999!'
  });
  assert(invalidResetRes.statusCode === 400, 'Rejects invalid reset token with 400 Bad Request');

  // 15. Reset Password with Valid Token
  console.log('\n[Test 15] Reset Password with Valid Token');
  const validResetRes = await request('POST', '/api/auth/reset-password', {
    token: resetToken,
    newPassword: 'BrandNewPassword999!'
  });
  assert(validResetRes.statusCode === 200, 'Valid reset token updates password (200 OK)');

  // Verify old password fails
  const oldLoginRes = await request('POST', '/api/auth/signin', {
    email: testEmail,
    password: testPassword
  });
  assert(oldLoginRes.statusCode === 401, 'Old password fails after reset');

  // Verify new password succeeds
  const newLoginRes = await request('POST', '/api/auth/signin', {
    email: testEmail,
    password: 'BrandNewPassword999!'
  });
  assert(newLoginRes.statusCode === 200, 'New password succeeds after reset');

  // 16. Logout
  console.log('\n[Test 16] Logout');
  const logoutRes = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${newLoginRes.json.token}`
  });
  assert(logoutRes.statusCode === 200, 'Logout returns 200 OK');
  const logoutCookies = logoutRes.headers['set-cookie'];
  assert(logoutCookies && logoutCookies.some(c => c.includes('Max-Age=0')), 'Set-Cookie clears session with Max-Age=0');

  // Invalidate token verification: using the logged-out token
  const postLogoutMe = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${newLoginRes.json.token}`
  });
  assert(postLogoutMe.statusCode === 401, 'Revoked token is rejected with 401 Unauthorized');

  // 17. DailyJob Flow - New Account Creation with Email, Username, Password
  console.log('\n[Test 17] DailyJob Flow - New Account Creation (Email, Username, Password)');
  const djEmail = `dailyjob_user_${Date.now()}@example.com`;
  const djUsername = 'rahul_verma';
  const djPassword = 'SecurePassword123!';

  const djSignupRes = await request('POST', '/api/auth/signup', {
    email: djEmail,
    username: djUsername,
    password: djPassword
  });
  assert(djSignupRes.statusCode === 201, 'Creates new account successfully (201 Created)');
  assert(djSignupRes.json?.user?.id && djSignupRes.json?.user?.id.startsWith('usr_'), 'Generates a unique user ID starting with usr_');
  assert(djSignupRes.json?.user?.username === djUsername, 'Correct username is saved on profile');
  assert(djSignupRes.json?.user?.email === djEmail, 'Correct email is saved on profile');
  assert(djSignupRes.json?.token, 'Returns authentication token');
  const djUserId = djSignupRes.json?.user?.id;
  const djToken = djSignupRes.json?.token;

  // 18. DailyJob Flow - Duplicate Email Prevention (One email = only one account)
  console.log('\n[Test 18] DailyJob Flow - Duplicate Email Prevention');
  const djDupRes = await request('POST', '/api/auth/signup', {
    email: djEmail,
    username: 'another_username',
    password: 'DifferentPassword456!'
  });
  assert(djDupRes.statusCode === 409, 'Rejects duplicate email with 409 Conflict');
  assert(djDupRes.json?.error?.includes('already exists'), 'Shows clear duplicate account error message');

  // 19. DailyJob Flow - Wrong Password Handling
  console.log('\n[Test 19] DailyJob Flow - Wrong Password Handling');
  const djWrongPassRes = await request('POST', '/api/auth/signin', {
    email: djEmail,
    username: djUsername,
    password: 'WrongPassword999!'
  });
  assert(djWrongPassRes.statusCode === 401, 'Rejects wrong password with 401 Unauthorized');
  assert(djWrongPassRes.json?.error === 'Invalid email, username, or password.', 'Shows clear invalid email/username/password error');

  // 20. DailyJob Flow - Existing User Login (Email + Username + Password)
  console.log('\n[Test 20] DailyJob Flow - Existing User Login with Email + Username + Password');
  const djLoginRes = await request('POST', '/api/auth/signin', {
    email: djEmail,
    username: djUsername,
    password: djPassword
  });
  assert(djLoginRes.statusCode === 200, 'Existing user logs in successfully (200 OK)');
  assert(djLoginRes.json?.user?.id === djUserId, 'Loads existing user ID');
  assert(djLoginRes.json?.user?.username === djUsername, 'Loads registered username');

  // 21. DailyJob Flow - Data Persistence across Logout and Login
  console.log('\n[Test 21] DailyJob Flow - Existing User Saved Data Remains Available after Logout & Login');
  const userSavedData = {
    savedJobIds: ['job-101', 'job-104'],
    appliedJobs: [{ jobId: 'job-101', date: '2026-10-07' }],
    customNotes: 'My saved daily jobs checklist'
  };

  // Save data while logged in
  const saveDataRes = await request('POST', '/api/user/data', { data: userSavedData }, {
    'Authorization': `Bearer ${djLoginRes.json.token}`
  });
  assert(saveDataRes.statusCode === 200, 'User saved data persisted to backend (200 OK)');

  // Logout
  const djLogoutRes = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${djLoginRes.json.token}`
  });
  assert(djLogoutRes.statusCode === 200, 'User logs out successfully (200 OK)');

  // Log back in with registered Email + Username + Password
  const djReloginRes = await request('POST', '/api/auth/signin', {
    email: djEmail,
    username: djUsername,
    password: djPassword
  });
  assert(djReloginRes.statusCode === 200, 'User logs back in successfully (200 OK)');

  // Verify previously saved data is loaded
  const getDataRes = await request('GET', '/api/user/data', null, {
    'Authorization': `Bearer ${djReloginRes.json.token}`
  });
  assert(getDataRes.statusCode === 200, 'Loads saved data endpoint (200 OK)');
  assert(JSON.stringify(getDataRes.json?.data?.savedJobIds) === JSON.stringify(['job-101', 'job-104']), 'Previously saved job IDs remain intact');
  assert(getDataRes.json?.data?.customNotes === 'My saved daily jobs checklist', 'Previously saved user notes remain intact');

  // 22. Profile Creation - Validation Errors
  console.log('\n[Test 22] Profile Creation - Validation Errors');
  const profNewEmail = `prof_user_${Date.now()}@example.com`;
  const profSignupRes = await request('POST', '/api/auth/signup', {
    email: profNewEmail,
    username: 'rohit_worker',
    password: 'WorkerPassword123!',
    confirmPassword: 'WorkerPassword123!'
  });
  assert(profSignupRes.statusCode === 201, 'Creates new profile test user (201 Created)');
  assert(profSignupRes.json?.user?.profile_completed === false, 'New user profile_completed is initially false');
  assert(profSignupRes.json?.user?.profile === null, 'New user profile is initially null');
  const profToken = profSignupRes.json.token;

  // Invalid user_type
  const badTypeRes = await request('POST', '/api/user/profile', {
    user_type: 'invalid_type',
    age: 25,
    profession: 'Electrician'
  }, { 'Authorization': `Bearer ${profToken}` });
  assert(badTypeRes.statusCode === 400, 'Rejects invalid user_type with 400');

  // Invalid / underage age (< 18)
  const badAgeRes = await request('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    age: 15,
    profession: 'Electrician'
  }, { 'Authorization': `Bearer ${profToken}` });
  assert(badAgeRes.statusCode === 400, 'Rejects age < 18 with 400 Bad Request');

  // Missing profession
  const missingProfRes = await request('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    age: 25,
    profession: ''
  }, { 'Authorization': `Bearer ${profToken}` });
  assert(missingProfRes.statusCode === 400, 'Rejects empty profession with 400');

  // Other without custom_profession
  const missingOtherRes = await request('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    age: 25,
    profession: 'Other',
    custom_profession: '   '
  }, { 'Authorization': `Bearer ${profToken}` });
  assert(missingOtherRes.statusCode === 400, 'Rejects "Other" without custom_profession with 400');

  // 23. Profile Creation - Job Seeker Flow (Page 1: job_seeker -> Page 2: Age 26 -> Page 3: Electrician)
  console.log('\n[Test 23] Profile Creation - Job Seeker Flow with Age & Profession');
  const saveSeekerRes = await request('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    age: 26,
    profession: 'Electrician'
  }, { 'Authorization': `Bearer ${profToken}` });
  assert(saveSeekerRes.statusCode === 200, 'Saves job seeker profile (200 OK)');
  assert(saveSeekerRes.json?.user?.profile_completed === true, 'profile_completed becomes true');
  assert(saveSeekerRes.json?.user?.profile?.user_type === 'job_seeker', 'User type is job_seeker');
  assert(saveSeekerRes.json?.user?.age === 26, 'User age is 26');
  assert(saveSeekerRes.json?.user?.profile?.age === 26, 'User profile.age is 26');
  assert(saveSeekerRes.json?.user?.profile?.profession === 'Electrician', 'Profession is Electrician');
  assert(saveSeekerRes.json?.user?.role === 'worker', 'Role correctly mapped to worker');

  // 24. Profile Creation - Employer Flow with Age & "Other" Custom Profession
  console.log('\n[Test 24] Profile Creation - Employer Flow with Age & Custom Profession (Other)');
  const empEmail = `emp_user_${Date.now()}@example.com`;
  const empSignupRes = await request('POST', '/api/auth/signup', {
    email: empEmail,
    username: 'sharma_contractor',
    password: 'EmployerPassword123!',
    confirmPassword: 'EmployerPassword123!'
  });
  assert(empSignupRes.statusCode === 201, 'Creates new employer user (201 Created)');
  assert(empSignupRes.json?.user?.profile_completed === false, 'New employer user profile_completed is initially false');

  const empToken = empSignupRes.json.token;
  const saveEmpRes = await request('POST', '/api/user/profile', {
    user_type: 'employer',
    age: 38,
    profession: 'Other',
    custom_profession: 'Event Catering & Tent Services'
  }, { 'Authorization': `Bearer ${empToken}` });
  assert(saveEmpRes.statusCode === 200, 'Saves employer profile with custom profession & age (200 OK)');
  assert(saveEmpRes.json?.user?.profile_completed === true, 'Employer profile_completed is true');
  assert(saveEmpRes.json?.user?.age === 38, 'Employer age is 38');
  assert(saveEmpRes.json?.user?.profile?.age === 38, 'Employer profile.age is 38');
  assert(saveEmpRes.json?.user?.profile?.user_type === 'employer', 'User type is employer');
  assert(saveEmpRes.json?.user?.profile?.profession === 'Event Catering & Tent Services', 'Custom profession saved correctly');
  assert(saveEmpRes.json?.user?.role === 'employer', 'Role correctly mapped to employer');

  // 25. Persistence Check - Logout and Relogin checks age & profile_completed status
  console.log('\n[Test 25] Profile & Age Persistence across Future Logins');
  // Log out employer
  const empLogoutRes = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${empToken}`
  });
  assert(empLogoutRes.statusCode === 200, 'Employer logged out successfully (200 OK)');

  // Log back in
  const empReloginRes = await request('POST', '/api/auth/signin', {
    email: empEmail,
    username: 'sharma_contractor',
    password: 'EmployerPassword123!'
  });
  assert(empReloginRes.statusCode === 200, 'Employer logs back in successfully (200 OK)');
  assert(empReloginRes.json?.user?.profile_completed === true, 'profile_completed persists as true on future login');
  assert(empReloginRes.json?.user?.age === 38, 'Employer age 38 persists on future login');
  assert(empReloginRes.json?.user?.profile?.age === 38, 'Employer profile.age persists on future login');
  assert(empReloginRes.json?.user?.profile?.profession === 'Event Catering & Tent Services', 'Saved profession persists on future login');
  assert(empReloginRes.json?.user?.role === 'employer', 'Role persists as employer on future login');

  // Also check Job Seeker login persistence
  const seekerReloginRes = await request('POST', '/api/auth/signin', {
    email: profNewEmail,
    username: 'rohit_worker',
    password: 'WorkerPassword123!'
  });
  assert(seekerReloginRes.statusCode === 200, 'Job Seeker logs back in successfully (200 OK)');
  assert(seekerReloginRes.json?.user?.profile_completed === true, 'Job seeker profile_completed persists as true on future login');
  assert(seekerReloginRes.json?.user?.age === 26, 'Job seeker age 26 persists on future login');
  assert(seekerReloginRes.json?.user?.profile?.age === 26, 'Job seeker profile.age persists on future login');
  assert(seekerReloginRes.json?.user?.profile?.profession === 'Electrician', 'Job seeker profession persists as Electrician');
  assert(seekerReloginRes.json?.user?.role === 'worker', 'Job seeker role persists as worker');

  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
