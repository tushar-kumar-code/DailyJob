/**
 * CGNeeti / कामसाथी - Onboarding, Login & Role Selection Flow
 * 3 Simple Steps: Role -> Language -> Basic Profile (Progressive profiling)
 */

let onboardingState = {
  step: 1,
  role: "worker",
  language: "hi",
  name: "Ravi Kumar",
  phone: "9827145678",
  city: "Raipur"
};

function renderAuthView(mode = "onboarding") {
  return `
    <div style="max-width: 500px; margin: 1.5rem auto;">
      <!-- Step Progress Header -->
      <div class="card mb-4" style="text-align: center; border-radius: var(--radius-xl);">
        <div class="flex justify-between items-center text-muted mb-2" style="font-size: 0.85rem; font-weight: 600;">
          <span>सरल शुरुआत (Simple Signup)</span>
          <span>कदम ${onboardingState.step} / 3</span>
        </div>
        <div class="wizard-progress-bar">
          <div class="wizard-progress-fill" style="width: ${(onboardingState.step / 3) * 100}%;"></div>
        </div>

        <div class="mt-4" id="auth-step-container">
          ${renderCurrentAuthStep()}
        </div>
      </div>
    </div>
  `;
}

function renderCurrentAuthStep() {
  if (onboardingState.step === 1) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        आप क्या करना चाहते हैं?
      </h2>

      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <button class="option-card-btn ${onboardingState.role === 'worker' ? 'selected' : ''}" onclick="window.setAuthRole('worker')" style="padding: 1.1rem; flex-direction: row; gap: 1rem; justify-content: flex-start; text-align: left;">
          <span style="font-size: 2.2rem;">👷</span>
          <div>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-dark);">
              ${t('iNeedWork')}
            </div>
          </div>
        </button>

        <button class="option-card-btn ${onboardingState.role === 'employer' ? 'selected' : ''}" onclick="window.setAuthRole('employer')" style="padding: 1.1rem; flex-direction: row; gap: 1rem; justify-content: flex-start; text-align: left;">
          <span style="font-size: 2.2rem;">🏪</span>
          <div>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-dark);">
              ${t('iNeedWorkers')}
            </div>
          </div>
        </button>
      </div>

      <div class="mt-4">
        <button class="btn btn-primary btn-block btn-lg" onclick="window.nextAuthStep()">
          आगे बढ़ें (Next) →
        </button>
      </div>
    `;
  }

  if (onboardingState.step === 2) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        भाषा चुनें / Select Language
      </h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <button class="option-card-btn ${onboardingState.language === 'hi' ? 'selected' : ''}" onclick="window.setAuthLang('hi')">
          <span class="option-icon">🇮🇳</span>
          <div style="font-size: 1.2rem; font-weight: 700;">हिंदी</div>
        </button>

        <button class="option-card-btn ${onboardingState.language === 'en' ? 'selected' : ''}" onclick="window.setAuthLang('en')">
          <span class="option-icon">🌐</span>
          <div style="font-size: 1.2rem; font-weight: 700;">English</div>
        </button>
      </div>

      <div class="flex gap-2 mt-6">
        <button class="btn btn-secondary flex-1" onclick="window.prevAuthStep()">← वापस</button>
        <button class="btn btn-primary flex-1 btn-lg" onclick="window.nextAuthStep()">आगे बढ़ें →</button>
      </div>
    `;
  }

  if (onboardingState.step === 3) {
    return `
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
        सामान्य जानकारी
      </h2>

      <form id="auth-finish-form" onsubmit="window.finishOnboarding(event)" class="text-left">
        <div class="form-group">
          <label class="form-label" for="auth-name">आपका पूरा नाम *</label>
          <input type="text" id="auth-name" class="form-control" value="${escapeHTML(onboardingState.name)}" required placeholder="उदा. Ravi Kumar" />
        </div>

        <div class="form-group">
          <label class="form-label" for="auth-phone">मोबाइल नंबर *</label>
          <input type="tel" id="auth-phone" class="form-control" value="${escapeHTML(onboardingState.phone)}" required placeholder="10 अंकों का नंबर" pattern="[0-9]{10}" />
        </div>

        <div class="form-group">
          <label class="form-label" for="auth-city">आपका शहर *</label>
          <select id="auth-city" class="form-control">
            <option value="Raipur" selected>Raipur (रायपुर)</option>
            <option value="Bhilai">Bhilai (भिलाई)</option>
            <option value="Durg">Durg (दुर्ग)</option>
            <option value="Bilaspur">Bilaspur (बिलासपुर)</option>
            <option value="Rajnandgaon">Rajnandgaon (राजनांदगांव)</option>
          </select>
        </div>

        <div class="flex gap-2 mt-4">
          <button type="button" class="btn btn-secondary flex-1" onclick="window.prevAuthStep()">← वापस</button>
          <button type="submit" class="btn btn-success flex-1 btn-lg">
            ✓ खाता बनाएं और शुरू करें
          </button>
        </div>
      </form>
    `;
  }
}

// Global actions attached to window for event binding
window.setAuthRole = function(role) {
  onboardingState.role = role;
  document.getElementById("auth-step-container").innerHTML = renderCurrentAuthStep();
};

window.setAuthLang = function(lang) {
  onboardingState.language = lang;
  setLanguage(lang);
  document.getElementById("auth-step-container").innerHTML = renderCurrentAuthStep();
};

window.nextAuthStep = function() {
  if (onboardingState.step < 3) {
    onboardingState.step += 1;
    document.getElementById("app-view-container").innerHTML = renderAuthView();
  }
};

window.prevAuthStep = function() {
  if (onboardingState.step > 1) {
    onboardingState.step -= 1;
    document.getElementById("app-view-container").innerHTML = renderAuthView();
  }
};

window.finishOnboarding = function(e) {
  e.preventDefault();
  const name = document.getElementById("auth-name").value.trim() || "Ravi Kumar";
  const phone = document.getElementById("auth-phone").value.trim() || "9827145678";
  const city = document.getElementById("auth-city").value || "Raipur";

  appState.setRole(onboardingState.role);
  if (onboardingState.role === "worker") {
    appState.workers[0].name = name;
    appState.workers[0].city = city;
    appState.workers[0].phone = phone;
    appState.save();
    showToast(`स्वागत है ${name}! आपका खाता तैयार है।`, "success");
    window.location.hash = "#/worker";
  } else {
    appState.employer.name = name;
    appState.employer.city = city;
    appState.employer.phone = phone;
    appState.save();
    showToast(`स्वागत है ${name}! आपका नियोक्ता खाता तैयार है।`, "success");
    window.location.hash = "#/employer";
  }
};
