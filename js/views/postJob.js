/**
 * CGNeeti / कामसाथी - Step-by-Step Post Job Wizard
 * One question at a time with large visual choices for low digital literacy employers.
 */

let jobWizardState = {
  step: 1,
  totalSteps: 6,
  tradeId: "helper",
  workersNeeded: 1,
  locationName: "Pandri, Raipur",
  city: "Raipur",
  date: "आज (Today)",
  timeSlot: "9:00 AM – 5:00 PM",
  wage: 700,
  urgent: false
};

function renderPostJobView() {
  return `
    <div style="max-width: 580px; margin: 0 auto; padding-bottom: 2rem;">
      <!-- Wizard Progress Header -->
      <div class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.5rem;">
        <div class="flex justify-between items-center text-muted mb-2" style="font-size: 0.85rem; font-weight: 700;">
          <span>काम डालें (Post Job)</span>
          <span>कदम ${jobWizardState.step} / ${jobWizardState.totalSteps}</span>
        </div>
        <div class="wizard-progress-bar mb-3">
          <div class="wizard-progress-fill" style="width: ${(jobWizardState.step / jobWizardState.totalSteps) * 100}%;"></div>
        </div>

        <div id="job-wizard-body" class="mt-4">
          ${renderWizardStepContent()}
        </div>
      </div>
    </div>
  `;
}

