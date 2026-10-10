/**
 * CGNeeti / कामसाथी - Global Sidebar Drawer, Profile, AI Chat, How-To-Use Guide & Settings
 */

// Application Settings State (Persisted in localStorage)
let appSettings = {
  theme: localStorage.getItem("cgneeti_theme") || "light",
  fontSize: localStorage.getItem("cgneeti_font_size") || "normal",
  jobAlerts: localStorage.getItem("cgneeti_notif_jobs") !== "false",
  paymentAlerts: localStorage.getItem("cgneeti_notif_payment") !== "false",
  smsAlerts: localStorage.getItem("cgneeti_notif_sms") !== "false",
  voicePrompts: localStorage.getItem("cgneeti_voice_prompts") !== "false",
  autoGps: localStorage.getItem("cgneeti_auto_gps") !== "false",
  privacyNumber: localStorage.getItem("cgneeti_privacy_num") !== "false"
};

// Apply initial settings immediately
applyGlobalSettings();

function applyGlobalSettings() {
  document.documentElement.setAttribute("data-theme", appSettings.theme);
  document.documentElement.setAttribute("data-font-size", appSettings.fontSize);
}

// ---------------------------------------------------------------------------
// 1. Sidebar Opening & Closing Controls
// ---------------------------------------------------------------------------
window.openSidebar = function() {
  if (window.authService && window.authService.isAuthenticated() && !window.authService.isProfileCompleted()) {
    return; // Main features locked until profile is completed
  }
  const sidebar = document.getElementById("app-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!sidebar || !overlay) return;

  window.renderSidebarContent();
  sidebar.classList.add("open");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
};

window.closeSidebar = function() {
  const sidebar = document.getElementById("app-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
};

window.toggleSidebar = function() {
  const sidebar = document.getElementById("app-sidebar");
  if (sidebar && sidebar.classList.contains("open")) {
    window.closeSidebar();
  } else {
    window.openSidebar();
  }
};

// Keyboard escape closes sidebar
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.closeSidebar();
  }
});

