/**
 * CGNeeti / कामसाथी - Realistic Local Mock Datasets
 * Localities: Raipur, Durg, Bhilai, Bilaspur, Rajnandgaon
 */

const INITIAL_TRADES = [
  { id: "all", nameHi: "सभी काम", nameEn: "All Trades", icon: "🛠️" },
  { id: "cooking", nameHi: "खाना बनाना / कुक", nameEn: "Cooking / Chef", icon: "🍳", minWage: 500, maxWage: 800 },
  { id: "electrician", nameHi: "इलेक्ट्रीशियन", nameEn: "Electrician", icon: "⚡", minWage: 700, maxWage: 950 },
  { id: "mason", nameHi: "राजमिस्त्री", nameEn: "Mason", icon: "🧱", minWage: 750, maxWage: 950 },
  { id: "plumber", nameHi: "प्लंबर", nameEn: "Plumber", icon: "🚰", minWage: 650, maxWage: 850 },
  { id: "painter", nameHi: "पेंटर", nameEn: "Painter", icon: "🎨", minWage: 600, maxWage: 850 },
  { id: "welder", nameHi: "वेल्डर", nameEn: "Welder", icon: "🔥", minWage: 700, maxWage: 950 },
  { id: "helper", nameHi: "मजदूर / हेल्पर", nameEn: "Construction Helper", icon: "👷", minWage: 500, maxWage: 650 },
  { id: "carpenter", nameHi: "बढ़ई", nameEn: "Carpenter", icon: "🪚", minWage: 750, maxWage: 1000 },
  { id: "loader", nameHi: "लोडर / हमाल", nameEn: "Loader / Porter", icon: "📦", minWage: 550, maxWage: 700 },
  { id: "cleaning", nameHi: "सफाई कर्मचारी", nameEn: "Cleaning / Help", icon: "🧹", minWage: 400, maxWage: 650 },
  { id: "driving", nameHi: "ड्राइवर", nameEn: "Driving / Driver", icon: "🚗", minWage: 600, maxWage: 900 },
  { id: "delivery", nameHi: "डिलीवरी कर्मचारी", nameEn: "Delivery Worker", icon: "🛵", minWage: 500, maxWage: 800 },
  { id: "other", nameHi: "अन्य काम", nameEn: "Other Work", icon: "💼", minWage: 500, maxWage: 850 }
];

const INITIAL_JOBS = [];

const INITIAL_WORKERS = [];

const INITIAL_EMPLOYER = {
  id: null,
  name: "",
  contactPerson: "",
  phone: "",
  city: "",
  area: "",
  verified: false,
  rating: 5.0,
  totalHires: 0,
  onTimePaymentRate: "100%",
  cancellationRate: "0%",
  activeJobIds: []
};

const INITIAL_APPLICATIONS = [];

const INITIAL_NOTIFICATIONS = [];

const INITIAL_MESSAGES = [];

const INITIAL_DISPUTES = [];

const INITIAL_ADMIN_METRICS = {
  activeJobsCount: 148,
  verifiedWorkersCount: 1840,
  verifiedEmployersCount: 420,
  fairWageAdherence: "96.4%",
  disputeResolutionTime: "4.2 hrs",
  fraudAlertsCount: 2
};