function renderWizardStepContent() {
  const currentTrade = INITIAL_TRADES.find(t => t.id === jobWizardState.tradeId) || INITIAL_TRADES[6];

  // STEP 1: किस काम के लिए व्यक्ति चाहिए?
  if (jobWizardState.step === 1) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        आपको किस काम के लिए व्यक्ति चाहिए?
      </h2>

      <div class="option-grid mb-4">
        ${INITIAL_TRADES.slice(1).map(trade => `
          <button type="button" class="option-card-btn ${jobWizardState.tradeId === trade.id ? 'selected' : ''}" onclick="window.selectWizardTrade('${trade.id}')">
            <span class="option-icon">${trade.icon}</span>
            <div style="font-size: 1rem; font-weight: 700;">${trade.nameHi}</div>
            <div class="text-muted" style="font-size: 0.75rem; margin-top: 0.2rem;">₹${trade.minWage}-${trade.maxWage}</div>
          </button>
        `).join('')}
      </div>

      <div class="flex justify-end mt-4">
        <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 700;">
          आगे बढ़ें →
        </button>
      </div>
    `;
  }

  // STEP 2: कितने लोग चाहिए?
  if (jobWizardState.step === 2) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        कितने लोग चाहिए?
      </h2>

      <div class="flex items-center justify-center gap-4 my-6">
        <button type="button" class="btn btn-secondary btn-icon-only" style="font-size: 1.8rem; width: 60px; height: 60px; border-radius: 50%;" onclick="window.adjustWorkerCount(-1)">−</button>
        <div style="font-size: 3rem; font-weight: 800; min-width: 80px; text-align: center; color: var(--color-primary-dark);">
          ${jobWizardState.workersNeeded}
        </div>
        <button type="button" class="btn btn-secondary btn-icon-only" style="font-size: 1.8rem; width: 60px; height: 60px; border-radius: 50%;" onclick="window.adjustWorkerCount(1)">+</button>
      </div>

      <div class="flex justify-between mt-6">
        <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
        <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 700;">आगे बढ़ें →</button>
      </div>
    `;
  }

  // STEP 3: काम कहाँ है?
  if (jobWizardState.step === 3) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        काम कहाँ है?
      </h2>

      <div class="form-group mb-3">
        <label class="form-label">शहर (City):</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          ${["Raipur", "Bhilai", "Durg", "Bilaspur"].map(c => `
            <button type="button" class="btn ${jobWizardState.city === c ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="jobWizardState.city='${c}'; renderWizardStep();" style="font-weight: 600;">
              ${c}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="form-group mt-3">
        <label class="form-label" for="wiz-loc">इलाका / लैंडमार्क (Area):</label>
        <input type="text" id="wiz-loc" class="form-control" value="${escapeHTML(jobWizardState.locationName)}" oninput="jobWizardState.locationName = this.value" placeholder="उदा. शंकर नगर, मेन रोड" />
      </div>

      <div class="flex justify-between mt-6">
        <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
        <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 700;">आगे बढ़ें →</button>
      </div>
    `;
  }

  // STEP 4: कब काम है?
  if (jobWizardState.step === 4) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        कब काम है?
      </h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
        <button type="button" class="option-card-btn ${jobWizardState.date.includes('आज') ? 'selected' : ''}" onclick="window.setWizardDate('आज (Today)')">
          <span style="font-size: 2rem;">📅</span>
          <div style="font-size: 1.1rem; font-weight: 700; margin-top: 0.35rem;">आज (Today)</div>
        </button>

        <button type="button" class="option-card-btn ${jobWizardState.date.includes('कल') ? 'selected' : ''}" onclick="window.setWizardDate('कल (Tomorrow)')">
          <span style="font-size: 2rem;">📆</span>
          <div style="font-size: 1.1rem; font-weight: 700; margin-top: 0.35rem;">कल (Tomorrow)</div>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">समय (Working Hours):</label>
        <select class="form-control" onchange="jobWizardState.timeSlot = this.value">
          <option value="9:00 AM – 5:00 PM" selected>9:00 AM – 5:00 PM (फुल डे)</option>
          <option value="8:30 AM – 5:30 PM">8:30 AM – 5:30 PM</option>
          <option value="दोपहर 1:00 PM – 5:00 PM">हाफ डे (4 घंटे)</option>
        </select>
      </div>

      <div class="flex justify-between mt-6">
        <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
        <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 700;">आगे बढ़ें →</button>
      </div>
    `;
  }

  // STEP 5: कितना पैसा देंगे?
  if (jobWizardState.step === 5) {
    const minW = currentTrade.minWage || 600;
    const maxW = currentTrade.maxWage || 850;
    const isBelow = jobWizardState.wage < minW;

    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        कितना पैसा देंगे?
      </h2>

      <div class="form-group mb-3">
        <div style="position: relative;">
          <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1.5rem; font-weight: 800; color: var(--text-secondary);">₹</span>
          <input 
            type="number" 
            id="wiz-wage" 
            class="form-control" 
            value="${jobWizardState.wage}" 
            oninput="window.setWizardWage(this.value)" 
            style="padding-left: 2.75rem; font-size: 1.6rem; font-weight: 800;"
          />
        </div>
      </div>

      <div class="card p-3 mb-3" style="background: ${isBelow ? '#fffbeb' : '#f0fdf4'}; border: 1.5px solid ${isBelow ? '#fde68a' : '#bbf7d0'}; border-radius: var(--radius-md);">
        <div style="font-size: 0.88rem; font-weight: 600; color: ${isBelow ? '#92400e' : '#166534'};">
          ${currentTrade.nameHi} के लिए सामान्य दर: <strong>₹${minW} – ₹${maxW}/दिन</strong>
        </div>
      </div>

      <div class="flex justify-between mt-6">
        <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
        <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 700;">आगे बढ़ें →</button>
      </div>
    `;
  }

  // STEP 6: समीक्षा एवं काम डालें (Review & Publish)
  if (jobWizardState.step === 6) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        जानकारी जांचें और काम डालें
      </h2>

      <div class="card mb-4" style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.95rem;">
        <div><strong>काम:</strong> ${currentTrade.icon} ${currentTrade.nameHi}</div>
        <div><strong>कितने लोग:</strong> ${jobWizardState.workersNeeded} Worker(s)</div>
        <div><strong>स्थान:</strong> 📍 ${escapeHTML(jobWizardState.locationName)}, ${escapeHTML(jobWizardState.city)}</div>
        <div><strong>कब:</strong> 📅 ${escapeHTML(jobWizardState.date)} (${escapeHTML(jobWizardState.timeSlot)})</div>
        <div><strong>मजदूरी:</strong> <span class="font-bold text-success" style="font-size: 1.2rem;">₹${jobWizardState.wage}/दिन</span></div>
      </div>

      <div class="flex justify-between mt-6">
        <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← सुधारें</button>
        <button type="button" class="btn btn-success btn-lg" onclick="window.publishWizardJob()" style="font-weight: 800; min-width: 180px; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);">
          ✓ काम पोस्ट करें
        </button>
      </div>
    `;
  }
}

// Wizard actions
window.selectWizardTrade = function(tradeId) {
  jobWizardState.tradeId = tradeId;
  const t = INITIAL_TRADES.find(item => item.id === tradeId);
  if (t) jobWizardState.wage = t.minWage;
  renderWizardStep();
};

window.adjustWorkerCount = function(delta) {
  jobWizardState.workersNeeded = Math.max(1, Math.min(20, jobWizardState.workersNeeded + delta));
  renderWizardStep();
};

window.setWizardDate = function(dateStr) {
  jobWizardState.date = dateStr;
  renderWizardStep();
};

window.setWizardWage = function(val) {
  jobWizardState.wage = parseInt(val) || 600;
  renderWizardStep();
};

window.nextJobStep = function() {
  if (jobWizardState.step < jobWizardState.totalSteps) {
    jobWizardState.step += 1;
    renderWizardStep();
  }
};

window.prevJobStep = function() {
  if (jobWizardState.step > 1) {
    jobWizardState.step -= 1;
    renderWizardStep();
  }
};

function renderWizardStep() {
  const container = document.getElementById("job-wizard-body");
  if (container) {
    container.innerHTML = renderWizardStepContent();
  }
}

window.publishWizardJob = async function() {
  const currentTrade = INITIAL_TRADES.find(t => t.id === jobWizardState.tradeId) || INITIAL_TRADES[6];
  const newJob = await appState.postJob({
    tradeId: jobWizardState.tradeId,
    titleHi: `${currentTrade.nameHi} चाहिए - ${jobWizardState.locationName}`,
    titleEn: `${currentTrade.nameEn} Needed - ${jobWizardState.locationName}`,
    workersNeeded: jobWizardState.workersNeeded,
    locationName: jobWizardState.locationName,
    city: jobWizardState.city,
    date: jobWizardState.date,
    timeSlot: jobWizardState.timeSlot,
    wage: jobWizardState.wage,
    urgent: jobWizardState.urgent,
    toolsProvided: "आवश्यक औजार उपलब्ध होंगे।",
    safetyProvided: "सुरक्षा व्यवस्था उपलब्ध।",
    descriptionHi: `${currentTrade.nameHi} कार्य हेतु कामगार चाहिए।`
  });

  showToast("✓ आपका काम सफलतापूर्वक पोस्ट हो गया!", "success");
  window.location.hash = `#/applicants/${newJob.id}`;
};
