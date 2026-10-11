/**
 * DailyJob (कामसाथी) - Smart & Flexible Job Posting Wizard
 * Rule: Every suggestion is optional guidance, never a restriction.
 * Employers can select suggestions or enter custom information in every section.
 */

let jobWizardState = {
  step: 1,
  totalSteps: 9,

  // Step 1: Work Type / Category
  tradeId: "mason",
  customTradeTitle: "",

  // Step 2: Work Responsibilities ("काम क्या करना होगा?")
  description: "",

  // Step 3: Workers & Duration
  workersNeeded: 1,
  startDate: "आज (Today)",
  startDatePicker: "",
  startDateMode: "today", // "today" | "tomorrow" | "picker" | "custom"
  customStartDate: "",
  assignmentType: "temporary", // "one_day" | "temporary" | "recurring" | "ongoing" | "custom"
  durationDays: 3,
  customDurationText: "",
  endDate: "",

  // Step 4: Wage & Payment
  wage: 750,
  wageUnit: "day", // "day" | "hour" | "week" | "month" | "task" | "custom"
  customWageUnit: "",
  paymentTiming: "daily_end", // "daily_end" | "completion" | "weekly" | "monthly" | "advance_completion" | "custom"
  customPaymentTiming: "",
  paymentTerms: "",

  // Step 5: Location
  city: "Raipur",
  customCity: "",
  locationName: "",
  landmark: "",

  // Step 6: Working Hours
  timeSlot: "9:00 AM – 5:00 PM",
  timeSlotMode: "preset", // "preset" | "custom"
  customTimeSlot: "",
  startTimePicker: "09:00",
  endTimePicker: "17:00",
  breakIncluded: "1 घंटे का लंच ब्रेक शामिल है",
  customBreak: "",

  // Step 7: Tools, Food, Travel & Safety
  toolsResponsibility: "employer", // "employer" | "worker" | "both" | "custom"
  customTools: "",
  foodProvided: "दोपहर का खाना व चाय उपलब्ध",
  customFood: "",
  travelProvided: "नहीं, खुद आना होगा",
  customTravel: "",
  safetyEquipment: "सुरक्षा किट व बुनियादी उपकरण उपलब्ध",
  customSafety: "",
  specialConditions: "",
  urgent: false,

  // Status
  isSubmitting: false,
  validationError: ""
};

const CATEGORY_EXAMPLES = {
  mason: {
    example: "दीवार पर ईंट लगाना और प्लास्टर करना।",
    chips: ["दीवार जोड़ना", "प्लास्टर व छपाई", "फर्श की ढलाई", "बाउंड्री वॉल का काम"]
  },
  helper: {
    example: "सीमेंट-रेत का तगाड़ी उठाना और साइट साफ करना।",
    chips: ["सीमेंट-रेत उठाना", "सामान लोडिंग/अनलोडिंग", "साइट सफाई", "मिट्टी खुदाई"]
  },
  painter: {
    example: "दीवार पर पुट्टी घिसना और 2 कोट डिस्टेंपर पेंट करना।",
    chips: ["पुट्टी लगाना", "कलर पेंट करना", "प्राइमर मारना", "दरवाजे-खिड़की पेंट"]
  },
  electrician: {
    example: "कमरे में 4 बोर्ड फिटिंग और कंसील्ड वायरिंग खींचना।",
    chips: ["वायरिंग खींचना", "स्विच बोर्ड फिटिंग", "पंखा व लाइट लगाना", "फॉल्ट रिपेयर"]
  },
  plumber: {
    example: "बाथरूम में पाइपलाइन फिटिंग और नए नल लगाना।",
    chips: ["पाइपलाइन फिटिंग", "नल व शावर लगाना", "लीकेज ठीक करना", "टैंक कनेक्शन"]
  },
  driving: {
    example: "सामान डिलीवरी के लिए 4-पहिया लोडिंग गाड़ी चलाना।",
    chips: ["लोकल डिलीवरी", "पिकअप गाड़ी चलाना", "कार ड्राइविंग", "मटेरियल ट्रांसपोर्ट"]
  },
  cooking: {
    example: "15 लोगों के लिए दोपहर और रात का खाना बनाना।",
    chips: ["दाल-चावल व सब्जी", "रोटी व पूड़ी", "पार्टी/ऑर्डर का खाना", "चाय-नाश्ता"]
  },
  cleaning: {
    example: "पूरे घर में झाड़ू-पोछा और खिड़कियां साफ करना।",
    chips: ["झाड़ू-पोछा", "बर्तन धोना", "डीप क्लीनिंग", "ऑफिस सफाई"]
  },
  delivery: {
    example: "दुकान से ग्राहकों के घर तक सामान और पार्सल पहुंचाना।",
    chips: ["दुकान का सामान पहुंचाना", "पार्सल डिलीवरी", "किराना सामान डिलीवरी", "कूरियर"]
  },
  other: {
    example: "दुकान में सामान संभालना और ग्राहकों को देना।",
    chips: ["दुकान संभालना", "पैकिंग करना", "सामान गिनना व रखना", "सामान्य सहायता"]
  }
};