// ---------------------------------------------------------------------------
// 2. Render Sidebar Content (Profile, Banners, All Features, Settings)
// ---------------------------------------------------------------------------
window.renderSidebarContent = function() {
  const sidebar = document.getElementById("app-sidebar");
  if (!sidebar) return;

  const isAuth = window.authService && window.authService.isAuthenticated();
  const authUser = isAuth ? window.authService.user : null;
  const currentRole = appState.currentRole;
  const worker = (appState.workers && appState.workers[0]) || {};
  const employer = appState.employer || {};
  const isWorker = currentRole === "worker";

  const userName = authUser ? (authUser.username || authUser.name || authUser.fullName) : (isWorker ? (worker.name || 'कामगार') : (employer.name || 'नियोक्ता'));
  const userSubtext = authUser ? (authUser.email || authUser.phone) : (isWorker ? (worker.phone || '') : (employer.phone || ''));
  const userRating = isWorker ? (worker.rating || 4.8) : (employer.rating || 4.9);
  const currentHash = window.location.hash || "#/";

  const hasWorkerProfile = window.authService?.hasWorkerProfile ? window.authService.hasWorkerProfile() : (authUser?.profile?.user_type === 'job_seeker' || !!authUser?.worker_profile || !!authUser?.job_seeker_profile);
  const hasEmployerProfile = window.authService?.hasEmployerProfile ? window.authService.hasEmployerProfile() : (authUser?.profile?.user_type === 'employer' || !!authUser?.employer_profile);
  const workerProf = window.authService?.getWorkerProfile ? window.authService.getWorkerProfile() : (authUser?.worker_profile || authUser?.job_seeker_profile || (authUser?.profile?.user_type === 'job_seeker' ? authUser.profile : null));
  const employerProf = window.authService?.getEmployerProfile ? window.authService.getEmployerProfile() : (authUser?.employer_profile || (authUser?.profile?.user_type === 'employer' ? authUser.profile : null));

  const workerProfessionName = workerProf?.preferences?.preferred_roles?.[0] || workerProf?.profession || (isWorker ? (authUser?.profile?.profession || worker.primaryTrade || 'कामगार') : 'कामगार');
  const employerBusinessName = employerProf?.business_info?.industry || employerProf?.profession || (!isWorker ? (authUser?.profile?.profession || employer.industry || 'Employer') : 'Employer');

  const currentRoleName = isWorker ? workerProfessionName : employerBusinessName;
  const currentRoleIcon = isWorker ? (workerProfessionName.toLowerCase().includes("cook") || workerProfessionName.includes("खाना") ? "🍳" : "💼") : "🏢";

  sidebar.innerHTML = `
    <!-- Top Header with Close Button -->
    <div class="sidebar-header-bar">
      <div class="flex items-center gap-2">
        <span style="font-size: 1.4rem;">🤝</span>
        <span style="font-weight: 800; font-size: 1.15rem; color: var(--color-primary-dark);">DailyJob (कामसाथी)</span>
      </div>
      <button class="btn btn-ghost btn-sm btn-icon-only" onclick="window.closeSidebar()" aria-label="Close Menu">
        ✕
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="sidebar-scroll-area">
      <!-- User Profile Card -->
      <div class="sidebar-profile-card">
        <div class="flex items-center gap-3 mb-2">
          <div class="sidebar-profile-avatar">
            ${(userName || 'U').charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(userName || 'User')}
            </div>
            <div class="flex items-center gap-1 mt-1 flex-wrap">
              <span class="badge ${isWorker ? 'badge-success' : 'badge-primary'}" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">
                ${isWorker ? '🟢 कामगार' : '🔵 नियोक्ता'}
              </span>
              <span class="badge" style="background: var(--bg-surface-muted); color: var(--text-primary); font-size: 0.72rem; padding: 0.2rem 0.5rem; font-weight: 700;">
                ${currentRoleIcon} ${escapeHTML(currentRoleName)}
              </span>
              <span class="badge badge-warning" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">
                ⭐ ${userRating}
              </span>
            </div>
          </div>
        </div>

        <div class="text-secondary mb-3" style="font-size: 0.82rem; word-break: break-all;">
          ${authUser ? `✉️ ${escapeHTML(authUser.email || userSubtext)}` : `📱 +91 ${escapeHTML(userSubtext)}`}
        </div>

        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm flex-1" onclick="window.closeSidebar(); window.location.hash='${isWorker ? '#/worker-profile' : '#/employer-profile'}';" style="background: #ffffff; font-weight: 700;">
            👤 ${isWorker ? 'कामगार प्रोफाइल' : 'नियोक्ता प्रोफाइल'} देखें
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.handleSidebarLogout()" style="color: #dc2626; border-color: #fca5a5; font-weight: 700;">
            🚪 Logout
          </button>
        </div>
      </div>

      <!-- DEDICATED ROLE SWITCH SECTION -->
      <div class="sidebar-purpose-selector card mb-3" style="padding: 1.1rem; border-radius: var(--radius-xl); background: ${isWorker ? '#f0fdf4' : '#eff6ff'}; border: 2px solid ${isWorker ? '#86efac' : '#93c5fd'}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
        <div class="flex items-center justify-between mb-2">
          <span class="badge ${isWorker ? 'badge-success' : 'badge-primary'} font-bold" style="font-size: 0.8rem; padding: 0.3rem 0.65rem;">
            ${isWorker ? '🟢 Active Mode: Worker (Job Seeker)' : '🔵 Active Mode: Employer'}
          </span>
          <span style="font-size: 0.75rem; color: ${isWorker ? '#166534' : '#1e40af'}; font-weight: 800; text-transform: uppercase;">
            ${isWorker ? 'Worker' : 'Employer'}
          </span>
        </div>

        ${isWorker ? `
          <!-- Worker currently active -> Option to become Employer -->
          <div style="font-size: 0.98rem; font-weight: 800; color: #14532d; margin-bottom: 0.25rem;">
            Looking to Hire Workers?
          </div>
          <p style="font-size: 0.82rem; color: #166534; margin: 0 0 0.85rem 0; line-height: 1.35;">
            Switch to Employer mode to post new work opportunities and hire verified candidates.
          </p>
          <button 
            type="button" 
            class="btn btn-primary btn-block" 
            onclick="window.switchRoleAndRefresh('employer')" 
            style="font-weight: 800; font-size: 0.92rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1rem; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);">
            <span>🏪 Switch to Employer Mode</span>
            <span style="font-size: 1.1rem;">→</span>
          </button>
        ` : `
          <!-- Employer currently active -> Option to become Worker -->
          <div style="font-size: 0.98rem; font-weight: 800; color: #1e3a8a; margin-bottom: 0.25rem;">
            Looking for Daily Work?
          </div>
          <p style="font-size: 0.82rem; color: #1e40af; margin: 0 0 0.85rem 0; line-height: 1.35;">
            Switch to Worker mode to discover nearby job listings and apply directly.
          </p>
          <button 
            type="button" 
            class="btn btn-success btn-block" 
            onclick="window.switchRoleAndRefresh('worker')" 
            style="font-weight: 800; font-size: 0.92rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.28);">
            <span>👷 Switch to Worker Mode</span>
            <span style="font-size: 1.1rem;">→</span>
          </button>
        `}
      </div>

      <!-- Feature Banner 1: AI Chat Assistant -->
      <div class="sidebar-banner-ai" onclick="window.closeSidebar(); window.openAIChatModal();" role="button" tabindex="0">
        <div class="flex items-center gap-3">
          <span style="font-size: 1.6rem;">🤖</span>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem;">कामसाथी AI सहायक</div>
            <div style="font-size: 0.75rem; opacity: 0.9;">बोलकर या लिखकर सवाल पूछें</div>
          </div>
        </div>
        <span style="font-size: 1.1rem; font-weight: 800;">→</span>
      </div>

      <!-- Feature Banner 2: How to Use Guide -->
      <div class="sidebar-banner-guide" onclick="window.closeSidebar(); window.openHowToUseModal();" role="button" tabindex="0">
        <div class="flex items-center gap-3">
          <span style="font-size: 1.6rem;">📖</span>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem;">ऐप का उपयोग कैसे करें?</div>
            <div style="font-size: 0.75rem; opacity: 0.9;">सरल गाइड और नियम</div>
          </div>
        </div>
        <span style="font-size: 1.1rem; font-weight: 800;">→</span>
      </div>

      <!-- Feature Banner 3: Integrated Backend & API Portal -->
      <div class="sidebar-banner-guide" onclick="window.closeSidebar(); window.openBackendPortalModal();" role="button" tabindex="0" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; margin-bottom: 0.75rem;">
        <div class="flex items-center gap-3">
          <span style="font-size: 1.5rem;">⚡</span>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>Backend API Hub</span>
              <span style="font-size: 0.65rem; background: #22c55e; color: #fff; padding: 1px 5px; border-radius: 999px;">Integrated</span>
            </div>
            <div style="font-size: 0.75rem; opacity: 0.85;">FastAPI • Swagger Docs • Port 8001</div>
          </div>
        </div>
        <span style="font-size: 1.1rem; font-weight: 800;">→</span>
      </div>

      <!-- CATEGORY 1: काम और सेवाएं (Role-Isolated Features) -->
      <div>
        <div class="sidebar-section-title">
          ${isWorker ? '👷 कामगार सेवाएं (Job Seeker)' : '🏪 नियोक्ता सेवाएं (Employer)'}
        </div>
        <div class="sidebar-nav-list">
          ${isWorker ? `
            <!-- WORKER ONLY FEATURES (Job Lene Wale Ke Liye) -->
            <a href="#/worker" class="sidebar-nav-link ${currentHash === '#/worker' ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">🏠</span>
                <span>होम (Dashboard)</span>
              </div>
            </a>

            <a href="#/jobs" class="sidebar-nav-link ${currentHash.startsWith('#/jobs') && !currentHash.includes('saved') ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">🔎</span>
                <span>काम खोजें (Find Work)</span>
              </div>
              <span class="badge badge-success font-bold" style="font-size: 0.75rem;">${appState.jobs.length}</span>
            </a>

            <a href="#/today-work" class="sidebar-nav-link ${currentHash === '#/today-work' ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">📋</span>
                <span>मेरे काम (Check-In)</span>
              </div>
            </a>

            <a href="#/earnings" class="sidebar-nav-link ${currentHash === '#/earnings' ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">💰</span>
                <span>मेरी कमाई (Earnings)</span>
              </div>
            </a>

            <a href="#/skills" class="sidebar-nav-link ${currentHash === '#/skills' ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">🛠️</span>
                <span>हुनर की जाँच (Skills)</span>
              </div>
            </a>

            <a href="#/jobs?saved=1" class="sidebar-nav-link ${currentHash.includes('saved=1') ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">❤️</span>
                <span>सेव किए गए काम</span>
              </div>
              <span class="badge badge-neutral font-bold" style="font-size: 0.75rem;">${appState.savedJobIds.length}</span>
            </a>
          ` : `
            <!-- EMPLOYER ONLY FEATURES (Job Dene Wale Ke Liye) -->
            <a href="#/employer" class="sidebar-nav-link ${currentHash === '#/employer' ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">🏠</span>
                <span>होम (Dashboard)</span>
              </div>
            </a>

            <a href="#/post-job" class="sidebar-nav-link ${currentHash === '#/post-job' ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">➕</span>
                <span>काम डालें (Post Job)</span>
              </div>
            </a>

            <a href="#/applicants" class="sidebar-nav-link ${currentHash.startsWith('#/applicants') ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">👥</span>
                <span>आवेदक (Applicants)</span>
              </div>
            </a>

            <a href="#/employer" class="sidebar-nav-link" onclick="window._employerHomeFilterMode='all'; window.closeSidebar();">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">👷</span>
                <span>कामगार सूची (Workers)</span>
              </div>
            </a>

            <a href="#/active-work" class="sidebar-nav-link ${currentHash === '#/active-work' ? 'active' : ''}" onclick="window.closeSidebar()">
              <div class="sidebar-link-left">
                <span class="sidebar-link-icon">🔨</span>
                <span>चालू कार्य (Active Work)</span>
              </div>
            </a>
          `}
        </div>
      </div>

      <!-- CATEGORY 2: संचार व सुरक्षा (Connect & Safety) -->
      <div>
        <div class="sidebar-section-title">संचार व सुरक्षा</div>
        <div class="sidebar-nav-list">
          <a href="#/messages" class="sidebar-nav-link ${currentHash.startsWith('#/messages') ? 'active' : ''}" onclick="window.closeSidebar()">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">💬</span>
              <span>बातचीत (Messages)</span>
            </div>
          </a>

          <a href="#/notifications" class="sidebar-nav-link ${currentHash === '#/notifications' ? 'active' : ''}" onclick="window.closeSidebar()">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">🔔</span>
              <span>सूचनाएं (Notifications)</span>
            </div>
          </a>

          <a href="#/safety" class="sidebar-nav-link ${currentHash === '#/safety' ? 'active' : ''}" onclick="window.closeSidebar()">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">🛡️</span>
              <span class="text-danger font-bold">सुरक्षा केंद्र & SOS</span>
            </div>
          </a>

          <a href="#/disputes" class="sidebar-nav-link ${currentHash.startsWith('#/disputes') ? 'active' : ''}" onclick="window.closeSidebar()">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">⚖️</span>
              <span>समस्या व विवाद</span>
            </div>
          </a>

          <a href="#/admin" class="sidebar-nav-link ${currentHash === '#/admin' ? 'active' : ''}" onclick="window.closeSidebar()">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">⚙️</span>
              <span>व्यवस्थापक (Admin)</span>
            </div>
          </a>
        </div>
      </div>

      <!-- CATEGORY 3: सेटिंग्स व विकल्प (Settings & Preferences) -->
      <div>
        <div class="sidebar-section-title">सिस्टम व सेटिंग्स</div>
        <div class="sidebar-nav-list">
          <button class="sidebar-nav-link btn-block" onclick="window.closeSidebar(); window.openSettingsModal();" style="border: none; background: transparent; cursor: pointer; text-align: left;">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">⚙️</span>
              <span>सेटिंग्स (Settings)</span>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">❯</span>
          </button>

          <button class="sidebar-nav-link btn-block" onclick="window.closeSidebar(); window.openRoleSwitchModal();" style="border: none; background: transparent; cursor: pointer; text-align: left;">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">🔄</span>
              <span>रोल बदलें (Switch Mode)</span>
            </div>
          </button>
        </div>
      </div>

      <!-- App Version Footer -->
      <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
        <div>CGNeeti कामसाथी • v2.1.0</div>
        <div style="margin-top: 0.2rem; font-size: 0.75rem;">छत्तीसगढ़ स्थानीय कामगार मंच</div>
      </div>
    </div>
  `;
};

