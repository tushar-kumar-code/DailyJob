/**
 * CGNeeti / कामसाथी - Utility Functions, Toast, Modal, SVG Icons & Voice Mock
 */

// Safe HTML Escaping
function escapeHTML(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format Currency
function formatCurrency(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

// Toast Notifications
function showToast(message, type = "success", duration = 3200) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "✓";
  if (type === "danger") icon = "⚠️";
  if (type === "warning") icon = "🔔";

  toast.innerHTML = `<span>${icon}</span> <div>${escapeHTML(message)}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.2s ease";
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// Modal Dialog Helpers
function openModal(title, bodyHTML, footerHTML = "") {
  let backdrop = document.getElementById("global-modal-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "global-modal-backdrop";
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title" id="global-modal-title"></h3>
          <button class="btn btn-ghost btn-sm" id="global-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body" id="global-modal-body"></div>
        <div class="modal-footer" id="global-modal-footer"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    document.getElementById("global-modal-close").addEventListener("click", closeModal);
  }

  document.getElementById("global-modal-title").innerHTML = escapeHTML(title);
  document.getElementById("global-modal-body").innerHTML = bodyHTML;
  document.getElementById("global-modal-footer").innerHTML = footerHTML;

  backdrop.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const backdrop = document.getElementById("global-modal-backdrop");
  if (backdrop) {
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }
}

// SVG Icons Dictionary (Zero dependencies, crisp rendering)
const ICONS = {
  shieldCheck: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>`,
  star: `<svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  rupee: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8"></path></svg>`,
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  briefcase: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  mic: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
  chat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  bell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  alertCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
};

// Voice Job Posting Simulation Flow
function triggerVoiceJobModal(onExtractedCallback) {
  const sampleVoiceTexts = [
    {
      speech: "मुझे कल 3 construction helpers चाहिए। ₹700 रोज दूंगा। भिलाई में काम है।",
      extracted: {
        tradeId: "helper",
        titleHi: "3 Construction Helpers चाहिए",
        titleEn: "3 Construction Helpers Needed",
        workersNeeded: 3,
        wage: 700,
        date: "कल (Tomorrow)",
        locationName: "Supela, Bhilai",
        city: "Bhilai",
        distanceKm: 3.0
      }
    },
    {
      speech: "रायपुर में आज ही एक इलेक्ट्रीशियन चाहिए 2 घंटे के लिए। 800 रुपये दूंगा।",
      extracted: {
        tradeId: "electrician",
        titleHi: "Electrician चाहिए - वायरिंग रिपेयर",
        titleEn: "Electrician Needed - Wiring Repair",
        workersNeeded: 1,
        wage: 800,
        date: "आज (Today)",
        locationName: "Pandri, Raipur",
        city: "Raipur",
        distanceKm: 2.2
      }
    }
  ];

  const selectedSample = sampleVoiceTexts[Math.floor(Math.random() * sampleVoiceTexts.length)];

  const bodyHTML = `
    <div class="text-center" id="voice-sim-step1">
      <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1.5rem;">
        माइक दबाकर बोलें 🎙️
      </h3>
      
      <button class="voice-mic-big" id="voice-record-btn" aria-label="Start Voice Recording">
        ${ICONS.mic}
      </button>

      <div class="voice-wave-container" id="voice-waves" style="display: none;">
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
      </div>

      <div class="text-muted mt-3" id="voice-status-text" style="font-size: 0.85rem;">माइक पर क्लिक करें</div>
    </div>

    <div id="voice-sim-step2" style="display: none;">
      <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
        <span class="badge badge-success mb-2">🎤 आपकी आवाज़ सुनी गई</span>
        <blockquote style="font-style: italic; color: #166534; font-size: 1.05rem; font-weight: 500;">
          "${selectedSample.speech}"
        </blockquote>
      </div>

      <div class="card" style="background: #f8fafc;">
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--color-primary-dark);">
          ✓ अपने आप बनी Job जानकारी (AI Extracted):
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
          <div><strong>काम:</strong> ${selectedSample.extracted.titleHi}</div>
          <div><strong>कामगार संख्या:</strong> ${selectedSample.extracted.workersNeeded} Workers</div>
          <div><strong>मजदूरी:</strong> ₹${selectedSample.extracted.wage}/दिन</div>
          <div><strong>तारीख:</strong> ${selectedSample.extracted.date}</div>
          <div><strong>स्थान:</strong> ${selectedSample.extracted.locationName}</div>
        </div>
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">रद्द करें / Cancel</button>
    <button class="btn btn-primary" id="voice-confirm-btn" style="display: none;">
      ✓ पुष्टि करें और पोस्ट करें
    </button>
  `;

  openModal("🎤 बोलकर काम डालें (Voice Post)", bodyHTML, footerHTML);

  const micBtn = document.getElementById("voice-record-btn");
  const waves = document.getElementById("voice-waves");
  const statusText = document.getElementById("voice-status-text");
  const step1 = document.getElementById("voice-sim-step1");
  const step2 = document.getElementById("voice-sim-step2");
  const confirmBtn = document.getElementById("voice-confirm-btn");

  micBtn.addEventListener("click", () => {
    micBtn.classList.add("recording");
    waves.style.display = "flex";
    statusText.textContent = "🎙️ सुन रहा हूँ... बोलिए (Listening...)";

    // Simulate speech recognition result after 2.2 seconds
    setTimeout(() => {
      micBtn.classList.remove("recording");
      step1.style.display = "none";
      step2.style.display = "block";
      confirmBtn.style.display = "inline-flex";
    }, 2200);
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "काम पोस्ट हो रहा है...";
    const posted = await appState.postJob(selectedSample.extracted);
    closeModal();
    showToast("✓ आपका काम सफलतापूर्वक पोस्ट हो गया!", "success");
    if (onExtractedCallback) {
      onExtractedCallback(posted);
    } else {
      window.location.hash = "#/employer";
    }
  });
}
