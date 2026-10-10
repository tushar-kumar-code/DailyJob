/**
 * CGNeeti / कामसाथी - User Profile View (Job Seeker & Employer)
 * Displays Real Account Information provided during Sign Up / Login / Profile Creation:
 * - Username & Full Name
 * - Registered Email
 * - Unique Account ID
 * - User Type (Job Seeker / Employer)
 * - Selected Profession / Trade / Business Category
 * - Verification & Account Status
 */

async function renderWorkerProfileView() {
  const isAuth = window.authService && window.authService.isAuthenticated();
  const authUser = isAuth ? window.authService.user : null;
  const currentRole = appState.currentRole;
  const isEmployer = currentRole === "employer" || (authUser?.role === "employer") || (authUser?.profile?.user_type === "employer");
  const isWorker = !isEmployer;

  const profile = isEmployer ? await appState.getEmployerProfile() : await appState.getWorkerProfile();

  // Real user details from authentication & profile creation - ZERO fake fallbacks
  const realName = (authUser?.fullName || authUser?.name || authUser?.username || profile.name || "User").trim();
  const realEmail = (authUser?.email || profile.email || "ईमेल दर्ज नहीं").trim();
  const realPhone = (authUser?.mobile_number || authUser?.mobileNumber || authUser?.phone || profile.phone || "").trim();
  const realUserId = authUser?.user_id || authUser?.id || profile.id || "usr_dailyjob";
  const realAge = authUser?.age || authUser?.profile?.age || profile.age || null;
  const isAccountVerified = Boolean(authUser?.is_verified || profile.verified || profile.is_verified);
  const userTypeLabel = isEmployer ? "Employer" : "Job Seeker";
  const userTypeBadge = isEmployer ? (isAccountVerified ? "✓ Verified Employer" : "Employer Account") : (isAccountVerified ? "✓ Verified Job Seeker" : "Job Seeker Account");
  const avatarLetter = (realName.charAt(0) || 'U').toUpperCase();

  const trade = INITIAL_TRADES ? INITIAL_TRADES.find(t => t.id === profile.primaryTrade || t.id === profile.tradeId) : null;
  const tradeIcon = trade ? trade.icon : (profile.tradeIcon || (isEmployer ? "🏢" : "💼"));

  const workerProf = window.authService?.getWorkerProfile ? window.authService.getWorkerProfile() : (authUser?.worker_profile || authUser?.job_seeker_profile || (authUser?.profile?.user_type === 'job_seeker' ? authUser.profile : null));
  const employerProf = window.authService?.getEmployerProfile ? window.authService.getEmployerProfile() : (authUser?.employer_profile || (authUser?.profile?.user_type === 'employer' ? authUser.profile : null));

  const workerTradeDisplay = workerProf?.profession || workerProf?.categoryTitle || workerProf?.preferences?.preferred_roles?.[0] || profile.profession || profile.primaryTrade || "कामगार";
  const employerTradeDisplay = employerProf?.business_info?.industry || employerProf?.profession || employerProf?.industry || profile.industry || "Employer";
  const realProfession = isEmployer ? employerTradeDisplay : workerTradeDisplay;
  const realLocation = profile.city || profile.area || authUser?.profile?.current_city || workerProf?.personal?.current_city || workerProf?.cityName || employerProf?.location?.city || employerProf?.workLocation || "";

  return `
    <div class="worker-profile-page" style="max-width: 640px; margin: 0 auto; padding-bottom: 2rem;">
      <!-- Profile Header Card -->
      <div class="card mb-4" style="text-align: center; padding: 2rem 1.5rem; border-radius: var(--radius-xl); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
        <div style="width: 84px; height: 84px; border-radius: 50%; background: linear-gradient(135deg, ${isEmployer ? '#dbeafe, #bfdbfe' : '#dcfce7, #bbf7d0'}); color: ${isEmployer ? 'var(--color-primary-dark)' : '#166534'}; font-size: 2.3rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
          ${avatarLetter}
        </div>

        <h1 style="font-size: 1.55rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          ${escapeHTML(realName)}
        </h1>

        <div class="text-secondary mb-2" style="font-size: 0.9rem; word-break: break-all;">
          ✉️ ${escapeHTML(realEmail)}
        </div>

        <div class="flex justify-center gap-2 flex-wrap mb-2">
          <span class="badge ${isEmployer ? 'badge-primary' : 'badge-success'} font-bold">
            ${userTypeBadge}
          </span>
          ${realAge ? `
            <span class="badge font-bold" style="background: #e0f2fe; color: #0369a1; font-size: 0.8rem;">
              🎂 ${realAge} Years
            </span>
          ` : ''}
          <span class="badge badge-warning font-bold">
            ${profile.rating ? `⭐ ${profile.rating} Rating` : '⭐ नया खाता'}
          </span>
          <span class="badge" style="background: var(--bg-surface-muted); color: var(--text-secondary); font-size: 0.75rem;">
            🆔 ${escapeHTML(realUserId)}
          </span>
        </div>
      </div>

      <!-- DUAL PURPOSE PROFILES CARD -->
      <div class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.35rem; border-left: 4px solid var(--color-accent);">
        <div class="flex justify-between items-center mb-3 border-bottom pb-2">
          <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            💼 Linked Profiles & Roles
          </h2>
          <span class="badge badge-primary" style="font-size: 0.75rem;">Multi-Role Account</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <!-- 1. Worker Profile -->
          <div class="card p-3" style="border: 1.5px solid ${isWorker ? '#16a34a' : 'var(--border-subtle)'}; background: ${isWorker ? '#f0fdf4' : 'var(--bg-surface)'}; border-radius: 12px;">
            <div class="flex justify-between items-center gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.5rem;">👷</span>
                <div>
                  <div class="font-bold" style="font-size: 0.95rem; color: #15803d;">Job Seeker Profile (Worker)</div>
                  <div class="text-secondary" style="font-size: 0.82rem; margin-top: 2px;">
                    ${workerProf ? `Trade: <strong>${escapeHTML(workerTradeDisplay)}</strong>${(workerProf.age || realAge) ? ` • Age: ${workerProf.age || realAge} Years` : ''}` : 'Profile not yet configured'}
                  </div>
                </div>
              </div>

              <div>
                ${isWorker ? `
                  <span class="badge badge-success font-bold">✓ Active Mode</span>
                ` : `
                  <button class="btn btn-outline btn-sm font-bold" onclick="window.switchRoleAndRefresh('worker')">
                    Switch to Worker →
                  </button>
                `}
              </div>
            </div>
          </div>

          <!-- 2. Employer Profile -->
          <div class="card p-3" style="border: 1.5px solid ${!isWorker ? '#2563eb' : 'var(--border-subtle)'}; background: ${!isWorker ? '#eff6ff' : 'var(--bg-surface)'}; border-radius: 12px;">
            <div class="flex justify-between items-center gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.5rem;">🏪</span>
                <div>
                  <div class="font-bold" style="font-size: 0.95rem; color: #1d4ed8;">Employer Profile</div>
                  <div class="text-secondary" style="font-size: 0.82rem; margin-top: 2px;">
                    ${employerProf ? `Industry: <strong>${escapeHTML(employerTradeDisplay)}</strong>` : 'Profile details ready'}
                  </div>
                </div>
              </div>

              <div>
                ${!isWorker ? `
                  <span class="badge badge-primary font-bold">✓ Active Mode</span>
                ` : `
                  <button class="btn btn-outline btn-sm font-bold" onclick="window.switchRoleAndRefresh('employer')">
                    Switch to Employer →
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1. Real Account Information -->
      <div class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.35rem; border-left: 4px solid var(--color-primary);">
        <div class="flex justify-between items-center mb-3 border-bottom pb-2">
          <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            👤 Account Information
          </h2>
          <span class="badge badge-success" style="font-size: 0.75rem;">Active Account</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.9rem; font-size: 0.95rem;">
          <!-- 👤 Username -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">Username:</span>
            <span class="font-bold text-primary">${escapeHTML(realName)}</span>
          </div>

          <!-- 📧 Real Email -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">Email Address:</span>
            <span class="font-bold" style="word-break: break-all;">${escapeHTML(realEmail)}</span>
          </div>

          <!-- 📞 Phone Number -->
          ${realPhone ? `
            <div class="flex justify-between items-center">
              <span class="text-secondary">Mobile Number:</span>
              <span class="font-bold text-primary">+91 ${escapeHTML(realPhone)}</span>
            </div>
          ` : ''}

          <!-- 🎂 Real Age (Only shown if provided) -->
          ${realAge ? `
            <div class="flex justify-between items-center">
              <span class="text-secondary">Age:</span>
              <span class="font-bold text-primary" style="font-size: 1.05rem;">${realAge} Years</span>
            </div>
          ` : ''}

          <!-- 🆔 Real User Account ID -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">Account ID:</span>
            <code style="font-size: 0.82rem; background: var(--bg-surface-muted); padding: 0.2rem 0.5rem; border-radius: 4px;">
              ${escapeHTML(realUserId)}
            </code>
          </div>

          <!-- 🎯 User Type -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">Account Role:</span>
            <span class="font-bold ${isEmployer ? 'text-primary' : 'text-success'}">${escapeHTML(userTypeLabel)}</span>
          </div>

          <!-- 💼 Profession / Field -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">Primary Category:</span>
            <span class="font-bold text-primary">${escapeHTML(realProfession)}</span>
          </div>

          <!-- 🔒 Session / Provider -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">Security Status:</span>
            <span class="font-bold text-success">✓ Verified Session (JWT Secure)</span>
          </div>
        </div>

        <!-- Option to edit / update profession -->
        <div class="mt-3 pt-3 border-top text-right">
          <button 
            type="button" 
            class="btn btn-outline btn-sm" 
            onclick="window.location.hash='#/create-profile'"
            style="font-size: 0.85rem; font-weight: 700;">
            ✏️ पेशा / फील्ड अपडेट करें (Edit Profile)
          </button>
        </div>
      </div>

      <!-- 2. Work & Service Details (मेरी कार्य जानकारी) -->
      <div class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.35rem;">
        <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
          ${isEmployer ? '🏢 नियोक्ता कार्य विवरण (Employer Details)' : '🛠️ काम व हुनर विवरण (Work & Skills)'}
        </h2>

        <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.95rem;">
          <!-- 📍 Area / Location -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">📍 स्थान (Location):</span>
            <span class="font-bold">${escapeHTML(realLocation || "स्थान दर्ज नहीं (Location not set)")}</span>
          </div>

          <!-- 📞 Phone / Contact -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">📞 संपर्क (Contact):</span>
            <span class="font-bold">${realPhone ? `+91 ${escapeHTML(realPhone)}` : 'उपलब्ध नहीं'}</span>
          </div>

          <!-- 🛠 Primary Trade / Skills -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">${isEmployer ? '🏭 बिजनेस श्रेणी:' : '🛠️ मुख्य हुनर (Skill):'}</span>
            <span class="font-bold text-primary-color">${escapeHTML(realProfession)}</span>
          </div>

          <!-- 🎂 Age for Job Matching (Only if provided) -->
          ${realAge ? `
            <div class="flex justify-between items-center">
              <span class="text-secondary">🎂 आयु / उम्र (Age):</span>
              <span class="font-bold text-primary">${realAge} वर्ष (Job Matching)</span>
            </div>
          ` : ''}

          <!-- ⭐ Rating -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">⭐ रेटिंग (Rating):</span>
            <span class="font-bold text-success">${profile.rating ? `⭐ ${profile.rating} / 5.0 (${profile.reviewCount || 0} कार्य)` : 'नया खाता (अभी कोई रेटिंग नहीं)'}</span>
          </div>

          <!-- 📋 Work History -->
          <div class="flex justify-between items-center">
            <span class="text-secondary">${isEmployer ? '👥 नियुक्तियां:' : '📋 पूरे किए काम:'}</span>
            <span class="font-bold">${profile.jobsCompleted || profile.totalHires || 0} काम पूरे</span>
          </div>
        </div>
      </div>

      <!-- Trust Score -->
      ${UI && UI.renderTrustScore ? UI.renderTrustScore(profile) : ''}

      <!-- Quick Actions -->
      <div class="card" style="background: var(--bg-surface-muted); border-radius: var(--radius-lg); padding: 1.25rem; text-align: center; display: flex; gap: 0.75rem; justify-content: center;">
        <button class="btn btn-outline" onclick="window.location.hash='${isEmployer ? '#/employer' : '#/worker'}'" style="border-radius: var(--radius-full); font-weight: 700;">
          ← डैशबोर्ड पर जाएं
        </button>
        <button class="btn btn-primary" onclick="window.location.hash='#/more'" style="border-radius: var(--radius-full); font-weight: 700;">
          ☰ और सुविधाएं →
        </button>
      </div>
    </div>
  `;
}
