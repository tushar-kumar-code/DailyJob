/**
 * CGNeeti / कामसाथी - Hash-based Client-Side Router
 * Smooth, zero-page-reload routing for all 47+ platform flows
 */

class Router {
  constructor() {
    this.routes = {};
    window.addEventListener("hashchange", () => this.handleRoute());
  }

  addRoute(pattern, handler) {
    this.routes[pattern] = handler;
  }

  async handleRoute() {
    const rawHash = window.location.hash || "#/";
    const [pathPart, queryPart] = rawHash.split("?");
    const path = pathPart.replace(/^#/, "") || "/";

    const queryParams = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, value] of searchParams.entries()) {
        queryParams[key] = value;
      }
    }

    const container = document.getElementById("app-view-container");
    if (!container) return;

    const authRoutes = ["/login", "/signin", "/signup", "/auth"];
    const isAuthRoute = authRoutes.includes(path);
    const isAuthenticated = window.authService ? window.authService.isAuthenticated() : false;

    // When not authenticated, show Welcome to DailyJob
    if (!isAuthenticated) {
      if (!isAuthRoute && path !== "/" && path !== "/landing") {
        const redirectTarget = encodeURIComponent(rawHash);
        window.location.hash = `#/login?redirect=${redirectTarget}`;
        return;
      }
      const initialTab = path === "/signup" ? "signup" : "login";
      container.innerHTML = renderDailyJobAuthView(initialTab, queryParams);
      window.updateShellUI();
      return;
    }

    // Authenticated: Profile Check
    const isProfileDone = window.authService ? window.authService.isProfileCompleted() : false;

    // Incomplete profile: Gate to Profile Creation flow only
    if (!isProfileDone) {
      if (path !== "/create-profile") {
        window.location.hash = "#/create-profile";
        return;
      }
      container.innerHTML = renderDailyJobProfileCreationView(queryParams);
      window.updateShellUI();
      return;
    }

    // Allow creating second profile (Worker or Employer) or editing profile
    const isTargetedCreation = path === "/create-profile" && (queryParams.type || queryParams.edit || queryParams.mode === "switch");
    if (isTargetedCreation) {
      container.innerHTML = renderDailyJobProfileCreationView(queryParams);
      window.updateShellUI();
      return;
    }

    // Already authenticated and profile completed: Redirect away from /login, /signup, /create-profile, /, /landing to dashboard
    if (isAuthRoute || path === "/create-profile" || path === "/" || path === "/landing") {
      const userRole = (window.authService.user && window.authService.user.role === "employer") || appState.currentRole === "employer" ? "employer" : "worker";
      const roleHome = userRole === "employer" ? "#/employer" : "#/worker";
      window.location.hash = roleHome;
      return;
    }

    // -----------------------------------------------------------------------
    // Role-Based Route Isolation:
    // Worker (जॉब लेने वाला) cannot access Employer features.
    // Employer (जॉब देने वाला) cannot access Worker features.
    // -----------------------------------------------------------------------
    const currentActiveRole = appState.currentRole || (window.authService?.user?.role) || "worker";

    const employerOnlyRoutes = ["/employer", "/employer-home", "/post-job", "/active-work"];
    const isEmployerRoute = employerOnlyRoutes.includes(path) || path.startsWith("/applicants");

    const workerOnlyRoutes = ["/worker", "/worker-home", "/jobs", "/today-work", "/skills", "/earnings"];
    const isWorkerRoute = workerOnlyRoutes.includes(path);

    if (currentActiveRole === "worker" && isEmployerRoute) {
      if (typeof showToast === "function") {
        showToast("⚠️ यह फीचर केवल 'जॉब देने वालों (नियोक्ता)' के लिए है। साइडबार से 'जॉब देने वाला' बनें।", "warning", 3500);
      }
      window.location.hash = "#/worker";
      return;
    }

    if (currentActiveRole === "employer" && isWorkerRoute) {
      if (typeof showToast === "function") {
        showToast("⚠️ यह फीचर केवल 'जॉब लेने वालों (कामगार)' के लिए है। साइडबार से 'जॉब लेने वाला' बनें।", "warning", 3500);
      }
      window.location.hash = "#/employer";
      return;
    }

    // Show quick skeleton loading state
    container.innerHTML = `
      <div style="padding: 1rem 0;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    `;

    // Match exact route or parameterized route (e.g. /job-detail/:id)
    let handler = this.routes[path];
    let params = null;

    if (!handler) {
      for (const pattern of Object.keys(this.routes)) {
        if (pattern.includes(":")) {
          const patternParts = pattern.split("/");
          const pathParts = path.split("/");

          if (patternParts.length === pathParts.length) {
            let match = true;
            params = {};
            for (let i = 0; i < patternParts.length; i++) {
              if (patternParts[i].startsWith(":")) {
                const paramName = patternParts[i].slice(1);
                params[paramName] = pathParts[i];
              } else if (patternParts[i] !== pathParts[i]) {
                match = false;
                break;
              }
            }
            if (match) {
              handler = this.routes[pattern];
              break;
            }
          }
        }
      }
    }

    // Default fallback to landing or worker
    if (!handler) {
      if (path === "/" || path === "") {
        handler = () => renderLandingView();
      } else {
        handler = () => `
          <div class="empty-state">
            <div class="empty-state-icon">🧭</div>
            <h3 class="empty-state-title">पेज नहीं मिला (Page Not Found)</h3>
            <p class="empty-state-desc">यह पेज मौजूद नहीं है या पता बदल गया है।</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/'">मुख्य पृष्ठ पर जाएं</button>
          </div>
        `;
      }
    }

    try {
      window.scrollTo(0, 0);
      let content;
      if (params) {
        content = await handler(params[Object.keys(params)[0]], queryParams);
      } else {
        content = await handler(queryParams);
      }
      container.innerHTML = content;
      window.updateShellUI();
    } catch (err) {
      console.error("Route handling error:", err);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3 class="empty-state-title">${t('errorMsg')}</h3>
          <p class="empty-state-desc">${escapeHTML(err.message || 'Error occurred')}</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/'">होम पर जाएं</button>
        </div>
      `;
    }
  }
}

const router = new Router();

// Authentication Views (Welcome to DailyJob)
router.addRoute("/login", (q) => renderDailyJobAuthView("login", q));
router.addRoute("/signin", (q) => renderDailyJobAuthView("login", q));
router.addRoute("/signup", (q) => renderDailyJobAuthView("signup", q));
router.addRoute("/auth", (q) => renderDailyJobAuthView("login", q));
router.addRoute("/create-profile", (q) => renderDailyJobProfileCreationView(q));

// Register all other view routes
router.addRoute("/", () => renderLandingView());
router.addRoute("/landing", () => renderLandingView());
router.addRoute("/onboarding", (q) => renderAuthView("onboarding"));
router.addRoute("/worker", () => renderWorkerHomeView());
router.addRoute("/worker-home", () => renderWorkerHomeView());
router.addRoute("/jobs", (q) => renderJobsView(q));
router.addRoute("/job-detail/:id", (id) => renderJobDetailsView(id));
router.addRoute("/today-work", () => renderTodayWorkView());
router.addRoute("/worker-profile", () => renderWorkerProfileView());
router.addRoute("/employer-profile", () => renderWorkerProfileView());
router.addRoute("/profile", () => renderWorkerProfileView());
router.addRoute("/skills", () => renderSkillsView());
router.addRoute("/earnings", () => renderEarningsView());

router.addRoute("/employer", () => renderEmployerHomeView());
router.addRoute("/employer-home", () => renderEmployerHomeView());
router.addRoute("/post-job", () => renderPostJobView());
router.addRoute("/applicants", (q) => renderApplicantsView(q ? q.jobId : null));
router.addRoute("/applicants/:jobId", (jobId) => renderApplicantsView(jobId));
router.addRoute("/active-work", () => renderActiveWorkView());

router.addRoute("/messages", (q) => renderMessagesView(q ? q.jobId : null));
router.addRoute("/notifications", () => renderNotificationsView());
router.addRoute("/safety", () => renderSafetyView());
router.addRoute("/disputes", (q) => renderDisputesView(q));
router.addRoute("/admin", () => renderAdminView());
router.addRoute("/more", () => renderMoreView());
