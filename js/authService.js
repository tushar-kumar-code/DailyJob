/**
 * CGNeeti / कामसाथी - Centralized Frontend Authentication Service
 * Manages Auth State (Loading, Authenticated, Unauthenticated, Error)
 * Provides methods for Sign Up, Sign In, Google OAuth, Session, and Logout
 */

class AuthService {
  constructor() {
    this.status = "loading"; // "loading" | "authenticated" | "unauthenticated" | "error"
    this.user = null;
    this.token = null;
    this.error = null;
    this.isInitialized = false;
    this.googleClientId = "";

    // Sync with memory / session storage if available
    const savedToken = sessionStorage.getItem("cgneeti_auth_token") || localStorage.getItem("cgneeti_auth_token");
    if (savedToken) {
      this.token = savedToken;
    }
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Fetch public auth config (Google Client ID)
      await this.loadConfig();

      // 2. Verify existing session with backend
      await this.checkSession();
    } catch (err) {
      console.warn("Auth initialization error:", err);
      this.setStatus("unauthenticated", null);
    }
  }

  async loadConfig() {
    try {
      const res = await fetch("/api/auth/config");
      if (res.ok) {
        const data = await res.json();
        this.googleClientId = data.googleClientId || "";
      }
    } catch (e) {
      // Offline or static fallback
    }
  }

  setStatus(status, user = null, error = null) {
    this.status = status;
    this.user = user;
    this.error = error;

    // Dispatch global event for views & router to react
    window.dispatchEvent(
      new CustomEvent("authStateChanged", {
        detail: { status: this.status, user: this.user, error: this.error }
      })
    );
  }

  isAuthenticated() {
    return this.status === "authenticated" && this.user !== null;
  }

  isProfileCompleted() {
    if (!this.user) return false;
    return this.user.profile_completed === true || (this.user.profile && !!this.user.profile.user_type);
  }

  hasWorkerProfile() {
    if (!this.user) return false;
    return !!(this.user.worker_profile || this.user.job_seeker_profile || (this.user.profile && this.user.profile.user_type === 'job_seeker'));
  }

  hasEmployerProfile() {
    if (!this.user) return false;
    return !!(this.user.employer_profile || (this.user.profile && this.user.profile.user_type === 'employer'));
  }

  getWorkerProfile() {
    if (!this.user) return null;
    return this.user.worker_profile || this.user.job_seeker_profile || (this.user.profile?.user_type === 'job_seeker' ? this.user.profile : null);
  }

  getEmployerProfile() {
    if (!this.user) return null;
    return this.user.employer_profile || (this.user.profile?.user_type === 'employer' ? this.user.profile : null);
  }

  async switchRole(role) {
    if (!['worker', 'employer'].includes(role)) return { success: false };
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      const res = await fetch("/api/user/switch-role", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ role })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.user = data.user;
          this.setStatus("authenticated", data.user);
        }
      }
    } catch (_) {}

    if (window.appState) {
      window.appState.setRole(role);
      if (this.user && window.appState.loadUserData) {
        window.appState.loadUserData(this.user);
      }
    }
    if (window.updateShellUI) {
      window.updateShellUI();
    }
    return { success: true, role };
  }

  // ---------------------------------------------------------------------------
  // Check Current Session (GET /api/auth/me)
  // ---------------------------------------------------------------------------
  async checkSession() {
    this.status = "loading";
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers,
        credentials: "include" // sends HttpOnly cookie automatically
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          if (window.appState && window.appState.loadUserData) {
            window.appState.loadUserData(data.user);
          }
          this.setStatus("authenticated", data.user);
          return { success: true, user: data.user };
        }
      }

      // If 401 or not authenticated
      this.clearLocalSession();
      this.setStatus("unauthenticated", null);
      return { success: false };
    } catch (err) {
      this.clearLocalSession();
      this.setStatus("unauthenticated", null);
      return { success: false, error: err.message };
    }
  }

  // ---------------------------------------------------------------------------
  // User Sign Up (POST /api/auth/signup)
  // ---------------------------------------------------------------------------
  async signUp({ email, username, fullName, name, mobileNumber, mobile_number, password, confirmPassword, accountType, role }) {
    this.error = null;
    try {
      const resolvedName = (fullName || name || username || "").trim();
      const resolvedMobile = (mobileNumber || mobile_number || "").trim();
      const resolvedAccountType = accountType || (role === "employer" ? "employer" : "job_seeker");
      const resolvedRole = role || (resolvedAccountType === "employer" ? "employer" : "worker");

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          username: resolvedName,
          name: resolvedName,
          fullName: resolvedName,
          mobile_number: resolvedMobile,
          mobileNumber: resolvedMobile,
          password,
          confirmPassword,
          account_type: resolvedAccountType,
          accountType: resolvedAccountType,
          role: resolvedRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Failed to create account.";
        this.error = errMsg;
        return { success: false, error: errMsg };
      }

      // Account created and signed in
      this.storeSession(data.token, data.user, false);
      this.setStatus("authenticated", data.user);
      if (window.appState && window.appState.loadUserData) {
        window.appState.loadUserData(data.user);
      }
      return { success: true, message: data.message, user: data.user, accountType: resolvedAccountType };
    } catch (err) {
      const errMsg = "Unable to connect to server. Please check your internet connection.";
      this.error = errMsg;
      return { success: false, error: errMsg };
    }
  }

  // ---------------------------------------------------------------------------
  // User Sign In (POST /api/auth/signin - Email, Username, Password)
  // ---------------------------------------------------------------------------
  async signIn({ email, username, password, rememberMe = false }) {
    this.error = null;
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password, rememberMe })
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Invalid email, username, or password.";
        this.error = errMsg;
        return { success: false, error: errMsg };
      }

      this.storeSession(data.token, data.user, rememberMe);
      this.setStatus("authenticated", data.user);
      if (window.appState && window.appState.loadUserData) {
        window.appState.loadUserData(data.user);
      }
      return { success: true, message: data.message, user: data.user };
    } catch (err) {
      const errMsg = "Unable to connect to server. Please check your internet connection.";
      this.error = errMsg;
      return { success: false, error: errMsg };
    }
  }

  // ---------------------------------------------------------------------------
  // Per-User Saved Data API helpers
  // ---------------------------------------------------------------------------
  async saveUserData(savedData) {
    if (!this.token && !this.isAuthenticated()) return;
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
      await fetch("/api/user/data", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ data: savedData })
      });
    } catch (_) {}
  }

  async getUserData() {
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
      const res = await fetch("/api/user/data", {
        method: "GET",
        headers,
        credentials: "include"
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (_) {}
    return null;
  }

  // ---------------------------------------------------------------------------
  // Profile Completion API (POST /api/user/profile)
  // ---------------------------------------------------------------------------
  async saveProfile({ user_type, age, profession, custom_profession }) {
    this.error = null;
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ user_type, age, profession, custom_profession })
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || "Failed to save profile.";
        this.error = errMsg;
        return { success: false, error: errMsg };
      }

      this.user = data.user;
      if (window.appState) {
        if (data.user.role) {
          window.appState.setRole(data.user.role);
        }
        if (window.appState.loadUserData) {
          window.appState.loadUserData(data.user);
        }
      }
      this.setStatus("authenticated", data.user);
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      const errMsg = "Unable to connect to server. Please try again.";
      this.error = errMsg;
      return { success: false, error: errMsg };
    }
  }

  // ---------------------------------------------------------------------------
  // 10-Step Job Seeker Profile (POST & GET /api/user/profile/job-seeker)
  // ---------------------------------------------------------------------------
  async saveJobSeekerProfile(profileData) {
    this.error = null;
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      const res = await fetch("/api/user/profile/job-seeker", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(profileData)
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || data.detail || "Failed to save Job Seeker profile.";
        this.error = errMsg;
        return { success: false, error: errMsg };
      }

      if (data.user) {
        this.user = data.user;
        if (window.appState) {
          window.appState.setRole("worker");
          if (window.appState.loadUserData) {
            window.appState.loadUserData(data.user);
          }
        }
        this.setStatus("authenticated", data.user);
      }

      return {
        success: true,
        user: data.user,
        profile: data.profile,
        completion: data.completion,
        message: data.message || "Profile saved successfully."
      };
    } catch (err) {
      const errMsg = "Unable to connect to server. Please try again.";
      this.error = errMsg;
      return { success: false, error: errMsg };
    }
  }

  async getJobSeekerProfile() {
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      const res = await fetch("/api/user/profile/job-seeker", {
        method: "GET",
        headers,
        credentials: "include"
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return { success: false, profile: null };
  }

  // ---------------------------------------------------------------------------
  // 10-Step Employer Profile (POST & GET /api/user/profile/employer)
  // ---------------------------------------------------------------------------
  async saveEmployerProfile(profileData) {
    this.error = null;
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      const res = await fetch("/api/user/profile/employer", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(profileData)
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || data.detail || "Failed to save Employer profile.";
        this.error = errMsg;
        return { success: false, error: errMsg };
      }

      if (data.user) {
        this.user = data.user;
        if (window.appState) {
          window.appState.setRole("employer");
          if (window.appState.loadUserData) {
            window.appState.loadUserData(data.user);
          }
        }
        this.setStatus("authenticated", data.user);
      }

      return {
        success: true,
        user: data.user,
        profile: data.profile,
        completion: data.completion,
        message: data.message || "Profile saved successfully."
      };
    } catch (err) {
      const errMsg = "Unable to connect to server. Please try again.";
      this.error = errMsg;
      return { success: false, error: errMsg };
    }
  }

  async getEmployerProfile() {
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      const res = await fetch("/api/user/profile/employer", {
        method: "GET",
        headers,
        credentials: "include"
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return { success: false, profile: null };
  }

  // ---------------------------------------------------------------------------
  // Get Real Profile Completion Breakdown (GET /api/user/profile/completion)
  // ---------------------------------------------------------------------------
  async getProfileCompletion() {
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      const res = await fetch("/api/user/profile/completion", {
        method: "GET",
        headers,
        credentials: "include"
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return { success: false, breakdown: { percentage: 0, completed_sections: [], missing_sections: [] } };
  }

  // ---------------------------------------------------------------------------
  // Google Sign In (POST /api/auth/google)
  // ---------------------------------------------------------------------------
  async signInWithGoogle(credential, fallbackProfile = null) {
    this.error = null;
    try {
      const payload = { credential };
      if (!credential && fallbackProfile) {
        payload.testEmail = fallbackProfile.email;
        payload.testName = fallbackProfile.name;
      }

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Google authentication failed.";
        this.error = errMsg;
        return { success: false, error: errMsg };
      }

      this.storeSession(data.token, data.user, true);
      this.setStatus("authenticated", data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const errMsg = "Google authentication failed. Please try again.";
      this.error = errMsg;
      return { success: false, error: errMsg };
    }
  }

  // ---------------------------------------------------------------------------
  // Forgot Password (POST /api/auth/forgot-password)
  // ---------------------------------------------------------------------------
  async forgotPassword(email) {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Request failed." };
      }

      return {
        success: true,
        message: data.message,
        devResetToken: data.devResetToken
      };
    } catch (err) {
      return {
        success: false,
        error: "Unable to process request. Please try again later."
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Reset Password with Token (POST /api/auth/reset-password)
  // ---------------------------------------------------------------------------
  async resetPassword({ token, password, confirmPassword }) {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to reset password." };
      }

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: "Network error occurred." };
    }
  }

  // ---------------------------------------------------------------------------
  // Logout (POST /api/auth/logout)
  // ---------------------------------------------------------------------------
  async logout() {
    try {
      const headers = {};
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

      await fetch("/api/auth/logout", {
        method: "POST",
        headers,
        credentials: "include"
      });
    } catch (e) {
      // Clear client state even if backend offline
    } finally {
      this.clearLocalSession();
      if (window.appState && window.appState.clearCurrentUserData) {
        window.appState.clearCurrentUserData();
      }
      this.setStatus("unauthenticated", null);
      window.location.hash = "#/login";
    }
  }

  // ---------------------------------------------------------------------------
  // Session helpers
  // ---------------------------------------------------------------------------
  storeSession(token, user, rememberMe) {
    this.token = token;
    this.user = user;
    if (token) {
      if (rememberMe) {
        localStorage.setItem("cgneeti_auth_token", token);
        sessionStorage.removeItem("cgneeti_auth_token");
      } else {
        sessionStorage.setItem("cgneeti_auth_token", token);
        localStorage.removeItem("cgneeti_auth_token");
      }
    }
  }

  clearLocalSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("cgneeti_auth_token");
    sessionStorage.removeItem("cgneeti_auth_token");
  }

  // ---------------------------------------------------------------------------
  // Authenticated Fetch Helper for Protected APIs
  // ---------------------------------------------------------------------------
  async fetchProtected(url, options = {}) {
    const headers = { ...options.headers };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });

    if (res.status === 401) {
      // Session expired
      this.clearLocalSession();
      this.setStatus("unauthenticated", null);
      window.location.hash = "#/login?expired=1";
    }

    return res;
  }
}

// Global Singleton Instance
window.authService = new AuthService();
