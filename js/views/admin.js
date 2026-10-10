/**
 * CGNeeti / कामसाथी - Admin Dashboard Prototype
 * Moderation, Verification Approvals, Fraud Alerts, Platform Analytics
 */

function renderAdminView() {
  const metrics = INITIAL_ADMIN_METRICS;

  return `
    <div class="admin-page" style="max-width: 800px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-4">
        <div>
          <span class="badge badge-danger mb-1">व्यवस्थापक नियंत्रण कक्ष</span>
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            CGNeeti Admin Prototype & Moderation
          </h1>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.chooseRoleAndNavigate('worker')">
          ← वापस मुख्य ऐप पर जाएं
        </button>
      </div>

      <!-- Platform Analytics KPI Cards -->
      <div class="grid-cols-4 mb-5">
        <div class="card">
          <div class="text-muted" style="font-size: 0.78rem;">सक्रिय नौकरियां (Live Jobs)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary-dark); margin-top: 0.2rem;">
            ${metrics.activeJobsCount}
          </div>
          <span class="text-success font-semibold" style="font-size: 0.75rem;">↑ 12% आज वृद्धि</span>
        </div>

        <div class="card">
          <div class="text-muted" style="font-size: 0.78rem;">सत्यापित कामगार (Workers)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-success-dark); margin-top: 0.2rem;">
            ${metrics.verifiedWorkersCount}
          </div>
          <span class="text-success font-semibold" style="font-size: 0.75rem;">100% आधार सत्यापित</span>
        </div>

        <div class="card">
          <div class="text-muted" style="font-size: 0.78rem;">उचित मजदूरी पालन (Fair Wage)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #059669; margin-top: 0.2rem;">
            ${metrics.fairWageAdherence}
          </div>
          <span class="text-muted" style="font-size: 0.75rem;">इलाके के मानक अनुसार</span>
        </div>

        <div class="card">
          <div class="text-muted" style="font-size: 0.78rem;">विवाद निवारण समय (Avg Resolution)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-accent); margin-top: 0.2rem;">
            ${metrics.disputeResolutionTime}
          </div>
          <span class="text-success font-semibold" style="font-size: 0.75rem;">लक्ष्य: < 6 घंटे</span>
        </div>
      </div>

      <!-- Fraud Alerts & Moderation Alerts -->
      <div class="card card-warning mb-5" style="background: #fffbeb;">
        <h3 class="font-bold text-warning-dark mb-2" style="font-size: 1.1rem; display: flex; align-items: center; gap: 0.4rem;">
          🚨 धोखाधड़ी चेतावनी (Fraud & Security Alerts - 2 Active)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem;">
          <div class="card" style="background: #ffffff; padding: 0.85rem; border: 1px solid var(--color-warning-border);">
            <div class="flex justify-between items-center">
              <div>
                <strong>असामान्य कम मजदूरी अलर्ट:</strong> जॉब #job-104 (Durg) में प्लंबर के लिए ₹520/दिन पोस्ट किया गया है, जो न्यूनतम मानक ₹650 से कम है।
              </div>
              <button class="btn btn-outline btn-sm" onclick="window.adminWarnEmployer('job-104')">
                नियोक्ता को चेतावनी भेजें
              </button>
            </div>
          </div>

          <div class="card" style="background: #ffffff; padding: 0.85rem; border: 1px solid var(--color-warning-border);">
            <div class="flex justify-between items-center">
              <div>
                <strong>लगातार कैंसिलेशन नोटिस:</strong> एक खाते द्वारा पिछले 24 घंटे में 3 बार अंतिम समय पर कामगार रद्द किया गया।
              </div>
              <button class="btn btn-danger btn-sm" onclick="showToast('अकाउंट अस्थायी रूप से ब्लॉक किया गया', 'danger')">
                जांच हेतु ब्लॉक करें
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Verification Queue (User Verification) -->
      <section class="card mb-5">
        <h3 class="font-bold mb-3" style="font-size: 1.15rem;">
          प्रतीक्षारत हुनर सत्यापन (Pending Skill Verifications Queue)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div class="card" style="background: var(--bg-surface-muted); padding: 0.85rem 1rem;">
            <div class="flex justify-between items-center flex-wrap gap-2">
              <div>
                <div class="font-bold" style="font-size: 1rem;">सुनीता बाई (Durg) - पेंटर सत्यापन</div>
                <div class="text-muted" style="font-size: 0.8rem;">
                  प्रमाण: मास्टर पेंटर असेसमेंट टेस्ट (स्कोर 88%) • अनुभव: 3 वर्ष
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-success btn-sm" onclick="window.adminApproveSkill('Sunita Bai')">
                  ✓ स्वीकृत करें (Approve)
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showToast('पुनः प्रमाण मांगा गया', 'info')">
                  और दस्तावेज मांगें
                </button>
              </div>
            </div>
          </div>

          <div class="card" style="background: var(--bg-surface-muted); padding: 0.85rem 1rem;">
            <div class="flex justify-between items-center flex-wrap gap-2">
              <div>
                <div class="font-bold" style="font-size: 1rem;">रमेश वर्मा (Bilaspur) - प्लंबर सत्यापन</div>
                <div class="text-muted" style="font-size: 0.8rem;">
                  प्रमाण: पाइपलाइन वर्क साइट फोटो • अनुभव: 2 वर्ष
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-success btn-sm" onclick="window.adminApproveSkill('Ramesh Verma')">
                  ✓ स्वीकृत करें (Approve)
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showToast('पुनः प्रमाण मांगा गया', 'info')">
                  और दस्तावेज मांगें
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Active Disputes Resolution Board -->
      <section class="card">
        <h3 class="font-bold mb-3" style="font-size: 1.15rem;">
          सक्रिय विवाद मध्यस्थता (Active Disputes)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${appState.disputes.map(d => `
            <div class="card" style="border-left: 4px solid var(--color-danger); padding: 0.85rem 1rem;">
              <div class="flex justify-between items-start gap-2">
                <div>
                  <h4 style="font-weight: 700; margin: 0;">${escapeHTML(d.reason)}</h4>
                  <div class="text-muted mt-1" style="font-size: 0.8rem;">
                    वादी: ${escapeHTML(d.reporterName)} (${d.reporterRole}) • जॉब आईडी: #${d.jobId}
                  </div>
                  <p class="text-secondary mt-1" style="font-size: 0.85rem;">"${escapeHTML(d.description)}"</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="window.adminResolveDispute('${d.id}')">
                  समाधान करें (Resolve)
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

window.adminWarnEmployer = function(jobId) {
  showToast("नियोक्ता को उचित मजदूरी संशोधन का नोटिस भेज दिया गया है।", "warning");
};

window.adminApproveSkill = function(name) {
  showToast(`✓ ${name} का हुनर सफलतापूर्वक सत्यापित और प्रकाशित किया गया!`, "success");
};

window.adminResolveDispute = function(disputeId) {
  showToast(`✓ विवाद #${disputeId} का मध्यस्थता समाधान जारी किया गया।`, "success");
};
