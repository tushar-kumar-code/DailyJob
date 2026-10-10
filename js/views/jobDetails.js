/**
 * CGNeeti / कामसाथी - Simplified Job Details View
 * Clean vertical layout + Progressive disclosure ("और जानकारी देखें") + 1 dominant apply button.
 */

let jobDetailsDisclosureOpen = false;

async function renderJobDetailsView(jobId) {
  const job = await appState.getJobById(jobId);
  if (!job) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">यह काम उपलब्ध नहीं है</h3>
        <button class="btn btn-primary mt-2" onclick="window.location.hash='#/jobs'">अन्य काम देखें</button>
      </div>
    `;
  }

  const trade = INITIAL_TRADES.find(t => t.id === job.tradeId);
  const tradeName = trade ? trade.nameHi : "काम";
  const tradeIcon = trade ? trade.icon : "🛠️";
  const isSaved = appState.savedJobIds.includes(job.id);
  const alreadyApplied = appState.applications.some(a => a.jobId === job.id && a.workerId === appState.workers[0].id);

  return `
    <div class="job-details-page" style="max-width: 600px; margin: 0 auto; padding-bottom: 6rem;">
      <!-- Back Navigation Header -->
      <div class="flex justify-between items-center mb-3">
        <button class="btn btn-ghost btn-sm" onclick="history.back()">
          ← वापस (Back)
        </button>
        <button class="btn btn-ghost btn-sm" onclick="window.toggleSave('${job.id}')">
          ${isSaved ? '❤️ सेव है' : '🤍 काम सेव करें'}
        </button>
      </div>

      <!-- Main Header Card -->
      <div class="card mb-3" style="border-radius: var(--radius-xl); padding: 1.25rem;">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="simple-trade-badge font-bold">
            ${tradeIcon} ${tradeName}
          </span>
          ${job.employerVerified ? `
            <span class="simple-verified-chip">🟢 Verified Employer</span>
          ` : ''}
        </div>

        <h1 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); line-height: 1.3; margin-bottom: 0.5rem;">
          ${escapeHTML(getCurrentLanguage() === 'hi' ? job.titleHi : job.titleEn)}
        </h1>
      </div>

      <!-- Simple Vertical Details: पैसा, जगह, समय, काम, Employer -->
      <div class="card mb-3" style="border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem;">
        <!-- 💰 पैसा -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">💰</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">पैसा (Daily Wage)</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--color-primary-dark);">
              ${formatCurrency(job.wage)} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">${t('perDay')}</span>
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 📍 जगह -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">📍</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">जगह (Location)</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">
              ${job.distanceKm} km दूर (${escapeHTML(job.locationName)})
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 🕐 समय -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">🕐</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">समय (Date & Time)</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">
              ${escapeHTML(job.date)} • ${escapeHTML(job.timeSlot)}
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 🛠 काम -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">🛠️</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">काम का विवरण</div>
            <div style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.4; margin-top: 0.15rem;">
              ${escapeHTML(getCurrentLanguage() === 'hi' ? job.descriptionHi : job.descriptionEn)}
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- Employer -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">🏪</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">Employer</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">
              ${escapeHTML(job.employerName)}
            </div>
            <div class="text-secondary" style="font-size: 0.85rem;">
              ⭐ ${job.employerRating} (${job.employerHires} hires) • 🟢 Verified
            </div>
          </div>
        </div>
      </div>

      <!-- यह काम आपके लिए क्यों सही है? (3 clean checkmarks) -->
      ${UI.renderMatchExplanation(job, appState.workers[0])}

      <!-- PROGRESSIVE DISCLOSURE: और जानकारी देखें -->
      <div class="mb-4">
        <button class="btn btn-outline btn-block" onclick="window.toggleJobDetailsDisclosure()" style="border-radius: var(--radius-lg); font-weight: 700; padding: 0.75rem 1rem;">
          ${jobDetailsDisclosureOpen ? '▲ कम जानकारी दिखाएं' : '▼ और जानकारी देखें (Travel, Tools, Rules)'}
        </button>

        ${jobDetailsDisclosureOpen ? `
          <div class="card mt-3" style="background: #f8fafc; border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem;">
            <!-- Travel math -->
            ${UI.renderTravelBreakdown(job.wage, job.distanceKm, job.travelEstimate)}

            <div>
              <div class="text-muted font-bold" style="font-size: 0.8rem;">🔧 औजार व सामान:</div>
              <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.toolsProvided)}</div>
            </div>

            <div>
              <div class="text-muted font-bold" style="font-size: 0.8rem;">🛡️ सुरक्षा व्यवस्था:</div>
              <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.safetyProvided)}</div>
            </div>

            <div>
              <div class="text-muted font-bold" style="font-size: 0.8rem;">💵 भुगतान का नियम:</div>
              <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.paymentMode)}</div>
            </div>

            <div>
              <div class="text-muted font-bold" style="font-size: 0.8rem;">📋 कैंसिलेशन सुरक्षा:</div>
              <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.cancellationPolicy)}</div>
            </div>

            <div class="pt-2 text-right">
              <button class="btn btn-ghost btn-sm text-danger" onclick="window.location.hash='#/disputes?jobId=${job.id}'">
                🚩 काम की शिकायत करें
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- STICKY BOTTOM ACTION BAR: ONE DOMINANT BUTTON -->
      <div class="sticky-apply-bar">
        <div class="sticky-apply-inner">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">मजदूरी</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-primary-dark);">
              ${formatCurrency(job.wage)}/दिन
            </div>
          </div>

          ${alreadyApplied ? `
            <button class="btn btn-secondary btn-lg" disabled style="min-width: 200px; font-weight: 700;">
              ✓ आप आवेदन कर चुके हैं
            </button>
          ` : `
            <button class="btn btn-success btn-lg" onclick="window.openApplyModal('${job.id}')" style="min-width: 220px; font-size: 1.15rem; font-weight: 800; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);">
              काम के लिए आवेदन करें →
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

window.toggleJobDetailsDisclosure = function() {
  jobDetailsDisclosureOpen = !jobDetailsDisclosureOpen;
  router.handleRoute();
};

// Interactive Application Modal (Simplified Confirmation)
window.openApplyModal = async function(jobId) {
  const job = await appState.getJobById(jobId);
  if (!job) return;

  const bodyHTML = `
    <div>
      <div style="background: var(--bg-surface-muted); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
        <h4 style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">
          ${escapeHTML(job.titleHi)}
        </h4>
        <div class="text-secondary mt-1" style="font-size: 0.85rem;">
          📍 ${escapeHTML(job.locationName)} • 💰 ${formatCurrency(job.wage)}/दिन
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="apply-note">कोई संदेश (वैकल्पिक / Optional):</label>
        <input type="text" id="apply-note" class="form-control" placeholder="उदा. मैं समय पर पहुंच जाऊंगा।" />
      </div>

      <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem; color: #166534;">
        ✓ आवेदन भेजते ही Employer को सूचना जाएगी।<br />
        ✓ चयन होने पर आपको तुरंत notification मिलेगा।
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">रद्द करें</button>
    <button class="btn btn-success btn-lg" id="confirm-apply-btn" onclick="window.confirmApplication('${job.id}')" style="font-weight: 700;">
      ✓ आवेदन भेजें
    </button>
  `;

  openModal("काम का आवेदन (Apply)", bodyHTML, footerHTML);
};

window.confirmApplication = async function(jobId) {
  const note = document.getElementById("apply-note") ? document.getElementById("apply-note").value : "";
  const res = await appState.applyForJob(jobId, note);
  closeModal();

  if (res.success) {
    showToast("✓ आपका आवेदन भेज दिया गया। Employer आपको select करने पर notification भेजेगा।", "success", 4000);
    window.location.hash = "#/today-work";
  } else {
    showToast(res.message, "warning");
  }
};
