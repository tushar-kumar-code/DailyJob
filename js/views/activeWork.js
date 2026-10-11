/**
 * CGNeeti / कामसाथी - Employer Active Work & Payment Tracking View
 * Streamlined, clean work status, attendance and payment release.
 */

async function renderActiveWorkView() {
  let activeApps = appState.applications || [];
  try {
    const employerJobs = await appState.getEmployerJobs();
    const fetched = [];
    for (const job of employerJobs) {
      const apps = await appState.getJobApplicants(job.id);
      fetched.push(...apps);
    }
    if (fetched.length > 0) {
      activeApps = fetched;
      appState.applications = fetched;
    }
  } catch (_) {}

  if (window._activeWorkPollTimer) clearInterval(window._activeWorkPollTimer);
  window._activeWorkPollTimer = setInterval(async () => {
    if (window.location.hash.startsWith('#/active-work')) {
      const employerJobs = await appState.getEmployerJobs();
      let changed = false;
      for (const job of employerJobs) {
        const fresh = await appState.getJobApplicants(job.id);
        const currentStatus = (activeApps[0]?.status);
        if (fresh[0] && fresh[0].status !== currentStatus) {
          changed = true;
          break;
        }
      }
      if (changed) router.handleRoute();
    } else {
      clearInterval(window._activeWorkPollTimer);
      window._activeWorkPollTimer = null;
    }
  }, 4000);

  return `
    <div class="active-work-page" style="max-width: 640px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="mb-3 pt-1">
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
          चालू कार्य (Active Work)
        </h1>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${activeApps.length > 0 ? activeApps.map(app => renderEmployerWorkCard(app)).join('') : `
          <div class="card p-4 text-center" style="border-radius: var(--radius-xl); background: var(--bg-surface); border: 1.5px dashed #cbd5e1;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔨</div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
              अभी कोई चालू कार्य नहीं है
            </h3>
            <p class="text-secondary" style="font-size: 0.88rem; margin: 0 0 1rem 0;">
              जब आप किसी कामगार का चयन करेंगे और काम शुरू होगा, तो उसकी उपस्थिति और भुगतान यहाँ ट्रैक होगा।
            </p>
            <div>
              <button class="btn btn-primary" onclick="window.location.hash='#/post-job'" style="border-radius: var(--radius-full); font-weight: 700;">
                + नया काम डालें
              </button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderEmployerWorkCard(app) {
  const job = (appState.jobs || []).find(j => j && j.id === app.jobId) || { titleHi: "काम", wage: app.wage || 700 };
  const worker = (appState.workers || []).find(w => w && w.id === app.workerId) || { name: app.workerName || "कामगार", phone: app.workerPhone || "" };
  const workerPhone = app.workerPhone || worker.phone || "";

  return `
    <div class="card mb-3" style="border-radius: var(--radius-xl); border: 2px solid #93c5fd; padding: 1.25rem;">
      <div class="flex justify-between items-start gap-2 mb-2">
        <div>
          <span class="badge ${app.status === 'paid' ? 'badge-success' : 'badge-primary'} font-bold mb-1">
            ${app.status}
          </span>
          <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0.2rem 0 0 0;">
            ${escapeHTML(job.titleHi || job.titleEn || 'काम')}
          </h2>
          <div class="text-secondary" style="font-size: 0.85rem; margin-top: 0.2rem;">
            कामगार: <strong>${escapeHTML(app.workerName || worker.name || 'कामगार')}</strong> ${workerPhone ? `(📞 ${escapeHTML(workerPhone)})` : ''}
          </div>
        </div>

        <div class="text-right">
          <div class="font-bold text-primary-color" style="font-size: 1.25rem;">
            ${formatCurrency(app.wage)}
          </div>
        </div>
      </div>

      <!-- Timeline Stepper -->
      <div class="my-3">
        ${UI.renderStatusTimeline(app.status)}
      </div>

      <!-- Attendance status -->
      <div class="p-2 mb-3" style="background: var(--bg-surface-muted); border-radius: var(--radius-md); font-size: 0.85rem;">
        <span class="font-bold">उपस्थिति:</span>
        <span class="text-success font-semibold">
          ${app.checkInTime ? `🟢 Checked-In at ${app.checkInTime}` : '⏳ उपस्थिति प्रतीक्षित'}
        </span>
      </div>

      <!-- Employer Action block -->
      <div class="p-3 mb-3" style="background: #f8fafc; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        ${renderEmployerActionBlock(app)}
      </div>

      <!-- Quick chat and call link -->
      <div class="flex justify-between items-center gap-2 pt-2 flex-wrap" style="border-top: 1px solid var(--border-subtle);">
        ${workerPhone ? `
          <a href="tel:${escapeHTML(workerPhone)}" class="btn btn-outline btn-sm flex-1" style="color: #0284c7; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 140px;">
            📞 कामगार को कॉल (${escapeHTML(workerPhone)})
          </a>
        ` : ''}
        <button class="btn btn-outline btn-sm flex-1" onclick="window.location.hash='#/messages?jobId=${app.jobId}'" style="font-weight: 700; min-width: 120px;">
          💬 कामगार से बात करें
        </button>
        <button class="btn btn-ghost btn-sm text-danger" onclick="window.location.hash='#/disputes?jobId=${app.jobId}'">
          ⚠️ कोई समस्या है?
        </button>
      </div>
    </div>
  `;
}

function renderEmployerActionBlock(app) {
  if (app.status === "applied" || app.status === "selected") {
    return `
      <div class="text-center py-1 text-secondary" style="font-size: 0.85rem;">
        कामगार द्वारा पुष्टि की प्रतीक्षा है।
      </div>
    `;
  }

  if (app.status === "confirmed") {
    return `
      <div class="flex justify-between items-center flex-wrap gap-2">
        <div class="text-secondary" style="font-size: 0.85rem;">
          कामगार आ रहा है।
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.simulateCheckIn('${app.id}')">
          Check-In दर्ज करें
        </button>
      </div>
    `;
  }

  if (app.status === "started") {
    return `
      <div class="flex justify-between items-center flex-wrap gap-2">
        <div class="font-bold text-success" style="font-size: 0.9rem;">
          ⚡ कार्य चालू है
        </div>
        <button class="btn btn-success btn-sm" onclick="window.simulateCheckOut('${app.id}')">
          ✓ काम समाप्त मार्क करें
        </button>
      </div>
    `;
  }

  if (app.status === "completed") {
    return `
      <div>
        <div class="font-bold text-success mb-2" style="font-size: 0.92rem;">
          ✓ काम पूरा हुआ • भुगतान जारी करें:
        </div>
        <button class="btn btn-success btn-lg btn-block" onclick="window.employerReleasePayment('${app.id}')" style="font-weight: 800; border-radius: var(--radius-full);">
          💳 ₹${app.wage} भुगतान जारी करें
        </button>
      </div>
    `;
  }

  if (app.status === "paid") {
    return `
      <div class="text-center py-1 text-success font-bold" style="font-size: 0.95rem;">
        🟢 ₹${app.wage} का भुगतान पूरा हुआ (⭐⭐⭐⭐⭐ 5.0)
      </div>
    `;
  }

  return '';
}

window.employerReleasePayment = async function(appId) {
  await appState.releasePayment(appId);
  showToast("✓ भुगतान जारी कर दिया गया है!", "success");
  router.handleRoute();
};
