/**
 * CGNeeti / कामसाथी - Employer Home Dashboard
 * Supports:
 * 1. Showing all types of workers when employer has not posted a job.
 * 2. When employer has posted a job, strictly showing ONLY matched workers
 *    (those who applied for that job, or whose trade/skills match that work or similar work).
 * 3. Provides clean toggles, category filters, direct call & hire actions.
 */

// Global filtering state for Employer Dashboard
window._employerHomeFilterMode = window._employerHomeFilterMode || 'matched'; // 'matched' | 'all'
window._employerSelectedTrade = window._employerSelectedTrade || 'all';
window._employerSelectedJobId = window._employerSelectedJobId || null;

/**
 * Checks whether a worker matches a specific job
 * 1. Worker submitted direct application for this job
 * 2. Worker tradeId strictly matches job tradeId
 * 3. Worker skills, trade name, or experience matches job trade or similar work
 */
function isWorkerMatchedToJob(worker, job, applications = []) {
  if (!worker || !job) return false;

  // 1. Direct applicant check
  const hasApplied = applications.some(a =>
    a &&
    String(a.jobId) === String(job.id) &&
    (String(a.workerId) === String(worker.id) || (a.workerName && a.workerName === worker.name))
  );
  if (hasApplied) return true;

  // 2. Exact tradeId match
  const workerTrade = (worker.tradeId || '').toLowerCase();
  const jobTrade = (job.tradeId || '').toLowerCase();
  if (workerTrade && jobTrade && workerTrade === jobTrade) return true;

  // 3. Similar work / synonymous trade text matching
  const jobText = `${job.tradeId || ''} ${job.titleHi || ''} ${job.titleEn || ''} ${job.description || ''}`.toLowerCase();
  const workerSkills = (worker.skills || []).map(s => (s.name || s)).join(' ');
  const workerExp = (worker.experience || []).map(e => e.job_title || '').join(' ');
  const workerText = `${worker.tradeId || ''} ${worker.primaryTrade || ''} ${worker.profession || ''} ${workerSkills} ${workerExp}`.toLowerCase();

  // Helper / Labour / Construction / Safai / Hamal / Loading
  const isJobHelper = jobTrade === 'helper' || jobTrade === 'cleaning' || jobTrade === 'loader' ||
                      jobText.includes('मजदूर') || jobText.includes('हेल्पर') || jobText.includes('सफ़ाई') ||
                      jobText.includes('सफाई') || jobText.includes('लेबर') || jobText.includes('निर्माण') ||
                      jobText.includes('construction') || jobText.includes('helper') || jobText.includes('labour');
  const isWorkerHelper = workerTrade === 'helper' || workerTrade === 'cleaning' || workerTrade === 'loader' ||
                         workerText.includes('मजदूर') || workerText.includes('हेल्पर') || workerText.includes('सफ़ाई') ||
                         workerText.includes('सफाई') || workerText.includes('लेबर');
  if (isJobHelper && isWorkerHelper) return true;

  // Cooking / Chef / Kitchen
  const isJobCook = jobTrade === 'cooking' || jobText.includes('खाना') || jobText.includes('कुक') ||
                    jobText.includes('रसोई') || jobText.includes('शेफ') || jobText.includes('cook');
  const isWorkerCook = workerTrade === 'cooking' || workerText.includes('खाना') || workerText.includes('कुक') ||
                       workerText.includes('रसोई') || workerText.includes('शेफ') || workerText.includes('cook');
  if (isJobCook && isWorkerCook) return true;

  // Electrician / Wiring
  const isJobElec = jobTrade === 'electrician' || jobText.includes('बिजली') || jobText.includes('इलेक्ट्रीशियन') ||
                    jobText.includes('वायरिंग') || jobText.includes('electric');
  const isWorkerElec = workerTrade === 'electrician' || workerText.includes('बिजली') || workerText.includes('इलेक्ट्रीशियन') ||
                       workerText.includes('वायरिंग') || workerText.includes('electric');
  if (isJobElec && isWorkerElec) return true;

  // Plumber / Pipe / Sanitary
  const isJobPlumb = jobTrade === 'plumber' || jobText.includes('नल') || jobText.includes('प्लंबर') ||
                     jobText.includes('पाइप') || jobText.includes('plumb');
  const isWorkerPlumb = workerTrade === 'plumber' || workerText.includes('नल') || workerText.includes('प्लंबर') ||
                        workerText.includes('पाइप') || workerText.includes('plumb');
  if (isJobPlumb && isWorkerPlumb) return true;

  // Mason / Brickwork / Plaster / Tiles
  const isJobMason = jobTrade === 'mason' || jobText.includes('मिस्त्री') || jobText.includes('राजमिस्त्री') ||
                     jobText.includes('ईंट') || jobText.includes('टाइल्स') || jobText.includes('mason');
  const isWorkerMason = workerTrade === 'mason' || workerText.includes('मिस्त्री') || workerText.includes('राजमिस्त्री') ||
                        workerText.includes('ईंट') || workerText.includes('टाइल्स') || workerText.includes('mason');
  if (isJobMason && isWorkerMason) return true;

  // Driver / Transport
  const isJobDriver = jobTrade === 'driving' || jobText.includes('ड्राइव') || jobText.includes('गाड़ी') ||
                      jobText.includes('चालक') || jobText.includes('driv');
  const isWorkerDriver = workerTrade === 'driving' || workerText.includes('ड्राइव') || workerText.includes('गाड़ी') ||
                         workerText.includes('चालक') || workerText.includes('driv');
  if (isJobDriver && isWorkerDriver) return true;

  // Painter / Color
  const isJobPainter = jobTrade === 'painter' || jobText.includes('पेंट') || jobText.includes('रंग') ||
                       jobText.includes('paint');
  const isWorkerPainter = workerTrade === 'painter' || workerText.includes('पेंट') || workerText.includes('रंग') ||
                          workerText.includes('paint');
  if (isJobPainter && isWorkerPainter) return true;

  // Carpenter / Wood
  const isJobCarp = jobTrade === 'carpenter' || jobText.includes('बढ़ई') || jobText.includes('लकड़ी') ||
                    jobText.includes('carpent');
  const isWorkerCarp = workerTrade === 'carpenter' || workerText.includes('बढ़ई') || workerText.includes('लकड़ी') ||
                       workerText.includes('carpent');
  if (isJobCarp && isWorkerCarp) return true;

  // Welder
  const isJobWelder = jobTrade === 'welder' || jobText.includes('वेल्डर') || jobText.includes('weld');
  const isWorkerWelder = workerTrade === 'welder' || workerText.includes('वेल्डर') || workerText.includes('weld');
  if (isJobWelder && isWorkerWelder) return true;

  return false;
}

