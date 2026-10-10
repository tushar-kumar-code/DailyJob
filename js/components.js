/**
 * CGNeeti / कामसाथी - Reusable Simplified UI Components
 * Rule: Primary action visible. Secondary features hidden until needed.
 * No dense data tables or congested text for low digital literacy users.
 */

const UI = {
  // Simplified Job Card (Only 5 essential pieces of info for quick decision)
  renderJobCard(job, options = {}) {
    const isSaved = appState.savedJobIds.includes(job.id);
    const trade = INITIAL_TRADES.find(t => t.id === job.tradeId);
    const minW = trade ? trade.minWage : 600;
    const isBelowMarket = job.wage < minW;
    const tradeName = trade ? trade.nameHi : "काम";
    const tradeIcon = trade ? trade.icon : "🛠️";

    return `
      <article class="card card-interactive simple-job-card mb-3" onclick="window.location.hash='#/job-detail/${job.id}'" role="button" tabindex="0">
        <div class="flex justify-between items-start gap-2 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="simple-trade-badge">
              ${tradeIcon} <strong>${tradeName}</strong>
            </span>
            ${job.employerVerified ? `
              <span class="simple-verified-chip">🟢 भरोसेमंद Employer</span>
            ` : ''}
            ${job.urgent ? `
              <span class="badge badge-danger">🚨 तुरंत</span>
            ` : ''}
          </div>

          <button class="btn btn-ghost btn-sm btn-icon-only" onclick="event.stopPropagation(); window.toggleSave('${job.id}')" aria-label="Save Job" title="Save Job">
            <span style="font-size: 1.25rem;">${isSaved ? '❤️' : '🤍'}</span>
          </button>
        </div>

        <h3 class="job-card-title mb-2" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); line-height: 1.35;">
          ${escapeHTML(getCurrentLanguage() === 'hi' ? job.titleHi : job.titleEn)}
        </h3>

        <!-- Only 3-4 Essential Decision Points -->
        <div class="simple-job-meta mb-3">
          <span class="meta-item">📍 <strong>${job.distanceKm} km</strong> दूर</span>
          <span class="meta-dot">•</span>
          <span class="meta-item wage-highlight">💰 <strong>${formatCurrency(job.wage)}</strong>/दिन</span>
          <span class="meta-dot">•</span>
          <span class="meta-item">📅 ${escapeHTML(job.date)}</span>
        </div>

        ${isBelowMarket ? `
          <div class="simple-wage-alert mb-2">
            🟡 Payment थोड़ा कम है (सामान्य: ₹${minW}+)
          </div>
        ` : ''}

        <!-- One Dominant CTA -->
        <div class="flex justify-between items-center pt-2" style="border-top: 1px solid var(--border-subtle);">
          <span class="text-secondary" style="font-size: 0.85rem;">
            ${escapeHTML(job.employerName)}
          </span>
          <span class="btn btn-primary btn-sm" style="font-weight: 700; border-radius: var(--radius-full); padding: 0.4rem 1rem;">
            काम देखें →
          </span>
        </div>
      </article>
    `;
  },

  // Simplified Fair Wage Guidance
  renderWageTransparency(wage, tradeId) {
    const trade = INITIAL_TRADES.find(t => t.id === tradeId);
    const minW = trade ? trade.minWage : 650;
    const maxW = trade ? trade.maxWage : 850;
    const isBelow = wage < minW;

    return `
      <div class="card mb-3" style="background: #f8fafc; border-left: 4px solid ${isBelow ? 'var(--color-warning)' : 'var(--color-success)'};">
        <div class="text-muted" style="font-size: 0.8rem; font-weight: 600;">💰 तय मजदूरी (Payment)</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: var(--color-primary-dark); margin: 0.2rem 0;">
          ${formatCurrency(wage)} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">${t('perDay')}</span>
        </div>
        <div class="text-secondary" style="font-size: 0.85rem;">
          आसपास की सामान्य दर: <strong>₹${minW} – ₹${maxW}</strong>
        </div>
        <div class="mt-2 font-bold" style="font-size: 0.85rem; color: ${isBelow ? '#b45309' : '#047857'};">
          ${isBelow ? '🟡 Payment थोड़ा कम है' : '🟢 उचित और सही मजदूरी'}
        </div>
      </div>
    `;
  },

  // Simple Arithmetic Travel Cost
  renderTravelBreakdown(wage, distanceKm, travelEstimate) {
    const netEarnings = wage - travelEstimate;
    return `
      <div class="card mb-3" style="background: #f8fafc;">
        <div class="font-bold text-secondary mb-2" style="font-size: 0.9rem;">
          🚲 आपकी बची कमाई (Travel घटाकर)
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem;">
          <div class="flex justify-between text-secondary">
            <span>काम की मजदूरी:</span>
            <span>${formatCurrency(wage)}</span>
          </div>
          <div class="flex justify-between text-danger">
            <span>आने-जाने का खर्च (${distanceKm} km):</span>
            <span>- ${formatCurrency(travelEstimate)}</span>
          </div>
          <div class="flex justify-between font-bold pt-1" style="border-top: 1px dashed #cbd5e1; font-size: 1.05rem; color: var(--color-success-dark);">
            <span>हाथ में बची कमाई:</span>
            <span>${formatCurrency(netEarnings)}</span>
          </div>
        </div>
      </div>
    `;
  },

  // Simple Match Explanation (3 clean checkmarks)
  renderMatchExplanation(job, worker = null) {
    return `
      <div class="card mb-3" style="background: #f0fdf4; border: 1.5px solid #bbf7d0;">
        <h4 style="font-weight: 700; color: #166534; font-size: 0.95rem; margin-bottom: 0.4rem;">
          यह काम आपके लिए सही क्यों है?
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.88rem; color: #14532d;">
          <div>✓ आपकी skill match करती है</div>
          <div>✓ आपके पास समय उपलब्ध है</div>
          <div>✓ काम आपके पास है (${job.distanceKm} km दूर)</div>
        </div>
      </div>
    `;
  },

  // Simple Trust & Reputation
  renderTrustScore(worker) {
    return `
      <div class="card mb-3" style="background: #f0fdf4; border: 1.5px solid #bbf7d0;">
        <h4 style="font-weight: 700; color: #166534; font-size: 1rem; margin-bottom: 0.6rem;">
          भरोसे की जानकारी
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.88rem;">
          <div class="font-bold" style="color: #047857;">🟢 Identity verified</div>
          <div class="font-bold" style="color: #047857;">🟢 Skill verified</div>
          <div class="font-bold" style="color: #b45309;">⭐ ${worker.rating} रेटिंग</div>
          <div class="font-bold" style="color: var(--text-primary);">💼 ${worker.jobsCompleted} काम पूरे</div>
        </div>
      </div>
    `;
  },

  // Work Status Timeline Component (6 steps)
  renderStatusTimeline(currentStatus) {
    const steps = [
      { key: "applied", labelHi: "आवेदन" },
      { key: "selected", labelHi: "चयन" },
      { key: "confirmed", labelHi: "पुष्टि" },
      { key: "started", labelHi: "काम चालू" },
      { key: "completed", labelHi: "समाप्त" },
      { key: "paid", labelHi: "भुगतान" }
    ];

    const statusOrder = ["applied", "selected", "confirmed", "started", "completed", "paid"];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return `
      <div class="timeline-stepper" role="region" aria-label="Work Progress Timeline">
        ${steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;
          const statusClass = isDone ? 'completed' : (isActive ? 'active' : '');
          return `
            <div class="timeline-step ${statusClass}">
              <div class="timeline-dot">
                ${isDone ? ICONS.check : (idx + 1)}
              </div>
              <span class="timeline-label">
                ${step.labelHi}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // Worker Profile Card for Employers & Search
  renderWorkerCard(worker, options = {}) {
    if (!worker) return '';
    const trade = INITIAL_TRADES ? INITIAL_TRADES.find(t => t.id === worker.primaryTrade) : null;
    const workerName = worker.name || worker.username || 'कामगार';
    return `
      <div class="card mb-3" style="border-radius: var(--radius-lg);">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-3">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #e0e7ff; color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700;">
              ${(workerName || 'W').charAt(0)}
            </div>
            <div>
              <div class="flex items-center gap-1">
                <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0;">${escapeHTML(workerName)}</h4>
                ${worker.identityVerified ? `<span class="text-success" title="Verified">🟢</span>` : ''}
              </div>
              <div class="text-secondary" style="font-size: 0.85rem;">
                ${trade ? trade.icon : '⚡'} ${trade ? trade.nameHi : (worker.primaryTrade || 'कामगार')} • ${worker.experienceYears || 2} वर्ष अनुभव
              </div>
            </div>
          </div>
          <div class="badge badge-success font-bold">
            ⭐ ${worker.rating || 4.8}
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap mb-2" style="font-size: 0.8rem;">
          <span class="badge badge-neutral">💼 ${worker.jobsCompleted || 0} काम पूरे</span>
          <span class="badge badge-neutral">📍 ${escapeHTML(worker.city || 'रायपुर')}</span>
          ${worker.skillVerified ? `<span class="badge badge-success">🟢 Skill Verified</span>` : ''}
        </div>

        ${options.showSelectBtn ? `
          <div class="flex gap-2 pt-2" style="border-top: 1px solid var(--border-subtle);">
            <button class="btn btn-outline btn-sm flex-1" onclick="window.viewWorkerModal('${worker.id}')">
              Profile देखें
            </button>
            <button class="btn btn-success btn-sm flex-1" onclick="window.selectWorkerForJob('${options.appId || ''}', '${worker.id}', '${options.jobId || ''}')">
              ✓ काम पर चुनें
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
};
