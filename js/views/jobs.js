/**
 * CGNeeti / कामसाथी - Simplified Job Search View
 * Simple search + 3 primary filters (दूरी, पैसे, कब) + और फ़िल्टर disclosure.
 */

let currentJobFilters = {
  tradeId: "all",
  urgentOnly: false,
  beginnerFriendly: false,
  searchQuery: "",
  maxDistance: null,
  minWage: null,
  dateFilter: "all",
  showMoreFilters: false
};

async function renderJobsView(queryParams = {}) {
  // Apply query params if passed
  if (queryParams.trade) currentJobFilters.tradeId = queryParams.trade;
  if (queryParams.filter === "today" || queryParams.filter === "urgent") currentJobFilters.urgentOnly = true;

  let allJobs = await appState.getJobs(currentJobFilters);
  // Strictly filter out any booked, filled, or completed jobs for other users
  allJobs = (allJobs || []).filter(j => j && (j.status === "open" || !j.status));

  // Apply distance filter
  if (currentJobFilters.maxDistance) {
    allJobs = allJobs.filter(j => j.distanceKm <= currentJobFilters.maxDistance);
  }
  // Apply wage filter
  if (currentJobFilters.minWage) {
    allJobs = allJobs.filter(j => j.wage >= currentJobFilters.minWage);
  }
  // Apply date filter
  if (currentJobFilters.dateFilter === "today") {
    allJobs = allJobs.filter(j => j.date.includes("आज") || j.date.toLowerCase().includes("today"));
  } else if (currentJobFilters.dateFilter === "tomorrow") {
    allJobs = allJobs.filter(j => j.date.includes("कल") || j.date.toLowerCase().includes("tomorrow"));
  }

  return `
    <div class="find-jobs-page" style="max-width: 640px; margin: 0 auto;">
      <!-- Title -->
      <div class="mb-3 pt-1">
        <div class="flex justify-between items-center">
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            आसपास का काम
          </h1>
          <span class="badge badge-primary font-bold">${allJobs.length} काम</span>
        </div>
      </div>

      <!-- Search Bar -->
      <div style="position: relative; margin-bottom: 1rem;">
        <input 
          type="text" 
          id="jobs-search-input" 
          class="form-control" 
          placeholder="काम खोजें (उदा. Electrician, Durg)..." 
          value="${escapeHTML(currentJobFilters.searchQuery)}"
          oninput="window.handleJobSearch(this.value)"
          style="padding-left: 2.75rem; border-radius: var(--radius-full); font-size: 1rem;"
        />
        <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1.15rem; color: var(--text-muted);">
          🔍
        </span>
        ${currentJobFilters.searchQuery ? `
          <button class="btn btn-ghost btn-sm btn-icon-only" onclick="window.clearJobSearch()" style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);" aria-label="Clear">✕</button>
        ` : ''}
      </div>

      <!-- ONLY 3 PRIMARY FILTERS: दूरी, पैसे, कब -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.75rem;">
        <!-- Filter 1: दूरी -->
        <select class="form-control" onchange="window.setDistanceFilter(this.value)" style="padding: 0.5rem 0.6rem; font-size: 0.85rem; font-weight: 600; border-radius: var(--radius-full); text-align: center;">
          <option value="">📍 दूरी: सभी</option>
          <option value="3" ${currentJobFilters.maxDistance === 3 ? 'selected' : ''}>📍 3 km तक</option>
          <option value="5" ${currentJobFilters.maxDistance === 5 ? 'selected' : ''}>📍 5 km तक</option>
          <option value="10" ${currentJobFilters.maxDistance === 10 ? 'selected' : ''}>📍 10 km तक</option>
        </select>

        <!-- Filter 2: पैसे -->
        <select class="form-control" onchange="window.setWageFilter(this.value)" style="padding: 0.5rem 0.6rem; font-size: 0.85rem; font-weight: 600; border-radius: var(--radius-full); text-align: center;">
          <option value="">💰 पैसे: सभी</option>
          <option value="600" ${currentJobFilters.minWage === 600 ? 'selected' : ''}>💰 ₹600+</option>
          <option value="750" ${currentJobFilters.minWage === 750 ? 'selected' : ''}>💰 ₹750+</option>
          <option value="900" ${currentJobFilters.minWage === 900 ? 'selected' : ''}>💰 ₹900+</option>
        </select>

        <!-- Filter 3: कब -->
        <select class="form-control" onchange="window.setDateFilter(this.value)" style="padding: 0.5rem 0.6rem; font-size: 0.85rem; font-weight: 600; border-radius: var(--radius-full); text-align: center;">
          <option value="all">📅 कब: कभी भी</option>
          <option value="today" ${currentJobFilters.dateFilter === 'today' ? 'selected' : ''}>📅 आज</option>
          <option value="tomorrow" ${currentJobFilters.dateFilter === 'tomorrow' ? 'selected' : ''}>📅 कल</option>
        </select>
      </div>

      <!-- Progressive Disclosure: और फ़िल्टर -->
      <div class="mb-4">
        <button class="btn btn-ghost btn-sm" onclick="window.toggleMoreFilters()" style="font-weight: 600; color: var(--color-primary); padding: 0.25rem 0.5rem;">
          ${currentJobFilters.showMoreFilters ? '▲ कम फ़िल्टर' : '▼ और फ़िल्टर'}
        </button>

        ${currentJobFilters.showMoreFilters ? `
          <div class="card mt-2 p-3" style="background: var(--bg-surface-muted); border-radius: var(--radius-lg);">
            <div class="text-secondary font-bold mb-2" style="font-size: 0.85rem;">काम का प्रकार (Trade):</div>
            <div class="filter-scroll-container mb-3">
              ${INITIAL_TRADES.map(tItem => `
                <button 
                  class="filter-pill ${currentJobFilters.tradeId === tItem.id ? 'active' : ''}" 
                  onclick="window.setTradeFilter('${tItem.id}')"
                >
                  ${tItem.icon || ''} ${tItem.nameHi}
                </button>
              `).join('')}
            </div>

            <div class="flex gap-2 flex-wrap items-center">
              <button 
                class="filter-pill ${currentJobFilters.urgentOnly ? 'active' : ''}" 
                onclick="window.toggleUrgentFilter()"
              >
                🚨 तुरंत काम
              </button>

              <button 
                class="filter-pill ${currentJobFilters.beginnerFriendly ? 'active' : ''}" 
                onclick="window.toggleBeginnerFilter()"
              >
                🌱 बिना अनुभव (Beginner)
              </button>

              <button class="btn btn-ghost btn-sm text-danger" onclick="window.resetAllJobFilters()">
                ✕ फ़िल्टर हटाएं
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Jobs List -->
      <div id="jobs-container">
        ${allJobs.length > 0 ? (
          allJobs.map(job => UI.renderJobCard(job)).join('')
        ) : (
          `
          <div class="empty-state">
            <div class="empty-state-icon">🔎</div>
            <h3 class="empty-state-title">अभी कोई काम नहीं मिला</h3>
            <p class="empty-state-desc">फ़िल्टर बदलकर दोबारा देखें।</p>
            <button class="btn btn-primary mt-2" onclick="window.resetAllJobFilters()">
              सभी काम देखें →
            </button>
          </div>
          `
        )}
      </div>
    </div>
  `;
}

// Global actions
window.handleJobSearch = function(val) {
  currentJobFilters.searchQuery = val;
  refreshJobsView();
};

window.clearJobSearch = function() {
  currentJobFilters.searchQuery = "";
  refreshJobsView();
};

window.setDistanceFilter = function(val) {
  currentJobFilters.maxDistance = val ? parseInt(val) : null;
  refreshJobsView();
};

window.setWageFilter = function(val) {
  currentJobFilters.minWage = val ? parseInt(val) : null;
  refreshJobsView();
};

window.setDateFilter = function(val) {
  currentJobFilters.dateFilter = val || "all";
  refreshJobsView();
};

window.toggleMoreFilters = function() {
  currentJobFilters.showMoreFilters = !currentJobFilters.showMoreFilters;
  refreshJobsView();
};

window.setTradeFilter = function(tradeId) {
  currentJobFilters.tradeId = tradeId;
  refreshJobsView();
};

window.toggleUrgentFilter = function() {
  currentJobFilters.urgentOnly = !currentJobFilters.urgentOnly;
  refreshJobsView();
};

window.toggleBeginnerFilter = function() {
  currentJobFilters.beginnerFriendly = !currentJobFilters.beginnerFriendly;
  refreshJobsView();
};

window.resetAllJobFilters = function() {
  currentJobFilters = {
    tradeId: "all",
    urgentOnly: false,
    beginnerFriendly: false,
    searchQuery: "",
    maxDistance: null,
    minWage: null,
    dateFilter: "all",
    showMoreFilters: false
  };
  refreshJobsView();
};

async function refreshJobsView() {
  const container = document.getElementById("app-view-container");
  if (container) {
    container.innerHTML = await renderJobsView();
  }
}
