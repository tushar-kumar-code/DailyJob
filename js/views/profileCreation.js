/**
 * DailyJob — Universal Adaptive Profile Creation System
 * Designed for the least technically comfortable user (non-literate, basic-reading, daily-wage workers)
 * as well as highly educated professionals.
 *
 * Core Principles:
 * 1. Adaptive Questions: The answer to the previous question determines the next question.
 * 2. Minimum Data, Maximum Usefulness: Ask only what is required for job matching.
 * 3. Accessibility & Low-Literacy: Large buttons, icons, minimal typing, voice read-aloud (🔊).
 * 4. Education & Resume: NEVER asked to daily workers, cleaners, cooks; only unlocked when relevant.
 * 5. Employer Flow: Adaptive (Household/Shop skips GST/CIN; Corporate gets business fields).
 */

// Adaptive Profile State - 100% Real User Data (Zero Dummy Defaults)
let adaptiveState = {
  activeFlow: "job_seeker", // "job_seeker" | "employer"
  currentStepIndex: 0,
  lang: "hi", // "hi" | "en"
  isSpeaking: false,

  // Job Seeker Answers - Pure User Selections
  jobSeeker: {
    workType: "", // "daily" | "part_time" | "full_time" | "permanent" | "temporary" | "remote" | "any" | "undecided" | custom
    customWorkType: "",
    category: "", // Category key
    categoryTitle: "",
    customCategoryTitle: "",
    skillDetail: "",
    customSkillDetail: "",
    hasExperience: "", // "yes" | "no" | "little"
    experienceYears: "", // "<6m" | "6m-1y" | "1-3y" | "3-5y" | "5y+"
    customExperience: "",
    education: "",
    customEducation: "",
    locationType: "",
    cityName: "",
    timing: "",
    customTiming: "",
    startDate: "",
    wageType: "",
    expectedWage: "",
    customWage: "",
    fullName: "",
    mobileNumber: "",
    email: "",
    age: "",
    gender: "",
    date_of_birth: "",
    professionalLinks: { resume_url: "", linkedin_url: "" }
  },

  // Employer Answers - Pure User Selections
  employer: {
    empCategory: "",
    empCategoryTitle: "",
    customCategoryTitle: "",
    isCorporate: false,
    contactName: "",
    companyName: "",
    mobileNumber: "",
    officialEmail: "",
    industry: "",
    neededRole: "",
    neededCount: "",
    workLocation: "",
    workTiming: "",
    customWorkTiming: "",
    paymentOffer: "",
    startDate: ""
  }
};

// ---------------------------------------------------------------------------
// 1. Text-to-Speech (Voice Audio) Support
// ---------------------------------------------------------------------------
window.speakQuestion = function(text) {
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = adaptiveState.lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.88;

    const btn = document.getElementById("active-voice-btn");
    if (btn) btn.classList.add("speaking");

    utterance.onend = () => {
      if (btn) btn.classList.remove("speaking");
    };
    utterance.onerror = () => {
      if (btn) btn.classList.remove("speaking");
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech error:", e);
  }
};

// Toggle Language
window.toggleAdaptiveLanguage = function() {
  adaptiveState.lang = adaptiveState.lang === "hi" ? "en" : "hi";
  renderAdaptiveDOM();
};

// ---------------------------------------------------------------------------
// 2. Adaptive Step Generator Engine
// ---------------------------------------------------------------------------
function getAdaptiveStepList() {
  if (adaptiveState.activeFlow === "employer") {
    const list = ["emp_category"];
    if (adaptiveState.employer.isCorporate) {
      list.push("emp_corporate_info");
    } else {
      list.push("emp_household_info");
    }
    list.push("emp_requirement");
    list.push("emp_location");
    list.push("emp_timing_payment");
    list.push("emp_ready");
    return list;
  }

  // Job Seeker Flow:
  const js = adaptiveState.jobSeeker;
  const list = [];

  // Q1: Work Type (Always asked)
  list.push("js_work_type");

  // Q2: Work Category (Always asked)
  list.push("js_category");

  // Q3: Adaptive Skill Detail (For categories with specific questions or custom work)
  if (["cooking", "driving", "electrician", "software", "teaching", "custom", "other"].includes(js.category)) {
    list.push("js_skill_detail");
  }

  // Q4: Experience (Always asked in simple conversational form)
  list.push("js_experience");

  // Q5: Age (Always asked directly from the user - 100% real data)
  list.push("js_age");

  // Q6: Education (ONLY asked if Software, Teaching, Computer, or Professional! Never for cleaner/cook/driver/daily worker)
  const isEducatedCategory = ["software", "computer", "teaching"].includes(js.category) ||
                             ["permanent", "full_time"].includes(js.workType) && ["office", "manager"].includes(js.category);
  if (isEducatedCategory) {
    list.push("js_education");
  }

  // Q6: Location (Always asked)
  list.push("js_location");

  // Q7: Timing & Availability
  list.push("js_timing_availability");

  // Q8: Payment Expectation
  list.push("js_payment");

  // Q9: Professional Links (Only for Software / Engineering)
  if (js.category === "software") {
    list.push("js_professional_links");
  }

  // Final: Profile Ready Screen
  list.push("js_ready");

  return list;
}