// ---------------------------------------------------------------------------
// 2.5. Backend & API Portal Modal (Integrated Access Center)
// ---------------------------------------------------------------------------
window.openBackendPortalModal = function() {
  const bodyHTML = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <!-- Integration Status Header Card -->
      <div class="card p-3" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; border: 1px solid #334155;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.4rem;">⚡</span>
            <span style="font-weight: 800; font-size: 1.05rem;">Integrated Access Gateway</span>
          </div>
          <span id="portal-health-badge" style="background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">
            Checking...
          </span>
        </div>
        <p style="font-size: 0.82rem; margin: 0; color: #cbd5e1; line-height: 1.4;">
          Frontend (Node.js) और Backend (FastAPI) आपस में पूरी तरह जुड़े हुए हैं। आप दोनों को एक ही पोर्ट या अलग-अलग पोर्ट्स से एक्सेस कर सकते हैं।
        </p>
      </div>

      <!-- Quick Action Endpoints -->
      <div>
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">
          🔗 1-Click Access Links
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <a href="/docs" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 0.5rem; text-decoration: none; border-color: #6366f1; color: #4f46e5; font-weight: 700;">
            <span>📖</span> <span>Swagger UI Docs</span>
          </a>
          <a href="/redoc" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 0.5rem; text-decoration: none; border-color: #0ea5e9; color: #0284c7; font-weight: 700;">
            <span>📑</span> <span>ReDoc Docs</span>
          </a>
          <a href="/api/health" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 0.5rem; text-decoration: none; border-color: #10b981; color: #059669; font-weight: 700;">
            <span>🩺</span> <span>API Health Check</span>
          </a>
          <a href="/api/jobs" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 0.5rem; text-decoration: none; border-color: #f59e0b; color: #d97706; font-weight: 700;">
            <span>💼</span> <span>Live Jobs API</span>
          </a>
        </div>
      </div>

      <!-- Architecture Mapping Table -->
      <div class="card p-3" style="background: #f8fafc; border: 1px solid var(--border-subtle);">
        <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-primary);">
          🖥️ Active Ports & Integration Mapping:
        </div>
        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 0; color: var(--text-secondary);">Frontend App:</td>
              <td style="padding: 4px 0; font-weight: 700; text-align: right;"><a href="http://localhost:8000" target="_blank" style="color: var(--color-primary);">http://localhost:8000</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 0; color: var(--text-secondary);">Backend Direct:</td>
              <td style="padding: 4px 0; font-weight: 700; text-align: right;"><a href="http://localhost:8001" target="_blank" style="color: var(--color-primary);">http://localhost:8001</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 0; color: var(--text-secondary);">Reverse Proxy:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right; color: #16a34a;">/api/* &rarr; Port 8001</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: var(--text-secondary);">Docs on Port 8000:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right;"><a href="/docs" target="_blank" style="color: #4f46e5;">http://localhost:8000/docs</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Live Connection Test Console -->
      <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">⚡ Live Backend Diagnostic</span>
          <button id="ping-backend-btn" class="btn btn-secondary btn-sm" onclick="window.pingBackendDiagnostic()" style="padding: 0.25rem 0.65rem; font-size: 0.78rem;">
            🔄 Ping Now
          </button>
        </div>
        <pre id="portal-diag-output" style="background: #0f172a; color: #38bdf8; padding: 0.65rem; border-radius: var(--radius-md); font-size: 0.75rem; max-height: 120px; overflow-y: auto; margin: 0; font-family: monospace;">Testing connection...</pre>
      </div>
    </div>
  `;

  openModal("⚡ Backend & API Portal (Integrated)", bodyHTML, `<button class="btn btn-primary" onclick="closeModal()">ठीक है (Close)</button>`);

  window.pingBackendDiagnostic();
};

window.pingBackendDiagnostic = async function() {
  const badge = document.getElementById("portal-health-badge");
  const output = document.getElementById("portal-diag-output");
  const btn = document.getElementById("ping-backend-btn");
  if (!output) return;

  if (btn) btn.disabled = true;
  output.textContent = "Connecting to FastAPI backend via /api/backend-status...";

  const startTime = performance.now();
  try {
    const res = await fetch("/api/backend-status");
    const data = await res.json();
    const duration = Math.round(performance.now() - startTime);

    if (data.backend && data.backend.online) {
      if (badge) {
        badge.textContent = "🟢 Online (Active)";
        badge.style.background = "#22c55e";
      }
      output.textContent = JSON.stringify({
        status: "CONNECTED",
        latency: `${duration}ms`,
        frontend: data.frontend,
        backend: data.backend,
        proxy: "Active (Forwarding /api & /docs)"
      }, null, 2);
    } else {
      if (badge) {
        badge.textContent = "🟡 Backend Standby";
        badge.style.background = "#f59e0b";
      }
      output.textContent = JSON.stringify({
        status: "BACKEND_OFFLINE",
        message: "FastAPI server is not detected on port 8001. Please run RUN.bat to launch both.",
        frontend: data.frontend
      }, null, 2);
    }
  } catch (err) {
    if (badge) {
      badge.textContent = "🔴 Disconnected";
      badge.style.background = "#ef4444";
    }
    output.textContent = `Connection error: ${err.message}\nMake sure servers are started via RUN.bat.`;
  } finally {
    if (btn) btn.disabled = false;
  }
};

// ---------------------------------------------------------------------------
// 3. "ऐप का उपयोग कैसे करें" (How to Use Application Modal)
// ---------------------------------------------------------------------------
window.openHowToUseModal = function() {
  const bodyHTML = `
    <div>
      <!-- Role Tabs for Guide -->
      <div class="flex gap-2 mb-4">
        <button id="guide-tab-worker" class="btn btn-primary btn-sm flex-1" onclick="window.switchGuideTab('worker')">
          👷 कामगार के लिए
        </button>
        <button id="guide-tab-employer" class="btn btn-secondary btn-sm flex-1" onclick="window.switchGuideTab('employer')">
          🏪 नियोक्ता के लिए
        </button>
      </div>

      <!-- Worker Guide Section -->
      <div id="guide-content-worker">
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div class="card p-3" style="border-left: 4px solid var(--color-primary); background: #f8fafc;">
            <div class="font-bold text-primary-color mb-1" style="font-size: 0.95rem;">1. पास का काम खोजें</div>
            <p style="font-size: 0.88rem; margin: 0; color: var(--text-secondary);">
              होम स्क्रीन पर <strong>'आज का काम खोजें'</strong> दबाएं। दूरी (3 km, 5 km), मजदूरी और समय अनुसार काम चुनें।
            </p>
          </div>

          <div class="card p-3" style="border-left: 4px solid var(--color-success); background: #f8fafc;">
            <div class="font-bold text-success mb-1" style="font-size: 0.95rem;">2. 1-क्लिक में आवेदन करें</div>
            <p style="font-size: 0.88rem; margin: 0; color: var(--text-secondary);">
              काम पसंद आने पर <strong>'काम के लिए आवेदन करें'</strong> बटन दबाएं। नियोक्ता द्वारा चुनते ही आपको SMS/नोटिफिकेशन मिलेगा।
            </p>
          </div>

          <div class="card p-3" style="border-left: 4px solid #f59e0b; background: #f8fafc;">
            <div class="font-bold text-warning-dark mb-1" style="font-size: 0.95rem;">3. साइट पर पहुँचकर Check-In करें</div>
            <p style="font-size: 0.88rem; margin: 0; color: var(--text-secondary);">
              कार्यस्थल पहुँचकर <strong>'Check-In'</strong> दबाएं। इससे आपकी उपस्थिति और GPS रिकॉर्ड हो जाता है ताकि कोई विवाद न हो।
            </p>
          </div>

          <div class="card p-3" style="border-left: 4px solid #8b5cf6; background: #f8fafc;">
            <div class="font-bold mb-1" style="font-size: 0.95rem; color: #6d28d9;">4. पूरा पैसा और रेटिंग पाएं</div>
            <p style="font-size: 0.88rem; margin: 0; color: var(--text-secondary);">
              काम पूरा होने पर <strong>'Check-Out'</strong> करें। तय मजदूरी सीधे आपके बैंक खाते / UPI में प्राप्त हो जाएगी।
            </p>
          </div>
        </div>
      </div>

      <!-- Employer Guide Section -->
      <div id="guide-content-employer" style="display: none;">
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div class="card p-3" style="border-left: 4px solid var(--color-primary); background: #f8fafc;">
            <div class="font-bold text-primary-color mb-1" style="font-size: 0.95rem;">1. 1 मिनट में काम डालें</div>
            <p style="font-size: 0.88rem; margin: 0; color: var(--text-secondary);">
              <strong>'+ काम डालें'</strong> बटन दबाएं। काम का प्रकार, कामगार संख्या, तारीख और उचित मजदूरी तय करें। आप बोलकर (माइक) भी काम डाल सकते हैं।
            </p>
          </div>

          <div class="card p-3" style="border-left: 4px solid var(--color-success); background: #f8fafc;">
            <div class="font-bold text-success mb-1" style="font-size: 0.95rem;">2. नजदीकी सत्यापित कामगार चुनें</div>
            <p style="font-size: 0.88rem; margin: 0; color: var(--text-secondary);">
              आवेदकों की प्रोफाइल, आधार सत्यापन, हुनर टेस्ट स्कोर और पुराने काम की रेटिंग देखकर उपयुक्त व्यक्ति को चुनें।
            </p>
          </div>

          <div class="card p-3" style="border-left: 4px solid #10b981; background: #f8fafc;">
            <div class="font-bold mb-1" style="font-size: 0.95rem; color: #047857;">3. उपस्थिति देखें और भुगतान रिलीज करें</div>
            <p style="font-size: 0.88rem; margin: 0; color: var(--text-secondary);">
              कामगार के आते ही चेक-इन पुष्टि होती है। काम पूरा होने पर 1-क्लिक में सुरक्षित भुगतान जारी करें।
            </p>
          </div>
        </div>
      </div>

      <!-- Safety Note -->
      <div class="mt-4 p-3" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md);">
        <div class="font-bold text-danger mb-1" style="font-size: 0.9rem;">🚨 आपातकालीन सुरक्षा (SOS):</div>
        <div style="font-size: 0.82rem; color: #991b1b;">
          किसी भी खतरे या समस्या में मेनू से 'सुरक्षा केंद्र & SOS' बटन दबाएं। तुरंत स्थानीय सहायता उपलब्ध होगी।
        </div>
      </div>
    </div>
  `;

  openModal("📖 ऐप का उपयोग कैसे करें? (Guide)", bodyHTML, `<button class="btn btn-primary" onclick="closeModal()">समझ गया (Done)</button>`);
};

window.switchGuideTab = function(role) {
  const workerTab = document.getElementById("guide-tab-worker");
  const employerTab = document.getElementById("guide-tab-employer");
  const workerContent = document.getElementById("guide-content-worker");
  const employerContent = document.getElementById("guide-content-employer");

  if (role === "worker") {
    workerTab.className = "btn btn-primary btn-sm flex-1";
    employerTab.className = "btn btn-secondary btn-sm flex-1";
    workerContent.style.display = "block";
    employerContent.style.display = "none";
  } else {
    workerTab.className = "btn btn-secondary btn-sm flex-1";
    employerTab.className = "btn btn-primary btn-sm flex-1";
    workerContent.style.display = "none";
    employerContent.style.display = "block";
  }
};

// ---------------------------------------------------------------------------
// 4. "AI Chat" (कामसाथी AI सहायक) Interactive Assistant
// ---------------------------------------------------------------------------
let aiChatConversation = [
  { sender: "bot", text: "नमस्ते! 🙏 मैं कामसाथी AI सहायक हूँ। आप मुझसे काम, मजदूरी दर, चेक-इन या किसी भी समस्या के बारे में पूछ सकते हैं।" }
];

window.openAIChatModal = function() {
  const bodyHTML = `
    <div class="ai-chat-modal-content">
      <!-- Chat history area -->
      <div class="ai-chat-history" id="ai-chat-scroll">
        ${renderAIChatMessages()}
      </div>

      <!-- Smart Suggestion Chips -->
      <div class="ai-chip-scroll">
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('आज रायपुर में काम कैसे ढूंढें?')">
          🔎 आज काम कैसे ढूंढें?
        </button>
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('प्लंबर का आज का सही रेट क्या है?')">
          💰 प्लंबर का सही रेट?
        </button>
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('साइट पर चेक-इन कैसे करें?')">
          📍 चेक-इन कैसे करें?
        </button>
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('मजदूरी न मिले तो क्या करें?')">
          ⚖️ पेमेंट न मिले तो क्या करें?
        </button>
      </div>

      <!-- Chat input form -->
      <form onsubmit="window.handleAIChatSubmit(event)" class="flex gap-2 pt-2" style="border-top: 1px solid var(--border-subtle);">
        <button type="button" class="btn btn-secondary btn-icon-only" onclick="window.triggerAIVoicePrompt()" title="बोलकर पूछें" style="border-radius: 50%; min-width: 44px; min-height: 44px;">
          🎤
        </button>
        <input 
          type="text" 
          id="ai-user-input" 
          class="form-control" 
          placeholder="अपना सवाल पूछें या टाइप करें..." 
          autocomplete="off" 
          required 
          style="border-radius: var(--radius-full); font-size: 0.95rem;" 
        />
        <button type="submit" class="btn btn-primary" style="border-radius: var(--radius-full); padding: 0 1.25rem; font-weight: 700;">
          भेजें
        </button>
      </form>
    </div>
  `;

  openModal("🤖 कामसाथी AI सहायक (24/7 Helper)", bodyHTML);
  scrollAIChatToBottom();
};

function renderAIChatMessages() {
  return aiChatConversation.map(msg => `
    <div class="${msg.sender === 'bot' ? 'ai-bubble-bot' : 'ai-bubble-user'}">
      ${escapeHTML(msg.text)}
    </div>
  `).join('');
}

function scrollAIChatToBottom() {
  setTimeout(() => {
    const el = document.getElementById("ai-chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, 50);
}

window.handleAIChatSubmit = function(e) {
  e.preventDefault();
  const input = document.getElementById("ai-user-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  window.sendAIMessage(text);
};

window.sendAIMessage = function(questionText) {
  // Push user message
  aiChatConversation.push({ sender: "user", text: questionText });
  updateAIChatUI();

  // Generate intelligent response based on query
  setTimeout(() => {
    const botReply = generateSmartAIAnswer(questionText);
    aiChatConversation.push({ sender: "bot", text: botReply });
    updateAIChatUI();
  }, 400);
};

function updateAIChatUI() {
  const el = document.getElementById("ai-chat-scroll");
  if (el) {
    el.innerHTML = renderAIChatMessages();
    scrollAIChatToBottom();
  }
}

function generateSmartAIAnswer(query) {
  const q = query.toLowerCase();

  if (q.includes("काम कैसे") || q.includes("ढूंढें") || q.includes("work")) {
    return "काम खोजने के लिए होम स्क्रीन पर 'काम' (Jobs) टैब पर जाएं। वहां आप दूरी (📍 3 km, 5 km) और दैनिक मजदूरी (💰 ₹600+) चुनकर 1-क्लिक में आवेदन कर सकते हैं।";
  }
  if (q.includes("रेट") || q.includes("मजदूरी") || q.includes("पैसा") || q.includes("wage") || q.includes("rate")) {
    return "छत्तीसगढ़ शहरी मानक के अनुसार: 🛠️ प्लंबर: ₹650–₹850/दिन, ⚡ इलेक्ट्रीशियन: ₹700–₹900/दिन, 🧱 राजमिस्त्री: ₹750–₹950/दिन, 📦 हेल्पर: ₹500–₹650/दिन निर्धारित है।";
  }
  if (q.includes("चेक-इन") || q.includes("check in") || q.includes("उपस्थिति")) {
    return "कार्यस्थल पर पहुंचते ही 'मेरे काम' (My Work) मेनू में जाएं और '📍 काम शुरू करें (Check-In)' बटन दबाएं। इससे आपका GPS समय रिकॉर्ड हो जाता है।";
  }
  if (q.includes("पेमेंट") || q.includes("विवाद") || q.includes("पैसे नहीं") || q.includes("dispute")) {
    return "यदि काम पूरा होने के बाद नियोक्ता मजदूरी नहीं देता, तो साइड मेनू से '⚖️ समस्या व विवाद' में जाकर 1 मिनट में शिकायत दर्ज करें। हमारी टीम 4 घंटे के भीतर मध्यस्थता कर भुगतान सुरक्षित कराती है।";
  }
  if (q.includes("खतरा") || q.includes("sos") || q.includes("सुरक्षा")) {
    return "आपात स्थिति में साइडबार से '🛡️ सुरक्षा केंद्र & SOS' पर जाकर लाल बटन दबाएं। आपकी GPS लोकेशन तुरंत स्थानीय पुलिस (112) और परिवार को SMS से भेज दी जाएगी।";
  }
  if (q.includes("काम डाल") || q.includes("post") || q.includes("कामगार चाहिए")) {
    return "काम पोस्ट करने के लिए '+ काम डालें' विकल्प चुनें। केवल 6 आसान चरणों में काम, शहर, समय और मजदूरी दर्ज करें, या माइक दबाकर बोलकर पोस्ट करें।";
  }

  return `आपका सवाल प्राप्त हुआ: "${query}"। कामसाथी प्लेटफॉर्म पर सभी कामगार और नियोक्ता आधार व हुनर सत्यापित हैं। आप बिना किसी कमीशन के सीधे काम व भुगतान प्राप्त कर सकते हैं।`;
}

window.triggerAIVoicePrompt = function() {
  showToast("🎙️ सुन रहे हैं... कृपया बोलें", "info", 3000);
  setTimeout(() => {
    const input = document.getElementById("ai-user-input");
    if (input) {
      input.value = "आज रायपुर में प्लंबर का काम है क्या?";
      showToast("✓ आवाज़ पहचान ली गई", "success");
    }
  }, 1200);
};

// ---------------------------------------------------------------------------
// 5. "Settings" (सेटिंग्स) Standard Application Settings Modal
// ---------------------------------------------------------------------------
window.openSettingsModal = function() {
  const bodyHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.25rem; font-size: 0.95rem;">
      <!-- Section: भाषा (Language) -->
      <div>
        <div class="font-bold mb-2 text-primary-color" style="font-size: 0.95rem;">🌐 भाषा (Language)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <button class="btn ${getCurrentLanguage() === 'hi' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setLanguage('hi'); window.openSettingsModal();" style="font-weight: 700;">
            🇮🇳 हिंदी
          </button>
          <button class="btn ${getCurrentLanguage() === 'en' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setLanguage('en'); window.openSettingsModal();" style="font-weight: 700;">
            🌐 English
          </button>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

      <!-- Section: डिस्प्ले व थीम (Theme & Display) -->
      <div>
        <div class="font-bold mb-2 text-primary-color" style="font-size: 0.95rem;">🌙 डिस्प्ले और थीम (Theme)</div>
        
        <div class="flex justify-between items-center py-1">
          <div>
            <div class="font-bold">डार्क मोड (Dark Theme)</div>
            <div class="text-muted" style="font-size: 0.78rem;">आंखों के आराम और बैटरी बचत हेतु</div>
          </div>
          <label class="setting-switch">
            <input type="checkbox" id="sett-dark-mode" ${appSettings.theme === 'dark' ? 'checked' : ''} onchange="window.toggleSettingTheme(this.checked)" />
            <span class="setting-slider"></span>
          </label>
        </div>

        <div class="flex justify-between items-center py-2">
          <div>
            <div class="font-bold">बड़ा फ़ॉन्ट (Large Text)</div>
            <div class="text-muted" style="font-size: 0.78rem;">पढ़ने में आसानी के लिए बड़ा अक्षर</div>
          </div>
          <label class="setting-switch">
            <input type="checkbox" id="sett-large-font" ${appSettings.fontSize === 'large' ? 'checked' : ''} onchange="window.toggleSettingFontSize(this.checked)" />
            <span class="setting-slider"></span>
          </label>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

      <!-- Section: नोटिफिकेशन्स (Notifications) -->
      <div>
        <div class="font-bold mb-2 text-primary-color" style="font-size: 0.95rem;">🔔 सूचनाएं (Notifications)</div>
        
        <div class="flex justify-between items-center py-1">
          <div>
            <div class="font-bold">नए काम के अलर्ट (Job Alerts)</div>
            <div class="text-muted" style="font-size: 0.78rem;">नजदीकी काम पोस्ट होते ही नोटिफिकेशन</div>
          </div>
          <label class="setting-switch">
            <input type="checkbox" ${appSettings.jobAlerts ? 'checked' : ''} onchange="appSettings.jobAlerts = this.checked; localStorage.setItem('cgneeti_notif_jobs', this.checked);" />
            <span class="setting-slider"></span>
          </label>
        </div>

        <div class="flex justify-between items-center py-1">
          <div>
            <div class="font-bold">पेमेंट व चेक-इन सूचना</div>
            <div class="text-muted" style="font-size: 0.78rem;">मजदूरी जमा होने पर तुरंत अलर्ट</div>
          </div>
          <label class="setting-switch">
            <input type="checkbox" ${appSettings.paymentAlerts ? 'checked' : ''} onchange="appSettings.paymentAlerts = this.checked; localStorage.setItem('cgneeti_notif_payment', this.checked);" />
            <span class="setting-slider"></span>
          </label>
        </div>

        <div class="flex justify-between items-center py-1">
          <div>
            <div class="font-bold">SMS अलर्ट</div>
            <div class="text-muted" style="font-size: 0.78rem;">इंटरनेट बंद होने पर भी मोबाइल SMS</div>
          </div>
          <label class="setting-switch">
            <input type="checkbox" ${appSettings.smsAlerts ? 'checked' : ''} onchange="appSettings.smsAlerts = this.checked; localStorage.setItem('cgneeti_notif_sms', this.checked);" />
            <span class="setting-slider"></span>
          </label>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

      <!-- Section: आवाज़ व लोकेशन (Voice & Location) -->
      <div>
        <div class="font-bold mb-2 text-primary-color" style="font-size: 0.95rem;">🔊 आवाज़ व लोकेशन</div>
        
        <div class="flex justify-between items-center py-1">
          <div>
            <div class="font-bold">बोलकर सहायता (Voice Guidance)</div>
            <div class="text-muted" style="font-size: 0.78rem;">बटन दबाने पर बोलकर जानकारी देना</div>
          </div>
          <label class="setting-switch">
            <input type="checkbox" ${appSettings.voicePrompts ? 'checked' : ''} onchange="appSettings.voicePrompts = this.checked; localStorage.setItem('cgneeti_voice_prompts', this.checked);" />
            <span class="setting-slider"></span>
          </label>
        </div>

        <div class="flex justify-between items-center py-1">
          <div>
            <div class="font-bold">ऑटो GPS लोकेशन</div>
            <div class="text-muted" style="font-size: 0.78rem;">नजदीकी काम अपने-आप दिखाने हेतु</div>
          </div>
          <label class="setting-switch">
            <input type="checkbox" ${appSettings.autoGps ? 'checked' : ''} onchange="appSettings.autoGps = this.checked; localStorage.setItem('cgneeti_auto_gps', this.checked);" />
            <span class="setting-slider"></span>
          </label>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

      <!-- Section: डेटा व स्टोरेज (Data & Storage) -->
      <div>
        <div class="font-bold mb-2 text-primary-color" style="font-size: 0.95rem;">🧹 डेटा व स्टोरेज</div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm flex-1" onclick="window.clearAppCache()">
            ऐप कैशे साफ़ करें
          </button>
          <button class="btn btn-outline btn-sm flex-1" onclick="window.resetDemoAppData()">
            डेमो डेटा रीसेट
          </button>
        </div>
      </div>

      <!-- App Info -->
      <div class="card p-2 text-center" style="background: var(--bg-surface-muted); font-size: 0.82rem;">
        <div><strong>CGNeeti कामसाथी</strong> • वर्जन 2.1.0</div>
        <div class="text-muted mt-1">छत्तीसगढ़ शासन स्थानीय कामगार पहल (प्रोटोटाइप)</div>
      </div>
    </div>
  `;

  openModal("⚙️ एप्लिकेशन सेटिंग्स (Settings)", bodyHTML, `<button class="btn btn-primary" onclick="closeModal()">✓ सहेजें (Save)</button>`);
};

