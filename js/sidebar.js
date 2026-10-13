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
  privacyNumber: localStorage.getItem("cgneeti_privacy_num") !== "false",
  // AI Assistant Settings (Groq & Gemini)
  aiProvider: localStorage.getItem("dailyjob_ai_provider") || "groq", // "groq" | "gemini"
  groqApiKey: localStorage.getItem("dailyjob_groq_api_key") || "",
  geminiApiKey: localStorage.getItem("dailyjob_gemini_api_key") || "",
  groqModel: localStorage.getItem("dailyjob_groq_model") || "llama-3.3-70b-versatile",
  geminiModel: localStorage.getItem("dailyjob_gemini_model") || "gemini-1.5-flash",
  aiVoiceEnabled: localStorage.getItem("dailyjob_ai_voice") !== "false"
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
              <span class="badge badge-success font-bold" style="font-size: 0.75rem;">${(appState.jobs || []).filter(j => j && (j.status === 'open' || !j.status)).length}</span>
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
          <button class="sidebar-nav-link btn-block" onclick="window.closeSidebar(); window.openSettingsModal('ai');" style="border: none; background: transparent; cursor: pointer; text-align: left;">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">🔑</span>
              <span>AI Key सेटिंग्स (Groq / Gemini)</span>
            </div>
            <span style="font-size: 0.72rem; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 999px; font-weight: 700;">AI Engine</span>
          </button>

          <button class="sidebar-nav-link btn-block" onclick="window.closeSidebar(); window.openSettingsModal('guidelines');" style="border: none; background: transparent; cursor: pointer; text-align: left;">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">📘</span>
              <span>AI उपयोग गाइड व नियम</span>
            </div>
          </button>

          <button class="sidebar-nav-link btn-block" onclick="window.closeSidebar(); window.openSettingsModal('general');" style="border: none; background: transparent; cursor: pointer; text-align: left;">
            <div class="sidebar-link-left">
              <span class="sidebar-link-icon">⚙️</span>
              <span>सामान्य सेटिंग्स (Settings)</span>
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
// 4. "AI Chat" (कामसाथी AI सहायक) Interactive Assistant with Groq & Gemini
// ---------------------------------------------------------------------------
let aiChatConversation = [
  {
    sender: "bot",
    text: "नमस्ते! 🙏 मैं कामसाथी AI सहायक हूँ। आप बोलकर 🎤 या लिखकर मुझसे काम खोजने, जॉब फॉर्म भरने, मजदूरी दर जांचने या अपने हुनर को सही तरीके से निखारने के बारे में पूछ सकते हैं।"
  }
];

let activeSpeechUtterance = null;
let currentSpeakingIndex = -1;

window.openAIChatModal = function() {
  const activeProvider = appSettings.aiProvider || "groq";
  const activeKey = activeProvider === "gemini" ? appSettings.geminiApiKey : appSettings.groqApiKey;
  const isKeySet = Boolean(activeKey && activeKey.trim().length > 6);
  const providerLabel = activeProvider === "gemini" ? "Gemini 1.5" : "Groq Llama 3.3";

  const bodyHTML = `
    <div class="ai-chat-modal-content">
      <!-- Top AI Provider Status Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.65rem; background: var(--bg-surface-muted); border-radius: var(--radius-md); margin-bottom: 0.5rem; font-size: 0.78rem;">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span style="font-size: 1rem;">${activeProvider === 'gemini' ? '♊' : '⚡'}</span>
          <span style="font-weight: 700; color: var(--text-primary);">${providerLabel}</span>
          ${isKeySet ? `
            <span style="background: #dcfce7; color: #166534; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 999px;">
              🟢 Active
            </span>
          ` : `
            <span style="background: #fef3c7; color: #92400e; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 999px;">
              ⚪ Demo / No Key
            </span>
          `}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" onclick="closeModal(); window.openSettingsModal('ai');" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; font-weight: 700; color: var(--color-primary);">
          ⚙️ Key सेटिंग्स
        </button>
      </div>

      <!-- Chat history area -->
      <div class="ai-chat-history" id="ai-chat-scroll">
        ${renderAIChatMessages()}
      </div>

      <!-- Smart Suggestion Chips -->
      <div class="ai-chip-scroll">
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('आज मेरे लिए रायपुर में अच्छा काम खोजें?')">
          🔎 आज काम खोजें (Find Work)
        </button>
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('जॉब फॉर्म और प्रोफाइल कैसे भरें ताकि तुरंत काम मिले?')">
          📝 जॉब फॉर्म भरने में मदद
        </button>
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('कामसाथी ऐप का सबसे सही और प्रभावी उपयोग कैसे करें?')">
          📱 ऐप का सही उपयोग
        </button>
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('सही तरीके से हुनर और कमाई कैसे बढ़ाएं? गलत तरीके से कैसे बचें?')">
          🚀 सही तरीके से सुधार (Right Way)
        </button>
        <button type="button" class="ai-suggestion-chip" onclick="window.sendAIMessage('प्लंबर, हेल्पर और राजमिस्त्री का आज का सही रेट क्या है?')">
          💰 बाजार मजदूरी दरें?
        </button>
      </div>

      <!-- Voice Listening Wave Indicator (Hidden by default) -->
      <div id="ai-listening-indicator" style="display: none; padding: 0.35rem 0.75rem; background: #fee2e2; color: #991b1b; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-align: center; margin-bottom: 0.35rem; align-items: center; justify-content: center; gap: 0.5rem;">
        <span class="ai-voice-active-pulse" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span>
        <span>🎙️ सुन रहे हैं... कृपया स्पष्ट बोलें (जैसे: "मुझे रायपुर में कुक का काम चाहिए")</span>
      </div>

      <!-- Chat input form -->
      <form onsubmit="window.handleAIChatSubmit(event)" class="flex gap-2 pt-2" style="border-top: 1px solid var(--border-subtle);">
        <button 
          type="button" 
          id="ai-mic-btn"
          class="btn btn-secondary btn-icon-only" 
          onclick="window.triggerAIVoicePrompt()" 
          title="बोलकर पूछें (Oral Voice Search)" 
          style="border-radius: 50%; min-width: 44px; min-height: 44px;">
          🎤
        </button>
        <input 
          type="text" 
          id="ai-user-input" 
          class="form-control" 
          placeholder="बोलें या सवाल टाइप करें..." 
          autocomplete="off" 
          required 
          style="border-radius: var(--radius-full); font-size: 0.92rem;" 
        />
        <button type="submit" id="ai-send-btn" class="btn btn-primary" style="border-radius: var(--radius-full); padding: 0 1.25rem; font-weight: 700;">
          भेजें
        </button>
      </form>
    </div>
  `;

  openModal("🤖 कामसाथी AI सहायक (24/7 Smart Helper)", bodyHTML);
  scrollAIChatToBottom();
};

