/**
 * E2E Integration Test: DailyJob Profile Creation Flow
 * Simulates full frontend-to-backend journey:
 * 1. Sign Up -> Incomplete Profile (profile_completed: false)
 * 2. Page 1: User Type selection ("Rojgaar Lena Hai" vs "Rojgaar Dena Hai")
 * 3. Page 2: Profession selection ("Electrician", "Other" with custom input)
 * 4. Completion -> profile_completed = true, role mapped ('worker' / 'employer')
 * 5. Logout & Re-login -> Profile completion check (direct dashboard access, no repeat wizard)
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

    const reqHeaders = { ...headers };
    if (postData && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
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

async function runE2EProfileFlow() {
  console.log('\n================================================================');
  console.log('  DAILYJOB PROFILE CREATION FLOW - END-TO-END VERIFICATION');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // FLOW 1: JOB SEEKER (🟢 Rojgaar Lena Hai)
  // ---------------------------------------------------------------------------
  console.log('▶ [Flow 1] Job Seeker Registration & Profile Creation');
  const seekerEmail = `seeker_flow_${Date.now()}@example.com`;
  const seekerUser = 'suresh_electrician';
  const seekerPass = 'StrongPass123!';

  // Step 1: Create Account
  const signupRes = await request('POST', '/api/auth/signup', {
    email: seekerEmail,
    username: seekerUser,
    password: seekerPass,
    confirmPassword: seekerPass
  });

  assert(signupRes.statusCode === 201, 'Step 1: Account created successfully (201 Created)');
  assert(signupRes.json?.user?.profile_completed === false, 'Step 1: Profile is initially INCOMPLETE (profile_completed: false)');
  assert(signupRes.json?.user?.profile === null, 'Step 1: Profile object is null');
  const seekerToken = signupRes.json.token;

  // Step 2: Simulate Route Guard Check for incomplete profile
  // If user tries to access features, router redirects to #/create-profile
  const isProfileDoneInitially = signupRes.json?.user?.profile_completed === true;
  assert(!isProfileDoneInitially, 'Step 2: Route Guard intercepts incomplete profile -> redirects to #/create-profile');

  // Step 3: Page 1 - "Aap kya karna chahte hain?"
  // User selects "🟢 Rojgaar Lena Hai (Job Seeker)"
  const page1Selection = 'job_seeker';
  console.log(`  → Page 1: User selected "${page1Selection}" (🟢 Rojgaar Lena Hai)`);

  // Step 4: Page 2 - "Aapki umar kitni hai?" (Asked before profession)
  const page2Age = 26;
  console.log(`  → Page 2: User selected age "${page2Age}" वर्ष`);

  // Step 5: Page 3 - "Aap kis field me kaam karna chahte hain?"
  // User selects "Electrician"
  const page3Profession = 'Electrician';
  console.log(`  → Page 3: User selected profession "${page3Profession}"`);

  // Step 6: Click "Complete Profile"
  const completeProfileRes = await request('POST', '/api/user/profile', {
    user_type: page1Selection,
    age: page2Age,
    profession: page3Profession
  }, { 'Authorization': `Bearer ${seekerToken}` });

  assert(completeProfileRes.statusCode === 200, 'Step 6: Profile saved successfully (200 OK)');
  assert(completeProfileRes.json?.user?.profile_completed === true, 'Step 6: profile_completed is now TRUE');
  assert(completeProfileRes.json?.user?.age === page2Age, 'Step 6: Stored age is 26');
  assert(completeProfileRes.json?.user?.profile?.age === page2Age, 'Step 6: Stored profile.age is 26');
  assert(completeProfileRes.json?.user?.profile?.user_type === 'job_seeker', 'Step 6: Stored user_type is "job_seeker"');
  assert(completeProfileRes.json?.user?.profile?.profession === 'Electrician', 'Step 6: Stored profession is "Electrician"');
  assert(completeProfileRes.json?.user?.role === 'worker', 'Step 6: Role mapped to "worker" -> routes to #/worker dashboard');

  // Step 7: Logout
  const logoutRes = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${seekerToken}`
  });
  assert(logoutRes.statusCode === 200, 'Step 7: User logged out successfully');

  // Step 8: Subsequent Login - Check Profile & Age Completion
  const reloginRes = await request('POST', '/api/auth/signin', {
    email: seekerEmail,
    username: seekerUser,
    password: seekerPass
  });
  assert(reloginRes.statusCode === 200, 'Step 8: Existing user logs back in (200 OK)');
  assert(reloginRes.json?.user?.profile_completed === true, 'Step 8: profile_completed is TRUE on subsequent login');
  assert(reloginRes.json?.user?.age === page2Age, 'Step 8: Saved age persists on subsequent login');
  assert(reloginRes.json?.user?.profile?.age === page2Age, 'Step 8: Saved profile.age persists on subsequent login');
  assert(reloginRes.json?.user?.profile?.profession === 'Electrician', 'Step 8: Saved profession persists');
  assert(reloginRes.json?.user?.role === 'worker', 'Step 8: Role is "worker" -> directly opens #/worker (skips wizard)');

  // ---------------------------------------------------------------------------
  // FLOW 2: EMPLOYER (🔵 Rojgaar Dena Hai) with Age & "Other" Custom Profession
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Flow 2] Employer Registration & Custom Profession ("Other") Profile Creation');
  const empEmail = `emp_flow_${Date.now()}@example.com`;
  const empUser = 'vikram_builder';
  const empPass = 'StrongPass123!';

  // Step 1: Create Account
  const empSignupRes = await request('POST', '/api/auth/signup', {
    email: empEmail,
    username: empUser,
    password: empPass,
    confirmPassword: empPass
  });

  assert(empSignupRes.statusCode === 201, 'Step 1: Employer account created (201 Created)');
  assert(empSignupRes.json?.user?.profile_completed === false, 'Step 1: Employer profile initially incomplete');
  const empToken = empSignupRes.json.token;

  // Step 2: Page 1 - "Aap kya karna chahte hain?"
  // User selects "🔵 Rojgaar Dena Hai (Employer)"
  const empPage1Selection = 'employer';
  console.log(`  → Page 1: User selected "${empPage1Selection}" (🔵 Rojgaar Dena Hai)`);

  // Step 3: Page 2 - "Aapki umar kitni hai?"
  const empPage2Age = 35;
  console.log(`  → Page 2: Employer entered age "${empPage2Age}" वर्ष`);

  // Step 4: Page 3 - "Aap kis tarah ka kaam ya rozgaar dete hain?"
  // User selects "Other" and enters custom text
  const customWorkType = 'Solar Panel Installation & Roofing';
  console.log(`  → Page 3: User selected "Other" with custom text: "${customWorkType}"`);

  // Step 5: Click "Complete Profile"
  const empCompleteRes = await request('POST', '/api/user/profile', {
    user_type: empPage1Selection,
    age: empPage2Age,
    profession: 'Other',
    custom_profession: customWorkType
  }, { 'Authorization': `Bearer ${empToken}` });

  assert(empCompleteRes.statusCode === 200, 'Step 5: Employer profile saved (200 OK)');
  assert(empCompleteRes.json?.user?.profile_completed === true, 'Step 5: profile_completed is now TRUE');
  assert(empCompleteRes.json?.user?.age === empPage2Age, 'Step 5: Employer age is 35');
  assert(empCompleteRes.json?.user?.profile?.age === empPage2Age, 'Step 5: Employer profile.age is 35');
  assert(empCompleteRes.json?.user?.profile?.user_type === 'employer', 'Step 5: Stored user_type is "employer"');
  assert(empCompleteRes.json?.user?.profile?.profession === customWorkType, 'Step 5: Stored custom profession matches input');
  assert(empCompleteRes.json?.user?.role === 'employer', 'Step 5: Role mapped to "employer" -> routes to #/employer dashboard');

  // Step 6: Logout
  const empLogoutRes = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${empToken}`
  });
  assert(empLogoutRes.statusCode === 200, 'Step 6: Employer logged out');

  // Step 7: Subsequent Login - Check Profile Completion
  const empReloginRes = await request('POST', '/api/auth/signin', {
    email: empEmail,
    username: empUser,
    password: empPass
  });
  assert(empReloginRes.statusCode === 200, 'Step 7: Employer logs back in (200 OK)');
  assert(empReloginRes.json?.user?.profile_completed === true, 'Step 7: Employer profile_completed is TRUE on subsequent login');
  assert(empReloginRes.json?.user?.age === empPage2Age, 'Step 7: Employer age 35 persists');
  assert(empReloginRes.json?.user?.profile?.age === empPage2Age, 'Step 7: Employer profile.age persists');
  assert(empReloginRes.json?.user?.profile?.profession === customWorkType, 'Step 7: Custom profession persists');
  assert(empReloginRes.json?.user?.role === 'employer', 'Step 7: Role is "employer" -> directly opens #/employer (skips wizard)');

  // ---------------------------------------------------------------------------
  // FLOW 3: VALIDATION AND SECURITY CHECKS
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Flow 3] Input Validation & Gating Checks');
  const tempEmail = `temp_${Date.now()}@example.com`;
  const tempSignup = await request('POST', '/api/auth/signup', {
    email: tempEmail,
    username: 'temp_user',
    password: 'TempPassword123!',
    confirmPassword: 'TempPassword123!'
  });
  const tempToken = tempSignup.json.token;

  // Unauthenticated profile save
  const unauthRes = await request('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    profession: 'Plumber'
  });
  assert(unauthRes.statusCode === 401, 'Rejects unauthenticated profile save with 401 Unauthorized');

  // Invalid user_type
  const invalidTypeRes = await request('POST', '/api/user/profile', {
    user_type: 'hacker_role',
    profession: 'Plumber'
  }, { 'Authorization': `Bearer ${tempToken}` });
  assert(invalidTypeRes.statusCode === 400, 'Rejects invalid user_type with 400 Bad Request');

  // Missing profession
  const noProfRes = await request('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    profession: ''
  }, { 'Authorization': `Bearer ${tempToken}` });
  assert(noProfRes.statusCode === 400, 'Rejects empty profession with 400 Bad Request');

  // "Other" with empty custom_profession
  const emptyOtherRes = await request('POST', '/api/user/profile', {
    user_type: 'job_seeker',
    profession: 'Other',
    custom_profession: '   '
  }, { 'Authorization': `Bearer ${tempToken}` });
  assert(emptyOtherRes.statusCode === 400, 'Rejects "Other" without custom text with 400 Bad Request');

  console.log('\n================================================================');
  console.log(`  E2E TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runE2EProfileFlow().catch(err => {
  console.error('E2E Test execution failed:', err);
  process.exit(1);
});