function formatTimeAmPm(time24) {
  if (!time24 || !time24.includes(':')) return time24;
  const parts = time24.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function getEffectiveTradeTitle() {
  if (jobWizardState.customTradeTitle && jobWizardState.customTradeTitle.trim()) {
    return jobWizardState.customTradeTitle.trim();
  }
  const currentTrade = INITIAL_TRADES.find(t => t.id === jobWizardState.tradeId);
  return currentTrade ? currentTrade.nameHi : "काम";
}

function getEffectiveStartDate() {
  if (jobWizardState.customStartDate && jobWizardState.customStartDate.trim()) {
    return jobWizardState.customStartDate.trim();
  }
  return jobWizardState.startDate || "आज (Today)";
}

function getEffectiveCity() {
  if (jobWizardState.customCity && jobWizardState.customCity.trim()) {
    return jobWizardState.customCity.trim();
  }
  return jobWizardState.city || "Raipur";
}

function getEffectiveDurationText() {
  if (jobWizardState.customDurationText && jobWizardState.customDurationText.trim()) {
    return jobWizardState.customDurationText.trim();
  }
  return getReadableDuration();
}

function getEffectiveWageUnit() {
  if (jobWizardState.wageUnit === 'custom') {
    return jobWizardState.customWageUnit && jobWizardState.customWageUnit.trim() ? jobWizardState.customWageUnit.trim() : 'कस्टम यूनिट';
  }
  return jobWizardState.wageUnit || 'day';
}

function getEffectivePaymentTiming() {
  if (jobWizardState.paymentTiming === 'custom') {
    return jobWizardState.customPaymentTiming && jobWizardState.customPaymentTiming.trim() ? jobWizardState.customPaymentTiming.trim() : 'कस्टम भुगतान व्यवस्था';
  }
  const map = {
    daily_end: "रोज काम खत्म होने पर तुरंत भुगतान",
    completion: "काम पूरा होने पर एकमुश्त भुगतान",
    weekly: "हर हफ्ते भुगतान",
    monthly: "महीने के अंत में भुगतान",
    advance_completion: "आधा एडवांस + आधा काम खत्म होने पर"
  };
  return map[jobWizardState.paymentTiming] || jobWizardState.paymentTiming;
}

function getEffectiveTimeSlot() {
  if (jobWizardState.timeSlotMode === 'custom') {
    if (jobWizardState.customTimeSlot && jobWizardState.customTimeSlot.trim()) {
      return jobWizardState.customTimeSlot.trim();
    }
    if (jobWizardState.startTimePicker && jobWizardState.endTimePicker) {
      return `${formatTimeAmPm(jobWizardState.startTimePicker)} – ${formatTimeAmPm(jobWizardState.endTimePicker)}`;
    }
  }
  return jobWizardState.timeSlot || '9:00 AM – 5:00 PM';
}

function getEffectiveBreak() {
  if (jobWizardState.customBreak && jobWizardState.customBreak.trim()) {
    return jobWizardState.customBreak.trim();
  }
  return jobWizardState.breakIncluded || '1 घंटे का लंच ब्रेक शामिल है';
}

function getEffectiveTools() {
  if (jobWizardState.customTools && jobWizardState.customTools.trim()) {
    return jobWizardState.customTools.trim();
  }
  const map = {
    employer: "काम देने वाला उपलब्ध कराएगा",
    worker: "काम करने वाला अपना लाएगा",
    both: "दोनों मिलकर / जो उपलब्ध हो"
  };
  return map[jobWizardState.toolsResponsibility] || jobWizardState.toolsResponsibility;
}

function getEffectiveFood() {
  if (jobWizardState.customFood && jobWizardState.customFood.trim()) {
    return jobWizardState.customFood.trim();
  }
  return jobWizardState.foodProvided || "दोपहर का खाना व चाय उपलब्ध";
}

function getEffectiveTravel() {
  if (jobWizardState.customTravel && jobWizardState.customTravel.trim()) {
    return jobWizardState.customTravel.trim();
  }
  return jobWizardState.travelProvided || "नहीं, खुद आना होगा";
}

function getEffectiveSafety() {
  if (jobWizardState.customSafety && jobWizardState.customSafety.trim()) {
    return jobWizardState.customSafety.trim();
  }
  return jobWizardState.safetyEquipment || "सुरक्षा किट व बुनियादी उपकरण उपलब्ध";
}

function getReadableDuration() {
  if (jobWizardState.customDurationText && jobWizardState.customDurationText.trim()) {
    return jobWizardState.customDurationText.trim();
  }
  if (jobWizardState.assignmentType === 'one_day') return '1 दिन का काम';
  if (jobWizardState.assignmentType === 'recurring') return 'हफ्ते में कुछ दिन';
  if (jobWizardState.assignmentType === 'ongoing') return 'मासिक / पक्की नौकरी';
  const d = parseInt(jobWizardState.durationDays, 10) || 1;
  return `${d} दिन का काम`;
}

function renderPostJobView() {
  return `
    <div style="max-width: 660px; margin: 0 auto; padding-bottom: 3rem;">
      <!-- Wizard Progress Header -->
      <div class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.5rem; background: var(--bg-surface); box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
        <div class="flex justify-between items-center text-muted mb-2" style="font-size: 0.85rem; font-weight: 700;">
          <div class="flex items-center gap-2">
            <span style="color: var(--color-primary); font-size: 1.1rem;">📢</span>
            <span style="color: var(--text-primary);">काम डालें (Post Job)</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              type="button" 
              class="btn btn-ghost btn-sm" 
              onclick="window.speakJobWizardCurrentStep()" 
              title="आवाज़ में सुनें"
              style="font-size: 0.8rem; font-weight: 700; color: var(--color-primary); border: 1px solid var(--border-subtle); border-radius: 999px; padding: 2px 8px;">
              🔊 सुनें
            </button>
            <span style="background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 999px; font-size: 0.8rem;">
              कदम ${jobWizardState.step} / ${jobWizardState.totalSteps}
            </span>
          </div>
        </div>

        <div class="wizard-progress-bar mb-3" style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
          <div class="wizard-progress-fill" style="width: ${(jobWizardState.step / jobWizardState.totalSteps) * 100}%; height: 100%; background: var(--color-primary); transition: width 0.3s ease;"></div>
        </div>

        ${jobWizardState.validationError ? `
          <div class="card p-2 mb-3" style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 8px; color: #991b1b; font-size: 0.88rem; font-weight: 700;">
            ⚠️ ${escapeHTML(jobWizardState.validationError)}
          </div>
        ` : ''}

        <div id="job-wizard-body" class="mt-4">
          ${renderWizardStepContent()}
        </div>
      </div>
    </div>
  `;
}

function renderWizardStepContent() {
  const currentTrade = INITIAL_TRADES.find(t => t.id === jobWizardState.tradeId) || INITIAL_TRADES.find(t => t.id === "mason") || INITIAL_TRADES[1];

  // ---------------------------------------------------------------------------
  // STEP 1: Select Type of Work (Category & Optional Custom Title)
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 1) {
    const categories = [
      { id: "mason", nameHi: "राजमिस्त्री", icon: "🧱" },
      { id: "helper", nameHi: "मजदूर", icon: "👷" },
      { id: "painter", nameHi: "पेंटर", icon: "🎨" },
      { id: "electrician", nameHi: "इलेक्ट्रीशियन", icon: "⚡" },
      { id: "plumber", nameHi: "प्लंबर", icon: "🚰" },
      { id: "driving", nameHi: "ड्राइवर", icon: "🚗" },
      { id: "cooking", nameHi: "रसोइया", icon: "🍳" },
      { id: "cleaning", nameHi: "सफाई कर्मचारी", icon: "🧹" },
      { id: "delivery", nameHi: "डिलीवरी कर्मचारी", icon: "🛵" },
      { id: "other", nameHi: "अन्य काम / खुद लिखें", icon: "💼" }
    ];

    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          किस काम के लिए व्यक्ति चाहिए?
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          सुझाव चुनें या नीचे अपना मनपसंद काम लिखें:
        </p>

        <!-- Category Grid -->
        <div class="option-grid mb-3" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
          ${categories.map(c => `
            <button 
              type="button" 
              class="option-card-btn ${jobWizardState.tradeId === c.id ? 'selected' : ''}" 
              onclick="window.selectWizardTrade('${c.id}')"
              style="padding: 1rem 0.75rem; text-align: center; border-radius: 12px; border: 1.5px solid ${jobWizardState.tradeId === c.id ? 'var(--color-primary)' : 'var(--border-subtle)'}; background: ${jobWizardState.tradeId === c.id ? '#eff6ff' : '#ffffff'}; cursor: pointer;">
              <span class="option-icon" style="font-size: 2rem; display: block; margin-bottom: 0.35rem;">${c.icon}</span>
              <div style="font-size: 1rem; font-weight: 800; color: var(--text-primary);">${c.nameHi}</div>
            </button>
          `).join('')}
        </div>

        <!-- Flexible Custom Job Title Input (Available for ALL trades or custom trade) -->
        <div class="form-group mb-4" style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1.5px solid #e2e8f0;">
          <label class="form-label" for="custom-trade-title" style="font-weight: 700; font-size: 0.9rem; display: flex; justify-content: space-between;">
            <span>काम का नाम / शीर्षक (Job Title):</span>
            <span class="text-muted" style="font-weight: 500; font-size: 0.8rem;">(वैकल्पिक / Custom Title)</span>
          </label>
          <input 
            type="text" 
            id="custom-trade-title" 
            class="form-control" 
            placeholder="उदा. ${currentTrade.nameHi} (या लिखें: वेल्डर, सुरक्षा गार्ड, टाइल्स मिस्त्री)" 
            value="${escapeHTML(jobWizardState.customTradeTitle)}"
            oninput="jobWizardState.customTradeTitle = this.value;"
            style="font-size: 1rem; font-weight: 600;"
          />
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
            💡 आप श्रेणी चुनने के बाद भी काम का नाम अपनी जरूरत अनुसार बदल सकते हैं।
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            आगे बढ़ें →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Explain Actual Work ("काम क्या करना होगा?")
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 2) {
    const meta = CATEGORY_EXAMPLES[jobWizardState.tradeId] || CATEGORY_EXAMPLES.other;
    const tradeTitle = getEffectiveTradeTitle();

    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          काम क्या करना होगा?
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1rem;">
          काम की मुख्य जिम्मेदारियां सरल भाषा में लिखें:
        </p>

        <!-- Contextual Example Card with One-Tap Use Option -->
        <div class="card p-3 mb-3" style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 10px;">
          <div class="flex justify-between items-center mb-1">
            <span style="font-size: 0.8rem; font-weight: 700; color: #1e40af;">
              💡 ${tradeTitle} के लिए सुझाव:
            </span>
            <button 
              type="button" 
              class="btn btn-sm btn-ghost" 
              onclick="window.useExampleDescription('${escapeHTML(meta.example)}')"
              style="font-size: 0.78rem; font-weight: 700; color: #1d4ed8; padding: 2px 8px; border: 1px dashed #93c5fd; border-radius: 6px;">
              यह सुझाव उपयोग करें 📋
            </button>
          </div>
          <div style="font-size: 0.92rem; color: #1e3a8a; font-weight: 600;">
            "${meta.example}"
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" for="wiz-desc" style="font-weight: 700; font-size: 0.95rem;">
            काम का विवरण (Work Description):
          </label>
          <textarea 
            id="wiz-desc" 
            class="form-control" 
            rows="4" 
            placeholder="यहाँ लिखें कि कामगार को क्या काम करना होगा (अपनी भाषा में)..." 
            oninput="jobWizardState.description = this.value"
            style="font-size: 1rem; line-height: 1.5; padding: 0.75rem; border-radius: 8px;">${escapeHTML(jobWizardState.description)}</textarea>
        </div>

        <!-- Quick Phrase Chips -->
        <div class="mb-4">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.4rem;">
            सुझाव जोड़ें (Quick Add Chips - केवल मार्गदर्शन):
          </div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            ${meta.chips.map(chip => `
              <button 
                type="button" 
                class="btn btn-sm btn-secondary" 
                onclick="window.appendJobDescChip('${escapeHTML(chip)}')"
                style="font-size: 0.8rem; font-weight: 600; border-radius: 999px;">
                + ${chip}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            आगे बढ़ें →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 3: Number of Workers & Duration (Fully Flexible)
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 3) {
    const todayIso = new Date().toISOString().split('T')[0];

    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          कितने लोग और कब तक चाहिए?
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          कामगारों की संख्या और कार्य अवधि अपनी जरूरत अनुसार तय करें:
        </p>

        <!-- 1. Workers Count (Input + Counter + Quick Pills) -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; text-align: center;">
            👥 कितने कामगारों की जरूरत है?
          </div>
          
          <div class="flex items-center justify-center gap-3 my-2">
            <button type="button" class="btn btn-secondary" style="font-size: 1.6rem; width: 48px; height: 48px; border-radius: 50%; font-weight: 800;" onclick="window.adjustWorkerCount(-1)">−</button>
            
            <input 
              type="number" 
              class="form-control text-center" 
              min="1" 
              max="500"
              value="${jobWizardState.workersNeeded}" 
              oninput="jobWizardState.workersNeeded = Math.max(1, parseInt(this.value, 10) || 1);"
              style="font-size: 2.2rem; font-weight: 900; width: 110px; height: 60px; color: var(--color-primary-dark); border-radius: 12px;"
            />

            <button type="button" class="btn btn-secondary" style="font-size: 1.6rem; width: 48px; height: 48px; border-radius: 50%; font-weight: 800;" onclick="window.adjustWorkerCount(1)">+</button>
          </div>

          <!-- Quick Worker Count Pills -->
          <div style="display: flex; justify-content: center; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.75rem;">
            <span style="font-size: 0.8rem; color: var(--text-secondary); align-self: center; font-weight: 600;">सुझाव:</span>
            ${[1, 2, 3, 5, 10, 20].map(cnt => `
              <button 
                type="button" 
                class="btn btn-sm ${jobWizardState.workersNeeded === cnt ? 'btn-primary' : 'btn-secondary'}" 
                onclick="jobWizardState.workersNeeded = ${cnt}; renderWizardStep();"
                style="font-weight: 700; min-width: 42px;">
                ${cnt}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2. Start Date (Quick Options + Date Picker + Custom Text) -->
        <div class="form-group mb-4" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
            📅 काम कब शुरू होगा? (Start Date):
          </label>

          <!-- Quick Select Buttons -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.75rem;">
            <button 
              type="button" 
              class="btn ${jobWizardState.startDateMode === 'today' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="window.selectStartDateOption('today')" 
              style="font-weight: 700; padding: 0.75rem;">
              आज से (Today)
            </button>
            <button 
              type="button" 
              class="btn ${jobWizardState.startDateMode === 'tomorrow' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="window.selectStartDateOption('tomorrow')" 
              style="font-weight: 700; padding: 0.75rem;">
              कल से (Tomorrow)
            </button>
          </div>

          <!-- Date Picker & Custom Date Inputs -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.4rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 2px;">
                🗓️ कैलेंडर से तारीख चुनें:
              </label>
              <input 
                type="date" 
                class="form-control" 
                min="${todayIso}" 
                value="${jobWizardState.startDatePicker || ''}"
                onchange="window.selectCustomDatePicker(this.value)"
                style="font-weight: 600; font-size: 0.9rem;"
              />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 2px;">
                ✍️ या अपनी तारीख लिखें:
              </label>
              <input 
                type="text" 
                class="form-control" 
                placeholder="उदा. 15 अक्टूबर, सोमवार से" 
                value="${escapeHTML(jobWizardState.customStartDate)}"
                oninput="window.setCustomStartDateText(this.value)"
                style="font-weight: 600; font-size: 0.9rem;"
              />
            </div>
          </div>
          <div style="font-size: 0.8rem; color: #047857; font-weight: 700; margin-top: 4px;">
            ✓ चुनी गई तारीख: ${escapeHTML(getEffectiveStartDate())}
          </div>
        </div>

        <!-- 3. Assignment Type & Duration (Flexible) -->
        <div class="form-group mb-3" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
            ⏳ काम की अवधि (Duration):
          </label>

          <!-- Type Suggestions -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem;">
            ${[
              { key: "one_day", label: "1 दिन का काम" },
              { key: "temporary", label: "कुछ दिनों का काम" },
              { key: "recurring", label: "हफ्ते में कुछ दिन" },
              { key: "ongoing", label: "लगातार / मासिक काम" }
            ].map(opt => `
              <button 
                type="button" 
                class="btn btn-sm ${jobWizardState.assignmentType === opt.key ? 'btn-primary' : 'btn-secondary'}" 
                onclick="jobWizardState.assignmentType = '${opt.key}'; renderWizardStep();"
                style="font-weight: 700; padding: 0.6rem;">
                ${opt.label}
              </button>
            `).join('')}
          </div>

          <!-- Duration Days Quick Pills + Number Input -->
          <div class="mb-3" style="background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.4rem;">
              कितने दिन काम चलेगा?
            </div>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
              ${[1, 2, 3, 5, 7, 10, 15, 30].map(d => `
                <button 
                  type="button" 
                  class="btn btn-sm ${jobWizardState.durationDays === d && !jobWizardState.customDurationText ? 'btn-primary' : 'btn-secondary'}"
                  onclick="jobWizardState.durationDays = ${d}; jobWizardState.customDurationText = ''; renderWizardStep();"
                  style="font-weight: 700; min-width: 44px;">
                  ${d} दिन
                </button>
              `).join('')}
            </div>

            <!-- Custom Duration Field -->
            <div style="margin-top: 0.5rem;">
              <input 
                type="text" 
                class="form-control" 
                placeholder="या कस्टम अवधि लिखें (उदा. 3 दिन, 2 हफ्ते, जब तक प्लास्टर पूरा न हो)" 
                value="${escapeHTML(jobWizardState.customDurationText)}"
                oninput="jobWizardState.customDurationText = this.value;"
                style="font-size: 0.9rem; font-weight: 600;"
              />
            </div>
          </div>

          <!-- Summary display -->
          <div class="card p-2" style="background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 0.88rem; color: #166534; font-weight: 700;">
            ✓ सार: ${jobWizardState.workersNeeded} कामगार • ${getEffectiveStartDate()} शुरू • ${getEffectiveDurationText()}
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            आगे बढ़ें →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: Wage and Payment Details (Fully Flexible)
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 4) {
    const minW = currentTrade.minWage || 600;
    const maxW = currentTrade.maxWage || 850;
    const isBelow = jobWizardState.wage < minW && jobWizardState.wageUnit === 'day';
    const totalEst = calculateEstimatedTotal();

    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          मजदूरी और भुगतान (Wage & Payment)
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          मजदूरी राशि और भुगतान का आधार तय करें:
        </p>

        <!-- Wage Amount Input with Quick Suggestion Pills -->
        <div class="form-group mb-4" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
            तय मजदूरी (रुपये में):
          </label>
          <div style="position: relative; max-width: 280px; margin-bottom: 0.75rem;">
            <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1.6rem; font-weight: 900; color: var(--text-secondary);">₹</span>
            <input 
              type="number" 
              id="wiz-wage" 
              class="form-control" 
              value="${jobWizardState.wage}" 
              min="10" 
              max="500000"
              oninput="jobWizardState.wage = parseInt(this.value, 10) || 0;" 
              style="padding-left: 2.75rem; font-size: 1.6rem; font-weight: 900;"
            />
          </div>

          <!-- Quick Wage Pills -->
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <span style="font-size: 0.8rem; color: var(--text-secondary); align-self: center; font-weight: 600;">सुझाव:</span>
            ${[500, 650, 800, 1000, 1200, 1500, 15000].map(amt => `
              <button 
                type="button" 
                class="btn btn-sm ${jobWizardState.wage === amt ? 'btn-primary' : 'btn-secondary'}" 
                onclick="jobWizardState.wage = ${amt}; renderWizardStep();"
                style="font-weight: 700;">
                ₹${amt.toLocaleString('en-IN')}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Wage Unit (Standard + Custom Unit) -->
        <div class="form-group mb-4" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
            मजदूरी का आधार (Wage Unit):
          </label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; margin-bottom: 0.75rem;">
            ${[
              { key: "day", label: "प्रति दिन (/दिन)" },
              { key: "hour", label: "प्रति घंटा (/घंटा)" },
              { key: "week", label: "प्रति सप्ताह (/हफ्ता)" },
              { key: "month", label: "प्रति माह (/महीना)" },
              { key: "task", label: "पूरे काम का (एकमुश्त)" },
              { key: "custom", label: "अन्य / कस्टम यूनिट" }
            ].map(u => `
              <button 
                type="button" 
                class="btn btn-sm ${jobWizardState.wageUnit === u.key ? 'btn-primary' : 'btn-secondary'}" 
                onclick="jobWizardState.wageUnit = '${u.key}'; renderWizardStep();"
                style="font-weight: 700; padding: 0.5rem 0.25rem; font-size: 0.8rem;">
                ${u.label}
              </button>
            `).join('')}
          </div>

          ${jobWizardState.wageUnit === 'custom' ? `
            <div style="margin-top: 0.5rem;">
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">कस्टम यूनिट दर्ज करें:</label>
              <input 
                type="text" 
                class="form-control" 
                placeholder="उदा. प्रति वर्ग फुट (Sq. Ft.), प्रति चक्कर, प्रति बोरी" 
                value="${escapeHTML(jobWizardState.customWageUnit)}"
                oninput="jobWizardState.customWageUnit = this.value;"
                style="font-size: 0.95rem; font-weight: 600;"
              />
            </div>
          ` : ''}
        </div>

        <!-- Payment Timing / Terms (Presets + Custom) -->
        <div class="form-group mb-4" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
            💵 पैसे कब और कैसे मिलेंगे? (Payment Timing):
          </label>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem;">
            ${[
              { key: "daily_end", label: "रोज काम खत्म होने पर तुरंत भुगतान" },
              { key: "completion", label: "काम पूरा होने पर एकमुश्त भुगतान" },
              { key: "weekly", label: "हर हफ्ते भुगतान" },
              { key: "monthly", label: "महीने के अंत में भुगतान" },
              { key: "advance_completion", label: "आधा एडवांस + आधा काम खत्म होने पर" },
              { key: "custom", label: "अन्य कस्टम भुगतान व्यवस्था" }
            ].map(opt => `
              <label 
                style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid ${jobWizardState.paymentTiming === opt.key ? 'var(--color-primary)' : 'var(--border-subtle)'}; background: ${jobWizardState.paymentTiming === opt.key ? '#eff6ff' : '#ffffff'}; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                <input 
                  type="radio" 
                  name="paymentTiming" 
                  value="${opt.key}" 
                  ${jobWizardState.paymentTiming === opt.key ? 'checked' : ''} 
                  onchange="jobWizardState.paymentTiming = '${opt.key}'; renderWizardStep();" 
                />
                <span>${opt.label}</span>
              </label>
            `).join('')}
          </div>

          <!-- Free-text payment terms -->
          <div>
            <label class="form-label" for="wiz-payment-notes" style="font-weight: 700; font-size: 0.85rem;">
              भुगतान की अतिरिक्त शर्त / माध्यम (Optional):
            </label>
            <input 
              type="text" 
              id="wiz-payment-notes" 
              class="form-control" 
              placeholder="उदा. Cash या UPI दोनों चलेगा, हर 3 दिन में हिसाब" 
              value="${escapeHTML(jobWizardState.paymentTerms)}"
              oninput="jobWizardState.paymentTerms = this.value"
              style="font-size: 0.9rem;"
            />
          </div>
        </div>

        <!-- Mathematically Justified Estimated Total -->
        ${totalEst ? `
          <div class="card p-3 mb-2" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">
              📊 अनुमानित कुल खर्च (Estimated Total Cost):
            </div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #1e40af; margin-top: 2px;">
              ₹${totalEst.toLocaleString('en-IN')}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              (${jobWizardState.workersNeeded} कामगार × ₹${jobWizardState.wage} × ${jobWizardState.assignmentType === 'one_day' ? 1 : jobWizardState.durationDays} दिन) — यह केवल अनुमान है, गारंटी नहीं।
            </div>
          </div>
        ` : ''}

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            आगे बढ़ें →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Work Location (Fully Flexible)
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 5) {
    const cityPresets = ["Raipur", "Bhilai", "Durg", "Bilaspur", "Rajnandgaon"];

    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          काम कहाँ है? (Location)
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          कार्यस्थल का शहर, इलाका और लैंडमार्क बताएं (कोई भी शहर या गांव लिख सकते हैं):
        </p>

        <!-- City Selection + Custom City -->
        <div class="form-group mb-3">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem;">
            शहर / जिला (City):
          </label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; margin-bottom: 0.5rem;">
            ${cityPresets.map(c => `
              <button 
                type="button" 
                class="btn btn-sm ${jobWizardState.city === c && !jobWizardState.customCity ? 'btn-primary' : 'btn-secondary'}" 
                onclick="jobWizardState.city='${c}'; jobWizardState.customCity=''; renderWizardStep();" 
                style="font-weight: 700;">
                ${c}
              </button>
            `).join('')}
          </div>
          <input 
            type="text" 
            class="form-control" 
            placeholder="या अन्य शहर, कस्बा, गांव का नाम लिखें..." 
            value="${escapeHTML(jobWizardState.customCity || (cityPresets.includes(jobWizardState.city) ? '' : jobWizardState.city))}"
            oninput="jobWizardState.customCity = this.value; jobWizardState.city = this.value || 'Raipur';"
            style="font-size: 0.95rem; font-weight: 600;"
          />
        </div>

        <!-- Area / Locality -->
        <div class="form-group mb-3">
          <label class="form-label" for="wiz-loc" style="font-weight: 700; font-size: 0.95rem;">
            इलाका / मोहल्ला / गांव (Area / Locality):
          </label>
          <input 
            type="text" 
            id="wiz-loc" 
            class="form-control" 
            value="${escapeHTML(jobWizardState.locationName)}" 
            oninput="jobWizardState.locationName = this.value" 
            placeholder="उदा. नेहरू नगर, सेक्टर 6, शंकर नगर, नया रायपुर" 
            style="font-size: 1rem; font-weight: 600;"
          />
        </div>

        <!-- Landmark / Directions with Helpful Quick Chips -->
        <div class="form-group mb-3">
          <label class="form-label" for="wiz-landmark" style="font-weight: 700; font-size: 0.95rem;">
            रास्ता / लैंडमार्क (Landmark - पहचान स्थल):
          </label>
          <input 
            type="text" 
            id="wiz-landmark" 
            class="form-control mb-2" 
            value="${escapeHTML(jobWizardState.landmark)}" 
            oninput="jobWizardState.landmark = this.value" 
            placeholder="उदा. हनुमान मंदिर के पास, मेन रोड पेट्रोल पंप, स्टेशन के सामने" 
            style="font-size: 0.95rem;"
          />
          <!-- Quick Landmark Chips -->
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <span style="font-size: 0.78rem; color: var(--text-secondary); align-self: center; font-weight: 600;">सुझाव:</span>
            ${["मंदिर के पास", "बस स्टैंड के पास", "पेट्रोल पंप के पास", "मेन रोड पर", "अस्पताल के पास"].map(lm => `
              <button 
                type="button" 
                class="btn btn-sm btn-ghost" 
                onclick="jobWizardState.landmark = '${lm}'; renderWizardStep();"
                style="font-size: 0.78rem; font-weight: 600; border: 1px solid var(--border-subtle); border-radius: 999px; padding: 2px 8px;">
                ${lm}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Privacy Shield Notice -->
        <div class="card p-2 mb-2" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.8rem; color: var(--text-secondary);">
          🛡️ <strong>गोपनीयता सुरक्षा:</strong> आपका घर या निजी पता सार्वजनिक रूप से नहीं दिखाया जाएगा। कामगारों को केवल इलाका और लैंडमार्क दिखेगा।
        </div>

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            आगे बढ़ें →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Working Hours & Schedule (Presets + Time Pickers + Custom Text)
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 6) {
    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          काम का समय क्या रहेगा?
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          कार्य समय और ब्रेक की जानकारी दें (सुझाव चुनें या अपना समय दर्ज करें):
        </p>

        <!-- Time Slot Presets -->
        <div class="form-group mb-4" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
            ⏰ कार्य समय (Schedule):
          </label>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem;">
            ${[
              { key: "9:00 AM – 5:00 PM", label: "सुबह 9:00 AM – शाम 5:00 PM (फुल डे / 8 घंटे)" },
              { key: "8:30 AM – 5:30 PM", label: "सुबह 8:30 AM – शाम 5:30 PM (9 घंटे)" },
              { key: "हाफ डे (4 घंटे)", label: "हाफ डे (4 घंटे - सुबह या दोपहर)" },
              { key: "नाइट शिफ्ट (Night Shift)", label: "नाइट शिफ्ट (रात की पाली)" },
              { key: "समय लचीला (Flexible)", label: "काम के अनुसार / लचीला समय (Flexible)" },
              { key: "custom", label: "अन्य / कस्टम समय निर्धारित करें" }
            ].map(slot => `
              <label 
                style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid ${(jobWizardState.timeSlotMode === 'custom' && slot.key === 'custom') || (jobWizardState.timeSlotMode === 'preset' && jobWizardState.timeSlot === slot.key) ? 'var(--color-primary)' : 'var(--border-subtle)'}; background: ${(jobWizardState.timeSlotMode === 'custom' && slot.key === 'custom') || (jobWizardState.timeSlotMode === 'preset' && jobWizardState.timeSlot === slot.key) ? '#eff6ff' : '#ffffff'}; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                <input 
                  type="radio" 
                  name="timeSlot" 
                  value="${slot.key}" 
                  ${(jobWizardState.timeSlotMode === 'custom' && slot.key === 'custom') || (jobWizardState.timeSlotMode === 'preset' && jobWizardState.timeSlot === slot.key) ? 'checked' : ''} 
                  onchange="window.selectTimeSlotOption('${slot.key}')" 
                />
                <span>${slot.label}</span>
              </label>
            `).join('')}
          </div>

          <!-- Time Picker Controls & Custom Time Text Input -->
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.4rem;">
              घड़ी से समय चुनें या खुद लिखें:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
              <div>
                <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">शुरुआत (Start Time):</label>
                <input 
                  type="time" 
                  class="form-control" 
                  value="${jobWizardState.startTimePicker || '09:00'}"
                  onchange="jobWizardState.startTimePicker = this.value; jobWizardState.timeSlotMode = 'custom'; renderWizardStep();"
                />
              </div>
              <div>
                <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">समाप्ति (End Time):</label>
                <input 
                  type="time" 
                  class="form-control" 
                  value="${jobWizardState.endTimePicker || '17:00'}"
                  onchange="jobWizardState.endTimePicker = this.value; jobWizardState.timeSlotMode = 'custom'; renderWizardStep();"
                />
              </div>
            </div>
            <input 
              type="text" 
              class="form-control" 
              placeholder="या खुद शब्दों में लिखें (उदा. सुबह 7 बजे से दोपहर 1 बजे तक)" 
              value="${escapeHTML(jobWizardState.customTimeSlot)}"
              oninput="jobWizardState.customTimeSlot = this.value; jobWizardState.timeSlotMode = 'custom';"
              style="font-size: 0.9rem;"
            />
            <div style="font-size: 0.8rem; color: #047857; font-weight: 700; margin-top: 4px;">
              ✓ तय समय: ${escapeHTML(getEffectiveTimeSlot())}
            </div>
          </div>
        </div>

        <!-- Break Details (Presets + Custom) -->
        <div class="form-group mb-4" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
            🥪 ब्रेक / भोजन अवकाश:
          </label>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
            ${[
              "1 घंटे का लंच ब्रेक शामिल है",
              "आधे घंटे का टी-ब्रेक शामिल है",
              "बिना ब्रेक (हाफ डे)"
            ].map(b => `
              <button 
                type="button" 
                class="btn btn-sm ${jobWizardState.breakIncluded === b && !jobWizardState.customBreak ? 'btn-primary' : 'btn-secondary'}" 
                onclick="jobWizardState.breakIncluded = '${b}'; jobWizardState.customBreak = ''; renderWizardStep();"
                style="font-weight: 700;">
                ${b}
              </button>
            `).join('')}
          </div>
          <input 
            type="text" 
            class="form-control" 
            placeholder="या कस्टम ब्रेक लिखें (उदा. 45 मिनट लंच + 15 मिनट चाय)" 
            value="${escapeHTML(jobWizardState.customBreak)}"
            oninput="jobWizardState.customBreak = this.value;"
            style="font-size: 0.9rem;"
          />
        </div>

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            आगे बढ़ें →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 7: Tools, Food, Travel and Safety (Presets + Custom Inputs)
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 7) {
    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          औजार, भोजन, यात्रा और सुरक्षा
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          सुझाव चुनें या प्रत्येक व्यवस्था के लिए अपनी शर्त लिखें:
        </p>

        <!-- 1. Tools Responsibility -->
        <div class="form-group mb-3" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.4rem; display: block;">
            🔧 औजार कौन देगा? (Tools Responsibility):
          </label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; margin-bottom: 0.5rem;">
            ${[
              { key: "employer", label: "काम देने वाला देगा" },
              { key: "worker", label: "काम करने वाला लाएगा" },
              { key: "both", label: "दोनों मिलकर / जो हो" }
            ].map(tOpt => `
              <button 
                type="button" 
                class="btn btn-sm ${jobWizardState.toolsResponsibility === tOpt.key && !jobWizardState.customTools ? 'btn-primary' : 'btn-secondary'}" 
                onclick="jobWizardState.toolsResponsibility = '${tOpt.key}'; renderWizardStep();"
                style="font-weight: 700; padding: 0.6rem 0.25rem; font-size: 0.82rem;">
                ${tOpt.label}
              </button>
            `).join('')}
          </div>
          <input 
            type="text" 
            class="form-control" 
            placeholder="या औजार पर अपनी शर्त लिखें (उदा. भारी औजार हम देंगे, पेचकस/प्लास कामगार लाएगा)" 
            value="${escapeHTML(jobWizardState.customTools)}"
            oninput="jobWizardState.customTools = this.value;"
            style="font-size: 0.88rem;"
          />
        </div>

        <!-- 2. Food Provided -->
        <div class="form-group mb-3" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.4rem; display: block;">
            🍲 खाना / चाय मिलेगा? (Food Provision):
          </label>
          <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.5rem;">
            ${[
              "दोपहर का खाना व चाय उपलब्ध",
              "खाने का अलग भत्ता मिलेगा",
              "नहीं, अपना टिफिन लाना होगा"
            ].map(f => `
              <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid ${jobWizardState.foodProvided === f && !jobWizardState.customFood ? 'var(--color-primary)' : 'var(--border-subtle)'}; background: ${jobWizardState.foodProvided === f && !jobWizardState.customFood ? '#eff6ff' : '#ffffff'}; cursor: pointer; font-size: 0.88rem; font-weight: 600;">
                <input type="radio" name="foodProvided" value="${f}" ${jobWizardState.foodProvided === f && !jobWizardState.customFood ? 'checked' : ''} onchange="jobWizardState.foodProvided = '${f}'; jobWizardState.customFood = ''; renderWizardStep();" />
                <span>${f}</span>
              </label>
            `).join('')}
          </div>
          <input 
            type="text" 
            class="form-control" 
            placeholder="या भोजन पर अपनी शर्त लिखें (उदा. दोपहर का भोजन + ₹50 चाय नाश्ता)" 
            value="${escapeHTML(jobWizardState.customFood)}"
            oninput="jobWizardState.customFood = this.value;"
            style="font-size: 0.88rem;"
          />
        </div>

        <!-- 3. Travel Provided -->
        <div class="form-group mb-3" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.4rem; display: block;">
            🚲 आने-जाने का खर्च / यात्रा (Travel):
          </label>
          <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.5rem;">
            ${[
              "हाँ, आने-जाने का किराया मिलेगा",
              "पिकअप व ड्रॉप सुविधा उपलब्ध",
              "नहीं, खुद आना होगा"
            ].map(tr => `
              <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid ${jobWizardState.travelProvided === tr && !jobWizardState.customTravel ? 'var(--color-primary)' : 'var(--border-subtle)'}; background: ${jobWizardState.travelProvided === tr && !jobWizardState.customTravel ? '#eff6ff' : '#ffffff'}; cursor: pointer; font-size: 0.88rem; font-weight: 600;">
                <input type="radio" name="travelProvided" value="${tr}" ${jobWizardState.travelProvided === tr && !jobWizardState.customTravel ? 'checked' : ''} onchange="jobWizardState.travelProvided = '${tr}'; jobWizardState.customTravel = ''; renderWizardStep();" />
                <span>${tr}</span>
              </label>
            `).join('')}
          </div>
          <input 
            type="text" 
            class="form-control" 
            placeholder="या यात्रा पर अपनी शर्त लिखें (उदा. बस स्टैंड से पिकअप या ₹60 पेट्रोल खर्च)" 
            value="${escapeHTML(jobWizardState.customTravel)}"
            oninput="jobWizardState.customTravel = this.value;"
            style="font-size: 0.88rem;"
          />
        </div>

        <!-- 4. Safety Equipment -->
        <div class="form-group mb-3" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.4rem; display: block;">
            🛡️ सुरक्षा उपकरण (Safety Equipment):
          </label>
          <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.5rem;">
            ${[
              "सुरक्षा किट व बुनियादी उपकरण उपलब्ध",
              "सामान्य काम, विशेष उपकरण की जरूरत नहीं",
              "ऊंचाई/जोखिम का काम (सुरक्षा बेल्ट व हेलमेट अनिवार्य)"
            ].map(s => `
              <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid ${jobWizardState.safetyEquipment === s && !jobWizardState.customSafety ? 'var(--color-primary)' : 'var(--border-subtle)'}; background: ${jobWizardState.safetyEquipment === s && !jobWizardState.customSafety ? '#eff6ff' : '#ffffff'}; cursor: pointer; font-size: 0.88rem; font-weight: 600;">
                <input type="radio" name="safetyEquipment" value="${s}" ${jobWizardState.safetyEquipment === s && !jobWizardState.customSafety ? 'checked' : ''} onchange="jobWizardState.safetyEquipment = '${s}'; jobWizardState.customSafety = ''; renderWizardStep();" />
                <span>${s}</span>
              </label>
            `).join('')}
          </div>
          <input 
            type="text" 
            class="form-control" 
            placeholder="या सुरक्षा पर विशेष निर्देश लिखें (उदा. रबर के जूते व सुरक्षा चश्मा अनिवार्य)" 
            value="${escapeHTML(jobWizardState.customSafety)}"
            oninput="jobWizardState.customSafety = this.value;"
            style="font-size: 0.88rem;"
          />
        </div>

        <!-- Urgency toggle -->
        <div class="form-group mb-2">
          <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem; border-radius: 8px; border: 1.5px solid ${jobWizardState.urgent ? '#dc2626' : 'var(--border-subtle)'}; background: ${jobWizardState.urgent ? '#fef2f2' : '#ffffff'}; cursor: pointer; font-weight: 700;">
            <input type="checkbox" ${jobWizardState.urgent ? 'checked' : ''} onchange="jobWizardState.urgent = this.checked; renderWizardStep();" />
            <span style="color: ${jobWizardState.urgent ? '#991b1b' : 'var(--text-primary)'};">🚨 तुरंत आवश्यकता है (Urgent Job Alert)</span>
          </label>
        </div>

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            आगे बढ़ें →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 8: Employer Contact & Verification Review
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 8) {
    const user = window.authService?.user || {};
    const empName = user.fullName || user.name || user.username || "Employer";
    const isVerified = Boolean(user.verified || user.is_verified);

    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          काम देने वाले का विवरण (Employer Profile)
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          आपके खाते की प्रामाणिक जानकारी कामगारों को दिखाई जाएगी:
        </p>

        <div class="card p-3 mb-4" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px;">
          <div class="flex items-center gap-3 mb-3">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #dbeafe; color: #1e40af; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 900;">
              🏪
            </div>
            <div>
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">
                ${escapeHTML(empName)}
              </div>
              <div class="text-secondary" style="font-size: 0.85rem;">
                ${isVerified ? '<span style="color: #047857; font-weight: 700;">🟢 Verified Employer</span>' : '<span style="color: var(--text-secondary);">⚪ सामान्य Employer खाता</span>'}
              </div>
            </div>
          </div>

          <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 0.75rem;">
            ✓ <strong>सुरक्षित संपर्क:</strong> कामगार सीधे कामसाथी इन-ऐप आवेदन करेंगे।<br />
            ✓ <strong>गोपनीयता:</strong> आपका व्यक्तिगत फोन नंबर केवल आपके द्वारा चुने जाने पर ही साझा होगा।
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.nextJobStep()" style="min-width: 160px; font-weight: 800; border-radius: var(--radius-full);">
            पूर्वावलोकन देखें (Preview) →
          </button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // STEP 9: Preview Before Publishing (Live Worker-Facing Job Card)
  // ---------------------------------------------------------------------------
  if (jobWizardState.step === 9) {
    const previewData = buildPreviewJobObject();

    return `
      <div>
        <h2 id="wizard-q-text" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
          काम की समीक्षा और पूर्वावलोकन
        </h2>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem;">
          यह वही कार्ड है जो कामगारों को आपकी पोस्टिंग के रूप में दिखेगा:
        </p>

        <!-- Live Preview of Worker Job Card -->
        <div class="mb-4">
          ${UI.renderJobCard(previewData, { isPreview: true })}
        </div>

        <!-- Quick Jump-Back Buttons to Edit Specific Sections -->
        <div class="card p-3 mb-4" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem;">
            किसी भी जानकारी में बदलाव करें (Quick Edit):
          </div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.goToWizardStep(1)">✏️ काम / पद</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.goToWizardStep(2)">✏️ विवरण</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.goToWizardStep(3)">✏️ संख्या व तारीख</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.goToWizardStep(4)">✏️ मजदूरी</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.goToWizardStep(5)">✏️ स्थान</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.goToWizardStep(6)">✏️ समय</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.goToWizardStep(7)">✏️ सुविधाएं</button>
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <button type="button" class="btn btn-secondary" onclick="window.prevJobStep()">← वापस</button>
          <button 
            type="button" 
            class="btn btn-primary btn-lg" 
            onclick="window.publishWizardJob()" 
            ${jobWizardState.isSubmitting ? 'disabled' : ''}
            style="min-width: 180px; font-weight: 800; border-radius: var(--radius-full); background: #047857; border-color: #047857;">
            ${jobWizardState.isSubmitting ? 'प्रकाशित हो रहा है...' : '✓ काम प्रकाशित करें'}
          </button>
        </div>
      </div>
    `;
  }

  return '<div>अमान्य चरण</div>';
}

function calculateEstimatedTotal() {
  if (jobWizardState.wageUnit !== 'day') return null;
  const days = jobWizardState.assignmentType === 'one_day' ? 1 : (parseInt(jobWizardState.durationDays, 10) || 1);
  const workers = parseInt(jobWizardState.workersNeeded, 10) || 1;
  const wage = parseInt(jobWizardState.wage, 10) || 0;
  if (days > 0 && workers > 0 && wage > 0) {
    return workers * wage * days;
  }
  return null;
}

function buildPreviewJobObject() {
  const tradeTitle = getEffectiveTradeTitle();
  const effectiveCity = getEffectiveCity();
  const effectiveStartDate = getEffectiveStartDate();
  const effectiveDuration = getEffectiveDurationText();
  const effectiveWageUnit = getEffectiveWageUnit();
  const effectivePaymentTiming = getEffectivePaymentTiming();
  const effectiveTimeSlot = getEffectiveTimeSlot();
  const effectiveBreak = getEffectiveBreak();
  const effectiveTools = getEffectiveTools();
  const effectiveFood = getEffectiveFood();
  const effectiveTravel = getEffectiveTravel();
  const effectiveSafety = getEffectiveSafety();

  const user = window.authService?.user || {};
  const empName = user.fullName || user.name || user.username || "Employer";

  return {
    id: "preview_job_id",
    tradeId: jobWizardState.tradeId,
    customTradeTitle: jobWizardState.customTradeTitle || null,
    titleHi: `${tradeTitle} चाहिए — ${jobWizardState.locationName || effectiveCity}`,
    titleEn: `${tradeTitle} Needed — ${jobWizardState.locationName || effectiveCity}`,
    employerName: empName,
    employerVerified: Boolean(user.verified || user.is_verified),
    employerRating: user.rating || 5.0,
    wage: jobWizardState.wage,
    wageUnit: effectiveWageUnit,
    paymentTiming: effectivePaymentTiming,
    paymentMode: effectivePaymentTiming,
    paymentTerms: jobWizardState.paymentTerms || null,
    workersNeeded: jobWizardState.workersNeeded,
    locationName: jobWizardState.locationName || effectiveCity,
    city: effectiveCity,
    landmark: jobWizardState.landmark,
    distanceKm: 2.5,
    startDate: effectiveStartDate,
    date: effectiveStartDate,
    durationText: effectiveDuration,
    assignmentType: jobWizardState.assignmentType,
    timeSlot: effectiveTimeSlot,
    breakIncluded: effectiveBreak,
    descriptionHi: jobWizardState.description || `${tradeTitle} कार्य हेतु कामगार चाहिए।`,
    description: jobWizardState.description,
    toolsResponsibility: jobWizardState.toolsResponsibility,
    toolsProvided: effectiveTools,
    foodProvided: effectiveFood,
    travelProvided: effectiveTravel,
    safetyEquipment: effectiveSafety,
    safetyProvided: effectiveSafety,
    specialConditions: jobWizardState.specialConditions || null,
    urgent: jobWizardState.urgent,
    estimatedTotal: calculateEstimatedTotal()
  };
}

window.selectWizardTrade = function(tradeId) {
  jobWizardState.tradeId = tradeId;
  const t = INITIAL_TRADES.find(item => item.id === tradeId);
  if (t && t.minWage) jobWizardState.wage = t.minWage;
  renderWizardStep();
};

window.useExampleDescription = function(exampleText) {
  jobWizardState.description = exampleText;
  renderWizardStep();
};

window.appendJobDescChip = function(chipText) {
  if (jobWizardState.description) {
    jobWizardState.description += ` • ${chipText}`;
  } else {
    jobWizardState.description = chipText;
  }
  renderWizardStep();
};

window.adjustWorkerCount = function(delta) {
  jobWizardState.workersNeeded = Math.max(1, Math.min(500, jobWizardState.workersNeeded + delta));
  renderWizardStep();
};

window.selectStartDateOption = function(option) {
  jobWizardState.startDateMode = option;
  if (option === 'today') {
    jobWizardState.startDate = 'आज (Today)';
    jobWizardState.customStartDate = '';
  } else if (option === 'tomorrow') {
    jobWizardState.startDate = 'कल (Tomorrow)';
    jobWizardState.customStartDate = '';
  }
  renderWizardStep();
};

window.selectCustomDatePicker = function(dateIso) {
  jobWizardState.startDatePicker = dateIso;
  jobWizardState.startDateMode = 'picker';
  if (dateIso) {
    const parts = dateIso.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    jobWizardState.startDate = formatted;
    jobWizardState.customStartDate = formatted;
  }
  renderWizardStep();
};

window.setCustomStartDateText = function(text) {
  jobWizardState.customStartDate = text;
  jobWizardState.startDateMode = 'custom';
  if (text.trim()) {
    jobWizardState.startDate = text.trim();
  }
};

window.selectTimeSlotOption = function(slotKey) {
  if (slotKey === 'custom') {
    jobWizardState.timeSlotMode = 'custom';
  } else {
    jobWizardState.timeSlotMode = 'preset';
    jobWizardState.timeSlot = slotKey;
  }
  renderWizardStep();
};

window.nextJobStep = function() {
  jobWizardState.validationError = "";

  // Step 1 Validation
  if (jobWizardState.step === 1) {
    if (jobWizardState.tradeId === "other" && (!jobWizardState.customTradeTitle || !jobWizardState.customTradeTitle.trim())) {
      jobWizardState.validationError = "कृपया काम का नाम (Job Title) दर्ज करें।";
      renderWizardStep();
      return;
    }
  }

  // Step 2 Validation
  if (jobWizardState.step === 2) {
    if (!jobWizardState.description || jobWizardState.description.trim().length < 3) {
      jobWizardState.validationError = "कृपया काम का विवरण लिखें ताकि कामगार समझ सकें।";
      renderWizardStep();
      return;
    }
  }

  // Step 3 Validation
  if (jobWizardState.step === 3) {
    if (!jobWizardState.workersNeeded || jobWizardState.workersNeeded < 1) {
      jobWizardState.validationError = "कृपया कम से कम 1 कामगार चुनें।";
      renderWizardStep();
      return;
    }
  }

  // Step 4 Validation
  if (jobWizardState.step === 4) {
    if (!jobWizardState.wage || jobWizardState.wage < 10) {
      jobWizardState.validationError = "कृपया वैध मजदूरी राशि दर्ज करें।";
      renderWizardStep();
      return;
    }
    if (jobWizardState.wageUnit === 'custom' && (!jobWizardState.customWageUnit || !jobWizardState.customWageUnit.trim())) {
      jobWizardState.validationError = "कृपया कस्टम मजदूरी यूनिट (जैसे प्रति वर्ग फुट) दर्ज करें।";
      renderWizardStep();
      return;
    }
  }

  // Step 5 Validation
  if (jobWizardState.step === 5) {
    const effectiveCity = getEffectiveCity();
    if (!jobWizardState.locationName && !effectiveCity) {
      jobWizardState.validationError = "कृपया इलाका या शहर का नाम दर्ज करें।";
      renderWizardStep();
      return;
    }
  }

  if (jobWizardState.step < jobWizardState.totalSteps) {
    jobWizardState.step += 1;
    renderWizardStep();
  }
};

window.prevJobStep = function() {
  jobWizardState.validationError = "";
  if (jobWizardState.step > 1) {
    jobWizardState.step -= 1;
    renderWizardStep();
  }
};

window.goToWizardStep = function(stepNum) {
  jobWizardState.validationError = "";
  jobWizardState.step = Math.max(1, Math.min(jobWizardState.totalSteps, stepNum));
  renderWizardStep();
};

function renderWizardStep() {
  const container = document.getElementById("job-wizard-body");
  if (container) {
    container.innerHTML = renderWizardStepContent();
  }
}

window.speakJobWizardCurrentStep = function() {
  const qEl = document.getElementById("wizard-q-text");
  if (qEl && typeof window.speakQuestion === "function") {
    window.speakQuestion(qEl.innerText);
  }
};

window.publishWizardJob = async function() {
  if (jobWizardState.isSubmitting) return;

  const tradeTitle = getEffectiveTradeTitle();
  const effectiveCity = getEffectiveCity();
  const effectiveStartDate = getEffectiveStartDate();
  const effectiveDuration = getEffectiveDurationText();
  const effectiveWageUnit = getEffectiveWageUnit();
  const effectivePaymentTiming = getEffectivePaymentTiming();
  const effectiveTimeSlot = getEffectiveTimeSlot();
  const effectiveBreak = getEffectiveBreak();
  const effectiveTools = getEffectiveTools();
  const effectiveFood = getEffectiveFood();
  const effectiveTravel = getEffectiveTravel();
  const effectiveSafety = getEffectiveSafety();

  jobWizardState.isSubmitting = true;
  jobWizardState.validationError = "";
  renderWizardStep();

  try {
    // 1. Ensure user is authenticated
    if (window.authService && !window.authService.isAuthenticated()) {
      showToast("काम पोस्ट करने के लिए कृपया पहले नियोक्ता (Employer) के रूप में लॉगिन करें।", "warning", 4000);
      window.location.hash = "#/login";
      return;
    }

    // 2. Ensure active role is employer
    if (window.authService && window.authService.user && window.authService.user.role !== 'employer') {
      try {
        await window.authService.switchRole('employer');
      } catch (_) {}
    }
    if (window.appState && window.appState.currentRole !== 'employer') {
      window.appState.setRole('employer');
    }

    const payload = {
      tradeId: jobWizardState.tradeId,
      customTradeTitle: jobWizardState.customTradeTitle || null,
      titleHi: `${tradeTitle} चाहिए — ${jobWizardState.locationName || effectiveCity}`,
      titleEn: `${tradeTitle} Needed — ${jobWizardState.locationName || effectiveCity}`,
      descriptionHi: jobWizardState.description,
      descriptionEn: jobWizardState.description,
      description: jobWizardState.description,
      workersNeeded: jobWizardState.workersNeeded,
      startDate: effectiveStartDate,
      date: effectiveStartDate,
      durationDays: jobWizardState.assignmentType === 'one_day' ? 1 : jobWizardState.durationDays,
      durationText: effectiveDuration,
      assignmentType: jobWizardState.assignmentType,
      wage: jobWizardState.wage,
      wageUnit: effectiveWageUnit,
      paymentTiming: effectivePaymentTiming,
      paymentMode: effectivePaymentTiming,
      paymentTerms: jobWizardState.paymentTerms || null,
      city: effectiveCity,
      locationName: jobWizardState.locationName || effectiveCity,
      landmark: jobWizardState.landmark || null,
      timeSlot: effectiveTimeSlot,
      breakIncluded: effectiveBreak,
      toolsResponsibility: jobWizardState.toolsResponsibility,
      toolsProvided: effectiveTools,
      foodProvided: effectiveFood,
      travelProvided: effectiveTravel,
      safetyEquipment: effectiveSafety,
      safetyProvided: effectiveSafety,
      specialConditions: jobWizardState.specialConditions || null,
      urgent: jobWizardState.urgent,
      estimatedTotal: calculateEstimatedTotal()
    };

    const newJob = await appState.postJob(payload);

    if (newJob && newJob.id) {
      showToast("✓ आपका काम सफलतापूर्वक पोस्ट हो गया!", "success");
      window.location.hash = `#/job-detail/${newJob.id}`;
    } else {
      throw new Error("Unable to create job");
    }
  } catch (err) {
    console.error("Job posting error:", err);
    let userMsg = "काम पोस्ट करने में समस्या आई। कृपया पुनः प्रयास करें।";
    if (err.status === 401) {
      userMsg = "सत्र समाप्त हो गया है। कृपया दोबारा लॉगिन करें।";
      showToast(userMsg, "error", 4000);
      window.location.hash = "#/login";
      return;
    } else if (err.status === 403) {
      userMsg = "काम पोस्ट करने के लिए नियोक्ता (Employer) मोड आवश्यक है।";
    } else if (err.message) {
      userMsg = err.message;
    }
    jobWizardState.validationError = userMsg;
    showToast(userMsg, "warning", 4000);
  } finally {
    jobWizardState.isSubmitting = false;
    renderWizardStep();
  }
};
