/**
 * CGNeeti / कामसाथी - Worker Home Dashboard
 * Strictly shows jobs matching the worker's chosen trade / skills.
 * Clean, direct, and free of false/irrelevant mock data.
 */

async function renderWorkerHomeView() {
  const worker = await appState.getWorkerProfile();
  const allJobs = (await appState.getJobs()) || [];
  const openJobs = allJobs.filter(j => j && (j.status === "open" || !j.status));

  // Match jobs strictly against the worker's skill / trade
  const matchedJobs = openJobs.filter(job => {
    if (!job) return false;
    // Direct tradeId match (e.g. 'cooking')
    if (worker.tradeId) {
      if (job.tradeId === worker.tradeId) return true;
      if (worker.tradeId === "cooking") {
        const text = `${job.tradeId || ''} ${job.titleHi || ''} ${job.titleEn || ''} ${job.descriptionHi || ''}`.toLowerCase();
        return text.includes("cook") || text.includes("खाना") || text.includes("रसोई") || text.includes("कुक") || text.includes("शेफ");
      }
      return false;
    }
    // Fallback keyword check if worker has a trade name set
    if (worker.primaryTrade && worker.primaryTrade !== "Job Seeker" && worker.primaryTrade !== "कामगार (Worker)") {
      const p = worker.primaryTrade.toLowerCase();
      const jobText = `${job.tradeId || ''} ${job.titleHi || ''} ${job.titleEn || ''} ${job.descriptionHi || ''}`.toLowerCase();
      if ((p.includes("cook") || p.includes("खाना")) && (jobText.includes("cook") || jobText.includes("खाना") || jobText.includes("रसोई"))) {
        return true;
      }
      return false;
    }
    // If worker has no preference configured, allow general jobs
    return true;
  });

  const nearbyJobs = matchedJobs.slice(0, 3);

  // Check if worker has an ongoing work today
  const activeApp = appState.applications.find(a => 
    a.workerId === worker.id && ["selected", "confirmed", "started"].includes(a.status)
  );

  return `
    <div class="worker-home-view" style="max-width: 640px; margin: 0 auto;">
      <!-- Greeting -->
      <div class="mb-3 pt-1">
        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0;">
          नमस्ते ${escapeHTML(worker.name || 'User')} 👋
        </h1>
        <div class="mt-1 flex items-center gap-2 flex-wrap">
          <span class="badge font-bold" style="font-size: 0.88rem; padding: 0.35rem 0.85rem; background: #2563eb !important; color: #ffffff !important; border: 1px solid #3b82f6 !important; border-radius: 9999px;">${worker.tradeIcon || '🍳'} ${escapeHTML(worker.primaryTrade || 'Job Seeker')}</span>
          <span class="badge font-bold" style="font-size: 0.88rem; padding: 0.35rem 0.85rem; background: #16a34a !important; color: #ffffff !important; border: 1px solid #22c55e !important; border-radius: 9999px;">🟢 Verified Worker</span>
        </div>
      </div>

      <!-- Main Action -->
      <section class="card mb-4" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: var(--radius-xl); padding: 1.5rem; text-align: center;">
        <h2 style="font-size: 1.35rem; font-weight: 800; color: #14532d; margin-bottom: 0.85rem;">
          आज क्या करना है?
        </h2>

        <button class="btn btn-success btn-lg btn-block" onclick="window.location.hash='#/jobs${worker.tradeId ? '?trade=' + worker.tradeId : ''}'" style="font-size: 1.3rem; font-weight: 800; min-height: 58px; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);">
          🔎 आज का काम खोजें
        </button>
      </section>

      <!-- Active Job (If any) -->
      ${activeApp ? `
        <section class="mb-4">
          <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            आपका काम
          </h2>
          <div class="card" style="border-left: 4px solid var(--color-success); border-radius: var(--radius-lg); padding: 1rem 1.25rem;">
            <div class="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 800; color: #065f46; margin: 0;">
                  ${escapeHTML(activeApp.trade.toUpperCase())} — आज
                </h3>
                <span class="badge badge-success font-bold mt-1">🟢 काम चल रहा है</span>
              </div>
              <button class="btn btn-success btn-sm" onclick="window.location.hash='#/today-work'" style="font-weight: 700; border-radius: var(--radius-full);">
                काम देखें →
              </button>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Section: आपके पास काम (Strictly Matched to Worker's Trade) -->
      <section class="mb-4">
        <div class="flex justify-between items-center mb-3">
          <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            आपके पास काम
          </h2>
          <a href="#/jobs" class="text-primary-color font-bold" style="font-size: 0.9rem;">
            सभी काम →
          </a>
        </div>

        <div class="jobs-list">
          ${nearbyJobs.length > 0 ? nearbyJobs.map(job => UI.renderJobCard(job)).join('') : `
            <div class="card p-4 text-center" style="border-radius: var(--radius-xl); background: var(--bg-surface); border: 1.5px dashed #cbd5e1;">
              <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">${worker.tradeIcon || '🔍'}</div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                अभी ${escapeHTML(worker.primaryTrade || 'आपके हुनर')} से संबंधित कोई काम उपलब्ध नहीं है
              </h3>
              <p class="text-secondary" style="font-size: 0.88rem; margin: 0 0 1rem 0; line-height: 1.4;">
                जैसे ही कोई नियोक्ता इस काम की मांग पोस्ट करेगा, वह आपको तुरंत यहाँ दिखाई देगा।
              </p>
              <div>
                <a href="#/jobs" class="btn btn-outline btn-sm" style="font-weight: 700; border-radius: var(--radius-full); padding: 0.4rem 1rem;">
                  अन्य श्रेणियों के काम देखें →
                </a>
              </div>
            </div>
          `}
        </div>
      </section>

      <!-- Shortcut -->
      <div class="text-center pt-2 pb-4">
        <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/more'" style="border-radius: var(--radius-full); font-weight: 700; padding: 0.5rem 1.5rem;">
          ☰ और विकल्प →
        </button>
      </div>
    </div>
  `;
}
