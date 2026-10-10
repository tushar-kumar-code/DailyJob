/**
 * CGNeeti / कामसाथी - Simplified "मेरे काम" (Work Status & History)
 * Timeline: Applied -> Selected -> Confirmed -> Started -> Completed -> Paid
 */

async function renderTodayWorkView() {
  const worker = await appState.getWorkerProfile();
  const applications = appState.applications.filter(a => a.workerId === worker.id);
  const activeApp = applications.find(a => ["selected", "confirmed", "started", "completed"].includes(a.status)) || applications[0];

  return `
    <div class="today-work-page" style="max-width: 640px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-3 pt-1">
        <div>
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            मेरे काम (My Work)
          </h1>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.location.hash='#/earnings'">
          💰 कमाई देखें
        </button>
      </div>

      ${activeApp ? await renderActiveJobCard(activeApp) : `
        <div class="empty-state mb-4">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">अभी कोई चालू काम नहीं है</h3>
          <button class="btn btn-primary mt-2" onclick="window.location.hash='#/jobs'">
            काम खोजें →
          </button>
        </div>
      `}

      <!-- Work History / Applications List -->
      <section class="mt-4">
        <h2 class="font-bold mb-3" style="font-size: 1.15rem; color: var(--text-primary);">
          आवेदन व काम का इतिहास
        </h2>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${applications.length > 0 ? applications.map(app => renderAppHistoryRow(app)).join('') : `
            <div class="card p-4 text-center text-secondary" style="font-size: 0.9rem; border-radius: var(--radius-lg); background: var(--bg-surface);">
              आपने अभी तक किसी काम के लिए आवेदन नहीं किया है।
            </div>
          `}
        </div>
      </section>
    </div>
  `;
}

async function renderActiveJobCard(app) {
  const job = await appState.getJobById(app.jobId);
  const jobTitle = job ? (getCurrentLanguage() === 'hi' ? job.titleHi : job.titleEn) : "कार्य विवरण";
  const location = job ? job.locationName : "Raipur";
  const employerName = job ? job.employerName : "Employer";

  return `
    <div class="card mb-4" style="border-radius: var(--radius-xl); border: 2px solid #93c5fd; padding: 1.25rem;">
      <div class="flex justify-between items-start gap-2 mb-2">
        <div>
          <span class="badge ${app.status === 'paid' ? 'badge-success' : 'badge-primary'} mb-1 font-bold">
            ${app.status === 'started' ? '⚡ काम चालू है' : app.status}
          </span>
          <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0.2rem 0 0 0;">
            ${escapeHTML(jobTitle)}
          </h2>
          <div class="text-secondary" style="font-size: 0.85rem; margin-top: 0.2rem;">
            Employer: <strong>${escapeHTML(employerName)}</strong> • 📍 ${escapeHTML(location)}
          </div>
        </div>

        <div class="text-right">
          <div class="font-bold text-primary-color" style="font-size: 1.3rem;">
            ${formatCurrency(app.wage)}
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="my-3">
        ${UI.renderStatusTimeline(app.status)}
      </div>

      <!-- Action Block -->
      <div class="p-3 mb-3" style="background: var(--bg-surface-muted); border-radius: var(--radius-lg);">
        ${renderActionControls(app)}
      </div>

      <!-- Chat Link -->
      <div class="flex justify-between items-center gap-2 pt-2" style="border-top: 1px solid var(--border-subtle);">
        <button class="btn btn-outline btn-sm flex-1" onclick="window.location.hash='#/messages?jobId=${app.jobId}'">
          💬 Employer से चैट
        </button>
        <button class="btn btn-ghost btn-sm text-danger" onclick="window.location.hash='#/safety'">
          🛡️ SOS मदद
        </button>
      </div>
    </div>
  `;
}