window.toggleSettingTheme = function(isDark) {
  appSettings.theme = isDark ? "dark" : "light";
  localStorage.setItem("cgneeti_theme", appSettings.theme);
  applyGlobalSettings();
  showToast(isDark ? "🌙 डार्क मोड सक्रिय हुआ" : "☀️ लाइट मोड सक्रिय हुआ", "info");
};

window.toggleSettingFontSize = function(isLarge) {
  appSettings.fontSize = isLarge ? "large" : "normal";
  localStorage.setItem("cgneeti_font_size", appSettings.fontSize);
  applyGlobalSettings();
  showToast(isLarge ? "🔤 बड़ा फ़ॉन्ट सेट हुआ" : "🔤 सामान्य फ़ॉन्ट सेट हुआ", "info");
};

window.clearAppCache = function() {
  showToast("✓ ऐप कैशे सफलतापूर्वक साफ़ किया गया!", "success");
};

window.resetDemoAppData = function() {
  if (confirm("क्या आप डेमो डेटा को शुरुआती स्थिति में रीसेट करना चाहते हैं?")) {
    localStorage.clear();
    location.reload();
  }
};

window.handleSidebarLogout = async function() {
  window.closeSidebar();
  if (window.authService) {
    await window.authService.logout();
    window.location.hash = "#/login";
  }
};