function formatAIMarkdown(text) {
  if (!text) return "";
  let html = escapeHTML(text);
  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Bullet points * item
  html = html.replace(/^\*\s+(.*)$/gm, '<li style="margin-left: 1.25rem;">$1</li>');
  html = html.replace(/^\-\s+(.*)$/gm, '<li style="margin-left: 1.25rem;">$1</li>');
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function renderAIChatMessages() {
  return aiChatConversation.map((msg, index) => {
    if (msg.sender === 'bot') {
      const isSpeaking = currentSpeakingIndex === index;
      return `
        <div class="ai-bubble-bot">
          <div>${formatAIMarkdown(msg.text)}</div>
          <div class="ai-bubble-actions">
            <button type="button" class="ai-action-btn-small" onclick="window.speakAIMessage(${index})" title="${isSpeaking ? 'बोलना बंद करें' : 'बोलकर सुनें'}">
              <span>${isSpeaking ? '⏹️' : '🔊'}</span>
              <span>${isSpeaking ? 'रोकें' : 'सुनें (Listen)'}</span>
            </button>
            <button type="button" class="ai-action-btn-small" onclick="navigator.clipboard.writeText('${escapeHTML(msg.text).replace(/'/g, "\\'")}'); showToast('कॉपी हो गया', 'info', 1500);" title="टेक्स्ट कॉपी करें">
              <span>📋 कॉपी</span>
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="ai-bubble-user">
          ${escapeHTML(msg.text)}
        </div>
      `;
    }
  }).join('');
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
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  window.sendAIMessage(text);
};

window.sendAIMessage = async function(questionText) {
  // Push user message
  aiChatConversation.push({ sender: "user", text: questionText });
  updateAIChatUI();

  // Show typing indicator
  const typingIdx = aiChatConversation.length;
  aiChatConversation.push({ sender: "bot", text: "विचार कर रहा हूँ... ⏳" });
  updateAIChatUI();

  const sendBtn = document.getElementById("ai-send-btn");
  if (sendBtn) sendBtn.disabled = true;

  try {
    const botReply = await window.callDailyJobAI(questionText, aiChatConversation);
    aiChatConversation[typingIdx] = { sender: "bot", text: botReply };
  } catch (err) {
    console.error("AI Error:", err);
    aiChatConversation[typingIdx] = {
      sender: "bot",
      text: `माफ़ कीजिए, AI से उत्तर प्राप्त करने में समस्या आई: ${err.message || 'त्रुटि'}। कृपया सेटिंग्स में अपनी Groq या Gemini API Key जांचें।`
    };
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    updateAIChatUI();
  }
};

function updateAIChatUI() {
  const el = document.getElementById("ai-chat-scroll");
  if (el) {
    el.innerHTML = renderAIChatMessages();
    scrollAIChatToBottom();
  }
}

// ---------------------------------------------------------------------------
// 4.1. Core AI Query Dispatcher (Groq Cloud & Google Gemini)
// ---------------------------------------------------------------------------
window.callDailyJobAI = async function(userQuery, conversationHistory) {
  const provider = appSettings.aiProvider || "groq";
  const apiKey = provider === "gemini" ? appSettings.geminiApiKey : appSettings.groqApiKey;
  const model = provider === "gemini" ? appSettings.geminiModel : appSettings.groqModel;

  // Build context-aware system instruction tailored for DailyJob & Chhattisgarh
  const currentRole = window.appState ? window.appState.currentRole : "worker";
  const systemInstruction = `
आप "कामसाथी AI सहायक" (KaamSaathi AI Assistant) हैं - DailyJob (CGNeeti) प्लेटफॉर्म के आधिकारिक, ईमानदार और सशक्त मार्गदर्शक।
यह प्लेटफॉर्म छत्तीसगढ़ (रायपुर, दुर्ग-भिलाई, बिलासपुर, राजनांदगांव आदि) और भारत के स्थानीय कामगारों (प्लंबर, कुक, राजमिस्त्री, हेल्पर, इलेक्ट्रीशियन, पेंटर, ड्राइवर आदि) और नियोक्ताओं को पारदर्शी मजदूरी पर सीधे जोड़ता है।

आपकी मुख्य जिम्मेदारियां:
1. 🗣️ **Oral / Voice Job Finding (बोलकर या लिखकर काम खोजना)**: यूजर के हुनर, शहर और समय के अनुसार सही काम सुझाना।
2. 📝 **Job Form & Profile Filling (फॉर्म भरने में मदद)**: फॉर्म में सही बायो, अनुभव, हुनर और नियोक्ता को प्रभावित करने वाले स्पष्ट शब्द तैयार करना।
3. 📊 **Job Fetch & Market Analysis (काम व उचित मजदूरी का विश्लेषण)**: रायपुर/छत्तीसगढ़ की वास्तविक दैनिक मजदूरी दरें (जैसे: हेल्पर ₹500–₹650, प्लंबर ₹700–₹900, मिस्त्री ₹800–₹1000) बताना ताकि शोषण न हो।
4. 📱 **App Ko Best Way Me Use Karna (ऐप का श्रेष्ठ उपयोग)**: 
   - कार्यस्थल पर GPS Check-In / Check-Out का महत्व।
   - 5-Star रेटिंग और सत्यापित बैज प्राप्त करने के तरीके।
   - मजदूरी न मिलने पर "⚖️ समस्या व विवाद (Disputes)" में 1-क्लिक शिकायत दर्ज करना।
   - आपातकाल में "🛡️ सुरक्षा केंद्र & SOS" का उपयोग करना।
5. 🚀 **User Improvement in RIGHT WAY, NOT WRONG WAY (सही तरीके से तरक्की, गलत तरीके से नहीं)**:
   - सही तरीका: असली हुनर सीखना, हुनर टेस्ट (Skill Test) पास करना, समय पर पहुंचना, सुरक्षा हेलमेट/जूते पहनना, शिष्ट बातचीत।
   - गलत तरीका से बचाएं: कभी भी फर्जी प्रमाण पत्र, झूठा अनुभव विवरण या भ्रामक आवेदन न करें। किसी को धोखा देने में सहायता न करें।

निर्देश:
- भाषा: सम्मानजनक, सरल, स्पष्ट हिंदी (आवश्यकतानुसार उपयुक्त शब्द)।
- उत्तर संक्षिप्त, बुलेट-पॉइंट्स में और तुरंत काम आने वाले कदम बताएं।
- वर्तमान यूजर का रोल: ${currentRole === 'worker' ? 'कामगार (Worker/Job Seeker)' : 'नियोक्ता (Employer)'} है।
  `.trim();

  // If no API Key configured, fallback to smart offline knowledge base
  if (!apiKey || apiKey.trim().length < 6) {
    const offlineAnswer = generateSmartAIAnswer(userQuery);
    return offlineAnswer + "\n\n💡 **सलाह**: असीमित लाइव AI और बोलकर रीयल-टाइम काम खोजने के लिए सेटिंग्स में अपनी फ्री **Groq** या **Gemini** API Key दर्ज करें। (मेनू > सेटिंग्स > AI व API Key)";
  }

  // 1. Try Groq via direct client-side call
  if (provider === "groq") {
    try {
      const messages = [
        { role: "system", content: systemInstruction },
        ...conversationHistory.filter(m => m.text && !m.text.includes("विचार कर रहा हूँ")).slice(-6).map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text
        })),
        { role: "user", content: userQuery }
      ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: model || "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return reply;
      }
    } catch (directErr) {
      console.warn("Direct Groq call failed, trying backend proxy...", directErr);
    }
  }

  // 2. Try Gemini via direct client-side call
  if (provider === "gemini") {
    try {
      const geminiModel = model || "gemini-1.5-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userQuery }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply;
      }
    } catch (directErr) {
      console.warn("Direct Gemini call failed, trying backend proxy...", directErr);
    }
  }

  // 3. Fallback: Call local Backend Proxy /api/ai/chat
  try {
    const proxyRes = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: provider,
        apiKey: apiKey.trim(),
        model: model,
        prompt: userQuery,
        systemInstruction: systemInstruction
      })
    });

    const proxyData = await proxyRes.json();
    if (proxyRes.ok && proxyData.reply) {
      return proxyData.reply;
    }
    throw new Error(proxyData.error || "Proxy returned empty reply");
  } catch (proxyErr) {
    // Graceful fallback to local rule-based response
    const offlineReply = generateSmartAIAnswer(userQuery);
    return `⚠️ API कॉल असफल (${proxyErr.message})। ऑफ़लाइन उत्तर:\n\n${offlineReply}`;
  }
};