function renderActionControls(app) {
  if (app.status === "applied") {
    return `
      <div class="text-center py-2">
        <div class="font-bold text-primary-color" style="font-size: 1rem;">
          ⏳ Employer के चयन की प्रतीक्षा है
        </div>
      </div>
    `;
  }

  if (app.status === "selected") {
    return `
      <div class="text-center py-2">
        <div class="font-bold text-success" style="font-size: 1.05rem; margin-bottom: 0.75rem;">
          🎉 Employer ने आपको काम के लिए चुना है!
        </div>
        <button class="btn btn-success btn-lg btn-block" onclick="window.confirmWorkAvailability('${app.id}')" style="font-weight: 800; border-radius: var(--radius-full);">
          ✓ हाँ, मैं काम पर आ रहा हूँ
        </button>
      </div>
    `;
  }

  if (app.status === "confirmed") {
    return `
      <div>
        <button class="btn btn-primary btn-lg btn-block" onclick="window.simulateCheckIn('${app.id}')" style="font-weight: 800; border-radius: var(--radius-full);">
          📍 काम शुरू करें (Check-In)
        </button>
      </div>
    `;
  }

  if (app.status === "started") {
    return `
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold text-success" style="font-size: 0.92rem;">🟢 कार्यस्थल पर काम चालू है</span>
          <span class="badge badge-success font-bold">${app.checkInTime || '09:00 AM'}</span>
        </div>
        <button class="btn btn-success btn-lg btn-block mt-2" onclick="window.simulateCheckOut('${app.id}')" style="font-weight: 800; border-radius: var(--radius-full);">
          🏁 काम पूरा हुआ (Check-Out)
        </button>
      </div>
    `;
  }

  if (app.status === "completed") {
    return `
      <div>
        <div class="flex justify-between items-center mb-3">
          <span class="font-bold text-success" style="font-size: 0.95rem;">✓ काम पूरा हुआ</span>
          <span class="badge badge-warning font-bold">भुगतान प्रतीक्षारत</span>
        </div>
        <button class="btn btn-outline btn-sm btn-block" onclick="window.simulateEmployerPaymentRelease('${app.id}')">
          (डेमो) भुगतान प्राप्त करें
        </button>
      </div>
    `;
  }

  if (app.status === "paid") {
    return `
      <div class="text-center py-2" style="color: #065f46;">
        <div style="font-size: 1.4rem; font-weight: 800;">
          💰 ₹${app.wage} प्राप्त हुआ
        </div>
      </div>
    `;
  }

  return '';
}

function renderAppHistoryRow(app) {
  const job = appState.jobs.find(j => j.id === app.jobId);
  const title = job ? job.titleHi : "कार्य";

  return `
    <div class="card p-3" style="border-radius: var(--radius-md);">
      <div class="flex justify-between items-center">
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0;">${escapeHTML(title)}</h4>
          <div class="text-muted" style="font-size: 0.78rem;">तारीख: ${app.appliedAt}</div>
        </div>
        <div class="text-right">
          <span class="badge ${app.status === 'paid' ? 'badge-success' : 'badge-neutral'} font-bold">
            ${app.status}
          </span>
          <div class="font-bold text-primary-color mt-1" style="font-size: 0.9rem;">
            ${formatCurrency(app.wage)}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global actions
window.confirmWorkAvailability = async function(appId) {
  await appState.confirmJob(appId);
  showToast("✓ काम की पुष्टि हो गई!", "success");
  router.handleRoute();
};

window.simulateCheckIn = async function(appId) {
  await appState.checkInWork(appId, "GPS Verified");
  showToast("✓ Check-In सफल!", "success");
  router.handleRoute();
};

window.simulateCheckOut = async function(appId) {
  await appState.checkOutWork(appId);
  showToast("✓ Check-Out दर्ज हुआ!", "success");
  router.handleRoute();
};

window.simulateEmployerPaymentRelease = async function(appId) {
  await appState.releasePayment(appId);
  showToast("🎉 ₹850 भुगतान प्राप्त हुआ!", "success");
  router.handleRoute();
};