async function renderEmployerHomeView() {
  const employer = (await appState.getEmployerProfile()) || {};
  const employerId = employer.id || appState.currentUserId;
  const activeJobIds = employer.activeJobIds || [];
  const employerJobs = await appState.getEmployerJobs();

  const employerName = employer.name || employer.username || 'User';
  const employerBusiness = employer.businessType || employer.industry || 'Employer';

  // Fetch all real verified workers
  const allWorkers = (await appState.getWorkers()) || [];
  const applications = appState.applications || [];

  // Determine active selected job
  let selectedJob = null;
  if (employerJobs.length > 0) {
    if (window._employerSelectedJobId) {
      selectedJob = employerJobs.find(j => j.id === window._employerSelectedJobId) || employerJobs[0];
    } else {
      selectedJob = employerJobs[0];
      window._employerSelectedJobId = selectedJob.id;
    }
  }

  // Filter mode logic:
  // - If employer has NO jobs: filterMode is always 'all'
  // - If employer HAS jobs: filterMode defaults to 'matched', showing strictly matched workers
  const hasJobs = employerJobs.length > 0;
  const currentMode = hasJobs ? (window._employerHomeFilterMode || 'matched') : 'all';

  // Compute matched workers for the selected job
  const matchedWorkers = hasJobs && selectedJob
    ? allWorkers.filter(w => isWorkerMatchedToJob(w, selectedJob, applications))
    : [];

  // Workers to display
  let displayedWorkers = [];
  if (hasJobs && currentMode === 'matched') {
    displayedWorkers = matchedWorkers;
  } else {
    // Browsing all categories
    const selectedTrade = window._employerSelectedTrade || 'all';
    if (selectedTrade === 'all') {
      displayedWorkers = allWorkers;
    } else {
      displayedWorkers = allWorkers.filter(w => w.tradeId === selectedTrade);
    }
  }

  // Trade category definitions for browsing
  const tradePills = [
    { id: 'all', label: 'सभी', icon: '🌐' },
    { id: 'cooking', label: 'कुक / खाना', icon: '🍳' },
    { id: 'electrician', label: 'इलेक्ट्रीशियन', icon: '⚡' },
    { id: 'plumber', label: 'प्लंबर', icon: '🚰' },
    { id: 'mason', label: 'राजमिस्त्री', icon: '🧱' },
    { id: 'driving', label: 'ड्राइवर', icon: '🚗' },
    { id: 'painter', label: 'पेंटर', icon: '🎨' },
    { id: 'helper', label: 'मजदूर / हेल्पर', icon: '👷' },
    { id: 'cleaning', label: 'सफ़ाई', icon: '🧹' }
  ];

  return `
    <div class="employer-home-page" style="max-width: 680px; margin: 0 auto; padding-bottom: 3rem;">
      <!-- Greeting Header -->
      <div class="mb-3 pt-1">
        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0;">
          नमस्ते ${escapeHTML(employerName)} 👋
        </h1>
        <div class="mt-1 flex items-center gap-2 flex-wrap">
          <span class="badge badge-primary font-bold">🏢 ${escapeHTML(employerBusiness)}</span>
          <span class="badge badge-success font-bold">🟢 Verified Employer</span>
        </div>
      </div>

      <!-- Quick Action Card -->
      <section class="card mb-4" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #93c5fd; border-radius: var(--radius-xl); padding: 1.25rem 1.5rem; text-align: center;">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary-dark); margin-bottom: 0.75rem;">
          ${hasJobs ? '🎯 कामगारों की आवश्यकता?' : 'आपको कामगार चाहिए?'}
        </h2>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          ${hasJobs ? `
            <button class="btn btn-primary btn-block flex-1" onclick="window.location.hash='#/applicants/${selectedJob.id}'" style="font-size: 1.05rem; font-weight: 800; min-height: 48px; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);">
              👥 "${escapeHTML(selectedJob.titleHi || selectedJob.titleEn)}" के आवेदक देखें
            </button>
            <button class="btn btn-outline flex-1" onclick="window.location.hash='#/post-job'" style="font-size: 1.05rem; font-weight: 700; min-height: 48px; border-radius: var(--radius-full); background: #ffffff;">
              + नया काम डालें
            </button>
          ` : `
            <button class="btn btn-primary btn-lg btn-block" onclick="window.location.hash='#/post-job'" style="font-size: 1.2rem; font-weight: 800; min-height: 52px; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);">
              ➕ नया काम डालें (Post Job)
            </button>
          `}
        </div>
      </section>

      <!-- Section: Employer's Active Jobs -->
      <section class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            आपके सक्रिय काम (${employerJobs.length})
          </h2>
          <button class="btn btn-ghost btn-sm text-primary-color font-bold" onclick="window.location.hash='#/post-job'">
            + नया काम
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${employerJobs.length > 0 ? employerJobs.map(job => renderEmployerSimpleJobCard(job, job.id === selectedJob?.id)).join('') : `
            <div class="card p-3 text-center" style="border-radius: var(--radius-lg); background: #f8fafc; border: 1px dashed #cbd5e1;">
              <p class="text-secondary mb-2" style="font-size: 0.9rem; margin: 0 0 0.5rem 0;">
                अभी आपका कोई सक्रिय काम पोस्ट नहीं है। नीचे सभी कामगारों की सूची देखें या नया काम डालें।
              </p>
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/post-job'" style="border-radius: var(--radius-full); font-weight: 700;">
                + काम डालें (Post Job)
              </button>
            </div>
          `}
        </div>
      </section>

      <!-- ---------------------------------------------------------------- -->
      <!-- CORE WORKER DIRECTORY / MATCHED WORKERS SECTION                 -->
      <!-- ---------------------------------------------------------------- -->
      <section class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.25rem; border: 2px solid ${hasJobs && currentMode === 'matched' ? '#86efac' : 'var(--border-subtle)'}; background: var(--bg-surface);">
        <!-- Section Header with Mode Badge -->
        <div class="flex justify-between items-start gap-2 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                ${hasJobs && currentMode === 'matched'
                  ? `🎯 काम के अनुसार कामगार (${displayedWorkers.length})`
                  : `👷 उपलब्ध कामगार (${displayedWorkers.length})`}
              </h2>
              ${hasJobs && currentMode === 'matched' ? `
                <span class="badge badge-success font-bold" style="font-size: 0.75rem;">
                  ✓ ऑटो-मैचिंग सक्रिय
                </span>
              ` : `
                <span class="badge badge-primary font-bold" style="font-size: 0.75rem;">
                  🌐 सभी श्रेणियां
                </span>
              `}
            </div>

            <p class="text-secondary mt-1 mb-0" style="font-size: 0.85rem;">
              ${hasJobs && currentMode === 'matched'
                ? `✨ केवल वही कामगार दिख रहे हैं जो <strong>"${escapeHTML(selectedJob?.titleHi || selectedJob?.titleEn)}"</strong> या इसके समान काम की रिक्वेस्ट डाले हैं।`
                : `सत्यापित कामगार उपलब्ध हैं। आप सीधे कॉल कर सकते हैं या काम पर रख सकते हैं।`}
            </p>
          </div>
        </div>

        ${hasJobs ? `
          <!-- Job Selector & Matching Toggle Bar -->
          <div style="background: #f1f5f9; border-radius: var(--radius-lg); padding: 0.75rem; margin-bottom: 1rem;">
            <!-- If employer has multiple jobs, show job pills -->
            ${employerJobs.length > 1 ? `
              <div class="mb-2">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.35rem;">
                  सक्रिय काम चुनें:
                </span>
                <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 4px;">
                  ${employerJobs.map(j => `
                    <button
                      class="btn btn-sm ${j.id === selectedJob?.id ? 'btn-primary' : 'btn-outline'}"
                      onclick="window.switchEmployerActiveJob('${j.id}')"
                      style="border-radius: var(--radius-full); white-space: nowrap; font-size: 0.82rem; font-weight: 700;">
                      ${escapeHTML(j.titleHi || j.titleEn)}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Mode Toggle Switch: [🎯 केवल मैचिंग कामगार | 🌐 सभी कामगार देखें] -->
            <div style="display: flex; gap: 0.5rem;">
              <button
                class="btn btn-sm flex-1 ${currentMode === 'matched' ? 'btn-primary' : 'btn-outline'}"
                onclick="window.setEmployerWorkerFilterMode('matched')"
                style="border-radius: var(--radius-full); font-weight: 800; font-size: 0.85rem; padding: 0.5rem 0.75rem; background: ${currentMode === 'matched' ? 'var(--color-primary)' : '#ffffff'};">
                🎯 केवल मैचिंग कामगार (${matchedWorkers.length})
              </button>
              <button
                class="btn btn-sm flex-1 ${currentMode === 'all' ? 'btn-primary' : 'btn-outline'}"
                onclick="window.setEmployerWorkerFilterMode('all')"
                style="border-radius: var(--radius-full); font-weight: 700; font-size: 0.85rem; padding: 0.5rem 0.75rem; background: ${currentMode === 'all' ? 'var(--color-primary)' : '#ffffff'};">
                🌐 सभी कामगार देखें (${allWorkers.length})
              </button>
            </div>
          </div>
        ` : ''}

        ${currentMode === 'all' ? `
          <!-- Trade Category Filter Pills (When browsing all trades) -->
          <div class="mb-3">
            <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch;">
              ${tradePills.map(p => {
                const isActive = (window._employerSelectedTrade || 'all') === p.id;
                return `
                  <button
                    class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}"
                    onclick="window.filterEmployerWorkersByTrade('${p.id}')"
                    style="border-radius: var(--radius-full); white-space: nowrap; font-size: 0.82rem; font-weight: 700; padding: 0.35rem 0.85rem; background: ${isActive ? 'var(--color-primary)' : '#ffffff'};">
                    ${p.icon} ${p.label}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Worker Cards List -->
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${displayedWorkers.length > 0 ? displayedWorkers.map(worker => {
            const isMatched = hasJobs && selectedJob ? isWorkerMatchedToJob(worker, selectedJob, applications) : false;
            const hasApplied = hasJobs && selectedJob && applications.some(a => a && String(a.jobId) === String(selectedJob.id) && (String(a.workerId) === String(worker.id) || a.workerName === worker.name));
            return renderWorkerCardForEmployer(worker, isMatched, hasApplied, selectedJob);
          }).join('') : `
            <div class="text-center p-4" style="background: #f8fafc; border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👷‍♂️</div>
              <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0 0 0.25rem 0; color: var(--text-primary);">
                ${hasJobs && currentMode === 'matched'
                  ? 'इस काम के लिए सीधे मैचिंग कामगार नहीं मिले'
                  : 'इस श्रेणी में अभी कामगार नहीं मिले'}
              </h3>
              <p class="text-secondary" style="font-size: 0.85rem; margin: 0 0 1rem 0;">
                ${hasJobs && currentMode === 'matched'
                  ? 'आप सभी उपलब्ध कामगारों की सूची देख सकते हैं या अन्य श्रेणी चुन सकते हैं।'
                  : 'जल्द ही और कामगार इस श्रेणी में जुड़ेंगे।'}
              </p>
              ${hasJobs && currentMode === 'matched' ? `
                <button class="btn btn-outline btn-sm" onclick="window.setEmployerWorkerFilterMode('all')" style="border-radius: var(--radius-full); font-weight: 700;">
                  🌐 सभी कामगार देखें (${allWorkers.length})
                </button>
              ` : ''}
            </div>
          `}
        </div>
      </section>

      <!-- Bottom Shortcut Links -->
      <div class="text-center pt-2">
        <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/more'" style="border-radius: var(--radius-full); font-weight: 700; padding: 0.5rem 1.5rem;">
          ☰ और विकल्प (More Options) →
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders individual worker card for employers
 */
function renderWorkerCardForEmployer(worker, isMatched = false, hasApplied = false, activeJob = null) {
  if (!worker) return '';
  const workerName = worker.name || 'कामगार';
  const tradeName = worker.primaryTrade || worker.profession || 'कामगार';
  const icon = worker.tradeIcon || '👷';
  const wage = worker.expectedWage ? `₹${worker.expectedWage}/दिन` : 'बातचीत अनुसार (Negotiable)';
  const city = worker.city || worker.area || 'स्थान दर्ज नहीं';
  const isVerified = Boolean(worker.verified || worker.isVerified);
  const ratingText = worker.rating ? `⭐ ${worker.rating} (${worker.jobsCompleted || 0} काम)` : `⭐ नया खाता (${worker.jobsCompleted ? worker.jobsCompleted + ' काम' : '0 काम'})`;
  const expText = worker.experience && worker.experience[0] ? escapeHTML(worker.experience[0].job_title) : escapeHTML(tradeName);

  return `
    <div class="card p-3" style="border-radius: var(--radius-lg); border: 1.5px solid ${hasApplied ? 'var(--color-success)' : (isMatched ? '#93c5fd' : 'var(--border-subtle)')}; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
      <div class="flex justify-between items-start gap-2 mb-2">
        <!-- Worker Avatar & Core Info -->
        <div class="flex items-center gap-3">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #eff6ff; color: var(--color-primary); font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid #bfdbfe;">
            ${workerName.charAt(0)}
          </div>
          <div>
            <div class="flex items-center gap-1 flex-wrap">
              <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-primary);">
                ${escapeHTML(workerName)}
              </h3>
              ${isVerified ? `
                <span class="badge badge-success font-bold" style="font-size: 0.7rem; padding: 1px 6px;">
                  ✓ Verified
                </span>
              ` : `
                <span class="badge badge-neutral font-bold" style="font-size: 0.7rem; padding: 1px 6px;">
                  नया प्रोफाइल
                </span>
              `}
            </div>
            <div class="text-secondary mt-1" style="font-size: 0.82rem;">
              <span style="color: var(--color-primary); font-weight: 700;">${icon} ${escapeHTML(tradeName)}</span>
              • 📍 ${escapeHTML(city)}
            </div>
          </div>
        </div>

        <!-- Matched / Applied Badge -->
        <div class="text-right flex flex-col items-end gap-1">
          <div class="font-bold text-primary-color" style="font-size: 1.05rem;">
            ${wage}
          </div>
          ${hasApplied ? `
            <span class="badge badge-success font-bold" style="font-size: 0.72rem;">
              📝 आवेदन किया (Applied)
            </span>
          ` : (isMatched ? `
            <span class="badge badge-primary font-bold" style="font-size: 0.72rem; background: #dbeafe; color: #1e40af;">
              🎯 मैचिंग कामगार
            </span>
          ` : `
            <span class="badge badge-neutral" style="font-size: 0.72rem;">
              उपलब्ध
            </span>
          `)}
        </div>
      </div>

      <!-- Rating & Skills Line -->
      <div class="flex items-center justify-between text-secondary mb-2 pt-1" style="font-size: 0.8rem; border-top: 1px solid #f1f5f9;">
        <span>${ratingText}</span>
        <span>${expText}</span>
      </div>

      <!-- Action Buttons: Call & Hire/Offer -->
      <div class="flex gap-2 pt-1" style="border-top: 1px solid var(--border-subtle);">
        <!-- Direct Call Button -->
        <button
          class="btn btn-outline btn-sm flex-1"
          onclick="window.contactWorker('${escapeHTML(worker.phone || '')}', '${escapeHTML(workerName)}')"
          style="border-radius: var(--radius-full); font-weight: 700; font-size: 0.85rem; color: #0284c7; border-color: #bae6fd;">
          📞 कॉल करें
        </button>

        <!-- Direct Hire / Offer Job Button -->
        <button
          class="btn btn-primary btn-sm flex-1"
          onclick="window.directHireWorker('${worker.id}', '${activeJob ? activeJob.id : ''}', '${escapeHTML(workerName)}')"
          style="border-radius: var(--radius-full); font-weight: 700; font-size: 0.85rem;">
          🤝 काम पर रखें
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders employer's posted job card
 */
function renderEmployerSimpleJobCard(job, isSelected = false) {
  if (!job) return '';
  const applicantsForJob = (appState.applications || []).filter(a => a && a.jobId === job.id);
  const applicantCount = applicantsForJob.length || job.workersApplied || 0;

  return `
    <div class="card mb-1" style="border-left: 4px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-lg); padding: 0.9rem 1.15rem; background: ${isSelected ? '#f8fafc' : '#ffffff'};">
      <div class="flex justify-between items-start gap-2 mb-1">
        <div>
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;">
            ${escapeHTML(job.titleHi || job.titleEn || 'काम')}
          </h3>
          <div class="text-secondary mt-1" style="font-size: 0.82rem;">
            📍 ${escapeHTML(job.locationName || job.city || '')} • 📅 ${escapeHTML(job.date || 'आज')}
          </div>
        </div>

        <div class="text-right">
          <div class="font-bold text-primary-color" style="font-size: 1.1rem;">
            ${formatCurrency(job.wage || 700)}/दिन
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center pt-2 mt-2" style="border-top: 1px solid var(--border-subtle);">
        <span class="font-bold text-success" style="font-size: 0.85rem;">
          👥 ${applicantCount} आवेदक उपलब्ध
        </span>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" onclick="window.switchEmployerActiveJob('${job.id}')" style="border-radius: var(--radius-full); font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.75rem;">
            ${isSelected ? '✓ चुना गया' : 'मैचिंग देखें'}
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/applicants/${job.id}'" style="border-radius: var(--radius-full); font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.75rem;">
            आवेदक देखें →
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Global Event Handlers for Employer Views
// ---------------------------------------------------------------------------

window.setEmployerWorkerFilterMode = function(mode) {
  window._employerHomeFilterMode = mode;
  router.handleRoute();
};

window.switchEmployerActiveJob = function(jobId) {
  window._employerSelectedJobId = jobId;
  window._employerHomeFilterMode = 'matched';
  router.handleRoute();
};

window.filterEmployerWorkersByTrade = function(tradeId) {
  window._employerSelectedTrade = tradeId;
  router.handleRoute();
};

window.contactWorker = function(phone, name) {
  if (phone) {
    window.location.href = `tel:${phone}`;
  } else {
    showToast(`कामगार ${name} का नंबर रिकॉर्ड में सुरक्षित है।`, 'info');
  }
};

window.directHireWorker = async function(workerId, jobId, workerName) {
  try {
    let targetJobId = jobId;
    if (!targetJobId) {
      const myJobs = await appState.getEmployerJobs();
      if (myJobs.length > 0) {
        targetJobId = myJobs[0].id;
      } else {
        showToast("कृपया पहले एक काम डालें ताकि कामगार को सीधे काम पर रखा जा सके।", "warning");
        window.location.hash = "#/post-job";
        return;
      }
    }

    // Submit direct hiring application and confirm
    const res = await appState.applyForJob(targetJobId, "नियोक्ता द्वारा डायरेक्ट हायरिंग");
    if (res && res.application) {
      await appState.selectApplicant(res.application.id);
    }
    showToast(`✓ ${workerName || 'कामगार'} को काम पर चुन लिया गया है! सूचना भेज दी गई है।`, "success");
    window.location.hash = "#/active-work";
  } catch (err) {
    showToast("हायरिंग प्रक्रिया में समस्या: " + (err.message || 'त्रुटि'), "error");
  }
};
