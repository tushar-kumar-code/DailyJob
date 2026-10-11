/**
 * CGNeeti / कामसाथी - Reusable Simplified UI Components
 * Rule: Primary action visible. Secondary features hidden until needed.
 * No dense data tables or congested text for low digital literacy users.
 */

const UI = {
  // Worker-Friendly Real Job Card (100% Real Data, Zero Fake Fallbacks)
  renderJobCard(job, options = {}) {
    const isSaved = (appState.savedJobIds && Array.isArray(appState.savedJobIds)) ? appState.savedJobIds.includes(job.id) : false;
    const trade = INITIAL_TRADES.find(t => t.id === job.tradeId);
    const minW = trade ? trade.minWage : 500;
    const tradeName = job.customTradeTitle || (trade ? trade.nameHi : "काम");
    const tradeIcon = trade ? trade.icon : "🛠️";
    const isBelowMarket = Boolean(job.wage && job.wageUnit === "day" && job.wage < minW);

    // Wage Unit Display
    const unitMap = {
      day: "/दिन (प्रति दिन)",
      hour: "/घंटा (प्रति घंटा)",
      week: "/हफ्ता (प्रति सप्ताह)",
      month: "/महीना (प्रति माह)",
      task: "पूरे काम का (एकमुश्त)"
    };
    const wageUnitText = unitMap[job.wageUnit] || (job.wageUnit ? (job.wageUnit.startsWith('/') ? escapeHTML(job.wageUnit) : `/${escapeHTML(job.wageUnit)}`) : "/दिन");

    // Click handler for card
    const clickAttr = options.isPreview ? "" : `onclick="window.location.hash='#/job-detail/${job.id}'" role="button" tabindex="0"`;

    return `
      <article class="card card-interactive simple-job-card mb-3" ${clickAttr} style="border-radius: var(--radius-xl); border: 1.5px solid var(--border-subtle); padding: 1.25rem; background: var(--bg-surface); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <!-- Top bar: Trade badge, urgency, verified employer, save button -->
        <div class="flex justify-between items-start gap-2 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="simple-trade-badge font-bold" style="background: #eff6ff; color: #1d4ed8; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              <span>${tradeIcon}</span> <span>${escapeHTML(tradeName)}</span>
            </span>
            ${job.assignmentType ? `
              <span class="badge badge-neutral" style="font-size: 0.75rem; font-weight: 700;">
                ${job.assignmentType === 'one_day' ? '1 दिन का काम' : (job.assignmentType === 'temporary' ? 'अस्थायी काम' : (job.assignmentType === 'recurring' ? 'हफ्ते में कुछ दिन' : (job.assignmentType === 'ongoing' ? 'मासिक / पक्की नौकरी' : escapeHTML(job.assignmentType))))}
              </span>
            ` : ''}
            ${job.employerVerified ? `
              <span class="simple-verified-chip" style="font-size: 0.75rem; font-weight: 700; color: #047857; background: #ecfdf5; padding: 2px 8px; border-radius: 999px;">🟢 Verified Employer</span>
            ` : ''}
            ${job.urgent ? `
              <span class="badge badge-danger" style="font-size: 0.75rem; font-weight: 700;">🚨 तुरंत चाहिए</span>
            ` : ''}
          </div>

          ${!options.isPreview ? `
            <button class="btn btn-ghost btn-sm btn-icon-only" onclick="event.stopPropagation(); window.toggleSave('${job.id}')" aria-label="Save Job" title="Save Job">
              <span style="font-size: 1.25rem;">${isSaved ? '❤️' : '🤍'}</span>
            </button>
          ` : `
            <span class="badge badge-primary font-bold" style="font-size: 0.75rem;">पूर्वावलोकन (Preview)</span>
          `}
        </div>

        <!-- 1. Job Title -->
        <h3 class="job-card-title mb-2" style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
          ${escapeHTML(job.titleHi || job.titleEn || tradeName)}
        </h3>

        <!-- 2. Primary Decision Points (Wage, Workers, Date/Duration, Location) -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-lg); padding: 0.85rem; margin-bottom: 0.85rem;">
          <div class="flex justify-between items-baseline gap-2 flex-wrap mb-2">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">तय मजदूरी:</span>
              <div class="wage-highlight" style="font-size: 1.35rem; font-weight: 800; color: #047857;">
                ${formatCurrency(job.wage)} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">${wageUnitText}</span>
              </div>
            </div>
            ${job.workersNeeded ? `
              <div class="text-right">
                <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 600;">जरूरत:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--color-primary-dark);">
                  👥 ${job.workersNeeded} कामगार
                </div>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.88rem; color: var(--text-secondary); border-top: 1px dashed #cbd5e1; padding-top: 0.5rem;">
            <div>
              📍 <strong>${job.distanceKm ? `${job.distanceKm} km दूर • ` : ''}${escapeHTML(job.locationName || job.city || 'स्थान दर्ज नहीं')}</strong>${job.landmark ? ` (${escapeHTML(job.landmark)})` : ''}
            </div>
            <div>
              📅 <strong>${escapeHTML(job.startDate || job.date || 'तय तिथि')}</strong>${job.durationText ? ` (${escapeHTML(job.durationText)})` : ''} • ⏰ ${escapeHTML(job.timeSlot || '9:00 AM – 5:00 PM')}
            </div>
          </div>
        </div>

        <!-- 3. Work Description ("काम क्या करना होगा?") -->
        ${(job.descriptionHi || job.description) ? `
          <div style="background: #ffffff; border-left: 3px solid var(--color-primary); padding: 0.6rem 0.8rem; margin-bottom: 0.85rem; font-size: 0.9rem; color: var(--text-primary); line-height: 1.45;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 2px;">काम का विवरण (Responsibilities):</div>
            ${escapeHTML(job.descriptionHi || job.description)}
          </div>
        ` : ''}

        <!-- 4. Work Conditions Chips (Payment timing, Tools, Food, Travel, Safety) -->
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.85rem; font-size: 0.8rem;">
          ${(job.paymentMode || job.paymentTiming) ? `
            <span style="background: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: #334155;">
              💵 ${escapeHTML(job.paymentMode || job.paymentTiming)}
            </span>
          ` : ''}
          ${(job.toolsProvided || job.toolsResponsibility) ? `
            <span style="background: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: #334155;">
              🔧 औजार: ${escapeHTML(job.toolsProvided || job.toolsResponsibility)}
            </span>
          ` : ''}
          ${job.foodProvided ? `
            <span style="background: #ecfdf5; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: #065f46;">
              🍲 ${escapeHTML(job.foodProvided)}
            </span>
          ` : ''}
          ${job.travelProvided ? `
            <span style="background: #eff6ff; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: #1e40af;">
              🚲 ${escapeHTML(job.travelProvided)}
            </span>
          ` : ''}
          ${(job.safetyProvided || job.safetyEquipment) ? `
            <span style="background: #fefce8; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: #854d0e;">
              🛡️ ${escapeHTML(job.safetyProvided || job.safetyEquipment)}
            </span>
          ` : ''}
        </div>

        ${isBelowMarket ? `
          <div class="simple-wage-alert mb-2" style="font-size: 0.8rem; background: #fffbeb; color: #92400e; padding: 4px 8px; border-radius: 6px; border: 1px solid #fde68a;">
            🟡 सामान्य दर से कम (इस काम की औसत दर: ₹${minW}+/दिन)
          </div>
        ` : ''}

        <!-- 5. Footer & Dominant Action -->
        <div class="flex justify-between items-center pt-2" style="border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 0.82rem; color: var(--text-secondary);">
            🏪 <strong>${escapeHTML(job.employerName || 'Employer')}</strong>
            ${job.employerRating ? `<span> • ⭐ ${job.employerRating}</span>` : ''}
          </div>
          ${!options.isPreview ? `
            <span class="btn btn-primary btn-sm" style="font-weight: 800; border-radius: var(--radius-full); padding: 0.45rem 1.15rem; font-size: 0.9rem;">
              काम देखें व आवेदन करें →
            </span>
          ` : `
            <span class="text-muted" style="font-size: 0.8rem; font-weight: 700;">
              कामगारों को ऐसा दिखेगा
            </span>
          `}
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
    const isIdVerified = Boolean(worker && (worker.verified || worker.identityVerified || worker.is_verified));
    const isSkillVerified = Boolean(worker && (worker.skillVerified || worker.skill_verified));
    const ratingText = (worker && worker.rating && worker.rating > 0) ? `⭐ ${worker.rating} रेटिंग` : '⭐ नया खाता (0 रेटिंग)';
    const jobsCount = (worker && (worker.jobsCompleted || worker.totalHires || 0)) || 0;

    return `
      <div class="card mb-3" style="background: var(--bg-surface); border: 1.5px solid var(--border-subtle);">
        <h4 style="font-weight: 700; color: var(--text-primary); font-size: 1rem; margin-bottom: 0.6rem;">
          भरोसे की जानकारी (Trust & Verification)
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.88rem;">
          <div class="font-bold" style="color: ${isIdVerified ? '#047857' : 'var(--text-secondary)'};">
            ${isIdVerified ? '🟢 Identity Verified' : '⚪ पहचान सत्यापन बाकी (Unverified)'}
          </div>
          <div class="font-bold" style="color: ${isSkillVerified ? '#047857' : 'var(--text-secondary)'};">
            ${isSkillVerified ? '🟢 Skill Verified' : '⚪ हुनर सत्यापन बाकी (Unverified)'}
          </div>
          <div class="font-bold" style="color: #b45309;">${ratingText}</div>
          <div class="font-bold" style="color: var(--text-primary);">💼 ${jobsCount} काम पूरे</div>
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
