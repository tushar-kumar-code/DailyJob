/**
 * DailyJob - Smart Job Posting & Worker-Friendly Job Card Test Suite
 */

const assert = require('assert');
const http = require('http');
const { server } = require('../server');

const PORT = 8000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
let serverInstance = null;

function ensureServer() {
  return new Promise((resolve) => {
    const tester = http.get(BASE_URL, () => {
      resolve();
    });
    tester.on('error', () => {
      serverInstance = server.listen(PORT, '0.0.0.0', () => {
        setTimeout(resolve, 300);
      });
    });
  });
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(path, BASE_URL);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    let reqBody = null;
    if (body) {
      reqBody = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: reqHeaders
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

async function runSmartJobPostingTestSuite() {
  await ensureServer();
  console.log('\n======================================================');
  console.log('  DAILYJOB SMART JOB POSTING & WORKER CARD TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(msg) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  }

  function fail(msg, err) {
    console.error(`  ✗ FAIL: ${msg}`);
    if (err) console.error('    Error:', err.message || err);
    failed++;
  }

  try {
    // 1. Authenticate as an Employer
    const empEmail = `employer_post_${Date.now()}@example.com`;
    const signupRes = await request('POST', '/api/auth/signup', {
      fullName: 'Sharma Builders',
      username: 'sharma_builders',
      email: empEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      account_type: 'employer',
      role: 'employer',
      mobileNumber: '9876543210'
    });

    const empToken = signupRes.json?.token;
    assert(empToken, 'Employer signed up with auth token');
    pass('Employer authenticated successfully');

    // 2. Complete Employer Profile
    const profRes = await request('POST', '/api/user/profile/employer', {
      user_type: 'employer',
      profession: 'Construction & Masonry',
      age: 42,
      business_info: { name: 'Sharma Builders', industry: 'Construction' },
      location: { city: 'Bhilai', state: 'Chhattisgarh' }
    }, { 'Authorization': `Bearer ${empToken}` });
    assert(profRes.status === 200, 'Employer profile saved');
    pass('Employer profile completed with verified business identity');

    // 3. Test Unauthorized Worker Rejection
    const workerEmail = `worker_test_${Date.now()}@example.com`;
    const workerSignup = await request('POST', '/api/auth/signup', {
      fullName: 'Worker Rajesh',
      username: 'rajesh_worker',
      email: workerEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      account_type: 'job_seeker',
      role: 'worker'
    });
    const workerToken = workerSignup.json?.token;

    const workerPostAttempt = await request('POST', '/api/jobs', {
      tradeId: 'mason',
      wage: 800,
      workersNeeded: 2,
      city: 'Bhilai',
      locationName: 'Nehru Nagar'
    }, { 'Authorization': `Bearer ${workerToken}` });

    assert(workerPostAttempt.status === 403, 'Workers cannot create employer jobs');
    pass('Security check: Workers cannot create job postings (403 Forbidden)');

    // 4. Test Smart Job Creation: Custom Trade Title ("other")
    const customJobRes = await request('POST', '/api/jobs', {
      tradeId: 'other',
      customTradeTitle: 'सोलर पैनल तकनीशियन',
      wage: 950,
      wageUnit: 'day',
      workersNeeded: 4,
      city: 'Bhilai',
      locationName: 'सेक्टर 7',
      landmark: 'मेन मार्केट के पास',
      startDate: '15 अक्टूबर',
      durationDays: 3,
      durationText: '3 दिन का काम',
      assignmentType: 'temporary',
      timeSlot: '9:00 AM – 5:00 PM',
      breakIncluded: '1 घंटे का लंच ब्रेक शामिल है',
      toolsResponsibility: 'employer',
      foodProvided: 'दोपहर का खाना व चाय उपलब्ध',
      travelProvided: 'किराया उपलब्ध',
      safetyEquipment: 'सुरक्षा बेल्ट व दस्ताने अनिवार्य',
      paymentTiming: 'daily_end',
      paymentTerms: 'Cash or UPI दोनों चलेगा',
      estimatedTotal: 11400,
      description: 'छत पर सोलर पैनल का फ्रेम जोड़ना और 12 पैनल की माउंटिंग व वायरिंग करना।'
    }, { 'Authorization': `Bearer ${empToken}` });

    assert(customJobRes.status === 201, 'Custom job created successfully');
    const createdJob = customJobRes.json?.job || customJobRes.json;
    assert(createdJob.customTradeTitle === 'सोलर पैनल तकनीशियन', 'Custom title preserved');
    assert(createdJob.titleHi.includes('सोलर पैनल तकनीशियन'), 'Hindi title reflects custom trade');
    assert(createdJob.wage === 950, 'Wage is 950');
    assert(createdJob.wageUnit === 'day', 'Wage unit is day');
    assert(createdJob.workersNeeded === 4, 'Workers needed is 4');
    assert(createdJob.landmark === 'मेन मार्केट के पास', 'Landmark is preserved');
    assert(createdJob.durationDays === 3, 'Duration days preserved');
    assert(createdJob.toolsResponsibility === 'employer', 'Tools responsibility preserved');
    assert(createdJob.foodProvided === 'दोपहर का खाना व चाय उपलब्ध', 'Food provision preserved');
    assert(createdJob.descriptionHi.includes('सोलर पैनल का फ्रेम जोड़ना'), 'Work description preserved');
    pass('Smart Job Posting: Custom trade, duration, landmark & facilities stored accurately');

    // 5. Test Wage Units: Hour, Week, Month, Task
    const monthlyJobRes = await request('POST', '/api/jobs', {
      tradeId: 'driving',
      wage: 18000,
      wageUnit: 'month',
      workersNeeded: 1,
      city: 'Raipur',
      locationName: 'शंकर नगर',
      assignmentType: 'ongoing',
      timeSlot: '9:00 AM – 6:00 PM',
      paymentTiming: 'monthly',
      description: 'ऑफिस और परिवार के लिए नियमित कार ड्राइविंग।'
    }, { 'Authorization': `Bearer ${empToken}` });

    assert(monthlyJobRes.status === 201, 'Monthly job created successfully');
    const monthlyJob = monthlyJobRes.json?.job || monthlyJobRes.json;
    assert(monthlyJob.wageUnit === 'month', 'Wage unit month preserved');
    assert(monthlyJob.wage === 18000, 'Monthly wage 18000 preserved');
    pass('Smart Job Posting: Non-daily wage unit (month) saved and preserved without forcing daily');

    // 5b. Test Fully Flexible Fields: Arbitrary Calendar Date, Custom Wage Unit, Custom Title on Standard Trade, Custom City & Custom Hours
    const flexibleJobRes = await request('POST', '/api/jobs', {
      tradeId: 'plumber',
      customTradeTitle: 'सेनेटरी व वाटर टैंक फिटिंग मास्टर',
      wage: 1200,
      wageUnit: 'प्रति वर्ग फुट (sqft)',
      workersNeeded: 6,
      city: 'जगदलपुर',
      locationName: 'धरमपुरा',
      landmark: 'कृषि उपज मंडी के पीछे',
      startDate: '2026-11-15',
      durationDays: 14,
      durationText: '2 हफ्ते का प्रोजेक्ट',
      assignmentType: 'custom',
      timeSlot: '7:00 AM – 1:00 PM (हाफ डे मॉर्निंग)',
      breakIncluded: '30 मिनट का चाय-नाश्ता ब्रेक',
      toolsResponsibility: 'both',
      toolsProvided: 'भारी पाइप रेंच हम देंगे, बाकी टूल्स कामगार लाएगा',
      foodProvided: '₹80 प्रतिदिन भोजन भत्ता अलग से',
      travelProvided: '₹50 पेट्रोल खर्च उपलब्ध',
      safetyEquipment: 'सुरक्षा जूते व ग्लव्स अनिवार्य',
      paymentTiming: 'custom',
      paymentTerms: 'हर शनिवार को 50% काम के अनुपात में कैश/UPI भुगतान',
      description: 'नए हॉस्टल में 12 कमरों और 6 टॉयलेट्स की पूरी सेनेटरी फिटिंग और वाटर टैंक कनेक्शन।'
    }, { 'Authorization': `Bearer ${empToken}` });

    assert(flexibleJobRes.status === 201, 'Flexible custom job created successfully');
    const flexJob = flexibleJobRes.json?.job || flexibleJobRes.json;
    assert(flexJob.customTradeTitle === 'सेनेटरी व वाटर टैंक फिटिंग मास्टर', 'Custom title for standard trade preserved');
    assert(flexJob.startDate === '2026-11-15', 'Arbitrary calendar date preserved');
    assert(flexJob.wageUnit === 'प्रति वर्ग फुट (sqft)', 'Custom wage unit preserved');
    assert(flexJob.city === 'जगदलपुर', 'Custom city preserved');
    assert(flexJob.timeSlot.includes('7:00 AM'), 'Custom hours preserved');
    assert(flexJob.toolsProvided.includes('पाइप रेंच'), 'Custom tools notes preserved');
    assert(flexJob.foodProvided.includes('भोजन भत्ता'), 'Custom food notes preserved');
    assert(flexJob.travelProvided.includes('पेट्रोल खर्च'), 'Custom travel notes preserved');
    assert(flexJob.safetyEquipment.includes('ग्लव्स'), 'Custom safety notes preserved');
    assert(flexJob.paymentTerms.includes('हर शनिवार'), 'Custom payment terms preserved');
    pass('Flexibility Verification: Arbitrary calendar date, custom wage unit, custom trade title, custom city & schedule all saved 100% accurately');

    // 6. Test Worker Retrieval: Job appears in public jobs list
    const listRes = await request('GET', '/api/jobs');
    assert(listRes.status === 200, 'Jobs list fetched');
    const allJobs = listRes.json;
    const foundCustom = allJobs.find(j => j.id === createdJob.id);
    assert(foundCustom, 'Created custom job is present in active job listings');
    assert(foundCustom.wage === 950, 'Wage retrieved accurately');
    assert(foundCustom.landmark === 'मेन मार्केट के पास', 'Landmark retrieved accurately');
    pass('Worker Job Card: Saved job retrieved by workers with 100% real data');

    // 7. Test Single Job Details Specification
    const detailRes = await request('GET', `/api/jobs/${createdJob.id}`);
    assert(detailRes.status === 200, 'Job details retrieved');
    const jobDetail = detailRes.json?.job || detailRes.json;
    assert(jobDetail.toolsResponsibility === 'employer', 'Tools responsibility is employer');
    assert(jobDetail.foodProvided === 'दोपहर का खाना व चाय उपलब्ध', 'Food is provided');
    assert(jobDetail.travelProvided === 'किराया उपलब्ध', 'Travel is provided');
    assert(jobDetail.safetyProvided.includes('सुरक्षा बेल्ट') || jobDetail.safetyEquipment.includes('सुरक्षा बेल्ट'), 'Safety equipment verified');
    pass('Job Details Page: All structured fields (tools, food, travel, safety) verified');

    // 8. Test Modification Authorization (IDOR Protection)
    const patchRes = await request('PATCH', `/api/jobs/${createdJob.id}`, {
      wage: 1000
    }, { 'Authorization': `Bearer ${empToken}` });
    assert(patchRes.status === 200, 'Job owner can modify wage');
    assert(patchRes.json.wage === 1000, 'Updated wage is 1000');
    pass('Authorization: Job owner can update their own job');

    const unauthorizedPatch = await request('PATCH', `/api/jobs/${createdJob.id}`, {
      wage: 2000
    }, { 'Authorization': `Bearer ${workerToken}` });
    assert(unauthorizedPatch.status === 403 || unauthorizedPatch.status === 404, 'Unauthorized user cannot modify job');
    pass('Authorization: Another user cannot modify employer job (403/404 Protected)');

  } catch (err) {
    fail('Smart job posting test suite exception', err);
  } finally {
    try {
      const fs = require('fs');
      const path = require('path');
      const usersFile = path.join(__dirname, '..', 'data', 'users.json');
      if (fs.existsSync(usersFile)) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        const cleaned = users.filter(u => !u.email?.includes('employer_post_') && !u.email?.includes('worker_test_'));
        fs.writeFileSync(usersFile, JSON.stringify(cleaned, null, 2), 'utf8');
      }
    } catch (_) {}
  }

  console.log('\n======================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (serverInstance) serverInstance.close();
  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runSmartJobPostingTestSuite().catch(err => {
  console.error('Fatal error:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