// ---------------------------------------------------------------------------
// Role Switcher Handlers (जॉब लेने वाला <-> जॉब देने वाला)
// ---------------------------------------------------------------------------
window.switchRoleAndRefresh = async function(targetRole) {
  if (targetRole !== "worker" && targetRole !== "employer") return;

  const isWorker = targetRole === "worker";

  // 1. Update state
  if (window.appState) {
    window.appState.setRole(targetRole);
  }

  // 2. Sync with authService if present
  if (window.authService) {
    if (window.authService.user) {
      window.authService.user.role = targetRole;
      if (!window.authService.user.profile) {
        window.authService.user.profile = {};
      }
      window.authService.user.profile.user_type = isWorker ? "job_seeker" : "employer";
    }
    if (window.authService.switchRole) {
      try {
        await window.authService.switchRole(targetRole);
      } catch (_) {}
    }
  }

  // 3. Close the sidebar
  window.closeSidebar();

  // 4. Update Shell UI (Navigation bars, header badge, role pills)
  if (window.updateShellUI) {
    window.updateShellUI();
  }

  // 5. Navigate to the appropriate dashboard
  const targetRoute = isWorker ? "#/worker" : "#/employer";
  window.location.hash = targetRoute;

  // 6. Give immediate positive feedback
  const roleName = isWorker ? "Worker (Job Seeker)" : "Employer";
  showToast(`✓ Switched to ${roleName} mode`, "success", 3000);

  // 7. Route handle
  if (window.router && window.router.handleRoute) {
    window.router.handleRoute();
  }
};

window.handleSidebarPurposeClick = function(purpose) {
  window.switchRoleAndRefresh(purpose);
};

window.startCreateProfileForPurpose = function(userType) {
  window.closeSidebar();
  const label = userType === "job_seeker" ? "Job Seeker" : "Employer";
  showToast(`Setting up ${label} profile...`, "info");
  window.location.hash = `#/create-profile?type=${userType}`;
};


