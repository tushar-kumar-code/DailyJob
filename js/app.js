/**
 * CGNeeti / कामसाथी - Application Bootstrap & Global Shell Orchestration
 */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  // Listen for language changes to re-render shell and active route
  window.addEventListener("languageChanged", () => {
    updateShellUI();
    router.handleRoute();
  });

  window.addEventListener("stateUpdated", () => {
    updateShellUI();
  });

  // Listen for authentication changes
  window.addEventListener("authStateChanged", () => {
    if (window.authService && window.authService.user) {
      if (window.appState && window.appState.loadUserData) {
        window.appState.loadUserData(window.authService.user);
      }
      if (window.authService.user.role) {
        appState.setRole(window.authService.user.role);
      }
    }
    updateShellUI();
    router.handleRoute();
  });

  // Initialize Auth Service
  if (window.authService) {
    try {
      await window.authService.init();
      if (window.authService.user) {
        if (window.appState && window.appState.loadUserData) {
          window.appState.loadUserData(window.authService.user);
        }
        if (window.authService.user.role) {
          appState.setRole(window.authService.user.role);
        }
      }
    } catch (e) {
      console.warn("Auth initialization note:", e);
    }
  }

  // Initial render
  updateShellUI();
  router.handleRoute();
}

// Update Header and Bottom Navigation UI
window.updateShellUI = function() {
  const currentRole = appState.currentRole;
  const currentLang = getCurrentLanguage();
  const currentHash = window.location.hash || "#/";
  const unreadNotifs = appState.notifications.filter(n => !n.read).length;
  const isAuth = window.authService && window.authService.isAuthenticated();
  const isProfileDone = isAuth && window.authService.isProfileCompleted();
  const authUser = isAuth ? window.authService.user : null;

  // Header Title & Logo Link
  const homeLink = isProfileDone ? (currentRole === "employer" ? "#/employer" : "#/worker") : (isAuth ? "#/create-profile" : "#/login");
  const headerContainer = document.getElementById("header-content-inner");
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="flex items-center gap-1">
        ${isProfileDone ? `
          <!-- Sidebar Hamburger Toggle Button -->
          <button class="btn btn-ghost btn-sm btn-icon-only" onclick="window.openSidebar()" aria-label="मुख्य मेनू खोलें" title="मेनू (Menu)" style="font-size: 1.35rem; padding: 0.3rem 0.5rem; min-height: 38px; min-width: 38px; border-radius: var(--radius-md);">
            ☰
          </button>
        ` : ''}

        <a href="${homeLink}" class="brand-logo" aria-label="DailyJob Home">
          <span style="font-size: 1.5rem;">🤝</span>
          <span>DailyJob</span>
          <span class="brand-badge desktop-only">कामसाथी</span>
        </a>
      </div>

      <div class="header-actions">
        ${isProfileDone ? `
          <!-- Quick AI Assistant Button -->
          <button class="btn btn-ghost btn-sm desktop-only" onclick="window.openAIChatModal()" style="font-weight: 700; color: #4f46e5; border-radius: var(--radius-full);">
            🤖 AI Chat
          </button>

          <!-- Quick Integrated Backend & API Portal Button -->
          <button class="btn btn-ghost btn-sm desktop-only" onclick="window.openBackendPortalModal()" style="font-weight: 700; color: #0284c7; border-radius: var(--radius-full);" title="Integrated Backend API & Swagger Docs">
            ⚡ API Hub
          </button>

          <!-- Role Switcher Pill -->
          <button class="role-badge-pill ${currentRole}" onclick="window.openRoleSwitchModal()" title="Switch User Role">
            <span>${currentRole === 'worker' ? '👷' : (currentRole === 'employer' ? '🏪' : '🛡️')}</span>
            <span>${t(currentRole + 'Role')}</span>
            <span style="font-size: 0.65rem; opacity: 0.7;">▼</span>
          </button>

          <!-- Notification Bell -->
          <a href="#/notifications" class="btn btn-ghost btn-icon-only btn-sm" style="position: relative;" aria-label="Notifications" title="सूचनाएं">
            ${ICONS.bell}
            ${unreadNotifs > 0 ? `
              <span class="bottom-nav-badge" style="top: 2px; right: 2px;">${unreadNotifs}</span>
            ` : ''}
          </a>

          <!-- Settings Gear Button -->
          <button class="btn btn-ghost btn-icon-only btn-sm" onclick="window.openSettingsModal()" aria-label="सेटिंग्स" title="सेटिंग्स (Settings)">
            ⚙️
          </button>
        ` : (isAuth ? `
          <!-- Minimal Logout button for user in profile creation -->
          <button class="btn btn-ghost btn-sm" onclick="window.authService.logout()" style="color: var(--text-secondary); font-size: 0.85rem;" title="Logout">
            Logout
          </button>
        ` : `
          <!-- Guest Quick API Hub Button -->
          <button class="btn btn-ghost btn-sm" onclick="window.openBackendPortalModal()" style="font-weight: 700; color: #0284c7; border-radius: var(--radius-full);" title="Integrated Backend API & Swagger Docs">
            ⚡ API Hub
          </button>
          <a href="#/login" class="btn btn-primary btn-sm" style="font-weight: 700; border-radius: var(--radius-full); padding: 0.35rem 0.9rem;">
            Login
          </a>
        `)}
      </div>
    `;
  }

  // Refresh Sidebar content if already open
  if (window.renderSidebarContent && document.getElementById("app-sidebar")?.classList.contains("open")) {
    window.renderSidebarContent();
  }

  // Bottom Navigation Bar for Mobile
  const bottomNav = document.getElementById("bottom-navigation-bar");
  if (bottomNav) {
    if (!isProfileDone || currentHash === "#/" || currentHash === "#/landing" || currentHash.startsWith("#/onboarding") || currentHash.startsWith("#/login") || currentHash.startsWith("#/signup") || currentHash.startsWith("#/create-profile")) {
      bottomNav.style.display = "none";
    } else {
      bottomNav.style.display = "flex";
      bottomNav.innerHTML = currentRole === "employer" ? renderEmployerBottomNav(currentHash) : renderWorkerBottomNav(currentHash);
    }
  }
};

function renderWorkerBottomNav(currentHash) {
  return `
    <a href="#/worker" class="bottom-nav-item ${currentHash.startsWith('#/worker') && !currentHash.includes('profile') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">🏠</span>
      <span>होम</span>
    </a>

    <a href="#/jobs" class="bottom-nav-item ${currentHash.startsWith('#/jobs') || currentHash.startsWith('#/job-detail') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">🔎</span>
      <span>काम</span>
    </a>

    <a href="#/today-work" class="bottom-nav-item ${currentHash.startsWith('#/today-work') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">📋</span>
      <span>मेरे काम</span>
    </a>

    <a href="#/worker-profile" class="bottom-nav-item ${currentHash.startsWith('#/worker-profile') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">👤</span>
      <span>Profile</span>
    </a>

    <button type="button" class="bottom-nav-item" onclick="window.openSidebar()" style="background: transparent; border: none; cursor: pointer;">
      <span style="font-size: 1.25rem;">☰</span>
      <span>मेनू</span>
    </button>
  `;
}

function renderEmployerBottomNav(currentHash) {
  return `
    <a href="#/employer" class="bottom-nav-item ${currentHash.startsWith('#/employer') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">🏠</span>
      <span>होम</span>
    </a>

    <a href="#/post-job" class="bottom-nav-item ${currentHash.startsWith('#/post-job') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">➕</span>
      <span>काम डालें</span>
    </a>

    <a href="#/active-work" class="bottom-nav-item ${currentHash.startsWith('#/active-work') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">🔨</span>
      <span>चालू कार्य</span>
    </a>

    <a href="#/applicants" class="bottom-nav-item ${currentHash.startsWith('#/applicants') ? 'active' : ''}">
      <span style="font-size: 1.25rem;">👥</span>
      <span>आवेदक</span>
    </a>

    <button type="button" class="bottom-nav-item" onclick="window.openSidebar()" style="background: transparent; border: none; cursor: pointer;">
      <span style="font-size: 1.25rem;">☰</span>
      <span>मेनू</span>
    </button>
  `;
}

// Global action handlers
window.chooseRoleAndNavigate = function(role) {
  if (role === "worker" || role === "employer") {
    if (window.switchRoleAndRefresh) {
      window.switchRoleAndRefresh(role);
      return;
    }
  }
  appState.setRole(role);
  updateShellUI();
  if (role === "worker") {
    window.location.hash = "#/worker";
  } else if (role === "employer") {
    window.location.hash = "#/employer";
  } else {
    window.location.hash = "#/admin";
  }
};

window.openRoleSwitchModal = function() {
  const isWorker = appState.currentRole === "worker";
  const bodyHTML = `
    <div>
      <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1rem;">
        आप अपनी पसंद अनुसार कभी भी रोल बदल सकते हैं। रोल बदलते ही मेनू और फीचर्स उस रोल के अनुसार दिखाई देंगे:
      </p>
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <button class="option-card-btn ${isWorker ? 'selected' : ''}" onclick="window.chooseRoleAndNavigate('worker'); closeModal();" style="flex-direction: row; justify-content: flex-start; gap: 1rem; text-align: left; padding: 1.1rem; border: 2px solid ${isWorker ? '#16a34a' : 'var(--border-subtle)'}; background: ${isWorker ? '#f0fdf4' : 'var(--bg-surface)'};">
          <span style="font-size: 2.2rem;">👷</span>
          <div style="flex: 1;">
            <div style="font-weight: 800; font-size: 1.05rem; color: ${isWorker ? '#15803d' : 'var(--text-primary)'};">
              जॉब लेने वाला (कामगार मोड)
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
              काम खोजें, आज का काम, चेक-इन, कमाई व हुनर
            </div>
          </div>
          ${isWorker ? '<span class="badge badge-success font-bold">✓ सक्रिय</span>' : ''}
        </button>

        <button class="option-card-btn ${!isWorker ? 'selected' : ''}" onclick="window.chooseRoleAndNavigate('employer'); closeModal();" style="flex-direction: row; justify-content: flex-start; gap: 1rem; text-align: left; padding: 1.1rem; border: 2px solid ${!isWorker ? '#2563eb' : 'var(--border-subtle)'}; background: ${!isWorker ? '#eff6ff' : 'var(--bg-surface)'};">
          <span style="font-size: 2.2rem;">🏪</span>
          <div style="flex: 1;">
            <div style="font-weight: 800; font-size: 1.05rem; color: ${!isWorker ? '#1d4ed8' : 'var(--text-primary)'};">
              जॉब देने वाला (नियोक्ता मोड)
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
              काम डालें (Post Job), आवेदक सूची, चालू कार्य व भुगतान
            </div>
          </div>
          ${!isWorker ? '<span class="badge badge-primary font-bold">✓ सक्रिय</span>' : ''}
        </button>
      </div>
    </div>
  `;

  openModal("🔄 रोल बदलें (Switch Role)", bodyHTML);
};

window.toggleLanguage = function() {
  const nextLang = getCurrentLanguage() === "hi" ? "en" : "hi";
  setLanguage(nextLang);
  showToast(nextLang === "hi" ? "भाषा: हिंदी सेट की गई" : "Language: English selected", "info");
};

window.toggleSave = async function(jobId) {
  const isNowSaved = await appState.toggleSaveJob(jobId);
  showToast(isNowSaved ? "❤️ काम सेव किया गया" : "काम सेव से हटाया गया", "info");
  router.handleRoute();
};