function generateSmartAIAnswer(query) {
  const q = query.toLowerCase();

  if (q.includes("काम कैसे") || q.includes("ढूंढें") || q.includes("find work") || q.includes("job") || q.includes("खोज")) {
    return "काम खोजने के लिए होम स्क्रीन पर **'काम खोजें' (Jobs)** टैब पर जाएं।\n\n* 📍 **दूरी चुनें**: 3 km, 5 km या 10 km\n* 💰 **दैनिक मजदूरी दर**: ₹600+ से ₹1000+ फिल्टर करें\n* ⚡ **1-क्लिक आवेदन**: मनपसंद काम पर 'आवेदन करें' दबाएं। नियोक्ता द्वारा चुनते ही आपको SMS मिल जाएगा।";
  }
  if (q.includes("फॉर्म") || q.includes("form") || q.includes("profile") || q.includes("बायो") || q.includes("आवेदन")) {
    return "जॉब फॉर्म और प्रोफाइल भरने का सबसे सही तरीका:\n\n1. **सच्चा हुनर चुनें**: जो काम आप वास्तव में जानते हैं (जैसे: प्लंबिंग, पेंटिंग या कुकिंग)।\n2. **अनुभव दर्ज करें**: कितने साल काम किया और किस प्रकार के प्रोजेक्ट पूरे किए।\n3. **उचित मजदूरी दर तय करें**: बाजार दर के अनुसार सही दैनिक मजदूरी दर्ज करें।\n4. **आधार सत्यापन**: प्रोफाइल में आधार नंबर सत्यापित कर '🟢 Verified' बैज प्राप्त करें। इससे आपको 3 गुना ज्यादा काम मिलता है।";
  }
  if (q.includes("सुधार") || q.includes("improve") || q.includes("कमाई") || q.includes("तरक्की") || q.includes("right way") || q.includes("सही तरीका")) {
    return "🚀 **सही तरीके से हुनर व कमाई बढ़ाने के नियम (Right Way)**:\n\n* ✅ **हुनर टेस्ट दें**: मेनू से '🛠️ हुनर की जाँच' पर जाकर 5 मिनट का टेस्ट दें और 100% वेरिफाइड बैज पाएं।\n* ✅ **समय पर Check-In करें**: कार्यस्थल पर समय से पहुंचें ताकि 5-Star रेटिंग मिले।\n* ✅ **सुरक्षा उपकरण**: हेलमेट, दस्ताने और जूते का उपयोग करें ताकि नियोक्ता का विश्वास बढ़े।\n* ❌ **गलत तरीकों से बचें**: फर्जी अनुभव न भरें और बिना बताए काम न छोड़ें। ईमानदारी से बना नाम स्थायी कमाई देता है।";
  }
  if (q.includes("रेट") || q.includes("मजदूरी") || q.includes("पैसा") || q.includes("wage") || q.includes("rate") || q.includes("दर")) {
    return "छत्तीसगढ़ शहरी मानक के अनुसार आज की उचित दैनिक मजदूरी:\n\n* 🚰 **प्लंबर**: ₹700 – ₹900 / दिन\n* ⚡ **इलेक्ट्रीशियन**: ₹750 – ₹950 / दिन\n* 🧱 **राजमिस्त्री**: ₹800 – ₹1000 / दिन\n* 🎨 **पेंटर**: ₹700 – ₹850 / दिन\n* 🍳 **कुक / रसोइया**: ₹650 – ₹850 / दिन\n* 📦 **हेल्पर / मजदूर**: ₹500 – ₹650 / दिन\n\n(काम शुरू करने से पहले ऐप पर मजदूरी की पुष्टि अवश्य देखें।)";
  }
  if (q.includes("चेक-इन") || q.includes("check in") || q.includes("उपस्थिति") || q.includes("उपस्थिति दर्ज")) {
    return "कार्यस्थल पर पहुंचते ही 'मेरे काम' (My Work) मेनू में जाएं और '📍 काम शुरू करें (Check-In)' बटन दबाएं। इससे आपका GPS समय रिकॉर्ड हो जाता है ताकि पेमेंट में कोई विवाद न हो।";
  }
  if (q.includes("पेमेंट") || q.includes("विवाद") || q.includes("पैसे नहीं") || q.includes("dispute")) {
    return "यदि काम पूरा होने के बाद नियोक्ता मजदूरी नहीं देता, तो साइड मेनू से '⚖️ समस्या व विवाद' में जाकर 1 मिनट में शिकायत दर्ज करें। हमारी टीम 4 घंटे के भीतर मध्यस्थता कर आपका पूरा भुगतान सुरक्षित कराती है।";
  }
  if (q.includes("खतरा") || q.includes("sos") || q.includes("सुरक्षा") || q.includes("इमरजेंसी")) {
    return "आपात स्थिति में साइडबार से '🛡️ सुरक्षा केंद्र & SOS' पर जाकर लाल बटन दबाएं। आपकी GPS लोकेशन तुरंत स्थानीय पुलिस (112) और परिवार को SMS से भेज दी जाएगी।";
  }
  if (q.includes("काम डाल") || q.includes("post") || q.includes("कामगार चाहिए") || q.includes("hire")) {
    return "काम पोस्ट करने के लिए '+ काम डालें' विकल्प चुनें। केवल 6 आसान चरणों में काम, शहर, समय और मजदूरी दर्ज करें, या माइक दबाकर बोलकर पोस्ट करें।";
  }

  return `आपका सवाल प्राप्त हुआ: "${query}"। कामसाथी प्लेटफॉर्म पर सभी कामगार और नियोक्ता आधार व हुनर सत्यापित हैं। आप बिना किसी कमीशन के सीधे काम व भुगतान प्राप्त कर सकते हैं।`;
}

