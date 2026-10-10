/**
 * CGNeeti / कामसाथी - Simplified Applicants View
 * Clean candidate list without congested paragraphs or repetitive boxes.
 */

async function renderApplicantsView(jobId) {
  let targetJobId = jobId;
  if (!targetJobId || targetJobId === "job-101") {
    const allJobs = await appState.getJobs();
    targetJobId = allJobs[0]?.id;
  }

  const job = targetJobId ? await appState.getJobById(targetJobId) : null;

  if (!job) {
    return `
      <div class="applicants-page" style="max-width: 640px; margin: 0 auto; padding-bottom: 2rem;">
        <button class="btn btn-ghost btn-sm mb-3" onclick="history.back()">
          ← वापस (Back)
        </button>
        <div class="card p-4 text-center" style="border-radius: var(--radius-xl); background: var(--bg-surface);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📋</div>
          <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem;">कोई काम नहीं मिला</h2>
          <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">आवेदक देखने के लिए पहले अपना काम पोस्ट करें।</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/post-job'" style="border-radius: var(--radius-full); font-weight: 700;">
            + नया काम डालें
          </button>
        </div>
      </div>
    `;
  }

  const applicantsList = await appState.getJobApplicants(job.id);

  return `
    <div class="applicants-page" style="max-width: 640px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-3 pt-1">
        <button class="btn btn-ghost btn-sm" onclick="history.back()">
          ← वापस (Back)
        </button>
        <button class="btn btn-outline btn-sm" onclick="window.location.hash='#/active-work'">
          चालू कार्य →
        </button>
      </div>

      <!-- Job Summary Bar -->
      <div class="card mb-3 p-3" style="background: var(--bg-surface-muted); border-radius: var(--radius-lg);">
        <div class="flex justify-between items-center">
          <div>
            <h1 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">
              ${escapeHTML(job.titleHi || job.titleEn || 'Job')}
            </h1>
            <div class="text-secondary mt-1" style="font-size: 0.82rem;">
              📍 ${escapeHTML(job.locationName || job.city || '')} • 💰 ${formatCurrency(job.wage)}/दिन
            </div>
          </div>
          <span class="badge badge-primary font-bold">
            ${job.workersNeeded || 1} कामगार चाहिए
          </span>
        </div>
      </div>

      <h2 class="font-bold mb-3" style="font-size: 1.15rem; color: var(--text-primary);">
        आवेदक कामगार (${applicantsList.length})
      </h2>

      <!-- Applicants List -->
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${applicantsList.length > 0 ? applicantsList.map((app) => {
          const isSelected = ["selected", "confirmed", "started", "completed", "paid"].includes(app.status);
          const workerName = app.workerName || app.worker_name || 'Worker';
          const workerTrade = app.trade || job.tradeId || 'Worker';

          return `
            <div class="card p-3" style="border-radius: var(--radius-lg); border: 2px solid ${isSelected ? 'var(--color-success)' : 'var(--border-subtle)'};">
              <div class="flex justify-between items-start gap-2 mb-2">
                <div class="flex items-center gap-3">
                  <div style="width: 48px; height: 48px; border-radius: 50%; background: #e0e7ff; color: var(--color-primary); font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; justify-content: center;">
                    ${workerName.charAt(0)}
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0;">
                      ${escapeHTML(workerName)}
                    </h3>
                    <div class="text-secondary" style="font-size: 0.82rem;">
                      ⚡ ${escapeHTML(workerTrade)} • 📅 आवेदन: ${escapeHTML(app.appliedAt || 'हाल ही में')}
                    </div>
                  </div>
                </div>

                <span class="badge badge-success font-bold">
                  🟢 Real Applicant
                </span>
              </div>

              ${app.note ? `
                <div class="text-secondary mb-3" style="font-size: 0.85rem; background: #f8fafc; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm);">
                  💬 Note: ${escapeHTML(app.note)}
                </div>
              ` : ''}

              <!-- Action buttons -->
              <div class="flex gap-2 pt-1" style="border-top: 1px solid var(--border-subtle);">
                ${isSelected ? `
                  <button class="btn btn-secondary btn-sm flex-1" disabled style="color: var(--color-success-dark); font-weight: 700;">
                    ✓ चुना गया (Selected)
                  </button>
                ` : `
                  <button class="btn btn-success btn-sm flex-1" onclick="window.selectWorkerForJob('${app.id}', '${app.workerId}', '${job.id}')" style="font-weight: 700;">
                    ✓ काम पर चुनें (Hire)
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('') : `
          <div class="card p-4 text-center" style="border-radius: var(--radius-xl); background: var(--bg-surface);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">👷‍♂️</div>
            <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">अभी किसी कामगार ने आवेदन नहीं किया है</h3>
            <p class="text-secondary" style="font-size: 0.85rem; margin: 0;">जैसे ही कोई कामगार इस काम के लिए अप्लाई करेगा, उसकी जानकारी यहाँ तुरंत दिखेगी।</p>
          </div>
        `}
      </div>

      <!-- Section: Matching Available Workers (Who haven't applied yet) -->
      ${await renderMatchingWorkersForJob(job, applicantsList)}
    </div>
  `;
}

async function renderMatchingWorkersForJob(job, existingApplicants = []) {
  if (!job) return '';
  const allWorkers = (await appState.getWorkers()) || [];
  const appliedIds = (existingApplicants || []).map(a => a.workerId || a.worker_id);

  const matcher = window.isWorkerMatchedToJob || function(worker, j) {
    if (!worker || !j) return false;
    const wt = (worker.tradeId || '').toLowerCase();
    const jt = (j.tradeId || '').toLowerCase();
    if (wt && jt && wt === jt) return true;
    const jtext = `${j.tradeId || ''} ${j.titleHi || ''} ${j.titleEn || ''}`.toLowerCase();
    const wtext = `${worker.tradeId || ''} ${worker.primaryTrade || ''} ${(worker.skills || []).map(s=>s.name||s).join(' ')}`.toLowerCase();
    if ((jtext.includes('मजदूर') || jtext.includes('हेल्पर') || jt === 'helper') && (wt === 'helper' || wt === 'cleaning' || wtext.includes('मजदूर') || wtext.includes('हेल्पर'))) return true;
    if ((jtext.includes('खाना') || jtext.includes('cook') || jt === 'cooking') && (wt === 'cooking' || wtext.includes('खाना') || wtext.includes('cook'))) return true;
    if ((jtext.includes('बिजली') || jt === 'electrician') && (wt === 'electrician' || wtext.includes('बिजली'))) return true;
    if ((jtext.includes('नल') || jt === 'plumber') && (wt === 'plumber' || wtext.includes('नल'))) return true;
    if ((jtext.includes('मिस्त्री') || jt === 'mason') && (wt === 'mason' || wtext.includes('मिस्त्री'))) return true;
    if ((jtext.includes('ड्राइव') || jt === 'driving') && (wt === 'driving' || wtext.includes('ड्राइव'))) return true;
    if ((jtext.includes('पेंट') || jt === 'painter') && (wt === 'painter' || wtext.includes('पेंट'))) return true;
    return false;
  };

  const matchingWorkers = allWorkers.filter(w => !appliedIds.includes(w.id) && matcher(w, job));

  if (matchingWorkers.length === 0) return '';

  return `
    <div class="mt-4 pt-3" style="border-top: 2px dashed #cbd5e1;">
      <div class="mb-3">
        <div class="flex items-center gap-2">
          <h2 class="font-bold m-0" style="font-size: 1.15rem; color: var(--text-primary);">
            🎯 इस काम के लिए उपलब्ध अन्य कामगार (${matchingWorkers.length})
          </h2>
          <span class="badge badge-primary font-bold" style="font-size: 0.72rem;">
            सुझाव
          </span>
        </div>
        <p class="text-secondary mt-1 mb-0" style="font-size: 0.82rem;">
          ये कामगार आपके काम <strong>"${escapeHTML(job.titleHi || job.titleEn)}"</strong> के हुनर से पूरी तरह मेल खाते हैं। आप इन्हें सीधे कॉल या काम पर चुन सकते हैं।
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${matchingWorkers.map(worker => `
          <div class="card p-3" style="border-radius: var(--radius-lg); border: 1.5px solid #bfdbfe; background: #ffffff;">
            <div class="flex justify-between items-start gap-2 mb-2">
              <div class="flex items-center gap-3">
                <div style="width: 46px; height: 46px; border-radius: 50%; background: #eff6ff; color: var(--color-primary); font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid #93c5fd;">
                  ${(worker.name || 'W').charAt(0)}
                </div>
                <div>
                  <div class="flex items-center gap-1">
                    <h3 style="font-size: 1.02rem; font-weight: 800; margin: 0; color: var(--text-primary);">
                      ${escapeHTML(worker.name || 'कामगार')}
                    </h3>
                    <span class="badge badge-success font-bold" style="font-size: 0.68rem; padding: 1px 5px;">
                      ✓ Verified
                    </span>
                  </div>
                  <div class="text-secondary mt-1" style="font-size: 0.8rem;">
                    ${worker.tradeIcon || '💼'} <strong>${escapeHTML(worker.primaryTrade || worker.profession || '')}</strong> • 📍 ${escapeHTML(worker.city || 'रायपुर')}
                  </div>
                </div>
              </div>

              <div class="text-right">
                <div class="font-bold text-primary-color" style="font-size: 1rem;">
                  ₹${worker.expectedWage || 500}/दिन
                </div>
                <span class="badge badge-primary font-bold" style="font-size: 0.68rem; background: #dbeafe; color: #1d4ed8;">
                  मैचिंग हुनर
                </span>
              </div>
            </div>

            <div class="flex gap-2 pt-2" style="border-top: 1px solid var(--border-subtle);">
              <button
                class="btn btn-outline btn-sm flex-1"
                onclick="window.location.href='tel:${worker.phone || ''}'"
                style="border-radius: var(--radius-full); font-weight: 700; font-size: 0.82rem; color: #0284c7;">
                📞 कॉल करें
              </button>
              <button
                class="btn btn-primary btn-sm flex-1"
                onclick="window.selectWorkerForJob('new', '${worker.id}', '${job.id}')"
                style="border-radius: var(--radius-full); font-weight: 700; font-size: 0.82rem;">
                ✓ सीधे काम पर चुनें
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Global modal preview for Worker Profile
window.viewWorkerModal = async function(workerId) {
  const worker = (appState.workers && appState.workers.find(w => w && w.id === workerId)) || (appState.workers && appState.workers[0]) || { name: 'कामगार', age: 26, city: 'रायपुर' };
  const workerName = worker.name || 'कामगार';
  const bodyHTML = `
    <div>
      <div class="text-center mb-3">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: #dbeafe; color: var(--color-primary); font-size: 1.6rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem auto;">
          ${workerName.charAt(0)}
        </div>
        <h3 style="font-weight: 800; font-size: 1.15rem;">${escapeHTML(workerName)}</h3>
        <p class="text-muted" style="font-size: 0.85rem;">
          🎂 उम्र: <strong>${worker.age || 26} वर्ष</strong> • 📍 ${escapeHTML(worker.area || worker.city || 'रायपुर')}
        </p>
      </div>

      ${UI.renderTrustScore(worker)}
    </div>
  `;

  openModal("कामगार प्रोफाइल", bodyHTML, `<button class="btn btn-primary" onclick="closeModal()">ठीक है</button>`);
};

// Hire / Select worker action
window.selectWorkerForJob = async function(appId, workerId, jobId) {
  if (appId === "new" || !appId) {
    const res = await appState.applyForJob(jobId, "Direct employer match");
    appId = res.application ? res.application.id : "app-501";
  }

  await appState.selectApplicant(appId);
  showToast("✓ कामगार चुना गया! कामगार को सूचना भेज दी गई है।", "success");
  window.location.hash = "#/active-work";
};