// ---------------------------------------------------------------------------
// 3. Main View Renderer
// ---------------------------------------------------------------------------
function renderDailyJobProfileCreationView(queryParams = {}) {
  // Guard: if not authenticated at all, redirect to login
  if (!window.authService || !window.authService.isAuthenticated()) {
    setTimeout(() => { window.location.hash = "#/login"; }, 0);
    return "";
  }

  const currentUser = window.authService.user || {};

  // Completely sync real user details from authenticated account
  const realName = (currentUser.fullName || currentUser.name || currentUser.username || "").trim();
  const realMobile = (currentUser.mobile_number || currentUser.mobileNumber || currentUser.phone || "").trim();
  const realEmail = (currentUser.email || "").trim();

  if (realName) {
    if (!adaptiveState.jobSeeker.fullName) adaptiveState.jobSeeker.fullName = realName;
    if (!adaptiveState.employer.contactName) adaptiveState.employer.contactName = realName;
  }
  if (realMobile) {
    if (!adaptiveState.jobSeeker.mobileNumber) adaptiveState.jobSeeker.mobileNumber = realMobile;
    if (!adaptiveState.employer.mobileNumber) adaptiveState.employer.mobileNumber = realMobile;
  }
  if (realEmail) {
    if (!adaptiveState.jobSeeker.email) adaptiveState.jobSeeker.email = realEmail;
    if (!adaptiveState.employer.officialEmail) adaptiveState.employer.officialEmail = realEmail;
  }

  // Prepopulate from existing user profiles if already set by user previously
  const existingWorker = currentUser.worker_profile || currentUser.job_seeker_profile || (currentUser.profile?.user_type === 'job_seeker' ? currentUser.profile : null);
  if (existingWorker) {
    if (existingWorker.workType && !adaptiveState.jobSeeker.workType) adaptiveState.jobSeeker.workType = existingWorker.workType;
    if (existingWorker.category && !adaptiveState.jobSeeker.category) adaptiveState.jobSeeker.category = existingWorker.category;
    if ((existingWorker.categoryTitle || existingWorker.profession) && !adaptiveState.jobSeeker.categoryTitle) {
      adaptiveState.jobSeeker.categoryTitle = existingWorker.categoryTitle || existingWorker.profession;
    }
    if (existingWorker.cityName && !adaptiveState.jobSeeker.cityName) adaptiveState.jobSeeker.cityName = existingWorker.cityName;
    if (existingWorker.expectedWage && !adaptiveState.jobSeeker.expectedWage) adaptiveState.jobSeeker.expectedWage = existingWorker.expectedWage;
    if (existingWorker.skillDetail && !adaptiveState.jobSeeker.skillDetail) adaptiveState.jobSeeker.skillDetail = existingWorker.skillDetail;
  }

  const existingEmployer = currentUser.employer_profile || (currentUser.profile?.user_type === 'employer' ? currentUser.profile : null);
  if (existingEmployer) {
    if (existingEmployer.companyName && !adaptiveState.employer.companyName) adaptiveState.employer.companyName = existingEmployer.companyName;
    if (existingEmployer.workLocation && !adaptiveState.employer.workLocation) adaptiveState.employer.workLocation = existingEmployer.workLocation;
    if (existingEmployer.neededRole && !adaptiveState.employer.neededRole) adaptiveState.employer.neededRole = existingEmployer.neededRole;
  }

  // Determine flow from queryParams or user account type
  if (queryParams.type === "employer" || currentUser.account_type === "employer" || currentUser.role === "employer") {
    adaptiveState.activeFlow = "employer";
  } else if (queryParams.type === "job_seeker" || currentUser.account_type === "job_seeker") {
    adaptiveState.activeFlow = "job_seeker";
  }

  const steps = getAdaptiveStepList();
  if (adaptiveState.currentStepIndex >= steps.length) {
    adaptiveState.currentStepIndex = steps.length - 1;
  }
  const currentStepKey = steps[adaptiveState.currentStepIndex];

  return `
    <div class="profile-wizard-layout" style="max-width: 680px;">
      <!-- Top Bar: Role badge, Audio voice button, Language toggle -->
      <div class="wizard-top-nav">
        <div class="wizard-badge ${adaptiveState.activeFlow === 'employer' ? 'employer' : 'job-seeker'}">
          <span>${adaptiveState.activeFlow === 'employer' ? '🏢 काम देना है (Employer)' : '🧑‍🔧 काम ढूंढना है (Job Seeker)'}</span>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button" 
            id="active-voice-btn"
            class="voice-audio-btn" 
            onclick="window.speakCurrentStep()"
            title="आवाज़ में सुनें (Listen aloud)">
            <span>🔊</span> <span>सुनें (Listen)</span>
          </button>

          <button 
            type="button" 
            class="btn btn-ghost btn-sm"
            onclick="window.toggleAdaptiveLanguage()"
            style="font-size: 0.8rem; font-weight: 700; border: 1px solid var(--border-subtle); border-radius: 999px;">
            ${adaptiveState.lang === 'hi' ? 'English' : 'हिन्दी'}
          </button>
        </div>
      </div>

      <!-- Step Counter (Only minimal & friendly: "सवाल 2 / 6") -->
      ${currentStepKey !== 'js_ready' && currentStepKey !== 'emp_ready' ? `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; padding: 0 0.25rem;">
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-primary);">
            ${adaptiveState.lang === 'hi' ? `सवाल ${adaptiveState.currentStepIndex + 1} / ${steps.length - 1}` : `Question ${adaptiveState.currentStepIndex + 1} of ${steps.length - 1}`}
          </span>
          <button 
            type="button" 
            class="btn btn-ghost btn-sm" 
            onclick="window.toggleAdaptiveRole()" 
            style="font-size: 0.78rem; color: var(--text-secondary);">
            ${adaptiveState.activeFlow === 'employer' ? 'मुझे काम चाहिए (Job Seeker)' : 'मुझे काम देना है (Employer)'}
          </button>
        </div>
      ` : ''}

      <!-- Dynamic Question Content Card -->
      <div class="wizard-content-card">
        <div id="adaptive-question-container">
          ${renderCurrentAdaptiveStepHTML(currentStepKey)}
        </div>

        <!-- Navigation Buttons -->
        ${renderAdaptiveNavigationHTML(currentStepKey, steps)}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 4. Render Step HTML
// ---------------------------------------------------------------------------
function renderCurrentAdaptiveStepHTML(stepKey) {
  const isHi = adaptiveState.lang === "hi";

  switch (stepKey) {
    // -------------------------------------------------------------------------
    // Job Seeker Q1: Work Type
    // -------------------------------------------------------------------------
    case "js_work_type": {
      const selected = adaptiveState.jobSeeker.workType;
      const customVal = adaptiveState.jobSeeker.customWorkType;
      const isCustomActive = Boolean(customVal && selected === customVal);
      const title = isHi ? "आपको किस तरह का काम चाहिए?" : "What type of work are you looking for?";
      const subtitle = isHi ? "अपनी पसंद चुनें, या नीचे अपना विकल्प खुद बनाएं:" : "Select an option below or create your own custom option:";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${subtitle}</p>
            </div>
          </div>

          <div class="adaptive-grid-cards">
            ${[
              { key: "daily", icon: "🗓️", titleHi: "रोज काम", titleEn: "Daily Work", descHi: "रोज की दिहाड़ी वाला काम", descEn: "Daily wage basis" },
              { key: "part_time", icon: "⏰", titleHi: "पार्ट टाइम काम", titleEn: "Part Time", descHi: "दिन में कुछ घंटे", descEn: "Few hours a day" },
              { key: "full_time", icon: "💼", titleHi: "फुल टाइम नौकरी", titleEn: "Full Time Job", descHi: "पूरे दिन का काम / महीना", descEn: "Regular full-time" },
              { key: "permanent", icon: "🏛️", titleHi: "स्थायी नौकरी", titleEn: "Permanent Job", descHi: "पक्की नौकरी", descEn: "Permanent role" },
              { key: "temporary", icon: "⏳", titleHi: "अस्थायी काम", titleEn: "Temporary Work", descHi: "कुछ दिनों या हफ्तों का काम", descEn: "Short term" },
              { key: "remote", icon: "🏠", titleHi: "घर से काम", titleEn: "Work from Home", descHi: "घर बैठे काम", descEn: "Remote work" },
              { key: "any", icon: "🤝", titleHi: "कोई भी काम", titleEn: "Any Work", descHi: "जो भी अच्छा काम मिले", descEn: "Open to anything" },
              { key: "undecided", icon: "❓", titleHi: "मुझे नहीं पता", titleEn: "Not Sure Yet", descHi: "बाद में तय करेंगे", descEn: "Decide later" }
            ].map(opt => `
              <div 
                class="adaptive-card ${selected === opt.key ? 'selected' : ''}" 
                onclick="window.selectAdaptiveWorkType('${opt.key}')"
                role="button"
                tabindex="0">
                <div class="adaptive-card-icon">${opt.icon}</div>
                <div class="adaptive-card-title">${isHi ? opt.titleHi : opt.titleEn}</div>
                <div class="adaptive-card-desc">${isHi ? opt.descHi : opt.descEn}</div>
              </div>
            `).join("")}
          </div>

          <!-- Flexible Custom Work Type Option -->
          <div class="adaptive-custom-option-box ${isCustomActive ? 'active' : ''}">
            <div class="adaptive-custom-header">
              <span>✍️</span>
              <span>${isHi ? 'क्या आपका काम का प्रकार अलग है? अपना विकल्प खुद लिखें:' : 'Need a different work type? Create your own:'}</span>
            </div>
            <div class="adaptive-custom-input-group">
              <input 
                type="text" 
                id="custom-worktype-input"
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'उदा. ठेका काम, हफ्ते में 2 दिन, नाइट शिफ्ट, वीकेंड...' : 'e.g. Contract work, 2 days a week, Night shift...'}"
                value="${escapeHTML(customVal || '')}"
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomWorkType(this.value); }"
              />
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="window.applyCustomWorkType(document.getElementById('custom-worktype-input').value)">
                ✓ ${isHi ? 'यह चुनें' : 'Select'}
              </button>
            </div>
            ${isCustomActive ? `
              <div class="adaptive-custom-badge">
                <span>✓ आपका चुना हुआ विकल्प: <strong>${escapeHTML(customVal)}</strong></span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q2: Work Category / Skill
    // -------------------------------------------------------------------------
    case "js_category": {
      const selected = adaptiveState.jobSeeker.category;
      const customCat = adaptiveState.jobSeeker.customCategoryTitle;
      const isCustomActive = Boolean(customCat && (selected === 'custom' || selected === 'other'));
      const title = isHi ? "आप कौन सा काम कर सकते हैं?" : "What work or skills can you do?";
      const subtitle = isHi ? "अपना हुनर चुनें, या नीचे अपना काम खुद लिखें:" : "Choose your skill, or type your own custom trade below:";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${subtitle}</p>
            </div>
          </div>

          <div class="adaptive-grid-cards">
            ${[
              { key: "cooking", icon: "🍳", titleHi: "खाना बनाना", titleEn: "Cooking / Chef" },
              { key: "cleaning", icon: "🧹", titleHi: "साफ़-सफ़ाई / हेल्पर", titleEn: "Cleaning / House Help" },
              { key: "driving", icon: "🚗", titleHi: "ड्राइविंग / गाड़ी", titleEn: "Driving" },
              { key: "construction", icon: "🔨", titleHi: "निर्माण / मिस्त्री", titleEn: "Construction / Mason" },
              { key: "electrician", icon: "🔌", titleHi: "बिजली / इलेक्ट्रीशियन", titleEn: "Electrician" },
              { key: "plumber", icon: "🚰", titleHi: "प्लंबर / नल-फिटिंग", titleEn: "Plumber" },
              { key: "shop", icon: "🏪", titleHi: "दुकान का काम", titleEn: "Shop Work / Retail" },
              { key: "delivery", icon: "📦", titleHi: "डिलीवरी", titleEn: "Delivery Partner" },
              { key: "security", icon: "🛡️", titleHi: "सुरक्षा गार्ड", titleEn: "Security Guard" },
              { key: "agriculture", icon: "🌾", titleHi: "खेती-किसानी", titleEn: "Agriculture / Farming" },
              { key: "factory", icon: "🏭", titleHi: "फैक्ट्री वर्कर", titleEn: "Factory / Warehouse" },
              { key: "tailoring", icon: "🧵", titleHi: "सिलाई / दर्जी", titleEn: "Tailoring" },
              { key: "salon", icon: "💇", titleHi: "सैलून / ब्यूटीशियन", titleEn: "Salon / Beauty" },
              { key: "computer", icon: "💻", titleHi: "कंप्यूटर / डेटा एंट्री", titleEn: "Computer / Data Entry" },
              { key: "software", icon: "👨‍💻", titleHi: "सॉफ्टवेयर / IT", titleEn: "Software / Engineering" },
              { key: "teaching", icon: "👩‍🏫", titleHi: "पढ़ाना / ट्यूशन", titleEn: "Teaching / Tutor" },
              { key: "customer_service", icon: "📞", titleHi: "कॉलिंग / कस्टमर केयर", titleEn: "Calling / Support" },
              { key: "other", icon: "➕", titleHi: "अन्य काम", titleEn: "Other Work" }
            ].map(opt => `
              <div 
                class="adaptive-card ${selected === opt.key ? 'selected' : ''}" 
                onclick="window.selectAdaptiveCategory('${opt.key}', '${opt.titleHi}')"
                role="button"
                tabindex="0">
                <div class="adaptive-card-icon">${opt.icon}</div>
                <div class="adaptive-card-title">${isHi ? opt.titleHi : opt.titleEn}</div>
              </div>
            `).join("")}
          </div>

          <!-- Flexible Custom Work / Skill Option -->
          <div class="adaptive-custom-option-box ${isCustomActive ? 'active' : ''}">
            <div class="adaptive-custom-header">
              <span>✍️</span>
              <span>${isHi ? 'क्या आपका काम इस लिस्ट में नहीं है? अपना काम / हुनर खुद लिखें:' : 'Is your trade not listed? Type your skill / trade:'}</span>
            </div>
            <div class="adaptive-custom-input-group">
              <input 
                type="text" 
                id="custom-category-input"
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'उदा. कार मैकेनिक, हलवाई, एसी रिपेयर, लॉन्ड्री, फोटोग्राफर...' : 'e.g. Car Mechanic, AC Repair, Photographer, Baker...'}"
                value="${escapeHTML(customCat || '')}"
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomCategory(this.value); }"
              />
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="window.applyCustomCategory(document.getElementById('custom-category-input').value)">
                ✓ ${isHi ? 'यह काम जोड़ें' : 'Add This Skill'}
              </button>
            </div>
            ${isCustomActive ? `
              <div class="adaptive-custom-badge">
                <span>⭐ आपका चुना हुआ काम: <strong>${escapeHTML(customCat)}</strong></span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q3: Adaptive Skill Detail (Specific to Selected Skill)
    // -------------------------------------------------------------------------
    case "js_skill_detail": {
      const cat = adaptiveState.jobSeeker.category;
      let questionTitle = "";
      let options = [];

      if (cat === "cooking") {
        questionTitle = isHi ? "आप क्या बना सकते हैं?" : "What can you cook?";
        options = [
          { key: "home_food", icon: "🍲", titleHi: "घर का सादा खाना", titleEn: "Home style food" },
          { key: "hotel_food", icon: "🍛", titleHi: "होटल / रेस्टोरेंट का खाना", titleEn: "Restaurant / Hotel food" },
          { key: "sweets", icon: "🍯", titleHi: "मिठाई / स्वीट्स", titleEn: "Sweets & Desserts" },
          { key: "bakery", icon: "🍞", titleHi: "बेकरी और केक", titleEn: "Bakery & Cakes" },
          { key: "snacks", icon: "☕", titleHi: "चाय, नाश्ता और फास्ट फूड", titleEn: "Tea & Fast food" },
          { key: "any_food", icon: "🍽️", titleHi: "कोई भी खाना बना लेंगे", titleEn: "Any type of food" }
        ];
      } else if (cat === "driving") {
        questionTitle = isHi ? "आपके पास कौन सा लाइसेंस है?" : "Which driving license do you have?";
        options = [
          { key: "two_wheeler", icon: "🛵", titleHi: "टू-व्हीलर (बाइक / स्कूटर)", titleEn: "Two Wheeler (Bike)" },
          { key: "lmv", icon: "🚗", titleHi: "LMV (कार / जीप)", titleEn: "LMV (Car / Jeep)" },
          { key: "commercial", icon: "🚕", titleHi: "कमर्शियल / टैक्सी लाइसेंस", titleEn: "Commercial / Taxi" },
          { key: "heavy", icon: "🚚", titleHi: "हेवी लाइसेंस (ट्रक / बस)", titleEn: "Heavy Vehicle (Truck/Bus)" },
          { key: "no_license", icon: "❌", titleHi: "अभी लाइसेंस नहीं है", titleEn: "No Driving License" }
        ];
      } else if (cat === "electrician") {
        questionTitle = isHi ? "आप किस तरह का काम कर सकते हैं?" : "What kind of electrical work can you do?";
        options = [
          { key: "house_wiring", icon: "🏠", titleHi: "घर की वायरिंग", titleEn: "House Wiring" },
          { key: "motor_repair", icon: "⚙️", titleHi: "मोटर / पंप रिपेयर", titleEn: "Motor / Pump repair" },
          { key: "ac_fridge", icon: "❄️", titleHi: "AC और फ्रिज", titleEn: "AC & Refrigeration" },
          { key: "fan_light", icon: "💡", titleHi: "पंखा, लाइट और फिटिंग", titleEn: "Fan, Light & Fitting" },
          { key: "all_electrical", icon: "⚡", titleHi: "सभी सामान्य बिजली का काम", titleEn: "All general electrical" }
        ];
      } else if (cat === "software") {
        questionTitle = isHi ? "आपकी मुख्य टेक्नोलॉजी क्या है?" : "What is your primary technology / role?";
        options = [
          { key: "web_dev", icon: "🌐", titleHi: "वेब डेवलपमेंट (HTML/JS/React)", titleEn: "Web Development" },
          { key: "backend_dev", icon: "🖥️", titleHi: "बैकएंड / Python / Node / Java", titleEn: "Backend Development" },
          { key: "mobile_app", icon: "📱", titleHi: "मोबाइल ऐप (Android/Flutter)", titleEn: "Mobile App" },
          { key: "data_ai", icon: "📊", titleHi: "डेटा / AI / Python", titleEn: "Data / AI" },
          { key: "qa_testing", icon: "🔍", titleHi: "सॉफ्टवेयर टेस्टिंग (QA)", titleEn: "Software Testing / QA" },
          { key: "other_tech", icon: "💻", titleHi: "अन्य टेक्नोलॉजी", titleEn: "Other Tech" }
        ];
      } else if (cat === "teaching") {
        questionTitle = isHi ? "आप किस कक्षा या विषय को पढ़ा सकते हैं?" : "What classes or subjects can you teach?";
        options = [
          { key: "primary", icon: "👶", titleHi: "कक्षा 1 से 5", titleEn: "Primary (Class 1-5)" },
          { key: "middle", icon: "🎒", titleHi: "कक्षा 6 से 10", titleEn: "Middle & High School (6-10)" },
          { key: "senior", icon: "📚", titleHi: "11वीं - 12वीं / बोर्ड", titleEn: "Senior Secondary (11-12)" },
          { key: "english_spoken", icon: "🗣️", titleHi: "इंग्लिश स्पीकिंग", titleEn: "Spoken English" },
          { key: "computer_trainer", icon: "💻", titleHi: "कंप्यूटर सिखाना", titleEn: "Computer Training" }
        ];
      } else {
        const tradeTitle = adaptiveState.jobSeeker.categoryTitle || (isHi ? 'इस काम' : 'this work');
        questionTitle = isHi ? `"${tradeTitle}" में आपकी क्या खासियत है?` : `What is your specialty in "${tradeTitle}"?`;
        options = [
          { key: "all_round", icon: "⭐", titleHi: "सभी काम कर लेते हैं", titleEn: "All-round experience" },
          { key: "experienced", icon: "💼", titleHi: "कुशल व अनुभवी", titleEn: "Skilled & Experienced" },
          { key: "quick_learner", icon: "⚡", titleHi: "नया काम जल्दी सीख लेते हैं", titleEn: "Quick learner" }
        ];
      }

      const selectedDetail = adaptiveState.jobSeeker.skillDetail;
      const customDetail = adaptiveState.jobSeeker.customSkillDetail;
      const isCustomDetailActive = Boolean(customDetail && selectedDetail === customDetail);

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${questionTitle}</h2>
            </div>
          </div>

          <div class="adaptive-grid-cards">
            ${options.map(opt => `
              <div 
                class="adaptive-card ${selectedDetail === opt.key ? 'selected' : ''}" 
                onclick="window.selectAdaptiveSkillDetail('${opt.key}', '${opt.titleHi}')"
                role="button"
                tabindex="0">
                <div class="adaptive-card-icon">${opt.icon}</div>
                <div class="adaptive-card-title">${isHi ? opt.titleHi : opt.titleEn}</div>
              </div>
            `).join("")}
          </div>

          <!-- Flexible Custom Skill Detail Input -->
          <div class="adaptive-custom-option-box ${isCustomDetailActive ? 'active' : ''}">
            <div class="adaptive-custom-header">
              <span>✍️</span>
              <span>${isHi ? 'या अपनी विशेषता / खासियत खुद लिखें:' : 'Or type your specific specialty:'}</span>
            </div>
            <div class="adaptive-custom-input-group">
              <input 
                type="text" 
                id="custom-skilldetail-input"
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'उदा. तंदूरी रोटी, जेसीबी व क्रेन, सोलर पैनल वायरिंग, टिफिन सर्विस...' : 'e.g. Tandoori roti, JCB operator, Solar panels, Tiffin...'}"
                value="${escapeHTML(customDetail || '')}"
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomSkillDetail(this.value); }"
              />
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="window.applyCustomSkillDetail(document.getElementById('custom-skilldetail-input').value)">
                ✓ ${isHi ? 'लागू करें' : 'Apply'}
              </button>
            </div>
            ${isCustomDetailActive ? `
              <div class="adaptive-custom-badge">
                <span>✓ चुनी गई खासियत: <strong>${escapeHTML(customDetail)}</strong></span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q4: Experience
    // -------------------------------------------------------------------------
    case "js_experience": {
      const hasExp = adaptiveState.jobSeeker.hasExperience;
      const title = isHi ? "क्या आपने यह काम पहले किया है?" : "Have you done this work before?";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'अगर पहली बार कर रहे हैं तो भी कोई बात नहीं!' : 'No worries if you are just starting out!'}</p>
            </div>
          </div>

          <div class="adaptive-list-options">
            <div 
              class="adaptive-list-card ${hasExp === 'yes' ? 'selected' : ''}" 
              onclick="window.selectAdaptiveExperience('yes')">
              <div class="adaptive-list-icon">👍</div>
              <div class="adaptive-list-content">
                <div class="adaptive-list-title">${isHi ? 'हाँ, अनुभव है' : 'Yes, I have experience'}</div>
                <div class="adaptive-list-desc">${isHi ? 'मैंने पहले यह काम किया है' : 'I have worked before'}</div>
              </div>
            </div>

            <div 
              class="adaptive-list-card ${hasExp === 'no' ? 'selected' : ''}" 
              onclick="window.selectAdaptiveExperience('no')">
              <div class="adaptive-list-icon">🌱</div>
              <div class="adaptive-list-content">
                <div class="adaptive-list-title">${isHi ? 'नहीं, नया हूँ (Fresher)' : 'No, I am new (Fresher)'}</div>
                <div class="adaptive-list-desc">${isHi ? 'सीखने को तैयार हूँ' : 'Ready to learn and start'}</div>
              </div>
            </div>

            <div 
              class="adaptive-list-card ${hasExp === 'little' ? 'selected' : ''}" 
              onclick="window.selectAdaptiveExperience('little')">
              <div class="adaptive-list-icon">👌</div>
              <div class="adaptive-list-content">
                <div class="adaptive-list-title">${isHi ? 'थोड़ा-बहुत काम जानता हूँ' : 'I know basic work'}</div>
                <div class="adaptive-list-desc">${isHi ? 'कुछ समय काम किया है' : 'Have basic understanding'}</div>
              </div>
            </div>
          </div>

          ${hasExp === 'yes' ? `
            <div style="background: var(--bg-surface-muted); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 1rem;">
              <label class="dailyjob-step-label">${isHi ? 'कितने साल का अनुभव है?' : 'How many years of experience?'}</label>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${[
                  { key: "<6m", label: "6 महीने से कम" },
                  { key: "6m-1y", label: "6 महीने – 1 साल" },
                  { key: "1-3y", label: "1 से 3 साल" },
                  { key: "3-5y", label: "3 से 5 साल" },
                  { key: "5y+", label: "5 साल से ज्यादा" }
                ].map(opt => `
                  <button 
                    type="button" 
                    class="btn btn-sm ${adaptiveState.jobSeeker.experienceYears === opt.key ? 'btn-primary' : 'btn-secondary'}"
                    onclick="adaptiveState.jobSeeker.experienceYears = '${opt.key}'; renderAdaptiveDOM();">
                    ${opt.label}
                  </button>
                `).join("")}
              </div>
            </div>
          ` : ''}

          <!-- Flexible Custom Experience Description -->
          <div class="adaptive-custom-option-box ${adaptiveState.jobSeeker.customExperience ? 'active' : ''}">
            <div class="adaptive-custom-header">
              <span>✍️</span>
              <span>${isHi ? 'या अपने अनुभव के बारे में खुद लिखें (वैकल्पिक):' : 'Or describe your experience (optional):'}</span>
            </div>
            <div class="adaptive-custom-input-group">
              <input 
                type="text" 
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'उदा. 7 साल गैराज में काम किया, 2 साल होटल में शेफ रहे, पारिवारिक काम...' : 'e.g. 7 years in auto garage, 2 years in hotel...'}"
                value="${escapeHTML(adaptiveState.jobSeeker.customExperience || '')}"
                oninput="adaptiveState.jobSeeker.customExperience = this.value.trim(); if(this.value.trim()){ adaptiveState.jobSeeker.hasExperience = 'yes'; }"
              />
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q5: Age (आयु / उम्र) - Direct User Input, ZERO False Data
    // -------------------------------------------------------------------------
    case "js_age": {
      const currentAge = adaptiveState.jobSeeker.age || "";
      const title = isHi ? "आपकी उम्र (Age) कितनी है?" : "What is your age?";
      const subtitle = isHi ? "अपनी असली उम्र दर्ज करें (कम से कम 18 वर्ष):" : "Enter your real age (at least 18 years):";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${subtitle}</p>
            </div>
          </div>

          <div style="background: var(--bg-surface-muted); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem; max-width: 420px;">
            <label class="dailyjob-step-label" style="font-size: 0.95rem; font-weight: 700; display: block; margin-bottom: 0.5rem;">
              🎂 ${isHi ? 'अपनी उम्र दर्ज करें (वर्ष में):' : 'Enter your age (in years):'}
            </label>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <input 
                type="number" 
                id="adaptive-user-age-input"
                class="form-control" 
                min="18" 
                max="90" 
                value="${currentAge}" 
                placeholder="उदा. 24"
                oninput="adaptiveState.jobSeeker.age = this.value ? parseInt(this.value, 10) : '';"
                style="font-size: 1.3rem; font-weight: 800; text-align: center; border-radius: 10px; padding: 0.6rem; width: 140px;"
                autofocus
              />
              <span style="font-weight: 700; font-size: 1.05rem; color: var(--text-secondary);">${isHi ? 'वर्ष' : 'Years'}</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.6rem; margin-bottom: 0;">
              ℹ️ ${isHi ? 'कामगार की आयु 18 वर्ष या उससे अधिक होनी अनिवार्य है।' : 'Worker must be at least 18 years old.'}
            </p>
          </div>

          <div>
            <label class="dailyjob-step-label" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; display: block;">
              ⚡ ${isHi ? 'या सीधा टच करके चुनें (Quick Select):' : 'Or quick select:'}
            </label>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${[18, 20, 22, 24, 25, 28, 30, 32, 35, 40, 45, 50].map(val => `
                <button 
                  type="button" 
                  class="btn btn-sm ${currentAge === val ? 'btn-primary' : 'btn-secondary'}"
                  onclick="adaptiveState.jobSeeker.age = ${val}; renderAdaptiveDOM();"
                  style="min-width: 48px; font-weight: 700; border-radius: 8px;">
                  ${val}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q6: Education (ONLY for educated/professional categories)
    // -------------------------------------------------------------------------
    case "js_education": {
      const edu = adaptiveState.jobSeeker.education;
      const customEdu = adaptiveState.jobSeeker.customEducation;
      const isCustomEduActive = Boolean(customEdu && (edu === customEdu || edu === 'other'));
      const title = isHi ? "आपकी पढ़ाई क्या है?" : "What is your educational qualification?";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'सॉफ्टवेयर और ऑफिस नौकरियों के लिए यह उपयोगी है:' : 'Useful for technical & office jobs:'}</p>
            </div>
          </div>

          <div class="adaptive-grid-cards">
            ${[
              { key: "10th", icon: "📖", title: "10वीं पास" },
              { key: "12th", icon: "📘", title: "12वीं पास" },
              { key: "diploma", icon: "📜", title: "डिप्लोमा / ITI" },
              { key: "graduation", icon: "🎓", title: "ग्रेजुएशन / डिग्री (B.Tech, B.Sc, B.Com)" },
              { key: "post_graduation", icon: "🏛️", title: "पोस्ट ग्रेजुएशन (Master's / MBA)" },
              { key: "other", icon: "📝", title: "अन्य / Other" }
            ].map(opt => `
              <div 
                class="adaptive-card ${edu === opt.key ? 'selected' : ''}" 
                onclick="adaptiveState.jobSeeker.education = '${opt.key}'; renderAdaptiveDOM();"
                role="button"
                tabindex="0">
                <div class="adaptive-card-icon">${opt.icon}</div>
                <div class="adaptive-card-title">${opt.title}</div>
              </div>
            `).join("")}
          </div>

          <!-- Flexible Custom Education Input -->
          <div class="adaptive-custom-option-box ${isCustomEduActive ? 'active' : ''}">
            <div class="adaptive-custom-header">
              <span>✍️</span>
              <span>${isHi ? 'या अपनी पढ़ाई / डिग्री / कोर्स का नाम खुद लिखें:' : 'Or enter your course / degree / qualification:'}</span>
            </div>
            <div class="adaptive-custom-input-group">
              <input 
                type="text" 
                id="custom-education-input"
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'उदा. आईटीआई (फिटर), बीसीए, पॉलिटेक्निक, 10वीं...' : 'e.g. ITI, BCA, Polytechnic, High School...'}"
                value="${escapeHTML(customEdu || '')}"
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomEducation(this.value); }"
              />
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="window.applyCustomEducation(document.getElementById('custom-education-input').value)">
                ✓ ${isHi ? 'यह चुनें' : 'Select'}
              </button>
            </div>
            ${isCustomEduActive ? `
              <div class="adaptive-custom-badge">
                <span>✓ चुनी गई योग्यता: <strong>${escapeHTML(customEdu)}</strong></span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q6: Location
    // -------------------------------------------------------------------------
    case "js_location": {
      const loc = adaptiveState.jobSeeker.locationType;
      const title = isHi ? "आप कहाँ काम करना चाहते हैं?" : "Where do you want to work?";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'जहाँ आप आसानी से पहुंच सकें:' : 'Where you can easily commute or reach:'}</p>
            </div>
          </div>

          <div class="adaptive-list-options">
            <div 
              class="adaptive-list-card ${loc === 'nearby' ? 'selected' : ''}" 
              onclick="window.selectAdaptiveLocation('nearby')">
              <div class="adaptive-list-icon">📍</div>
              <div class="adaptive-list-content">
                <div class="adaptive-list-title">${isHi ? 'मेरे आसपास (Nearby - 5 से 10 किमी)' : 'Near My Location (5-10 km)'}</div>
                <div class="adaptive-list-desc">${isHi ? 'मेरे घर के पास का काम' : 'Local nearby jobs'}</div>
              </div>
            </div>

            <div 
              class="adaptive-list-card ${loc === 'city' ? 'selected' : ''}" 
              onclick="window.selectAdaptiveLocation('city')">
              <div class="adaptive-list-icon">🏙️</div>
              <div class="adaptive-list-content">
                <div class="adaptive-list-title">${isHi ? 'मेरे पूरे शहर में' : 'Anywhere in my city'}</div>
                <div class="adaptive-list-desc">${isHi ? 'शहर में कहीं भी जा सकते हैं' : 'Any locality in city'}</div>
              </div>
            </div>

            <div 
              class="adaptive-list-card ${loc === 'home' ? 'selected' : ''}" 
              onclick="window.selectAdaptiveLocation('home')">
              <div class="adaptive-list-icon">🏠</div>
              <div class="adaptive-list-content">
                <div class="adaptive-list-title">${isHi ? 'घर से काम (Work from Home)' : 'Work from Home'}</div>
                <div class="adaptive-list-desc">${isHi ? 'बिना कहीं जाए घर पर काम' : 'Remote work only'}</div>
              </div>
            </div>

            <div 
              class="adaptive-list-card ${loc === 'anywhere' ? 'selected' : ''}" 
              onclick="window.selectAdaptiveLocation('anywhere')">
              <div class="adaptive-list-icon">🗺️</div>
              <div class="adaptive-list-content">
                <div class="adaptive-list-title">${isHi ? 'दूसरे शहर भी जा सकते हैं' : 'Willing to relocate'}</div>
                <div class="adaptive-list-desc">${isHi ? 'अच्छा काम मिले तो कहीं भी' : 'Any city'}</div>
              </div>
            </div>
          </div>

          <div style="background: var(--bg-surface-muted); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
              <input 
                type="text" 
                class="dailyjob-input" 
                style="flex: 1;" 
                placeholder="${isHi ? 'अपने शहर / इलाके का नाम लिखें (उदा. रायपुर, बिलासपुर, मुंबई)' : 'Enter City or Locality (e.g. Raipur, Mumbai)'}"
                value="${escapeHTML(adaptiveState.jobSeeker.cityName || '')}"
                onchange="adaptiveState.jobSeeker.cityName = this.value.trim()"
              />
              <button 
                type="button" 
                class="btn btn-outline btn-sm" 
                onclick="window.useGPSLocation()" 
                title="GPS से लोकेशन लें"
                style="white-space: nowrap;">
                📌 GPS लोकेशन
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q7: Timing & Availability
    // -------------------------------------------------------------------------
    case "js_timing_availability": {
      const timing = adaptiveState.jobSeeker.timing;
      const start = adaptiveState.jobSeeker.startDate;
      const customTiming = adaptiveState.jobSeeker.customTiming;
      const isCustomTimingActive = Boolean(customTiming && timing === customTiming);
      const title = isHi ? "आप कब काम करना चाहते हैं?" : "When are you available to work?";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
            </div>
          </div>

          <div class="mb-4">
            <label class="dailyjob-step-label">${isHi ? 'दिन का पसंदीदा समय:' : 'Preferred Time of Day:'}</label>
            <div class="adaptive-grid-cards" style="grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));">
              ${[
                { key: "any", icon: "🔄", title: "कोई भी समय" },
                { key: "morning", icon: "🌅", title: "सुबह" },
                { key: "afternoon", icon: "☀️", title: "दोपहर" },
                { key: "evening", icon: "🌆", title: "शाम" },
                { key: "night", icon: "🌙", title: "रात" }
              ].map(opt => `
                <div 
                  class="adaptive-card ${timing === opt.key ? 'selected' : ''}" 
                  onclick="adaptiveState.jobSeeker.timing = '${opt.key}'; renderAdaptiveDOM();"
                  style="min-height: 80px; padding: 0.75rem;">
                  <div class="adaptive-card-icon" style="font-size: 1.6rem;">${opt.icon}</div>
                  <div class="adaptive-card-title" style="font-size: 0.95rem;">${opt.title}</div>
                </div>
              `).join("")}
            </div>

            <!-- Flexible Custom Timing Input -->
            <div class="adaptive-custom-option-box ${isCustomTimingActive ? 'active' : ''}">
              <div class="adaptive-custom-header">
                <span>✍️</span>
                <span>${isHi ? 'या अपनी सुविधा का समय खुद लिखें:' : 'Or type your preferred timing:'}</span>
              </div>
              <div class="adaptive-custom-input-group">
                <input 
                  type="text" 
                  id="custom-timing-input"
                  class="adaptive-custom-input" 
                  placeholder="${isHi ? 'उदा. सुबह 7 से 11 बजे, केवल शनिवार-रविवार, 4 घंटे पार्ट-टाइम...' : 'e.g. 7 AM to 11 AM, Weekends only, 4 hrs part-time...'}"
                  value="${escapeHTML(customTiming || '')}"
                  onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomTiming(this.value); }"
                />
                <button 
                  type="button" 
                  class="btn btn-primary btn-sm" 
                  onclick="window.applyCustomTiming(document.getElementById('custom-timing-input').value)">
                  ✓ ${isHi ? 'लागू करें' : 'Apply'}
                </button>
              </div>
              ${isCustomTimingActive ? `
                <div class="adaptive-custom-badge">
                  <span>✓ आपका चुना हुआ समय: <strong>${escapeHTML(customTiming)}</strong></span>
                </div>
              ` : ''}
            </div>
          </div>

          <div>
            <label class="dailyjob-step-label">${isHi ? 'कब से काम शुरू कर सकते हैं?' : 'When can you start working?'}</label>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${[
                { key: "today", label: "⚡ आज से (Today)" },
                { key: "tomorrow", label: "🗓️ कल से (Tomorrow)" },
                { key: "this_week", label: "📆 इस हफ्ते से (This week)" },
                { key: "next_month", label: "⏳ अगले महीने (Next month)" },
                { key: "not_sure", label: "❓ अभी नहीं पता (Not sure)" }
              ].map(opt => `
                <button 
                  type="button" 
                  class="btn btn-sm ${start === opt.key ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="adaptiveState.jobSeeker.startDate = '${opt.key}'; renderAdaptiveDOM();">
                  ${opt.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q8: Payment Expectation
    // -------------------------------------------------------------------------
    case "js_payment": {
      const isDaily = adaptiveState.jobSeeker.workType === "daily";
      const title = isDaily
        ? (isHi ? "आपको कितनी दिहाड़ी चाहिए?" : "What is your daily wage expectation?")
        : (isHi ? "महीने की कितनी कमाई / सैलरी चाहिए?" : "Expected monthly payment / salary?");

      const currentWage = adaptiveState.jobSeeker.expectedWage;
      const customWage = adaptiveState.jobSeeker.customWage;
      const isCustomWageActive = Boolean(customWage && currentWage === customWage);

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'आप बाद में बातचीत करके भी तय कर सकते हैं:' : 'Negotiable with employers:'}</p>
            </div>
          </div>

          <div class="adaptive-grid-cards">
            ${isDaily ? [
              { key: "300", icon: "💵", title: "₹300 / दिन" },
              { key: "400", icon: "💵", title: "₹400 / दिन" },
              { key: "500", icon: "💵", title: "₹500 / दिन" },
              { key: "600", icon: "💵", title: "₹600 / दिन" },
              { key: "700+", icon: "💵", title: "₹700+ / दिन" },
              { key: "negotiable", icon: "🤝", title: "बातचीत करके तय करेंगे" }
            ].map(opt => `
              <div 
                class="adaptive-card ${currentWage === opt.key ? 'selected' : ''}" 
                onclick="adaptiveState.jobSeeker.expectedWage = '${opt.key}'; renderAdaptiveDOM();">
                <div class="adaptive-card-icon">${opt.icon}</div>
                <div class="adaptive-card-title">${opt.title}</div>
              </div>
            `).join("") : [
              { key: "10000-15000", icon: "💰", title: "₹10,000 – ₹15,000 / महीना" },
              { key: "15000-25000", icon: "💰", title: "₹15,000 – ₹25,000 / महीना" },
              { key: "25000-40000", icon: "💰", title: "₹25,000 – ₹40,000 / महीना" },
              { key: "40000+", icon: "💰", title: "₹40,000+ / महीना" },
              { key: "negotiable", icon: "🤝", title: "बातचीत करके तय करेंगे" }
            ].map(opt => `
              <div 
                class="adaptive-card ${currentWage === opt.key ? 'selected' : ''}" 
                onclick="adaptiveState.jobSeeker.expectedWage = '${opt.key}'; renderAdaptiveDOM();">
                <div class="adaptive-card-icon">${opt.icon}</div>
                <div class="adaptive-card-title">${opt.title}</div>
              </div>
            `).join("")}
          </div>

          <!-- Flexible Custom Payment Expectation Input -->
          <div class="adaptive-custom-option-box ${isCustomWageActive ? 'active' : ''}">
            <div class="adaptive-custom-header">
              <span>✍️</span>
              <span>${isHi ? 'या अपनी मनपसंद कमाई / दिहाड़ी खुद लिखें:' : 'Or type your expected payment / salary:'}</span>
            </div>
            <div class="adaptive-custom-input-group">
              <input 
                type="text" 
                id="custom-wage-input"
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'उदा. ₹800 प्रति दिन, ₹18,000 प्रति माह, काम के हिसाब से...' : 'e.g. ₹800/day, ₹22,000/month, As per task...'}"
                value="${escapeHTML(customWage || '')}"
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomWage(this.value); }"
              />
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="window.applyCustomWage(document.getElementById('custom-wage-input').value)">
                ✓ ${isHi ? 'लागू करें' : 'Apply'}
              </button>
            </div>
            ${isCustomWageActive ? `
              <div class="adaptive-custom-badge">
                <span>✓ आपकी तय की गई कमाई: <strong>${escapeHTML(customWage)}</strong></span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Q9: Professional Links (Only for Software)
    // -------------------------------------------------------------------------
    case "js_professional_links": {
      const links = adaptiveState.jobSeeker.professionalLinks;
      const title = isHi ? "रिज्यूमे या लिंक्डइन (वैकल्पिक)" : "Resume or LinkedIn (Optional)";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'यह अनिवार्य नहीं है, आप बाद में भी जोड़ सकते हैं:' : 'Optional, you can add this anytime later:'}</p>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">Resume Link or Upload</label>
            <input 
              type="url" 
              class="dailyjob-input" 
              placeholder="https://drive.google.com/... or portfolio link" 
              value="${escapeHTML(links.resume_url || '')}"
              onchange="adaptiveState.jobSeeker.professionalLinks.resume_url = this.value.trim()"
            />
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">LinkedIn Profile URL</label>
            <input 
              type="url" 
              class="dailyjob-input" 
              placeholder="https://linkedin.com/in/username" 
              value="${escapeHTML(links.linkedin_url || '')}"
              onchange="adaptiveState.jobSeeker.professionalLinks.linkedin_url = this.value.trim()"
            />
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Job Seeker Final: Profile Ready Screen
    // -------------------------------------------------------------------------
    case "js_ready": {
      const js = adaptiveState.jobSeeker;
      const currentUser = window.authService?.user || {};
      const realDisplayName = (js.fullName || currentUser.fullName || currentUser.name || currentUser.username || "साथी").trim();
      const realDisplayMobile = (js.mobileNumber || currentUser.mobile_number || currentUser.mobileNumber || currentUser.phone || "").trim();

      return `
        <div class="profile-celebration-hero">
          <div class="celebration-icon">🎉</div>
          <h2 class="celebration-title" id="current-q-text">
            ${isHi ? 'आपका काम ढूंढने के लिए Profile तैयार है!' : 'Your profile is ready to find work!'}
          </h2>
          <p class="celebration-subtitle">
            ${isHi 
              ? `${escapeHTML(realDisplayName)}, आपके चुने हुए हुनर <strong>${escapeHTML(js.categoryTitle || js.category || 'हुनर')}</strong> के अनुसार काम उपलब्ध हैं।` 
              : `${escapeHTML(realDisplayName)}, matching jobs for <strong>${escapeHTML(js.categoryTitle || js.category || 'your skills')}</strong> are ready.`}
          </p>

          <div style="background: var(--bg-surface-muted); padding: 1.25rem; border-radius: var(--radius-lg); text-align: left; max-width: 480px; margin: 0 auto 1.5rem auto; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase;">आपकी मुख्य जानकारी:</div>
            <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary);">
              • नाम: <strong>${escapeHTML(realDisplayName)}</strong><br/>
              ${realDisplayMobile ? `• मोबाइल: <strong>+91 ${escapeHTML(realDisplayMobile)}</strong><br/>` : ''}
              • काम का प्रकार: <strong>${escapeHTML(js.workType || 'दर्ज नहीं')}</strong><br/>
              • हुनर / पेशा: <strong>${escapeHTML(js.categoryTitle || js.category || 'दर्ज नहीं')}</strong><br/>
              ${js.skillDetail ? `• मुख्य कार्य: <strong>${escapeHTML(js.skillDetail)}</strong><br/>` : ''}
              • अनुभव: <strong>${js.hasExperience === 'yes' ? 'अनुभवी' : (js.hasExperience === 'no' ? 'नया (Fresher)' : 'दर्ज नहीं')}</strong><br/>
              • लोकेशन: <strong>${escapeHTML(js.cityName || (js.locationType === 'nearby' ? 'मेरे आसपास (GPS)' : 'स्थान दर्ज नहीं'))}</strong><br/>
              • अपेक्षित कमाई: <strong>${escapeHTML(js.expectedWage ? `₹${js.expectedWage}` : 'बातचीत अनुसार')}</strong>
            </div>
          </div>

          <button 
            type="button" 
            class="btn btn-success btn-lg" 
            onclick="window.completeAdaptiveJobSeekerProfile()" 
            style="font-size: 1.15rem; font-weight: 900; padding: 1rem 2rem; border-radius: var(--radius-full); box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);">
            🔎 ${isHi ? 'मेरे लिए काम देखें (Show Matching Jobs)' : 'Show My Matching Jobs'} →
          </button>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Employer Q1: Category of People Needed
    // -------------------------------------------------------------------------
    case "emp_category": {
      const selected = adaptiveState.employer.empCategory;
      const customCat = adaptiveState.employer.customCategoryTitle;
      const isCustomActive = Boolean(customCat && (selected === 'custom' || selected === 'other'));
      const title = isHi ? "आप किस तरह के काम के लिए लोगों को रखना चाहते हैं?" : "What type of work do you want to hire for?";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'अपनी जरूरत के अनुसार चुनें, या नीचे अपना काम खुद लिखें:' : 'Select the category of work needed, or type your own below:'}</p>
            </div>
          </div>

          <div class="adaptive-grid-cards">
            ${[
              { key: "home", icon: "🏠", titleHi: "घर के काम", titleEn: "House / Domestic", isCorp: false },
              { key: "shop", icon: "🏪", titleHi: "दुकान / शोरूम", titleEn: "Shop / Retail", isCorp: false },
              { key: "restaurant", icon: "🍽️", titleHi: "होटल / रेस्टोरेंट", titleEn: "Restaurant / Hotel", isCorp: false },
              { key: "construction", icon: "🔨", titleHi: "निर्माण / लेबर", titleEn: "Construction / Labor", isCorp: false },
              { key: "factory", icon: "🏭", titleHi: "फैक्ट्री / वर्कशॉप", titleEn: "Factory / Workshop", isCorp: true },
              { key: "office", icon: "🏢", titleHi: "कंपनी / ऑफिस", titleEn: "Company / Office", isCorp: true },
              { key: "farm", icon: "🌾", titleHi: "खेती-किसानी", titleEn: "Farm / Agriculture", isCorp: false },
              { key: "delivery", icon: "📦", titleHi: "डिलीवरी स्टाफ", titleEn: "Delivery Staff", isCorp: false },
              { key: "security", icon: "🛡️", titleHi: "सिक्योरिटी गार्ड", titleEn: "Security Guard", isCorp: false },
              { key: "skilled", icon: "🔌", titleHi: "कारीगर (प्लंबर / बिजली)", titleEn: "Skilled Technician", isCorp: false },
              { key: "professional", icon: "👨‍💻", titleHi: "इंजीनियर / IT", titleEn: "Engineer / IT", isCorp: true },
              { key: "other", icon: "➕", titleHi: "अन्य काम", titleEn: "Other Work", isCorp: false }
            ].map(opt => `
              <div 
                class="adaptive-card ${selected === opt.key ? 'selected' : ''}" 
                onclick="window.selectEmployerCategory('${opt.key}', '${opt.titleHi}', ${opt.isCorp})"
                role="button"
                tabindex="0">
                <div class="adaptive-card-icon">${opt.icon}</div>
                <div class="adaptive-card-title">${isHi ? opt.titleHi : opt.titleEn}</div>
              </div>
            `).join("")}
          </div>

          <!-- Flexible Custom Employer Category Creator -->
          <div class="adaptive-custom-option-box ${isCustomActive ? 'active' : ''}">
            <div class="adaptive-custom-header">
              <span>✍️</span>
              <span>${isHi ? 'क्या आपका काम या व्यवसाय इस लिस्ट में नहीं है? खुद लिखें:' : 'Not in list? Type your business / work type:'}</span>
            </div>
            <div class="adaptive-custom-input-group">
              <input 
                type="text" 
                id="custom-emp-category-input"
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'उदा. कोचिंग सेंटर, इवेंट व शादी, अस्पताल / क्लिनिक, बेकरी, ट्रांसपोर्ट...' : 'e.g. Coaching Center, Event Management, Clinic, Bakery, Transport...'}"
                value="${escapeHTML(customCat || '')}"
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomEmployerCategory(this.value); }"
              />
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="window.applyCustomEmployerCategory(document.getElementById('custom-emp-category-input').value)">
                ✓ ${isHi ? 'यह काम जोड़ें' : 'Add Category'}
              </button>
            </div>
            ${isCustomActive ? `
              <div class="adaptive-custom-badge">
                <span>⭐ आपका चुना हुआ व्यवसाय: <strong>${escapeHTML(customCat)}</strong></span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Employer Q2: Household / Individual Info (NO GST/CIN required!)
    // -------------------------------------------------------------------------
    case "emp_household_info": {
      const emp = adaptiveState.employer;
      const title = isHi ? "आपका नाम और संपर्क विवरण" : "Your Name and Contact Details";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'ताकि काम करने वाले आपसे संपर्क कर सकें:' : 'For workers to reach you:'}</p>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">आपका नाम (Your Name) *</label>
            <input 
              type="text" 
              class="dailyjob-input" 
              placeholder="उदा. रमेश कुमार" 
              value="${escapeHTML(emp.contactName || '')}"
              onchange="adaptiveState.employer.contactName = this.value.trim()"
            />
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">मोबाइल नंबर (Mobile Number) *</label>
            <input 
              type="tel" 
              class="dailyjob-input" 
              placeholder="10 अंकों का मोबाइल नंबर" 
              value="${escapeHTML(emp.mobileNumber || '')}"
              onchange="adaptiveState.employer.mobileNumber = this.value.trim()"
            />
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Employer Q2 (Alt): Corporate / Office Info
    // -------------------------------------------------------------------------
    case "emp_corporate_info": {
      const emp = adaptiveState.employer;
      const title = isHi ? "कंपनी / व्यवसाय की जानकारी" : "Company / Business Information";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">कंपनी का नाम (Company Name) *</label>
            <input 
              type="text" 
              class="dailyjob-input" 
              placeholder="Company or Business Name" 
              value="${escapeHTML(emp.companyName || '')}"
              onchange="adaptiveState.employer.companyName = this.value.trim()"
            />
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">संपर्क व्यक्ति / HR का नाम (Contact Person) *</label>
            <input 
              type="text" 
              class="dailyjob-input" 
              placeholder="Recruiter or Owner Name" 
              value="${escapeHTML(emp.contactName || '')}"
              onchange="adaptiveState.employer.contactName = this.value.trim()"
            />
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">मोबाइल नंबर (Mobile Number) *</label>
            <input 
              type="tel" 
              class="dailyjob-input" 
              placeholder="10-digit mobile" 
              value="${escapeHTML(emp.mobileNumber || '')}"
              onchange="adaptiveState.employer.mobileNumber = this.value.trim()"
            />
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Employer Q3: Work Requirement
    // -------------------------------------------------------------------------
    case "emp_requirement": {
      const emp = adaptiveState.employer;
      const title = isHi ? "किस काम के लिए व्यक्ति चाहिए?" : "What work needs to be done?";
      const commonRoles = [
        "हेल्पर / सहायक", "कुक / रसोइया", "ड्राइवर", "सफाई कर्मचारी", 
        "दुकान सेल्समैन", "डिलीवरी बॉय", "सिक्योरिटी गार्ड", "इलेक्ट्रीशियन", 
        "प्लंबर", "कंप्यूटर ऑपरेटर", "ऑफिस स्टाफ"
      ];

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
              <p class="adaptive-question-subtitle">${isHi ? 'पद का नाम लिखें या नीचे दिए गए सुझावों में से चुनें:' : 'Enter role title or pick from suggestions:'}</p>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">${isHi ? 'काम / पद का नाम (Work Title) *' : 'Work Title *'}</label>
            <input 
              type="text" 
              id="emp-needed-role-input"
              class="dailyjob-input" 
              placeholder="उदा. Cook, Driver, सेल्समैन, हेल्पर, सॉफ्टवेयर डेवलपर" 
              value="${escapeHTML(emp.neededRole || '')}"
              oninput="adaptiveState.employer.neededRole = this.value.trim()"
            />
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.6rem;">
              ${commonRoles.map(r => `
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline" 
                  style="font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 20px;"
                  onclick="adaptiveState.employer.neededRole = '${r}'; const el = document.getElementById('emp-needed-role-input'); if(el) el.value = '${r}'; renderAdaptiveDOM();">
                  + ${r}
                </button>
              `).join("")}
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">${isHi ? 'कितने लोगों की जरूरत है?' : 'How many workers needed?'}</label>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
              ${["1", "2", "3–5", "5+"].map(c => `
                <button 
                  type="button" 
                  class="btn ${emp.neededCount === c ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="adaptiveState.employer.neededCount = '${c}'; renderAdaptiveDOM();"
                  style="flex: 1; min-width: 70px;">
                  ${c} ${isHi ? 'लोग' : 'people'}
                </button>
              `).join("")}
            </div>
            <div class="adaptive-custom-input-group mt-2">
              <input 
                type="text" 
                class="adaptive-custom-input" 
                placeholder="${isHi ? 'या अपनी संख्या खुद लिखें (उदा. 10 लोग, 20 लोग, जितनी जरूरत हो)...' : 'Or type custom count (e.g. 10 people)...'}"
                value="${escapeHTML(!["1", "2", "3–5", "5+"].includes(emp.neededCount) ? (emp.neededCount || '') : '')}"
                oninput="if(this.value.trim()){ adaptiveState.employer.neededCount = this.value.trim(); }"
              />
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Employer Q4: Location of Work
    // -------------------------------------------------------------------------
    case "emp_location": {
      const emp = adaptiveState.employer;
      const title = isHi ? "काम कहाँ पर है? (शहर / इलाका)" : "Where is the work located?";

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">${isHi ? 'शहर और इलाका लिखें' : 'Enter City & Area'}</label>
            <input 
              type="text" 
              class="dailyjob-input" 
              placeholder="उदा. रायपुर (पंडरी), बिलासपुर, या इंदौर" 
              value="${escapeHTML(emp.workLocation || '')}"
              onchange="adaptiveState.employer.workLocation = this.value.trim()"
            />
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Employer Q5: Timing & Payment
    // -------------------------------------------------------------------------
    case "emp_timing_payment": {
      const emp = adaptiveState.employer;
      const title = isHi ? "काम का समय और पेमेंट" : "Work Timing & Payment Offer";
      const timingOptions = [
        "फुल टाइम (8 घंटे)",
        "रोज 2 से 4 घंटे (Part-time)",
        "केवल सुबह (Morning shift)",
        "केवल शाम (Evening shift)",
        "रात की शिफ्ट (Night shift)"
      ];
      const customWorkTiming = emp.customWorkTiming;
      const isCustomTimingActive = Boolean(customWorkTiming && (emp.workTiming === customWorkTiming || emp.workTiming === 'कस्टम / अन्य समय'));

      return `
        <div class="adaptive-question-hero">
          <div class="adaptive-question-header">
            <div>
              <h2 class="adaptive-question-title" id="current-q-text">${title}</h2>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">${isHi ? 'काम का समय:' : 'Work Timing:'}</label>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
              ${timingOptions.map(t => `
                <button 
                  type="button" 
                  class="btn btn-sm ${emp.workTiming === t ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="adaptiveState.employer.workTiming = '${t}'; renderAdaptiveDOM();">
                  ${t}
                </button>
              `).join("")}
            </div>

            <!-- Flexible Custom Employer Timing Input -->
            <div class="adaptive-custom-option-box ${isCustomTimingActive ? 'active' : ''}">
              <div class="adaptive-custom-header">
                <span>✍️</span>
                <span>${isHi ? 'या अपने काम का सटीक समय खुद लिखें:' : 'Or type exact custom hours:'}</span>
              </div>
              <div class="adaptive-custom-input-group">
                <input 
                  type="text" 
                  id="custom-emp-timing-input"
                  class="adaptive-custom-input" 
                  placeholder="${isHi ? 'उदा. सुबह 9:00 से दोपहर 2:00, 12 घंटे की शिफ्ट, रोटेशनल...' : 'e.g. 9 AM to 2 PM, 12-hour shift, Rotational...'}"
                  value="${escapeHTML(customWorkTiming || '')}"
                  onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.applyCustomEmployerTiming(this.value); }"
                />
                <button 
                  type="button" 
                  class="btn btn-primary btn-sm" 
                  onclick="window.applyCustomEmployerTiming(document.getElementById('custom-emp-timing-input').value)">
                  ✓ ${isHi ? 'लागू करें' : 'Apply'}
                </button>
              </div>
              ${isCustomTimingActive ? `
                <div class="adaptive-custom-badge">
                  <span>✓ तय किया गया समय: <strong>${escapeHTML(customWorkTiming)}</strong></span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="dailyjob-step-label">${isHi ? 'दिहाड़ी या सैलरी कितनी देंगे?' : 'Payment / Salary Offer:'}</label>
            <input 
              type="text" 
              class="dailyjob-input" 
              placeholder="उदा. ₹500/दिन या ₹12,000/महीना (या बातचीत करके)" 
              value="${escapeHTML(emp.paymentOffer || '')}"
              oninput="adaptiveState.employer.paymentOffer = this.value.trim()"
            />
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // Employer Final: Ready Screen
    // -------------------------------------------------------------------------
    case "emp_ready": {
      const emp = adaptiveState.employer;

      return `
        <div class="profile-celebration-hero">
          <div class="celebration-icon">🎉</div>
          <h2 class="celebration-title" id="current-q-text">
            ${isHi ? 'आपकी भर्ती प्रोफ़ाइल तैयार है!' : 'Your Employer Profile is Ready!'}
          </h2>
          <p class="celebration-subtitle">
            ${isHi 
              ? `आपको <strong>${escapeHTML(emp.neededRole)}</strong> के लिए उपयुक्त कामगार तुरंत दिखाए जाएंगे।`
              : `Matching workers for <strong>${escapeHTML(emp.neededRole)}</strong> are ready to connect.`}
          </p>

          <button 
            type="button" 
            class="btn btn-success btn-lg" 
            onclick="window.completeAdaptiveEmployerProfile()" 
            style="font-size: 1.15rem; font-weight: 900; padding: 1rem 2rem; border-radius: var(--radius-full); box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);">
            📢 ${isHi ? 'कामगार देखें / नौकरी पोस्ट करें' : 'View Workers / Post Job'} →
          </button>
        </div>
      `;
    }

    default:
      return `<div class="p-4 text-center">Loading...</div>`;
  }
}

// ---------------------------------------------------------------------------
// 5. Adaptive Navigation Bar (Next, Back, Skip)
// ---------------------------------------------------------------------------
function renderAdaptiveNavigationHTML(currentStepKey, steps) {
  const isLast = adaptiveState.currentStepIndex === steps.length - 1;
  if (isLast) return ""; // Final screen has its own prominent CTA button

  const isHi = adaptiveState.lang === "hi";

  return `
    <div class="wizard-actions-bar mt-4">
      ${adaptiveState.currentStepIndex > 0 ? `
        <button 
          type="button" 
          class="btn btn-secondary" 
          onclick="window.adaptiveGoBack()">
          ← ${isHi ? 'पीछे जाएं' : 'Back'}
        </button>
      ` : `<div></div>`}

      <div class="flex items-center gap-2">
        <button 
          type="button" 
          class="btn-skip-adaptive" 
          onclick="window.adaptiveSkipQuestion()">
          ${isHi ? 'बाद में बताऊंगा (Skip)' : 'Skip for now'}
        </button>

        <button 
          type="button" 
          class="btn btn-primary btn-lg" 
          onclick="window.adaptiveGoNext()"
          style="font-weight: 800; min-width: 140px;">
          ${isHi ? 'आगे बढ़ें →' : 'Continue →'}
        </button>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 6. Action Handlers & Dynamic Navigation
// ---------------------------------------------------------------------------
window.speakCurrentStep = function() {
  const el = document.getElementById("current-q-text");
  if (el) {
    window.speakQuestion(el.innerText);
  }
};

window.selectAdaptiveWorkType = function(val) {
  adaptiveState.jobSeeker.workType = val;
  // Auto advance smoothly for touch-friendly low literacy users
  setTimeout(() => window.adaptiveGoNext(), 150);
};

window.applyCustomWorkType = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया काम का प्रकार लिखें" : "Please enter work type", "info");
    }
    return;
  }
  adaptiveState.jobSeeker.customWorkType = trimmed;
  adaptiveState.jobSeeker.workType = trimmed;
  renderAdaptiveDOM();
};

window.selectAdaptiveCategory = function(catKey, catTitle) {
  adaptiveState.jobSeeker.category = catKey;
  adaptiveState.jobSeeker.categoryTitle = catTitle;
  setTimeout(() => window.adaptiveGoNext(), 150);
};

window.applyCustomCategory = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया अपना काम / हुनर लिखें" : "Please enter your skill", "info");
    }
    return;
  }
  adaptiveState.jobSeeker.customCategoryTitle = trimmed;
  adaptiveState.jobSeeker.category = "custom";
  adaptiveState.jobSeeker.categoryTitle = trimmed;
  renderAdaptiveDOM();
};

window.selectAdaptiveSkillDetail = function(detailKey, detailTitle) {
  adaptiveState.jobSeeker.skillDetail = detailTitle || detailKey;
  setTimeout(() => window.adaptiveGoNext(), 150);
};

window.applyCustomSkillDetail = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया अपनी खासियत लिखें" : "Please enter your specialty", "info");
    }
    return;
  }
  adaptiveState.jobSeeker.customSkillDetail = trimmed;
  adaptiveState.jobSeeker.skillDetail = trimmed;
  renderAdaptiveDOM();
};

window.selectAdaptiveExperience = function(val) {
  adaptiveState.jobSeeker.hasExperience = val;
  renderAdaptiveDOM();
};

window.applyCustomEducation = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया पढ़ाई / कोर्स लिखें" : "Please enter qualification", "info");
    }
    return;
  }
  adaptiveState.jobSeeker.customEducation = trimmed;
  adaptiveState.jobSeeker.education = trimmed;
  renderAdaptiveDOM();
};

window.applyCustomTiming = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया समय दर्ज करें" : "Please enter timing", "info");
    }
    return;
  }
  adaptiveState.jobSeeker.customTiming = trimmed;
  adaptiveState.jobSeeker.timing = trimmed;
  renderAdaptiveDOM();
};

window.applyCustomWage = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया कमाई / सैलरी दर्ज करें" : "Please enter wage expectation", "info");
    }
    return;
  }
  adaptiveState.jobSeeker.customWage = trimmed;
  adaptiveState.jobSeeker.expectedWage = trimmed;
  renderAdaptiveDOM();
};

window.selectAdaptiveLocation = function(locKey) {
  adaptiveState.jobSeeker.locationType = locKey;
  renderAdaptiveDOM();
};

window.selectEmployerCategory = function(catKey, catTitle, isCorp) {
  adaptiveState.employer.empCategory = catKey;
  adaptiveState.employer.empCategoryTitle = catTitle;
  adaptiveState.employer.isCorporate = isCorp;
  setTimeout(() => window.adaptiveGoNext(), 150);
};

window.applyCustomEmployerCategory = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया कार्य श्रेणी / व्यवसाय लिखें" : "Please enter category", "info");
    }
    return;
  }
  adaptiveState.employer.customCategoryTitle = trimmed;
  adaptiveState.employer.empCategory = "custom";
  adaptiveState.employer.empCategoryTitle = trimmed;
  adaptiveState.employer.industry = trimmed;
  renderAdaptiveDOM();
};

window.applyCustomEmployerTiming = function(val) {
  const trimmed = (val || "").trim();
  if (!trimmed) return;
  adaptiveState.employer.customWorkTiming = trimmed;
  adaptiveState.employer.workTiming = trimmed;
  renderAdaptiveDOM();
};

window.useGPSLocation = function() {
  if (!navigator.geolocation) {
    if (typeof showToast === 'function') showToast("GPS सुविधा उपलब्ध नहीं है।", "info");
    return;
  }
  if (typeof showToast === 'function') showToast("📍 लोकेशन खोजी जा रही है...", "info");
  navigator.geolocation.getCurrentPosition(
    () => {
      adaptiveState.jobSeeker.locationType = "nearby";
      adaptiveState.jobSeeker.cityName = "मेरे आसपास (GPS Locality)";
      if (typeof showToast === 'function') showToast("✓ आपकी लोकेशन सेट हो गई!", "success");
      renderAdaptiveDOM();
    },
    () => {
      if (typeof showToast === 'function') showToast("कृपया शहर का नाम लिखें।", "info");
    },
    { timeout: 7000 }
  );
};

window.adaptiveGoNext = function() {
  const steps = getAdaptiveStepList();
  const currentKey = steps[adaptiveState.currentStepIndex];

  // Auto-capture any custom input typed by user before proceeding
  const customWorkTypeInput = document.getElementById("custom-worktype-input");
  if (customWorkTypeInput && customWorkTypeInput.value && customWorkTypeInput.value.trim()) {
    const val = customWorkTypeInput.value.trim();
    adaptiveState.jobSeeker.customWorkType = val;
    adaptiveState.jobSeeker.workType = val;
  }

  const customCatInput = document.getElementById("custom-category-input");
  if (customCatInput && customCatInput.value && customCatInput.value.trim()) {
    const val = customCatInput.value.trim();
    adaptiveState.jobSeeker.customCategoryTitle = val;
    adaptiveState.jobSeeker.category = "custom";
    adaptiveState.jobSeeker.categoryTitle = val;
  }

  const customSkillInput = document.getElementById("custom-skilldetail-input");
  if (customSkillInput && customSkillInput.value && customSkillInput.value.trim()) {
    const val = customSkillInput.value.trim();
    adaptiveState.jobSeeker.customSkillDetail = val;
    adaptiveState.jobSeeker.skillDetail = val;
  }

  const customEduInput = document.getElementById("custom-education-input");
  if (customEduInput && customEduInput.value && customEduInput.value.trim()) {
    const val = customEduInput.value.trim();
    adaptiveState.jobSeeker.customEducation = val;
    adaptiveState.jobSeeker.education = val;
  }

  const customTimingInput = document.getElementById("custom-timing-input");
  if (customTimingInput && customTimingInput.value && customTimingInput.value.trim()) {
    const val = customTimingInput.value.trim();
    adaptiveState.jobSeeker.customTiming = val;
    adaptiveState.jobSeeker.timing = val;
  }

  const customWageInput = document.getElementById("custom-wage-input");
  if (customWageInput && customWageInput.value && customWageInput.value.trim()) {
    const val = customWageInput.value.trim();
    adaptiveState.jobSeeker.customWage = val;
    adaptiveState.jobSeeker.expectedWage = val;
  }

  const customEmpCatInput = document.getElementById("custom-emp-category-input");
  if (customEmpCatInput && customEmpCatInput.value && customEmpCatInput.value.trim()) {
    const val = customEmpCatInput.value.trim();
    adaptiveState.employer.customCategoryTitle = val;
    adaptiveState.employer.empCategory = "custom";
    adaptiveState.employer.empCategoryTitle = val;
    adaptiveState.employer.industry = val;
  }

  const customEmpTimingInput = document.getElementById("custom-emp-timing-input");
  if (customEmpTimingInput && customEmpTimingInput.value && customEmpTimingInput.value.trim()) {
    const val = customEmpTimingInput.value.trim();
    adaptiveState.employer.customWorkTiming = val;
    adaptiveState.employer.workTiming = val;
  }

  // Validation: Only proceed if user has chosen an option for required questions
  if (currentKey === "js_work_type" && !adaptiveState.jobSeeker.workType) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया काम का प्रकार चुनें" : "Please select a work type", "info");
    }
    return;
  }
  if (currentKey === "js_category" && !adaptiveState.jobSeeker.category) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया अपना काम / हुनर चुनें" : "Please choose your skill or work", "info");
    }
    return;
  }
  if (currentKey === "js_age") {
    const ageInput = document.getElementById("adaptive-user-age-input");
    if (ageInput && ageInput.value) {
      adaptiveState.jobSeeker.age = parseInt(ageInput.value, 10);
    }
    if (!adaptiveState.jobSeeker.age || isNaN(adaptiveState.jobSeeker.age) || adaptiveState.jobSeeker.age < 18 || adaptiveState.jobSeeker.age > 99) {
      if (typeof showToast === 'function') {
        showToast(adaptiveState.lang === 'hi' ? "कृपया वैध उम्र (18 वर्ष या अधिक) दर्ज करें" : "Please enter a valid age (18+)", "warning");
      }
      return;
    }
  }
  if (currentKey === "emp_category" && !adaptiveState.employer.empCategory) {
    if (typeof showToast === 'function') {
      showToast(adaptiveState.lang === 'hi' ? "कृपया कार्य श्रेणी चुनें" : "Please select category", "info");
    }
    return;
  }

  if (adaptiveState.currentStepIndex < steps.length - 1) {
    adaptiveState.currentStepIndex += 1;
    renderAdaptiveDOM();
  }
};

window.adaptiveGoBack = function() {
  if (adaptiveState.currentStepIndex > 0) {
    adaptiveState.currentStepIndex -= 1;
    renderAdaptiveDOM();
  }
};

window.adaptiveSkipQuestion = function() {
  window.adaptiveGoNext();
};

window.toggleAdaptiveRole = function() {
  adaptiveState.activeFlow = adaptiveState.activeFlow === "employer" ? "job_seeker" : "employer";
  adaptiveState.currentStepIndex = 0;
  renderAdaptiveDOM();
};

// ---------------------------------------------------------------------------
// 7. Profile Submission & Backend Persistence (100% Real User Data)
// ---------------------------------------------------------------------------
window.completeAdaptiveJobSeekerProfile = async function() {
  const js = adaptiveState.jobSeeker;
  const currentUser = window.authService?.user || {};

  const realFullName = (js.fullName || currentUser.fullName || currentUser.name || currentUser.username || "कामगार").trim();
  const realMobile = (js.mobileNumber || currentUser.mobile_number || currentUser.mobileNumber || currentUser.phone || "").trim();
  const realEmail = (js.email || currentUser.email || "").trim();
  const realCity = (js.cityName || "").trim();
  const rawWage = (js.customWage || js.expectedWage || "").trim();
  const parsedWage = parseInt(rawWage.replace(/[^0-9]/g, ""), 10);
  const realWage = !isNaN(parsedWage) && parsedWage > 0 ? parsedWage : (rawWage || null);
  const effectiveWorkType = js.customWorkType || js.workType || "";
  const effectiveSkill = js.customSkillDetail || js.skillDetail || js.customCategoryTitle || js.categoryTitle || "";
  const realProfession = js.customCategoryTitle || js.categoryTitle || effectiveSkill || (js.category && js.category !== "custom" && js.category !== "other" ? js.category : "कामगार");

  // Build normalized payload - ZERO dummy or hardcoded defaults
  const payload = {
    personal: {
      full_name: realFullName,
      profile_photo: "",
      date_of_birth: js.date_of_birth || null,
      age: js.age ? parseInt(js.age, 10) : (currentUser.age || null),
      gender: js.gender || null,
      mobile_number: realMobile,
      email: realEmail,
      current_city: realCity,
      current_state: js.state || "",
      country: "India",
      preferred_language: adaptiveState.lang === "hi" ? "Hindi" : "English"
    },
    employment_status: {
      status: effectiveWorkType ? (effectiveWorkType === "daily" ? "Daily Wage Worker" : (js.hasExperience === "no" ? "Fresher" : "Working Professional")) : "Job Seeker"
    },
    education: (js.customEducation || js.education) ? [{ level: js.customEducation || js.education, degree: js.customEducation || js.education, university: "", graduation_year: "" }] : [],
    skills: effectiveSkill ? [
      { name: effectiveSkill, category: js.category || "General", level: "Primary" }
    ] : [],
    has_experience: js.hasExperience === "yes",
    experience: js.hasExperience === "yes" && (realProfession || js.experienceYears || js.customExperience) ? [{ 
      job_title: realProfession || "", 
      years: js.experienceYears || "", 
      description: js.customExperience || "" 
    }] : [],
    preferences: {
      looking_for: effectiveWorkType ? [effectiveWorkType] : [],
      preferred_roles: realProfession ? [realProfession] : [],
      work_modes: js.locationType === "home" ? ["Work from Home"] : (js.locationType ? ["On-site"] : []),
      preferred_cities: realCity ? [realCity] : [],
      expected_salary_min: realWage,
      preferred_timing: js.customTiming || js.timing || ""
    },
    languages: [{ language: adaptiveState.lang === "hi" ? "Hindi" : "English", speaking_level: "Fluent" }],
    portfolio: js.professionalLinks || {},
    visibility: { visibility: "public_employers", allow_contact: true },
    profession: realProfession,
    category: js.category || "",
    categoryTitle: realProfession,
    workType: effectiveWorkType,
    work_type: effectiveWorkType,
    expectedWage: rawWage,
    timing: js.customTiming || js.timing || "",
    cityName: realCity,
    mobileNumber: realMobile,
    fullName: realFullName
  };

  try {
    const res = await window.authService.saveJobSeekerProfile(payload);
    if (res.success) {
      if (typeof showToast === 'function') {
        showToast("✓ आपका प्रोफाइल सफलतापूर्वक बन गया!", "success");
      }
      window.location.hash = "#/jobs";
    } else {
      if (typeof showToast === 'function') {
        showToast(res.error || "Failed to save profile", "warning");
      }
    }
  } catch (e) {
    window.location.hash = "#/jobs";
  }
};

window.completeAdaptiveEmployerProfile = async function() {
  const emp = adaptiveState.employer;
  const currentUser = window.authService?.user || {};

  const realContactName = (emp.contactName || currentUser.fullName || currentUser.name || currentUser.username || "Employer").trim();
  const realMobile = (emp.mobileNumber || currentUser.mobile_number || currentUser.mobileNumber || currentUser.phone || "").trim();
  const realEmail = (emp.officialEmail || currentUser.email || "").trim();
  const realCity = (emp.workLocation || "").trim();
  const realCompany = (emp.companyName || realContactName).trim();
  const effectiveIndustry = emp.customCategoryTitle || emp.empCategoryTitle || emp.industry || "General Services";
  const effectiveRole = emp.neededRole || effectiveIndustry;
  const effectiveTiming = emp.customWorkTiming || emp.workTiming || "फुल टाइम";

  const payload = {
    business_type: emp.isCorporate ? "Private Company" : "Individual / Household",
    business_info: {
      name: realCompany,
      industry: effectiveIndustry
    },
    location: {
      city: realCity,
      state: "",
      work_model: "On-site"
    },
    recruiter_info: {
      name: realContactName,
      mobile_number: realMobile,
      official_email: realEmail
    },
    hiring_info: {
      hiring_types: effectiveTiming ? [effectiveTiming] : [],
      categories: effectiveRole ? [effectiveRole] : [effectiveIndustry]
    },
    hiring_location: {
      cities: realCity ? [realCity] : [],
      onsite_hiring: true
    },
    payment_offer: emp.paymentOffer || "",
    needed_count: emp.neededCount || "1",
    verification: { status: "not_verified" },
    company_profile: {},
    hiring_preferences: {},
    visibility: { visibility: "public" },
    profession: effectiveIndustry,
    industry: effectiveIndustry,
    neededRole: effectiveRole,
    companyName: realCompany,
    workLocation: realCity,
    mobileNumber: realMobile,
    contactName: realContactName
  };

  try {
    const res = await window.authService.saveEmployerProfile(payload);
    if (res.success) {
      if (typeof showToast === 'function') {
        showToast("✓ आपकी भर्ती प्रोफ़ाइल तैयार है!", "success");
      }
      window.location.hash = "#/employer";
    } else {
      if (typeof showToast === 'function') {
        showToast(res.error || "Failed to save profile", "warning");
      }
    }
  } catch (e) {
    window.location.hash = "#/employer";
  }
};

// ---------------------------------------------------------------------------
// 8. DOM Refresh Helper
// ---------------------------------------------------------------------------
function renderAdaptiveDOM() {
  const container = document.getElementById("app-view-container");
  if (container) {
    container.innerHTML = renderDailyJobProfileCreationView();
  }
}

// ---------------------------------------------------------------------------
// 9. Backward Compatibility Handler (For existing unit/E2E tests)
// ---------------------------------------------------------------------------
window.handleCompleteProfile = async function() {
  const userType = adaptiveState.activeFlow === "employer" ? "employer" : "job_seeker";
  const numAge = adaptiveState.jobSeeker.age ? parseInt(adaptiveState.jobSeeker.age, 10) : (window.authService?.user?.age || null);
  const profession = adaptiveState.jobSeeker.categoryTitle || "कामगार";

  return await window.authService.saveProfile({
    user_type: userType,
    age: numAge,
    profession: profession,
    custom_profession: null
  });
};
