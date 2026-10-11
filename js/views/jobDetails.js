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

      <!-- Simple Vertical Details: पैसा, लोग, जगह, समय, काम, Employer, सुविधाएं -->
      <div class="card mb-3" style="border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem;">
        <!-- 💰 पैसा (Wage & Unit) -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">💰</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">तय मजदूरी (Payment Terms)</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #047857;">
              ${formatCurrency(job.wage)} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
                ${job.wageUnit === 'hour' ? '/घंटा (प्रति घंटा)' : (job.wageUnit === 'week' ? '/हफ्ता (प्रति सप्ताह)' : (job.wageUnit === 'month' ? '/महीना (प्रति माह)' : (job.wageUnit === 'task' ? 'पूरे काम का' : (job.wageUnit === 'day' ? '/दिन (प्रति दिन)' : (job.wageUnit?.startsWith('/') ? escapeHTML(job.wageUnit) : `/${escapeHTML(job.wageUnit || 'दिन')}`)))))}
              </span>
            </div>
            ${(job.paymentMode || job.paymentTiming) ? `
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
                💵 भुगतान: <strong>${escapeHTML(job.paymentMode || job.paymentTiming)}</strong>
              </div>
            ` : ''}
            ${job.estimatedTotal ? `
              <div style="font-size: 0.8rem; color: #1e40af; background: #eff6ff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">
                📊 अनुमानित कुल खर्च: <strong>₹${job.estimatedTotal.toLocaleString('en-IN')}</strong>
              </div>
            ` : ''}
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 👥 कितने लोग चाहिए -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">👥</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">कामगारों की संख्या (Workers Needed)</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">
              ${job.workersNeeded || 1} कामगार चाहिए
              ${job.assignmentType ? `
                <span class="badge badge-neutral" style="font-size: 0.75rem; margin-left: 0.35rem;">
                  ${job.assignmentType === 'one_day' ? '1 दिन का काम' : (job.assignmentType === 'temporary' ? 'अस्थायी काम' : (job.assignmentType === 'recurring' ? 'हफ्ते में कुछ दिन' : (job.assignmentType === 'ongoing' ? 'मासिक / पक्की नौकरी' : escapeHTML(job.assignmentType))))}
                </span>
              ` : ''}
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 📍 जगह -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">📍</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">कार्यस्थल (Work Location)</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">
              ${job.distanceKm ? `${job.distanceKm} km दूर • ` : ''}${escapeHTML(job.locationName || job.city || 'स्थान दर्ज नहीं')}
            </div>
            ${job.landmark ? `
              <div class="text-secondary" style="font-size: 0.85rem; margin-top: 2px;">
                रास्ता / लैंडमार्क: <strong>${escapeHTML(job.landmark)}</strong>
              </div>
            ` : ''}
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 🕐 समय व अवधि -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">🕐</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">तारीख व समय (Date & Hours)</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">
              📅 ${escapeHTML(job.startDate || job.date || 'तय तिथि')}${job.durationText ? ` (${escapeHTML(job.durationText)})` : ''}
            </div>
            <div class="text-secondary" style="font-size: 0.85rem; margin-top: 2px;">
              ⏰ समय: <strong>${escapeHTML(job.timeSlot || '9:00 AM – 5:00 PM')}</strong>
              ${job.breakIncluded ? ` • <span>${escapeHTML(job.breakIncluded)}</span>` : ''}
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 🛠 काम का विवरण -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">🛠️</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">काम क्या करना होगा? (Work Responsibilities)</div>
            <div style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.5; margin-top: 0.2rem; background: #f8fafc; padding: 0.6rem 0.75rem; border-radius: 8px; border-left: 3px solid var(--color-primary);">
              ${escapeHTML(job.descriptionHi || job.description || 'काम की जरूरत।')}
            </div>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

        <!-- 🏪 Employer -->
        <div class="flex items-start gap-3">
          <span style="font-size: 1.5rem;">🏪</span>
          <div>
            <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">काम देने वाला (Employer)</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">
              ${escapeHTML(job.employerName || 'Employer')}
            </div>
            <div class="text-secondary" style="font-size: 0.85rem; margin-top: 2px;">
              ${job.employerRating ? `⭐ ${job.employerRating}` : ''}
              ${job.employerHires ? ` • ${job.employerHires} काम दिए` : ''}
              ${job.employerVerified ? ` • <span style="color: #047857; font-weight: 700;">🟢 Verified</span>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- यह काम आपके लिए क्यों सही है? (3 clean checkmarks) -->
      ${UI.renderMatchExplanation(job, appState.workers[0])}

      <!-- PROGRESSIVE DISCLOSURE: और जानकारी देखें (Tools, Food, Travel, Safety) -->
      <div class="mb-4">
        <button class="btn btn-outline btn-block" onclick="window.toggleJobDetailsDisclosure()" style="border-radius: var(--radius-lg); font-weight: 700; padding: 0.75rem 1rem;">
          ${jobDetailsDisclosureOpen ? '▲ कम जानकारी दिखाएं' : '▼ सुविधाएं व शर्तें देखें (Tools, Food, Travel, Safety)'}
        </button>

        ${jobDetailsDisclosureOpen ? `
          <div class="card mt-3" style="background: #f8fafc; border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem;">
            <!-- Travel math -->
            ${UI.renderTravelBreakdown(job.wage, job.distanceKm || 2.5, job.travelEstimate || 80)}

            <div>
              <div class="text-muted font-bold" style="font-size: 0.8rem;">🔧 औजार व सामान (Tools):</div>
              <div style="font-size: 0.9rem; margin-top: 0.15rem;">
                ${escapeHTML(job.toolsProvided || (job.toolsResponsibility === 'worker' ? 'काम करने वाले को अपने औजार लाने होंगे' : 'काम देने वाला औजार उपलब्ध कराएगा'))}
              </div>
            </div>

            ${job.foodProvided ? `
              <div>
                <div class="text-muted font-bold" style="font-size: 0.8rem;">🍲 भोजन / चाय (Food):</div>
                <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.foodProvided)}</div>
              </div>
            ` : ''}

            ${job.travelProvided ? `
              <div>
                <div class="text-muted font-bold" style="font-size: 0.8rem;">🚲 आने-जाने का खर्च / यात्रा (Travel):</div>
                <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.travelProvided)}</div>
              </div>
            ` : ''}

            <div>
              <div class="text-muted font-bold" style="font-size: 0.8rem;">🛡️ सुरक्षा व्यवस्था (Safety):</div>
              <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.safetyProvided || job.safetyEquipment || 'सामान्य काम, विशेष उपकरण की जरूरत नहीं')}</div>
            </div>

            <div>
              <div class="text-muted font-bold" style="font-size: 0.8rem;">💵 भुगतान का नियम:</div>
              <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.paymentMode || 'काम समाप्ति पर भुगतान')}</div>
            </div>

            ${job.paymentTerms ? `
              <div>
                <div class="text-muted font-bold" style="font-size: 0.8rem;">📝 अतिरिक्त शर्तें:</div>
                <div style="font-size: 0.9rem; margin-top: 0.15rem;">${escapeHTML(job.paymentTerms)}</div>
              </div>
            ` : ''}

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
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">तय मजदूरी</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #047857;">
              ${formatCurrency(job.wage)} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">${job.wageUnit === 'hour' ? '/घंटा' : (job.wageUnit === 'month' ? '/माह' : (job.wageUnit === 'week' ? '/हफ्ता' : (job.wageUnit === 'task' ? 'पूरा काम' : '/दिन')))}</span>
            </div>
          </div>

          ${job.status && job.status !== 'open' ? `
            <button class="btn btn-secondary btn-lg" disabled style="min-width: 200px; font-weight: 700;">
              ⛔ यह काम बंद हो चुका है
            </button>
          ` : (alreadyApplied ? `
            <button class="btn btn-secondary btn-lg" disabled style="min-width: 200px; font-weight: 700;">
              ✓ आप आवेदन कर चुके हैं
            </button>
          ` : `
            <button class="btn btn-success btn-lg" onclick="window.openApplyModal('${job.id}')" style="min-width: 220px; font-size: 1.15rem; font-weight: 800; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);">
              काम के लिए आवेदन करें →
            </button>
          `)}
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
