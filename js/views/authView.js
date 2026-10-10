/**
 * DailyJob - Simple, Clean Authentication Views
 * Universal Adaptive Account Creation with Voice & Visual Options
 */

let activeDailyJobAuthTab = "login"; // "login" | "signup"

// Global Text-to-Speech Helper for Low-Literacy / Audio Assistance
window.speakText = function(text, lang = "hi-IN") {
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
};

function renderDailyJobAuthView(tab = "login", queryParams = {}) {
  // If user is already authenticated, check profile completion
  if (window.authService && window.authService.isAuthenticated()) {
    if (!window.authService.isProfileCompleted()) {
      setTimeout(() => { window.location.hash = "#/create-profile"; }, 0);
    } else {
      const target = (window.authService.user && window.authService.user.role === "employer") ? "#/employer" : "#/worker";
      setTimeout(() => { window.location.hash = target; }, 0);
    }
    return "";
  }

  activeDailyJobAuthTab = tab;
  const isLogin = activeDailyJobAuthTab === "login";
  const expiredMsg = queryParams.expired ? "Your session has expired. Please log in again." : "";

  return `
    <div class="dailyjob-auth-wrapper">
      <div class="dailyjob-auth-card">
        <!-- Header with Voice Read-Aloud Button -->
        <div class="dailyjob-auth-header">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div class="dailyjob-logo-icon">🤝</div>
            <button 
              type="button" 
              class="voice-audio-btn" 
              onclick="window.speakText('डेली जॉब में आपका स्वागत है। काम ढूंढने या काम देने के लिए अपना अकाउंट बनाएं।')"
              title="आवाज़ में सुनें (Listen)">
              <span>🔊</span> <span>सुनें</span>
            </button>
          </div>
          <h1 class="dailyjob-title">Welcome to DailyJob</h1>
          <p class="text-secondary" style="font-size: 0.92rem; margin-top: 0.25rem;">
            ${isLogin ? 'अपने खाते में लॉगिन करें (Sign in)' : 'नया खाता बनाएं (Create your account)'}
          </p>
        </div>

        <!-- Tab Selection: Sign In | Create Account -->
        <div class="dailyjob-tabs" role="tablist">
          <button 
            type="button" 
            id="tab-btn-login"
            class="dailyjob-tab-btn ${isLogin ? 'active' : ''}" 
            onclick="window.switchDailyJobTab('login')"
            role="tab"
            aria-selected="${isLogin}">
            लॉगिन (Sign In)
          </button>
          <button 
            type="button" 
            id="tab-btn-signup"
            class="dailyjob-tab-btn ${!isLogin ? 'active' : ''}" 
            onclick="window.switchDailyJobTab('signup')"
            role="tab"
            aria-selected="${!isLogin}">
            खाता बनाएं (Create Account)
          </button>
        </div>

        ${expiredMsg ? `
          <div class="auth-alert auth-alert-warning" role="alert">
            <span>🔔</span> <div>${escapeHTML(expiredMsg)}</div>
          </div>
        ` : ''}

        <!-- Alerts -->
        <div id="auth-error-box" class="auth-alert auth-alert-error" style="display: none;" role="alert"></div>
        <div id="auth-success-box" class="auth-alert auth-alert-success" style="display: none;" role="alert"></div>

        <!-- Auth Body -->
        <div id="dailyjob-auth-form-container">
          ${isLogin ? renderLoginFormHTML() : renderSignUpFormHTML()}
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 1. SIGN IN FORM
// ---------------------------------------------------------------------------
function renderLoginFormHTML() {
  return `
    <form id="dailyjob-login-form" onsubmit="window.handleDailyJobLogin(event)">
      <div class="form-group mb-3">
        <label class="dailyjob-step-label" for="login-email">ईमेल या फ़ोन नंबर (Email or Phone)</label>
        <input 
          type="email" 
          id="login-email" 
          class="dailyjob-input" 
          placeholder="name@example.com" 
          required 
          autocomplete="email"
        />
      </div>

      <div class="form-group mb-3">
        <label class="dailyjob-step-label" for="login-username">यूज़रनेम / नाम (Username / Name)</label>
        <input 
          type="text" 
          id="login-username" 
          class="dailyjob-input" 
          placeholder="आपका नाम या यूज़रनेम" 
          required 
          autocomplete="username"
        />
      </div>

      <div class="form-group mb-4">
        <label class="dailyjob-step-label" for="login-password">पासवर्ड (Password)</label>
        <input 
          type="password" 
          id="login-password" 
          class="dailyjob-input" 
          placeholder="Enter password" 
          required 
          autocomplete="current-password"
        />
      </div>

      <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block btn-lg" style="font-weight: 800; border-radius: var(--radius-md);">
        लॉगिन करें (Sign In)
      </button>

      <div class="mt-3 text-center">
        <span class="text-secondary" style="font-size: 0.9rem;">खाता नहीं है?</span>
        <a href="javascript:void(0)" onclick="window.switchDailyJobTab('signup')" style="font-weight: 700; color: var(--color-primary); margin-left: 0.3rem;">
          नया खाता बनाएं (Create Account)
        </a>
      </div>
    </form>
  `;
}

// ---------------------------------------------------------------------------
// 2. CREATE ACCOUNT FORM (PART 1 - COMMON ACCOUNT CREATION)
// ---------------------------------------------------------------------------
let selectedAccountType = "job_seeker"; // "job_seeker" | "employer"

window.selectAccountType = function(type) {
  selectedAccountType = type;
  const seekerCard = document.getElementById("account-type-seeker");
  const employerCard = document.getElementById("account-type-employer");
  if (seekerCard && employerCard) {
    if (type === "job_seeker") {
      seekerCard.classList.add("selected");
      employerCard.classList.remove("selected");
    } else {
      seekerCard.classList.remove("selected");
      employerCard.classList.add("selected");
    }
  }
};

function renderSignUpFormHTML() {
  selectedAccountType = "job_seeker";

  return `
    <form id="dailyjob-signup-form" onsubmit="window.handleDailyJobSignUp(event)" novalidate>
      <!-- Section 3: "आप क्या करना चाहते हैं?" Large Visual Cards -->
      <div class="form-group mb-3">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <label class="dailyjob-step-label" style="font-size: 1.05rem; font-weight: 800; margin: 0;">
            आप क्या करना चाहते हैं?
          </label>
          <button 
            type="button" 
            class="voice-audio-btn" 
            style="padding: 0.2rem 0.6rem; font-size: 0.75rem;"
            onclick="window.speakText('आप क्या करना चाहते हैं? काम ढूंढना है या लोगों को काम पर रखना है?')"
            title="सुनें">
            <span>🔊</span>
          </button>
        </div>
        <div class="account-type-grid">
          <div 
            id="account-type-seeker"
            class="account-type-card selected" 
            onclick="window.selectAccountType('job_seeker')"
            role="button"
            tabindex="0"
            aria-label="काम ढूंढना है">
            <div class="account-type-icon">🧑‍🔧</div>
            <div class="account-type-title">काम ढूंढना है</div>
            <div class="account-type-subtitle">मुझे नौकरी / काम चाहिए</div>
            <div class="account-type-badge">चुना गया</div>
          </div>
          <div 
            id="account-type-employer"
            class="account-type-card" 
            onclick="window.selectAccountType('employer')"
            role="button"
            tabindex="0"
            aria-label="काम देना है">
            <div class="account-type-icon">🏢</div>
            <div class="account-type-title">काम देना है</div>
            <div class="account-type-subtitle">मुझे लोगों को काम पर रखना है</div>
            <div class="account-type-badge">चुना गया</div>
          </div>
        </div>
      </div>

      <!-- Full Name -->
      <div class="form-group mb-3">
        <label class="dailyjob-step-label" for="signup-fullname">आपका पूरा नाम (Full Name) *</label>
        <input 
          type="text" 
          id="signup-fullname" 
          class="dailyjob-input" 
          placeholder="अपना नाम लिखें" 
          required 
          autocomplete="name"
        />
      </div>

      <!-- Mobile Number (Large touch input & numeric keyboard) -->
      <div class="form-group mb-3">
        <label class="dailyjob-step-label" for="signup-mobile">मोबाइल नंबर (Mobile Number) *</label>
        <div class="input-with-prefix">
          <span class="input-prefix">+91</span>
          <input 
            type="tel" 
            id="signup-mobile" 
            class="dailyjob-input dailyjob-input-prefixed" 
            placeholder="10 अंकों का मोबाइल नंबर" 
            required 
            inputmode="numeric"
            maxlength="10"
            pattern="[0-9]{10}"
            autocomplete="tel"
          />
        </div>
      </div>

      <!-- Email Address -->
      <div class="form-group mb-3">
        <label class="dailyjob-step-label" for="signup-email">ईमेल पता (Email Address) *</label>
        <input 
          type="email" 
          id="signup-email" 
          class="dailyjob-input" 
          placeholder="name@example.com" 
          required 
          autocomplete="email"
        />
      </div>

      <!-- Password -->
      <div class="form-group mb-3">
        <label class="dailyjob-step-label" for="signup-password">पासवर्ड बनाएं (Password) *</label>
        <input 
          type="password" 
          id="signup-password" 
          class="dailyjob-input" 
          placeholder="कम से कम 6 अक्षर का पासवर्ड" 
          required 
          minlength="6"
          autocomplete="new-password"
        />
      </div>

      <!-- Confirm Password -->
      <div class="form-group mb-4">
        <label class="dailyjob-step-label" for="signup-confirm-password">पासवर्ड दोबारा डालें (Confirm Password) *</label>
        <input 
          type="password" 
          id="signup-confirm-password" 
          class="dailyjob-input" 
          placeholder="पासवर्ड दोबारा लिखें" 
          required 
          minlength="6"
          autocomplete="new-password"
        />
      </div>

      <button type="submit" id="signup-submit-btn" class="btn btn-primary btn-block btn-lg" style="font-weight: 800; border-radius: var(--radius-md);">
        आगे बढ़ें (Continue) →
      </button>

      <div class="mt-3 text-center">
        <span class="text-secondary" style="font-size: 0.9rem;">पहले से खाता है?</span>
        <a href="javascript:void(0)" onclick="window.switchDailyJobTab('login')" style="font-weight: 700; color: var(--color-primary); margin-left: 0.3rem;">
          लॉगिन करें (Sign In)
        </a>
      </div>
    </form>
  `;
}

// Backward compatibility router bindings
function renderSignInView(queryParams = {}) {
  return renderDailyJobAuthView("login", queryParams);
}

function renderSignUpView(queryParams = {}) {
  return renderDailyJobAuthView("signup", queryParams);
}

// ---------------------------------------------------------------------------
// 3. Tab Switching
// ---------------------------------------------------------------------------
window.switchDailyJobTab = function(tab) {
  activeDailyJobAuthTab = tab;
  window.clearAuthAlerts();

  const tabLogin = document.getElementById("tab-btn-login");
  const tabSignup = document.getElementById("tab-btn-signup");
  const container = document.getElementById("dailyjob-auth-form-container");

  if (tabLogin && tabSignup && container) {
    if (tab === "login") {
      tabLogin.classList.add("active");
      tabSignup.classList.remove("active");
      container.innerHTML = renderLoginFormHTML();
    } else {
      tabLogin.classList.remove("active");
      tabSignup.classList.add("active");
      container.innerHTML = renderSignUpFormHTML();
    }
  } else {
    window.location.hash = tab === "login" ? "#/login" : "#/signup";
  }
};

// ---------------------------------------------------------------------------
// 4. Form Submission Handlers
// ---------------------------------------------------------------------------
window.handleDailyJobLogin = async function(e) {
  e.preventDefault();
  const emailInput = document.getElementById("login-email");
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const submitBtn = document.getElementById("login-submit-btn");

  const email = emailInput ? emailInput.value.trim() : "";
  const username = usernameInput ? usernameInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";

  window.clearAuthAlerts();

  if (!email || !username || !password) {
    window.showAuthError("Please fill in email, username, and password.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Logging in...";

  const res = await window.authService.signIn({ email, username, password });

  if (res.success) {
    showToast(`✓ Welcome back, ${res.user.username || res.user.name}!`, "success");
    if (!window.authService.isProfileCompleted()) {
      window.location.hash = "#/create-profile";
    } else {
      const rawHash = window.location.hash || "";
      const redirectParam = new URLSearchParams(rawHash.split("?")[1] || "").get("redirect");
      const target = redirectParam || (res.user.role === "employer" ? "#/employer" : "#/worker");
      window.location.hash = target;
    }
  } else {
    submitBtn.disabled = false;
    submitBtn.innerText = "Sign In";
    window.showAuthError(res.error || "Invalid email, username, or password.");
  }
};

window.handleDailyJobSignUp = async function(e) {
  e.preventDefault();
  const nameInput = document.getElementById("signup-fullname") || document.getElementById("signup-username");
  const emailInput = document.getElementById("signup-email");
  const mobileInput = document.getElementById("signup-mobile");
  const passwordInput = document.getElementById("signup-password");
  const confirmPasswordInput = document.getElementById("signup-confirm-password");
  const submitBtn = document.getElementById("signup-submit-btn");

  const fullName = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const mobileNumber = mobileInput ? mobileInput.value.trim().replace(/\D/g, "") : "";
  const password = passwordInput ? passwordInput.value : "";
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
  const accountType = selectedAccountType || "job_seeker";

  window.clearAuthAlerts();

  if (!fullName || fullName.length < 2) {
    window.showAuthError("Please enter your full name (minimum 2 characters).");
    if (nameInput) nameInput.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    window.showAuthError("Please enter a valid email address.");
    if (emailInput) emailInput.focus();
    return;
  }

  if (mobileInput && (!mobileNumber || mobileNumber.length !== 10 || !/^[6-9]\d{9}$/.test(mobileNumber))) {
    window.showAuthError("Please enter a valid 10-digit mobile number.");
    if (mobileInput) mobileInput.focus();
    return;
  }

  if (!password || password.length < 6) {
    window.showAuthError("Password must be at least 6 characters long.");
    if (passwordInput) passwordInput.focus();
    return;
  }

  if (confirmPasswordInput && password !== confirmPassword) {
    window.showAuthError("Passwords do not match. Please verify.");
    if (confirmPasswordInput) confirmPasswordInput.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Creating Account...";

  const res = await window.authService.signUp({
    fullName,
    name: fullName,
    username: fullName,
    email,
    mobileNumber,
    password,
    confirmPassword,
    accountType,
    role: accountType === "employer" ? "employer" : "worker"
  });

  if (res.success) {
    showToast(`✓ Welcome to DailyJob, ${res.user.name || res.user.username}!`, "success");
    // Direct immediately to the chosen profile creation flow
    window.location.hash = `#/create-profile?type=${accountType}`;
  } else {
    submitBtn.disabled = false;
    submitBtn.innerText = "Create Account & Continue";
    window.showAuthError(res.error || "Failed to create account.");
  }
};

// Alert helpers
window.showAuthError = function(msg) {
  const box = document.getElementById("auth-error-box");
  if (box) {
    box.innerHTML = `<span>⚠️</span> <div>${escapeHTML(msg)}</div>`;
    box.style.display = "flex";
  } else {
    showToast(msg, "danger");
  }
};

window.showAuthSuccess = function(msg) {
  const box = document.getElementById("auth-success-box");
  if (box) {
    box.innerHTML = `<span>✓</span> <div>${escapeHTML(msg)}</div>`;
    box.style.display = "flex";
  } else {
    showToast(msg, "success");
  }
};

window.clearAuthAlerts = function() {
  const errBox = document.getElementById("auth-error-box");
  const succBox = document.getElementById("auth-success-box");
  if (errBox) errBox.style.display = "none";
  if (succBox) succBox.style.display = "none";
};
