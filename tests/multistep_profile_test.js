/**
 * DailyJob - Multi-Step Profile Creation System Test Suite
 * Validates Part 1 (Common Account Creation), Part 2 (Job Seeker 10 Steps),
 * and Part 3 (Employer 10 Steps) with real completion percentage calculations.
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

async function runMultiStepProfileTests() {
  console.log('\n======================================================');
  console.log('  DAILYJOB MULTI-STEP PROFILE CREATION TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // TEST 1: Common Account Creation (Job Seeker)
  // ---------------------------------------------------------------------------
  console.log('▶ [Test 1] Part 1: Common Account Creation - Job Seeker');
  const seekerEmail = `seeker_test_${Date.now()}@example.com`;
  const seekerMobile = '9876543210';
  const seekerName = 'Priya Sharma';
  const testPass = 'SecurePass123!';

  const signupRes = await request('POST', '/api/auth/signup', {
    fullName: seekerName,
    email: seekerEmail,
    mobileNumber: seekerMobile,
    password: testPass,
    confirmPassword: testPass,
    accountType: 'job_seeker'
  });

  assert(signupRes.statusCode === 201, 'Signup returns 201 Created');
  assert(signupRes.json?.user?.account_type === 'job_seeker', 'User account_type is job_seeker');
  assert(signupRes.json?.user?.mobile_number === seekerMobile, 'Mobile number properly stored');
  assert(signupRes.json?.user?.profile_completed === false, 'Profile starts as incomplete');
  const seekerToken = signupRes.json?.token;

  // ---------------------------------------------------------------------------
  // TEST 2: Part 2: Save 10-Step Job Seeker Profile
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Test 2] Part 2: Save 10-Step Job Seeker Profile');
  const seekerProfilePayload = {
    personal: {
      full_name: seekerName,
      profile_photo: 'https://example.com/photo.jpg',
      date_of_birth: '1998-05-15',
      age: 28,
      gender: 'Female',
      mobile_number: seekerMobile,
      email: seekerEmail,
      current_city: 'Bengaluru',
      current_state: 'Karnataka',
      country: 'India',
      preferred_language: 'English'
    },
    employment_status: {
      status: 'Working Professional',
      current_job_title: 'Software Developer',
      current_company: 'Tech Solutions',
      total_experience_years: '3',
      current_industry: 'Information Technology'
    },
    education: [
      {
        level: 'Undergraduate',
        degree: 'B.Tech in Computer Science',
        university: 'VTU Belagavi',
        graduation_year: '2020',
        status: 'Completed'
      }
    ],
    skills: [
      { name: 'JavaScript', category: 'Technical', level: 'Advanced' },
      { name: 'React', category: 'Technical', level: 'Intermediate' }
    ],
    has_experience: true,
    experience: [
      {
        job_title: 'Junior Engineer',
        company_name: 'Tech Solutions',
        employment_type: 'Full-time',
        start_date: '2021-01-01',
        end_date: '2024-01-01',
        is_current: true,
        location: 'Bengaluru'
      }
    ],
    preferences: {
      looking_for: ['Full-time'],
      preferred_roles: ['Frontend Developer', 'Full Stack Developer'],
      work_modes: ['Hybrid', 'Work from Home'],
      preferred_cities: ['Bengaluru'],
      expected_salary_min: 50000,
      expected_salary_max: 80000,
      is_salary_negotiable: true
    },
    languages: [
      { language: 'English', speaking_level: 'Fluent/Native', reading_level: 'Fluent/Native', writing_level: 'Fluent/Native' },
      { language: 'Hindi', speaking_level: 'Intermediate', reading_level: 'Intermediate', writing_level: 'Intermediate' }
    ],
    portfolio: {
      resume_url: 'https://example.com/resumes/priya_resume.pdf',
      linkedin_url: 'https://linkedin.com/in/priyasharma',
      github_url: 'https://github.com/priyasharma'
    },
    visibility: {
      visibility: 'public_employers',
      allow_contact: true
    }
  };

  const saveSeekerRes = await request('POST', '/api/user/profile/job-seeker', seekerProfilePayload, {
    'Authorization': `Bearer ${seekerToken}`
  });

  assert(saveSeekerRes.statusCode === 200, 'POST /api/user/profile/job-seeker returns 200 OK');
  assert(saveSeekerRes.json?.success === true, 'Response indicates success');
  assert(saveSeekerRes.json?.completion?.percentage >= 80, `Calculated completion percentage is high (${saveSeekerRes.json?.completion?.percentage}%)`);
  assert(saveSeekerRes.json?.completion?.is_ready_for_matching === true, 'Candidate is marked ready for matching');
  assert(saveSeekerRes.json?.user?.profile_completed === true, 'User profile_completed flag is now true');

  // ---------------------------------------------------------------------------
  // TEST 3: Fetch Job Seeker Profile & Deterministic Completion
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Test 3] Fetch Saved Job Seeker Profile & Completion');
  const getSeekerRes = await request('GET', '/api/user/profile/job-seeker', null, {
    'Authorization': `Bearer ${seekerToken}`
  });

  assert(getSeekerRes.statusCode === 200, 'GET /api/user/profile/job-seeker returns 200 OK');
  assert(getSeekerRes.json?.profile?.personal?.current_city === 'Bengaluru', 'Current city matches Bengaluru');
  assert(getSeekerRes.json?.completion?.percentage === saveSeekerRes.json?.completion?.percentage, 'Deterministic percentage matches');

  const getCompletionRes = await request('GET', '/api/user/profile/completion', null, {
    'Authorization': `Bearer ${seekerToken}`
  });
  assert(getCompletionRes.statusCode === 200, 'GET /api/user/profile/completion returns 200 OK');
  assert(getCompletionRes.json?.account_type === 'job_seeker', 'Account type is job_seeker in completion breakdown');

  // ---------------------------------------------------------------------------
  // TEST 4: Common Account Creation (Employer)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Test 4] Part 1: Common Account Creation - Employer');
  const employerEmail = `recruiter_test_${Date.now()}@example.com`;
  const employerMobile = '9123456789';
  const employerName = 'Rohan Verma';

  const empSignupRes = await request('POST', '/api/auth/signup', {
    fullName: employerName,
    email: employerEmail,
    mobileNumber: employerMobile,
    password: testPass,
    confirmPassword: testPass,
    accountType: 'employer'
  });

  assert(empSignupRes.statusCode === 201, 'Employer signup returns 201 Created');
  assert(empSignupRes.json?.user?.account_type === 'employer', 'User account_type is employer');
  assert(empSignupRes.json?.user?.role === 'employer', 'User role is employer');
  const empToken = empSignupRes.json?.token;

  // ---------------------------------------------------------------------------
  // TEST 5: Part 3: Save 10-Step Employer Profile & Verification Security
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Test 5] Part 3: Save 10-Step Employer Profile');
  const empProfilePayload = {
    business_type: 'Private Limited Company',
    business_info: {
      name: 'Apex Innovations Pvt Ltd',
      logo_url: 'https://example.com/logo.png',
      description: 'Leading software development enterprise.',
      industry: 'Information Technology',
      year_established: '2018',
      employee_count: '51–200'
    },
    location: {
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      address: 'Tower 4, Cyber City, Magarpatta',
      pincode: '411028',
      work_model: 'Hybrid'
    },
    recruiter_info: {
      name: employerName,
      job_title: 'Talent Acquisition Lead',
      official_email: employerEmail,
      mobile_number: employerMobile,
      preferred_contact_method: 'Email'
    },
    hiring_info: {
      hiring_types: ['Full-time', 'Internships'],
      categories: ['IT / Software Development', 'Product Design']
    },
    hiring_location: {
      cities: ['Pune', 'Bengaluru'],
      remote_hiring: true,
      hybrid_hiring: true,
      onsite_hiring: false
    },
    verification: {
      status: 'verified', // Malicious attempt to self-promote to 'verified'
      gstin: '27AAACA1234A1Z5',
      official_website: 'https://apexinnovations.com',
      official_email: employerEmail
    },
    company_profile: {
      description: 'Global tech products firm.',
      mission: 'Empower digital transformation.',
      website: 'https://apexinnovations.com',
      benefits: ['Health Insurance', 'Performance Bonus', 'Flexible Hours'],
      work_culture: 'Innovation first with great work-life balance.'
    },
    hiring_preferences: {
      candidate_experience: '1–3 years',
      preferred_education: ["Bachelor's Degree in CS/IT"],
      preferred_skills: ['JavaScript', 'Python', 'React'],
      salary_min: 40000,
      salary_max: 90000,
      discuss_during_hiring: true
    },
    visibility: {
      visibility: 'public',
      allow_contact: true
    }
  };

  const saveEmpRes = await request('POST', '/api/user/profile/employer', empProfilePayload, {
    'Authorization': `Bearer ${empToken}`
  });

  assert(saveEmpRes.statusCode === 200, 'POST /api/user/profile/employer returns 200 OK');
  assert(saveEmpRes.json?.success === true, 'Employer profile save reported success');
  assert(saveEmpRes.json?.profile?.verification?.status !== 'verified', 'Security check: Client cannot self-promote verification status to "verified"');
  assert(saveEmpRes.json?.completion?.percentage >= 80, `Calculated employer completion percentage is high (${saveEmpRes.json?.completion?.percentage}%)`);

  // ---------------------------------------------------------------------------
  // TEST 6: Fetch Employer Profile & Deterministic Completion
  // ---------------------------------------------------------------------------
  console.log('\n▶ [Test 6] Fetch Saved Employer Profile & Completion');
  const getEmpRes = await request('GET', '/api/user/profile/employer', null, {
    'Authorization': `Bearer ${empToken}`
  });

  assert(getEmpRes.statusCode === 200, 'GET /api/user/profile/employer returns 200 OK');
  assert(getEmpRes.json?.profile?.business_info?.name === 'Apex Innovations Pvt Ltd', 'Company name matches saved value');
  assert(getEmpRes.json?.completion?.is_ready_for_matching === true, 'Employer profile is ready for hiring');

  // Summary
  console.log('\n======================================================');
  console.log(`  MULTI-STEP PROFILE RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Execute tests
runMultiStepProfileTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
