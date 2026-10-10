/**
 * CGNeeti / कामसाथी - Dispute Center & Resolution Flow
 */

let disputeFormState = {
  jobId: "job-104",
  reason: "Payment नहीं मिला",
  description: "",
  evidenceUploaded: false
};

function renderDisputesView(queryParams = {}) {
  if (queryParams.jobId) disputeFormState.jobId = queryParams.jobId;
  const existingDisputes = appState.disputes;

  return `
    <div class="disputes-page" style="max-width: 640px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            ⚖️ ${t('disputeCenter')}
          </h1>
        </div>
      </div>

      <!-- File a Dispute Form Card -->
      <div class="card mb-5" style="border-radius: var(--radius-xl); box-shadow: var(--shadow-sm);">
        <h2 class="font-bold mb-3" style="font-size: 1.2rem; color: var(--color-primary-dark);">
          नई समस्या दर्ज करें
        </h2>

        <form onsubmit="window.handleDisputeSubmit(event)">
          <div class="form-group">
            <label class="form-label">संबंधित कार्य (Job):</label>
            <select class="form-control" onchange="disputeFormState.jobId = this.value">
              ${appState.jobs.map(j => `
                <option value="${j.id}" ${j.id === disputeFormState.jobId ? 'selected' : ''}>
                  ${escapeHTML(j.titleHi)} (${escapeHTML(j.employerName)})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">क्या समस्या है? *</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.6rem;">
              ${[
                "Payment नहीं मिला",
                "काम अलग या ज्यादा था",
                "Worker / Employer नहीं आया",
                "अंतिम समय पर काम रद्द",
                "Unsafe workplace (असुरक्षित)",
                "गलत व्यवहार",
                "अन्य समस्या"
              ].map(reason => `
                <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.8rem; border: 1.5px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 0.88rem; cursor: pointer; background: var(--bg-surface);">
                  <input type="radio" name="dispute-reason" value="${reason}" ${disputeFormState.reason === reason ? 'checked' : ''} onchange="disputeFormState.reason = this.value" />
                  <span>${reason}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-group mt-3">
            <label class="form-label" for="dispute-desc">विवरण (Description) *</label>
            <textarea id="dispute-desc" class="form-control" rows="3" placeholder="बताएं क्या समस्या हुई..." required oninput="disputeFormState.description = this.value"></textarea>
          </div>

          <div class="form-group mt-3">
            <label class="form-label">सबूत या फोटो (Evidence):</label>
            <div style="border: 2px dashed #cbd5e1; padding: 1rem; text-align: center; border-radius: var(--radius-md); background: #f8fafc;">
              <button type="button" class="btn btn-outline btn-sm" onclick="window.mockDisputeEvidenceUpload()">
                ${disputeFormState.evidenceUploaded ? '✓ सबूत अपलोड हो गया (photo.jpg)' : '📎 फोटो चुनें'}
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="submit" class="btn btn-danger btn-lg">
              ⚖️ शिकायत दर्ज करें
            </button>
          </div>
        </form>
      </div>

      <!-- Previously Filed Disputes List -->
      <section>
        <h3 class="font-bold mb-3" style="font-size: 1.15rem;">
          दर्ज समस्याएं
        </h3>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${existingDisputes.map(disp => `
            <div class="card" style="border-left: 4px solid var(--color-warning);">
              <div class="flex justify-between items-start gap-2 mb-2">
                <div>
                  <span class="badge badge-warning mb-1">
                    🟡 समीक्षाधीन
                  </span>
                  <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0;">
                    ${escapeHTML(disp.reason)}
                  </h4>
                  <div class="text-muted" style="font-size: 0.8rem;">
                    केस #${disp.id} • ${disp.submittedAt}
                  </div>
                </div>

                <span class="badge badge-neutral">सक्रिय</span>
              </div>

              <div class="text-secondary" style="font-size: 0.88rem; background: var(--bg-surface-muted); padding: 0.6rem; border-radius: var(--radius-sm); margin-top: 0.4rem;">
                "${escapeHTML(disp.description)}"
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

window.mockDisputeEvidenceUpload = function() {
  disputeFormState.evidenceUploaded = true;
  showToast("✓ सबूत फोटो संलग्न कर दी गई है", "success");
  const el = document.getElementById("app-view-container");
  if (el) el.innerHTML = renderDisputesView();
};

window.handleDisputeSubmit = async function(e) {
  e.preventDefault();
  const desc = document.getElementById("dispute-desc").value.trim();
  if (!desc) {
    showToast("कृपया समस्या का विवरण लिखें।", "warning");
    return;
  }

  await appState.submitDispute({
    jobId: disputeFormState.jobId,
    reason: disputeFormState.reason,
    description: desc,
    evidence: disputeFormState.evidenceUploaded ? ["evidence_photo.jpg"] : []
  });

  showToast("✓ आपका विवाद सफलतापूर्वक दर्ज हो गया है!", "success");
  window.location.hash = "#/disputes";
};