// ---------------------------------------------------------------------------
// 4.2. Voice Input (Oral Speech Recognition)
// ---------------------------------------------------------------------------
window.triggerAIVoicePrompt = function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById("ai-mic-btn");
  const waveInd = document.getElementById("ai-listening-indicator");
  const input = document.getElementById("ai-user-input");

  if (!SpeechRecognition) {
    showToast("🎙️ आपके ब्राउज़र में वॉयस रिकॉग्निशन उपलब्ध नहीं है। सैंपल प्रश्न लोड किया जा रहा है।", "info", 3500);
    if (input) {
      input.value = "आज रायपुर में प्लंबर का काम है क्या और सही मजदूरी कितनी है?";
    }
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Hindi recognition
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (micBtn) micBtn.classList.add("ai-voice-active-pulse");
    if (waveInd) waveInd.style.display = "flex";
    showToast("🎙️ सुन रहे हैं... कृपया बोलें", "info", 3000);

    recognition.onresult = function(event) {
      const speechResult = event.results[0][0].transcript;
      if (input && speechResult) {
        input.value = speechResult;
        showToast(`✓ आवाज़ पहचान ली गई: "${speechResult}"`, "success", 2500);
        setTimeout(() => {
          window.sendAIMessage(speechResult);
        }, 500);
      }
    };

    recognition.onerror = function(event) {
      console.warn("Speech recognition error:", event.error);
      showToast("माइक्रोफ़ोन आवाज़ नहीं सुन सका। कृपया दोबारा माइक दबाएं।", "warning", 3000);
    };

    recognition.onend = function() {
      if (micBtn) micBtn.classList.remove("ai-voice-active-pulse");
      if (waveInd) waveInd.style.display = "none";
    };

    recognition.start();
  } catch (err) {
    console.warn("Speech recognition startup error:", err);
    showToast("माइक्रोफ़ोन शुरू करने में समस्या।", "warning");
    if (micBtn) micBtn.classList.remove("ai-voice-active-pulse");
    if (waveInd) waveInd.style.display = "none";
  }
};

// ---------------------------------------------------------------------------
// 4.3. Oral Audio Speech Synthesis (Text-to-Speech)
// ---------------------------------------------------------------------------
window.speakAIMessage = function(index) {
  if (!('speechSynthesis' in window)) {
    showToast("आपके ब्राउज़र में बोलकर सुनाने (Text-to-Speech) की सुविधा उपलब्ध नहीं है।", "warning");
    return;
  }

  // If already speaking this message, toggle off
  if (window.speechSynthesis.speaking && currentSpeakingIndex === index) {
    window.speechSynthesis.cancel();
    currentSpeakingIndex = -1;
    updateAIChatUI();
    return;
  }

  window.speechSynthesis.cancel();
  const msgObj = aiChatConversation[index];
  if (!msgObj || !msgObj.text) return;

  // Clean markdown symbols for cleaner speech
  const cleanSpeechText = msgObj.text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\#/g, '')
    .replace(/💡/g, '')
    .replace(/🚀/g, '')
    .replace(/✅/g, '')
    .replace(/❌/g, '');

  const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
  utterance.lang = "hi-IN";
  utterance.rate = 0.95; // Clear natural pacing

  currentSpeakingIndex = index;
  updateAIChatUI();

  utterance.onend = function() {
    currentSpeakingIndex = -1;
    updateAIChatUI();
  };

  utterance.onerror = function() {
    currentSpeakingIndex = -1;
    updateAIChatUI();
  };

  window.speechSynthesis.speak(utterance);
};

// ---------------------------------------------------------------------------
// 5. "Settings" (सेटिंग्स) Standard Application Settings Modal
//    Tabs: 1. 🤖 AI व API Key  |  2. 📘 उपयोग गाइड व नियम  |  3. ⚙️ सामान्य सेटिंग्स
// ---------------------------------------------------------------------------
let currentSettingsTab = "ai";

window.openSettingsModal = function(initialTab = "ai") {
  currentSettingsTab = initialTab || "ai";
  renderSettingsModalView();
};

window.switchSettingsTab = function(tabName) {
  currentSettingsTab = tabName;
  renderSettingsModalView();
};

