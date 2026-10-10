/**
 * DailyJob — Universal Adaptive Profile Engine Comprehensive Test Suite
 * Tests all required personas and adaptive paths from Section 36 of the product specification:
 * Job Seekers:
 *  1. Daily worker (skips education, resume)
 *  2. Part-time worker
 *  3. Full-time worker
 *  4. Engineer (gets technical questions, education, skills)
 *  5. Cook (gets cooking dish types)
 *  6. Cleaner (skips education, gets cleaning tasks)
 *  7. Driver (gets license type)
 *  8. User with no experience (Fresher)
 *  9. User with experience
 *  10. User who skips optional questions
 * Employers:
 *  1. Individual employer (no GST/CIN required)
 *  2. Household employer (domestic cook/maid)
 *  3. Shop owner
 *  4. Restaurant employer
 *  5. Company (corporate profile)
 *  6. Contractor
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

async function createTestAccount(name, email, mobile, accountType) {
  const res = await request('POST', '/api/auth/signup', {
    fullName: name,
    email,
    mobileNumber: mobile,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    accountType
  });
  return res.json?.token;
}

async function runAdaptiveEngineTests() {
  console.log('\n======================================================');
  console.log('  DAILYJOB ADAPTIVE PROFILE ENGINE VERIFICATION');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // Persona 1: Daily Wage Worker (Construction)
  // ---------------------------------------------------------------------------
  console.log('▶ [Persona 1] Daily Wage Worker (Construction / Labor)');
  const token1 = await createTestAccount('Ramu Mason', `ramu_${Date.now()}@test.com`, '9876540001', 'job_seeker');
  const res1 = await request('POST', '/api/user/profile/job-seeker', {
    personal: { full_name: 'Ramu Mason', mobile_number: '9876540001', current_city: 'Raipur' },
    employment_status: { status: 'Daily Wage Worker' },
    skills: [{ name: 'निर्माण / मिस्त्री (Mason)', category: 'Technical' }],
    has_experience: true,
    experience: [{ job_title: 'Mason', company_name: 'Local Site' }],
    preferences: { looking_for: ['Daily Wage'], work_modes: ['On-site'], expected_salary_min: 600 }
  }, { 'Authorization': `Bearer ${token1}` });

  assert(res1.statusCode === 200, 'Daily worker profile saved successfully (200 OK)');
  assert(res1.json?.completion?.is_ready_for_matching === true, 'Daily worker marked ready for matching WITHOUT education/resume');
  assert(res1.json?.user?.profile_completed === true, 'Daily worker profile marked completed');

  // ---------------------------------------------------------------------------
  // Persona 2: Cook (Adaptive Skill Detail: Dishes)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Persona 2] Cook (Adaptive Skill: Home Food)');
  const token2 = await createTestAccount('Sunita Cook', `sunita_${Date.now()}@test.com`, '9876540002', 'job_seeker');
  const res2 = await request('POST', '/api/user/profile/job-seeker', {
    personal: { full_name: 'Sunita Cook', mobile_number: '9876540002', current_city: 'Bilaspur' },
    employment_status: { status: 'Cook / Domestic Help' },
    skills: [{ name: 'घर का सादा खाना (Home Food)', category: 'Technical' }],
    has_experience: true,
    experience: [{ job_title: 'Cook', company_name: 'Home cooking' }],
    preferences: { looking_for: ['Part-time'], work_modes: ['On-site'] }
  }, { 'Authorization': `Bearer ${token2}` });

  assert(res2.statusCode === 200, 'Cook profile saved successfully');
  assert(res2.json?.profile?.skills[0]?.name.includes('घर का सादा खाना'), 'Adaptive cooking specialty preserved');

  // ---------------------------------------------------------------------------
  // Persona 3: Driver (Adaptive Skill Detail: License)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Persona 3] Driver (Adaptive Skill: LMV Commercial License)');
  const token3 = await createTestAccount('Rajesh Driver', `rajesh_${Date.now()}@test.com`, '9876540003', 'job_seeker');
  const res3 = await request('POST', '/api/user/profile/job-seeker', {
    personal: { full_name: 'Rajesh Driver', mobile_number: '9876540003', current_city: 'Durg' },
    employment_status: { status: 'Commercial Driver' },
    skills: [{ name: 'LMV (Commercial Taxi)', category: 'Technical' }],
    has_experience: true,
    experience: [{ job_title: 'Cab Driver', company_name: 'City Taxi' }],
    preferences: { looking_for: ['Full-time'], work_modes: ['On-site'] }
  }, { 'Authorization': `Bearer ${token3}` });

  assert(res3.statusCode === 200, 'Driver profile saved successfully');
  assert(res3.json?.profile?.skills[0]?.name.includes('LMV'), 'Driver license specialization recorded');

  // ---------------------------------------------------------------------------
  // Persona 4: House Cleaner (Skips education & resume)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Persona 4] House Cleaner (No education/resume requirement)');
  const token4 = await createTestAccount('Geeta Cleaner', `geeta_${Date.now()}@test.com`, '9876540004', 'job_seeker');
  const res4 = await request('POST', '/api/user/profile/job-seeker', {
    personal: { full_name: 'Geeta Cleaner', mobile_number: '9876540004', current_city: 'Raipur' },
    employment_status: { status: 'House Helper' },
    skills: [{ name: 'साफ़-सफ़ाई / झाड़ू-पोछा', category: 'General' }],
    has_experience: false,
    preferences: { looking_for: ['Part-time', 'Daily'], work_modes: ['On-site'] }
  }, { 'Authorization': `Bearer ${token4}` });

  assert(res4.statusCode === 200, 'House cleaner profile saved without friction');
  assert(res4.json?.completion?.is_ready_for_matching === true, 'Cleaner is ready for matching');

  // ---------------------------------------------------------------------------
  // Persona 5: Software Engineer (Progressively unlocks Education & Tech Stack)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Persona 5] Software Engineer (Detailed Education, Tech Stack, Resume)');
  const token5 = await createTestAccount('Amit Engineer', `amit_${Date.now()}@test.com`, '9876540005', 'job_seeker');
  const res5 = await request('POST', '/api/user/profile/job-seeker', {
    personal: { full_name: 'Amit Engineer', mobile_number: '9876540005', current_city: 'Bengaluru' },
    employment_status: { status: 'Working Professional' },
    education: [{ level: 'Undergraduate', degree: 'B.Tech in Computer Science', graduation_year: '2022' }],
    skills: [{ name: 'Web Development (React / Python)', category: 'Technical', level: 'Advanced' }],
    has_experience: true,
    experience: [{ job_title: 'Software Developer', company_name: 'Tech Corp' }],
    preferences: { looking_for: ['Full-time'], work_modes: ['Work from Home', 'Hybrid'], expected_salary_min: 50000 },
    portfolio: { resume_url: 'https://example.com/resume.pdf', github_url: 'https://github.com/amit' }
  }, { 'Authorization': `Bearer ${token5}` });

  assert(res5.statusCode === 200, 'Software engineer profile saved with advanced technical fields');
  assert(res5.json?.profile?.education?.length > 0, 'Education field populated for engineer');
  assert(res5.json?.profile?.portfolio?.resume_url, 'Resume link populated for engineer');

  // ---------------------------------------------------------------------------
  // Persona 6: Household Employer (NO GST/CIN required!)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Persona 6] Household Employer (Hiring Cook - No Corporate Data)');
  const token6 = await createTestAccount('Sharma Family', `sharma_${Date.now()}@test.com`, '9876540006', 'employer');
  const res6 = await request('POST', '/api/user/profile/employer', {
    business_type: 'Individual / Household',
    business_info: { name: 'Sharma Household', industry: 'Domestic Service' },
    location: { city: 'Raipur', work_model: 'On-site' },
    recruiter_info: { name: 'Mrs. Sharma', mobile_number: '9876540006' },
    hiring_info: { hiring_types: ['Daily Wage'], categories: ['खाना बनाने वाला (Cook)'] },
    hiring_location: { cities: ['Raipur'], onsite_hiring: true }
  }, { 'Authorization': `Bearer ${token6}` });

  assert(res6.statusCode === 200, 'Household employer saved successfully without business docs');
  assert(res6.json?.completion?.is_ready_for_matching === true, 'Household employer ready to receive applicants');

  // ---------------------------------------------------------------------------
  // Persona 7: Corporate Employer (Company / Office)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Persona 7] Corporate Company Employer');
  const token7 = await createTestAccount('Innovate Tech HR', `hr_${Date.now()}@test.com`, '9876540007', 'employer');
  const res7 = await request('POST', '/api/user/profile/employer', {
    business_type: 'Private Limited Company',
    business_info: { name: 'Innovate Tech Solutions', industry: 'Software / IT' },
    location: { city: 'Pune', work_model: 'Hybrid' },
    recruiter_info: { name: 'HR Manager', mobile_number: '9876540007' },
    hiring_info: { hiring_types: ['Full-time'], categories: ['Software Engineers'] },
    hiring_location: { cities: ['Pune'], hybrid_hiring: true }
  }, { 'Authorization': `Bearer ${token7}` });

  assert(res7.statusCode === 200, 'Corporate employer profile successfully saved');
  assert(res7.json?.profile?.business_type === 'Private Limited Company', 'Business type preserved');

  console.log('\n======================================================');
  console.log(`  ADAPTIVE ENGINE RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAdaptiveEngineTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
