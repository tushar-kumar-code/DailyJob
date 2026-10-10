/**
 * CGNeeti / कामसाथी - Centralized Bilingual Translation System
 * Default: Hindi ('hi') / English ('en')
 */

const translations = {
  hi: {
    // Brand & App
    appName: "कामसाथी (CGNeeti)",
    appTagline: "काम ढूंढना आसान। सही कामगार ढूंढना आसान।",
    appSubtagline: "अपने आसपास के भरोसेमंद लोगों से काम और कामगार खोजें।",

    // Roles & Core CTAs
    iNeedWork: "मुझे काम चाहिए",
    iNeedWorkers: "मुझे कामगार चाहिए",
    workerRole: "कामगार (Worker)",
    employerRole: "नियोक्ता (Employer)",
    adminRole: "व्यवस्थापक (Admin)",
    switchRole: "रोल बदलें",
    needWorkToday: "आज काम चाहिए?",
    findWorkToday: "आज का काम खोजें",
    findWorkers: "कामगार खोजें",
    postJobCTA: "काम डालें / Post Work",
    voicePostCTA: "🎤 बोलकर काम डालें",

    // Worker Dashboard
    helloGreeting: "नमस्ते, {name} 👋",
    jobsNearYou: "आपके पास काम",
    verifiedEmployer: "🟢 Verified Employer",
    verifiedSkill: "🟢 Verified Skill",
    identityVerified: "🟢 Identity Verified",
    viewJob: "काम देखें",
    applyNow: "आवेदन करें",
    saveJob: "काम सेव करें",
    saved: "सेव किया गया",
    distanceAway: "{dist} km दूर",
    perDay: "/दिन",
    today: "आज",
    tomorrow: "कल",
    workersNeeded: "{count} कामगार चाहिए",

    // Wage & Travel Transparency
    wageTransparencyTitle: "Wage Transparency (मजदूरी स्पष्टता)",
    localMarketRange: "इस इलाके में सामान्य मजदूरी: ₹{min} – ₹{max}",
    fairWageBadge: "✓ सही और उचित दर",
    lowWageWarning: "⚠️ यह payment सामान्य range से कम है।",
    travelCostTitle: "अनुमानित कमाई का हिसाब",
    jobWageLabel: "काम की कमाई:",
    travelExpenseLabel: "अनुमानित travel खर्च:",
    netEarningsLabel: "लगभग बची कमाई:",

    // Match Explanation
    whyMatchTitle: "यह काम आपके लिए सही क्यों है?",
    matchSkill: "✓ आपकी skill मैच करती है",
    matchAvailable: "✓ आप इस समय उपलब्ध हैं",
    matchTravel: "✓ आपके आने-जाने के दायरे में है",
    matchWage: "✓ आपकी मजदूरी की पसंद के अनुसार है",

    // Work Status Timeline
    statusApplied: "आवेदन किया (Applied)",
    statusSelected: "चयनित (Selected)",
    statusConfirmed: "पुष्टि हुई (Confirmed)",
    statusStarted: "काम शुरू (Started)",
    statusCompleted: "काम समाप्त (Completed)",
    statusPaid: "भुगतान प्राप्त (Paid)",

    // Check-in / Check-out
    startWorkBtn: "काम शुरू करें (Check In)",
    finishWorkBtn: "काम पूरा करें (Check Out)",
    locationVerified: "📍 कार्यस्थल लोकेशन सत्यापित",

    // Payment
    paymentStatus: "भुगतान स्थिति",
    pendingPayment: "🟡 भुगतान प्रतीक्षारत (Pending)",
    paidSuccess: "🟢 भुगतान पूरा हुआ (Paid)",
    releasePaymentBtn: "भुगतान जारी करें (Release ₹{amount})",

    // Dispute & Safety
    safetyCenter: "सुरक्षा केंद्र (Safety Center)",
    sosEmergency: "🚨 आपातकालीन मदद (SOS Help)",
    reportIssue: "समस्या रिपोर्ट करें (Report Problem)",
    disputeCenter: "विवाद केंद्र (Dispute Center)",
    fileDispute: "विवाद दर्ज करें",

    // Nav
    navHome: "होम",
    navJobs: "काम खोजें",
    navActiveWork: "आज का काम",
    navMessages: "बातचीत",
    navProfile: "प्रोफ़ाइल",
    navApplicants: "आवेदक",

    // General
    loading: "लोड हो रहा है...",
    noJobsFound: "अभी कोई काम नहीं मिला",
    noJobsSub: "अपना location या skill बदलकर फिर देखें।",
    searchPlaceholder: "काम या इलाका खोजें (उदा. Electrician, Durg)...",
    allCategories: "सभी काम",
    urgent: "अति आवश्यक (Urgent)",
    beginnerFriendly: "नया कामगार (Beginner Friendly)",
    successMsg: "सफलतापूर्वक पूरा हुआ!",
    errorMsg: "कुछ समस्या हुई। कृपया फिर कोशिश करें।",
    backBtn: "← वापस जाएं",
    close: "बंद करें",
    confirm: "पुष्टि करें",
    cancel: "रद्द करें"
  },

  en: {
    // Brand & App
    appName: "KaamSaathi (CGNeeti)",
    appTagline: "Finding work is easy. Finding verified workers is easy.",
    appSubtagline: "Connect with verified local workers and employers nearby.",

    // Roles & Core CTAs
    iNeedWork: "I Need Work",
    iNeedWorkers: "I Need Workers",
    workerRole: "Worker",
    employerRole: "Employer",
    adminRole: "Admin",
    switchRole: "Switch Role",
    needWorkToday: "Need Work Today?",
    findWorkToday: "Find Work Today",
    findWorkers: "Find Workers",
    postJobCTA: "Post a Job",
    voicePostCTA: "🎤 Voice Post Job",

    // Worker Dashboard
    helloGreeting: "Hello, {name} 👋",
    jobsNearYou: "Jobs Near You",
    verifiedEmployer: "🟢 Verified Employer",
    verifiedSkill: "🟢 Verified Skill",
    identityVerified: "🟢 Identity Verified",
    viewJob: "View Job",
    applyNow: "Apply Now",
    saveJob: "Save Job",
    saved: "Saved",
    distanceAway: "{dist} km away",
    perDay: "/day",
    today: "Today",
    tomorrow: "Tomorrow",
    workersNeeded: "{count} workers needed",

    // Wage & Travel Transparency
    wageTransparencyTitle: "Wage Transparency",
    localMarketRange: "Local area average wage: ₹{min} – ₹{max}",
    fairWageBadge: "✓ Fair Market Wage",
    lowWageWarning: "⚠️ This wage is below the local average.",
    travelCostTitle: "Estimated Net Earnings",
    jobWageLabel: "Job Pay:",
    travelExpenseLabel: "Estimated Travel Cost:",
    netEarningsLabel: "Estimated Take-Home:",

    // Match Explanation
    whyMatchTitle: "Why this matches you:",
    matchSkill: "✓ Your skill matches the requirement",
    matchAvailable: "✓ You are available on this date",
    matchTravel: "✓ Within your preferred travel range",
    matchWage: "✓ Matches your wage preference",

    // Work Status Timeline
    statusApplied: "Applied",
    statusSelected: "Selected",
    statusConfirmed: "Confirmed",
    statusStarted: "Work Started",
    statusCompleted: "Work Completed",
    statusPaid: "Paid",

    // Check-in / Check-out
    startWorkBtn: "Start Work (Check In)",
    finishWorkBtn: "Finish Work (Check Out)",
    locationVerified: "📍 Workplace Location Verified",

    // Payment
    paymentStatus: "Payment Status",
    pendingPayment: "🟡 Payment Pending",
    paidSuccess: "🟢 Payment Completed",
    releasePaymentBtn: "Release Payment (₹{amount})",

    // Dispute & Safety
    safetyCenter: "Safety Center",
    sosEmergency: "🚨 Emergency SOS Help",
    reportIssue: "Report Problem",
    disputeCenter: "Dispute Center",
    fileDispute: "File a Dispute",

    // Nav
    navHome: "Home",
    navJobs: "Find Work",
    navActiveWork: "Today's Work",
    navMessages: "Messages",
    navProfile: "Profile",
    navApplicants: "Applicants",

    // General
    loading: "Loading...",
    noJobsFound: "No jobs found right now",
    noJobsSub: "Try changing your location or trade filter.",
    searchPlaceholder: "Search trade or area (e.g. Electrician, Durg)...",
    allCategories: "All Trades",
    urgent: "Urgent",
    beginnerFriendly: "Beginner Friendly",
    successMsg: "Completed successfully!",
    errorMsg: "Something went wrong. Please try again.",
    backBtn: "← Go Back",
    close: "Close",
    confirm: "Confirm",
    cancel: "Cancel"
  }
};

let currentLanguage = localStorage.getItem("cgn_lang") || "hi";

function t(key, params = {}) {
  const langTable = translations[currentLanguage] || translations.hi;
  let text = langTable[key] || translations.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return text;
}

function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem("cgn_lang", lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
  }
}

function getCurrentLanguage() {
  return currentLanguage;
}