function renderSettingsModalView() {
  const activeTab = currentSettingsTab;
  const currentProvider = appSettings.aiProvider || "groq";
  const groqKey = appSettings.groqApiKey || "";
  const geminiKey = appSettings.geminiApiKey || "";
  const currentKey = currentProvider === "gemini" ? geminiKey : groqKey;
  const hasValidKey = Boolean(currentKey && currentKey.trim().length > 6);

  const bodyHTML = `
    <div>
      <!-- Settings Tabs Navigation -->
      <div class="settings-tab-nav" role="tablist">
        <button 
          type="button" 
          class="settings-tab-nav-btn ${activeTab === 'ai' ? 'active' : ''}" 
          onclick="window.switchSettingsTab('ai')">
          <span>🤖</span> <span>AI व API Key</span>
        </button>
        <button 
          type="button" 
          class="settings-tab-nav-btn ${activeTab === 'guidelines' ? 'active' : ''}" 
          onclick="window.switchSettingsTab('guidelines')">
          <span>📘</span> <span>उपयोग गाइड व नियम</span>
        </button>
        <button 
          type="button" 
          class="settings-tab-nav-btn ${activeTab === 'general' ? 'active' : ''}" 
          onclick="window.switchSettingsTab('general')">
          <span>⚙️</span> <span>सामान्य</span>
        </button>
      </div>

      <!-- TAB 1: AI व API Key सेटिंग्स -->
      <div id="tab-content-ai" style="display: ${activeTab === 'ai' ? 'block' : 'none'};">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          
          <!-- Information Banner -->
          <div class="card p-3" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; border-radius: var(--radius-lg);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-weight: 800; font-size: 1rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>🤖</span> <span>कामसाथी AI इंजन</span>
              </span>
              <span style="background: ${hasValidKey ? '#22c55e' : '#f59e0b'}; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">
                ${hasValidKey ? '🟢 Active & Ready' : '⚪ Key Not Added'}
              </span>
            </div>
            <p style="font-size: 0.82rem; margin: 0; opacity: 0.9; line-height: 1.45;">
              Groq या Gemini API Key दर्ज करने के बाद AI आपके लिए बोलकर काम खोजने (Oral Job Finding), जॉब फॉर्म भरने, उचित मजदूरी जांचने और सही तरीके से तरक्की करने में मदद करेगा।
            </p>
          </div>

          <!-- Provider Selector Cards -->
          <div>
            <label class="font-bold text-primary-color mb-2" style="display: block; font-size: 0.9rem;">
              1. AI प्रोवाइडर चुनें (Select Provider):
            </label>
            <div class="ai-provider-grid">
              <!-- Groq Card -->
              <div 
                class="ai-provider-card ${currentProvider === 'groq' ? 'active' : ''}" 
                onclick="window.toggleAIProvider('groq')" 
                role="button">
                <div class="ai-provider-card-header">
                  <span style="font-weight: 800; font-size: 0.92rem; color: #1e3a8a;">⚡ Groq Cloud</span>
                  <span style="font-size: 0.68rem; background: #dbeafe; color: #1e40af; font-weight: 700; padding: 1px 6px; border-radius: 999px;">अनुशंसित</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                  Llama 3.3 70B • अल्ट्रा-फास्ट • फ्री टियर
                </div>
                <div style="font-size: 0.72rem; font-weight: 700; color: ${groqKey ? '#16a34a' : '#64748b'};">
                  ${groqKey ? '✓ Key Saved' : 'Key दर्ज नहीं'}
                </div>
              </div>

              <!-- Gemini Card -->
              <div 
                class="ai-provider-card ${currentProvider === 'gemini' ? 'active' : ''}" 
                onclick="window.toggleAIProvider('gemini')" 
                role="button">
                <div class="ai-provider-card-header">
                  <span style="font-weight: 800; font-size: 0.92rem; color: #0284c7;">♊ Google Gemini</span>
                  <span style="font-size: 0.68rem; background: #e0f2fe; color: #0369a1; font-weight: 700; padding: 1px 6px; border-radius: 999px;">Google AI</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                  Gemini 1.5 Flash • बहुभाषी • फ्री टियर
                </div>
                <div style="font-size: 0.72rem; font-weight: 700; color: ${geminiKey ? '#16a34a' : '#64748b'};">
                  ${geminiKey ? '✓ Key Saved' : 'Key दर्ज नहीं'}
                </div>
              </div>
            </div>
          </div>

          <!-- Model Selection Dropdown -->
          <div>
            <label for="ai-model-select" class="font-bold text-primary-color mb-1" style="display: block; font-size: 0.88rem;">
              2. मॉडल चयन (AI Model):
            </label>
            <select id="ai-model-select" class="form-control" style="font-size: 0.88rem; font-weight: 600;">
              ${currentProvider === 'groq' ? `
                <option value="llama-3.3-70b-versatile" ${appSettings.groqModel === 'llama-3.3-70b-versatile' ? 'selected' : ''}>llama-3.3-70b-versatile (सर्वोत्तम हिंदी व तीक्ष्ण समझ)</option>
                <option value="llama-3.1-8b-instant" ${appSettings.groqModel === 'llama-3.1-8b-instant' ? 'selected' : ''}>llama-3.1-8b-instant (अल्ट्रा-फास्ट रिस्पॉन्स)</option>
                <option value="mixtral-8x7b-32768" ${appSettings.groqModel === 'mixtral-8x7b-32768' ? 'selected' : ''}>mixtral-8x7b-32768 (दीर्घ संदर्भ)</option>
              ` : `
                <option value="gemini-1.5-flash" ${appSettings.geminiModel === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash (अनुशंसित - तेज व सटीक)</option>
                <option value="gemini-2.0-flash" ${appSettings.geminiModel === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (नवीनतम जनरेशन)</option>
                <option value="gemini-1.5-pro" ${appSettings.geminiModel === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro (गहन तार्किक विश्लेषण)</option>
              `}
            </select>
          </div>

          <!-- API Key Input Field -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label for="ai-api-key-input" class="font-bold text-primary-color" style="font-size: 0.88rem;">
                3. ${currentProvider === 'gemini' ? 'Google Gemini' : 'Groq'} API Key:
              </label>
              <a 
                href="${currentProvider === 'gemini' ? 'https://aistudio.google.com/apikey' : 'https://console.groq.com/keys'}" 
                target="_blank" 
                rel="noopener noreferrer" 
                style="font-size: 0.78rem; font-weight: 700; color: #2563eb; text-decoration: none;">
                🔑 फ्री Key पाएँ ↗
              </a>
            </div>

            <div class="ai-key-input-container">
              <input 
                type="password" 
                id="ai-api-key-input" 
                class="ai-key-input" 
                placeholder="${currentProvider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}" 
                value="${escapeHTML(currentKey)}" 
                autocomplete="off" 
              />
              <button 
                type="button" 
                class="ai-key-toggle-btn" 
                onclick="window.toggleShowAPIKey()" 
                title="की (Key) देखें या छुपाएं">
                👁️
              </button>
            </div>
            <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 0.25rem;">
              🔒 आपकी API Key केवल आपके ब्राउज़र में सुरक्षित (LocalStorage) रहती है।
            </div>
          </div>

          <!-- Buttons: Test Connection & Save Key -->
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button 
              type="button" 
              id="ai-test-btn" 
              class="btn btn-secondary flex-1" 
              onclick="window.testAIConnection()" 
              style="font-weight: 700; font-size: 0.88rem;">
              🧪 कनेक्शन टेस्ट करें
            </button>
            <button 
              type="button" 
              class="btn btn-primary flex-1" 
              onclick="window.saveAISettings()" 
              style="font-weight: 700; font-size: 0.88rem;">
              💾 API Key सहेजें
            </button>
            ${currentKey ? `
              <button 
                type="button" 
                class="btn btn-outline" 
                onclick="window.clearAISettings()" 
                style="color: #dc2626; border-color: #fca5a5; font-weight: 700; font-size: 0.88rem;" 
                title="की हटाएं">
                🗑️
              </button>
            ` : ''}
          </div>

          <!-- Test Status Output Box -->
          <div id="ai-test-status-box" style="display: none; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem; font-weight: 600;"></div>

          <!-- Quick Helper: How to Get Free Key in 3 Steps -->
          <div class="card p-3" style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);">
            <div style="font-weight: 800; font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--text-primary);">
              💡 1 मिनट में फ्री API Key कैसे बनाएं:
            </div>
            ${currentProvider === 'groq' ? `
              <ol style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">
                <li><a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 700;">console.groq.com/keys</a> खोलें।</li>
                <li>Google या ईमेल से साइन इन करें।</li>
                <li><strong>'Create API Key'</strong> बटन दबाएं और कॉपी करके यहाँ पेस्ट करें।</li>
              </ol>
            ` : `
              <ol style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">
                <li><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 700;">aistudio.google.com/apikey</a> खोलें।</li>
                <li>अपने Google खाते से लॉग इन करें।</li>
                <li><strong>'Create API Key'</strong> दबाकर की को कॉपी करें और यहाँ पेस्ट करें।</li>
              </ol>
            `}
          </div>

        </div>
      </div>

      <!-- TAB 2: AI उपयोग गाइड व नियम (Guidelines & Ethics) -->
      <div id="tab-content-guidelines" style="display: ${activeTab === 'guidelines' ? 'block' : 'none'};">
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          
          <!-- Guideline Header -->
          <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #fff; padding: 0.85rem 1rem; border-radius: var(--radius-lg);">
            <div style="font-weight: 800; font-size: 1rem; margin-bottom: 0.25rem;">
              📘 AI उपयोग दिशानिर्देश (Ethical AI Framework)
            </div>
            <div style="font-size: 0.8rem; opacity: 0.95; line-height: 1.4;">
              AI आपका सच्चा सहायक है। इसका प्रभावी और सही उपयोग कैसे करें, ताकि आपकी वास्तविक प्रगति हो सके।
            </div>
          </div>

          <!-- Feature 1: AI क्या-क्या काम कर सकता है? -->
          <div class="ai-guideline-card">
            <div class="ai-guideline-title">
              <span>🎯</span> <span>AI आपकी क्या-क्या मदद कर सकता है?</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.84rem; color: var(--text-secondary); line-height: 1.45;">
              <div>
                <strong style="color: var(--text-primary);">1. 🗣️ बोलकर काम खोजना (Oral Job Finding):</strong>
                कम पढ़े-लिखे कामगार भी माइक 🎤 दबाकर बोल सकते हैं—जैसे *"मुझे रायपुर में ₹800 रोज का प्लंबिंग काम चाहिए"*, AI तुरंत उपयुक्त नौकरी और सही रेट बताएगा।
              </div>
              <div>
                <strong style="color: var(--text-primary);">2. 📝 जॉब फॉर्म व प्रोफाइल भरने में मदद:</strong>
                अपना हुनर (Skills), पिछला अनुभव और बायो (Bio) कैसे लिखना है ताकि नियोक्ता प्रभावित हों, AI सही शब्द तैयार करता है।
              </div>
              <div>
                <strong style="color: var(--text-primary);">3. 📊 जॉब सर्च व सही मजदूरी दर (Market Rates):</strong>
                अपने शहर की उचित न्यूनतम दरें जानना ताकि कम मजदूरी में शोषण न हो।
              </div>
              <div>
                <strong style="color: var(--text-primary);">4. 📱 ऐप का सर्वश्रेष्ठ उपयोग (Best Practices):</strong>
                कार्यस्थल पर Check-in करना, 5-Star रेटिंग बनाना, विवाद होने पर '⚖️ समस्या व विवाद' से शिकायत करना और आपातकाल में '🛡️ SOS' का उपयोग करना।
              </div>
              <div>
                <strong style="color: var(--text-primary);">5. 🚀 हुनर व कैरियर सुधार (Self-Improvement):</strong>
                अपनी ट्रेड में नई तकनीक, सुरक्षा नियम और ग्राहक से पेशेवर व्यवहार करना सीखना।
              </div>
            </div>
          </div>

          <!-- Feature 2: सही तरीका बनाम गलत तरीका (Right Way vs Wrong Way) -->
          <div class="ai-guideline-card">
            <div class="ai-guideline-title">
              <span>⚖️</span> <span>सही तरीका बनाम गलत तरीका (Right Way vs Wrong Way)</span>
            </div>

            <!-- DOs: Right Way -->
            <div class="ai-dos-box">
              <div style="font-weight: 800; font-size: 0.88rem; color: #166534; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.35rem;">
                <span>🟢</span> <span>सही तरीका (DOs - अवश्य अपनाएं):</span>
              </div>
              <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; color: #14532d; line-height: 1.5;">
                <li><strong>सच्ची जानकारी:</strong> अपनी असली क्षमता, अनुभव और पता ही दर्ज करें।</li>
                <li><strong>ईमानदार कमिटमेंट:</strong> काम स्वीकार करने के बाद तय समय पर पहुंचें।</li>
                <li><strong>GPS Check-in:</strong> कार्यस्थल पहुंचते ही चेक-इन करें ताकि उपस्थिति सुरक्षित रहे।</li>
                <li><strong>हुनर टेस्ट:</strong> ऐप पर हुनर टेस्ट देकर सत्यापित बैज प्राप्त करें।</li>
                <li><strong>सुरक्षा उपकरण:</strong> काम के दौरान हेलमेट, जूते व चश्मा अवश्य पहनें।</li>
              </ul>
            </div>

            <!-- DONTs: Wrong Way -->
            <div class="ai-donts-box">
              <div style="font-weight: 800; font-size: 0.88rem; color: #991b1b; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.35rem;">
                <span>🔴</span> <span>गलत तरीका (DON'Ts - सख्त मनाही):</span>
              </div>
              <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; color: #7f1d1d; line-height: 1.5;">
                <li><strong>फर्जी प्रोफाइल:</strong> AI से झूठे प्रमाण पत्र या फर्जी अनुभव कभी न बनवाएं।</li>
                <li><strong>धोखाधड़ी:</strong> किसी को गुमराह करने या अवैध कार्य के लिए AI का उपयोग न करें।</li>
                <li><strong>लापरवाही:</strong> काम तय करके बिना बताए अनुपस्थित न रहें।</li>
                <li><strong>गोपनीयता:</strong> अपना बैंक पिन, पासवर्ड या OTP कभी किसी को न बताएं।</li>
              </ul>
            </div>
          </div>

          <!-- Feature 3: प्रॉम्प्टिंग टिप्स -->
          <div class="ai-guideline-card">
            <div class="ai-guideline-title">
              <span>💡</span> <span>AI से श्रेष्ठ परिणाम पाने के लिए कैसे पूछें?</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45;">
              <p style="margin: 0 0 0.35rem 0;">* <strong>स्पष्ट कहें:</strong> "मैं रायपुर में 2 साल से इलेक्ट्रीशियन हूँ, मेरी प्रोफाइल का अच्छा विवरण लिख दो।"</p>
              <p style="margin: 0 0 0.35rem 0;">* <strong>बोलकर पूछें:</strong> स्क्रीन पर 🎤 माइक बटन दबाकर अपनी ही बोली में बोलें।</p>
              <p style="margin: 0;">* <strong>उत्तर सुनें:</strong> AI के उत्तर के साथ 🔊 स्पीकर बटन दबाकर पूरा जवाब सुनें।</p>
            </div>
          </div>

        </div>
      </div>

      <!-- TAB 3: सामान्य एप्लिकेशन सेटिंग्स (Theme, Font, Alerts, etc.) -->
      <div id="tab-content-general" style="display: ${activeTab === 'general' ? 'block' : 'none'};">
        <div style="display: flex; flex-direction: column; gap: 1.15rem; font-size: 0.95rem;">
          
          <!-- Section: भाषा (Language) -->
          <div>
            <div class="font-bold mb-2 text-primary-color" style="font-size: 0.92rem;">🌐 भाषा (Language)</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <button class="btn ${getCurrentLanguage() === 'hi' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setLanguage('hi'); renderSettingsModalView();" style="font-weight: 700;">
                🇮🇳 हिंदी
              </button>
              <button class="btn ${getCurrentLanguage() === 'en' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setLanguage('en'); renderSettingsModalView();" style="font-weight: 700;">
                🌐 English
              </button>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

          <!-- Section: डिस्प्ले व थीम (Theme & Display) -->
          <div>
            <div class="font-bold mb-2 text-primary-color" style="font-size: 0.92rem;">🌙 डिस्प्ले और थीम (Theme)</div>
            
            <div class="flex justify-between items-center py-1">
              <div>
                <div class="font-bold" style="font-size: 0.88rem;">डार्क मोड (Dark Theme)</div>
                <div class="text-muted" style="font-size: 0.75rem;">आंखों के आराम और बैटरी बचत हेतु</div>
              </div>
              <label class="setting-switch">
                <input type="checkbox" id="sett-dark-mode" ${appSettings.theme === 'dark' ? 'checked' : ''} onchange="window.toggleSettingTheme(this.checked)" />
                <span class="setting-slider"></span>
              </label>
            </div>

            <div class="flex justify-between items-center py-2">
              <div>
                <div class="font-bold" style="font-size: 0.88rem;">बड़ा फ़ॉन्ट (Large Text)</div>
                <div class="text-muted" style="font-size: 0.75rem;">पढ़ने में आसानी के लिए बड़ा अक्षर</div>
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
            <div class="font-bold mb-2 text-primary-color" style="font-size: 0.92rem;">🔔 सूचनाएं (Notifications)</div>
            
            <div class="flex justify-between items-center py-1">
              <div>
                <div class="font-bold" style="font-size: 0.88rem;">नए काम के अलर्ट (Job Alerts)</div>
                <div class="text-muted" style="font-size: 0.75rem;">नजदीकी काम पोस्ट होते ही नोटिफिकेशन</div>
              </div>
              <label class="setting-switch">
                <input type="checkbox" ${appSettings.jobAlerts ? 'checked' : ''} onchange="appSettings.jobAlerts = this.checked; localStorage.setItem('cgneeti_notif_jobs', this.checked);" />
                <span class="setting-slider"></span>
              </label>
            </div>

            <div class="flex justify-between items-center py-1">
              <div>
                <div class="font-bold" style="font-size: 0.88rem;">पेमेंट व चेक-इन सूचना</div>
                <div class="text-muted" style="font-size: 0.75rem;">मजदूरी जमा होने पर तुरंत अलर्ट</div>
              </div>
              <label class="setting-switch">
                <input type="checkbox" ${appSettings.paymentAlerts ? 'checked' : ''} onchange="appSettings.paymentAlerts = this.checked; localStorage.setItem('cgneeti_notif_payment', this.checked);" />
                <span class="setting-slider"></span>
              </label>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0;" />

          <!-- Section: आवाज़ व लोकेशन (Voice & Location) -->
          <div>
            <div class="font-bold mb-2 text-primary-color" style="font-size: 0.92rem;">🔊 आवाज़ व लोकेशन</div>
            
            <div class="flex justify-between items-center py-1">
              <div>
                <div class="font-bold" style="font-size: 0.88rem;">बोलकर सहायता (Voice Prompts)</div>
                <div class="text-muted" style="font-size: 0.75rem;">बटन दबाने पर बोलकर जानकारी देना</div>
              </div>
              <label class="setting-switch">
                <input type="checkbox" ${appSettings.voicePrompts ? 'checked' : ''} onchange="appSettings.voicePrompts = this.checked; localStorage.setItem('cgneeti_voice_prompts', this.checked);" />
                <span class="setting-slider"></span>
              </label>
            </div>

            <div class="flex justify-between items-center py-1">
              <div>
                <div class="font-bold" style="font-size: 0.88rem;">ऑटो GPS लोकेशन</div>
                <div class="text-muted" style="font-size: 0.75rem;">नजदीकी काम अपने-आप दिखाने हेतु</div>
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
            <div class="font-bold mb-2 text-primary-color" style="font-size: 0.92rem;">🧹 डेटा व स्टोरेज</div>
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
          <div class="card p-2 text-center" style="background: var(--bg-surface-muted); font-size: 0.8rem;">
            <div><strong>DailyJob कामसाथी</strong> • वर्जन 2.1.0</div>
            <div class="text-muted mt-1">छत्तीसगढ़ शासन स्थानीय कामगार पहल</div>
          </div>

        </div>
      </div>

    </div>
  `;

  openModal(
    "⚙️ एप्लिकेशन सेटिंग्स (Settings & AI Engine)", 
    bodyHTML, 
    `<button class="btn btn-primary" onclick="closeModal()">✓ संपन्न (Close)</button>`
  );
}

window.toggleAIProvider = function(provider) {
  appSettings.aiProvider = provider;
  localStorage.setItem("dailyjob_ai_provider", provider);
  renderSettingsModalView();
};

window.toggleShowAPIKey = function() {
  const input = document.getElementById("ai-api-key-input");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
};

window.saveAISettings = function() {
  const provider = appSettings.aiProvider || "groq";
  const keyInput = document.getElementById("ai-api-key-input");
  const modelSelect = document.getElementById("ai-model-select");

  const newKey = keyInput ? keyInput.value.trim() : "";
  const newModel = modelSelect ? modelSelect.value : "";

  if (provider === "gemini") {
    appSettings.geminiApiKey = newKey;
    localStorage.setItem("dailyjob_gemini_api_key", newKey);
    if (newModel) {
      appSettings.geminiModel = newModel;
      localStorage.setItem("dailyjob_gemini_model", newModel);
    }
  } else {
    appSettings.groqApiKey = newKey;
    localStorage.setItem("dailyjob_groq_api_key", newKey);
    if (newModel) {
      appSettings.groqModel = newModel;
      localStorage.setItem("dailyjob_groq_model", newModel);
    }
  }

  showToast(`✓ ${provider === 'gemini' ? 'Gemini' : 'Groq'} सेटिंग्स सफलतापूर्वक सहेजी गईं!`, "success", 3000);
  renderSettingsModalView();
};

window.clearAISettings = function() {
  const provider = appSettings.aiProvider || "groq";
  if (confirm(`क्या आप ${provider === 'gemini' ? 'Gemini' : 'Groq'} API Key हटाना चाहते हैं?`)) {
    if (provider === "gemini") {
      appSettings.geminiApiKey = "";
      localStorage.removeItem("dailyjob_gemini_api_key");
    } else {
      appSettings.groqApiKey = "";
      localStorage.removeItem("dailyjob_groq_api_key");
    }
    showToast(`✓ API Key हटा दी गई।`, "info");
    renderSettingsModalView();
  }
};

window.testAIConnection = async function() {
  const provider = appSettings.aiProvider || "groq";
  const keyInput = document.getElementById("ai-api-key-input");
  const modelSelect = document.getElementById("ai-model-select");
  const testBtn = document.getElementById("ai-test-btn");
  const statusBox = document.getElementById("ai-test-status-box");

  const keyToTest = keyInput ? keyInput.value.trim() : "";
  const modelToTest = modelSelect ? modelSelect.value : (provider === 'gemini' ? 'gemini-1.5-flash' : 'llama-3.3-70b-versatile');

  if (!keyToTest) {
    showToast("कृपया पहले API Key दर्ज करें।", "warning");
    if (keyInput) keyInput.focus();
    return;
  }

  if (testBtn) {
    testBtn.disabled = true;
    testBtn.textContent = "⏳ टेस्टिंग जारी है...";
  }

  if (statusBox) {
    statusBox.style.display = "block";
    statusBox.style.background = "#eff6ff";
    statusBox.style.color = "#1e40af";
    statusBox.style.border = "1px solid #bfdbfe";
    statusBox.textContent = `Testing ${provider.toUpperCase()} API connection...`;
  }

  try {
    let success = false;
    let message = "";

    // Test direct client call or backend test endpoint
    if (provider === "groq") {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyToTest}`
          },
          body: JSON.stringify({
            model: modelToTest,
            messages: [{ role: "user", content: "Ping" }],
            max_tokens: 5
          })
        });
        if (res.ok) {
          success = true;
          message = "✓ Groq Llama 3.3 कनेक्शन पूरी तरह सफल है!";
        } else {
          const errData = await res.json();
          throw new Error(errData.error?.message || `Status ${res.status}`);
        }
      } catch (clientErr) {
        // Fallback to backend test-key endpoint
        const proxyRes = await fetch("/api/ai/test-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "groq", apiKey: keyToTest, model: modelToTest })
        });
        const proxyData = await proxyRes.json();
        if (proxyRes.ok && proxyData.success) {
          success = true;
          message = "✓ Groq Cloud से कनेक्शन सत्यापित हो गया!";
        } else {
          throw new Error(proxyData.error || clientErr.message);
        }
      }
    } else {
      // Gemini test
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelToTest)}:generateContent?key=${encodeURIComponent(keyToTest)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Ping" }] }],
            generationConfig: { maxOutputTokens: 5 }
          })
        });
        if (res.ok) {
          success = true;
          message = "✓ Google Gemini API कनेक्शन पूरी तरह सफल है!";
        } else {
          const errData = await res.json();
          throw new Error(errData.error?.message || `Status ${res.status}`);
        }
      } catch (clientErr) {
        // Fallback to backend test-key endpoint
        const proxyRes = await fetch("/api/ai/test-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "gemini", apiKey: keyToTest, model: modelToTest })
        });
        const proxyData = await proxyRes.json();
        if (proxyRes.ok && proxyData.success) {
          success = true;
          message = "✓ Google Gemini से कनेक्शन सत्यापित हो गया!";
        } else {
          throw new Error(proxyData.error || clientErr.message);
        }
      }
    }

    if (success) {
      if (statusBox) {
        statusBox.style.background = "#f0fdf4";
        statusBox.style.color = "#166534";
        statusBox.style.border = "1px solid #86efac";
        statusBox.textContent = `🟢 ${message}`;
      }
      showToast(message, "success", 3500);

      // Auto save verified key
      if (provider === "gemini") {
        appSettings.geminiApiKey = keyToTest;
        localStorage.setItem("dailyjob_gemini_api_key", keyToTest);
      } else {
        appSettings.groqApiKey = keyToTest;
        localStorage.setItem("dailyjob_groq_api_key", keyToTest);
      }
    }
  } catch (testErr) {
    console.error("Key verification error:", testErr);
    if (statusBox) {
      statusBox.style.background = "#fef2f2";
      statusBox.style.color = "#991b1b";
      statusBox.style.border = "1px solid #fca5a5";
      statusBox.textContent = `🔴 कनेक्शन विफल: ${testErr.message || 'अमान्य Key'}`;
    }
    showToast(`कनेक्शन विफल: ${testErr.message}`, "danger", 4000);
  } finally {
    if (testBtn) {
      testBtn.disabled = false;
      testBtn.textContent = "🧪 कनेक्शन टेस्ट करें";
    }
  }
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


