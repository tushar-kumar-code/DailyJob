/**
 * CGNeeti / कामसाथी - Simplified Skills View
 * Clear, simple list + Test wizard if worker clicks to verify.
 */

let verificationWizard = {
  activeTradeId: "plumber",
  step: 0, // 0 = not running, 1-4 = running
  experienceYears: 3,
  evidenceUploaded: false
};

async function renderSkillsView() {
  const worker = await appState.getWorkerProfile();

  // If test wizard is active, show the wizard
  if (verificationWizard.step > 0) {
    return renderSkillWizardContainer();
  }

  return `
    <div class="skills-page" style="max-width: 600px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            आपकी Skills
          </h1>
        </div>
      </div>

      <!-- Simple Skills List (No congested dashboard) -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
        ${INITIAL_TRADES.slice(1, 5).map(trade => {
          const userSkill = worker.skills.find(s => s.id === trade.id);
          const isVerified = userSkill && userSkill.status === "verified";
          const isPending = userSkill && userSkill.status === "evidence_submitted";

          return `
            <div class="card" style="border-radius: var(--radius-lg); padding: 1rem 1.25rem;">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <span style="font-size: 1.8rem;">${trade.icon}</span>
                  <div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">${trade.nameHi}</h3>
                    <div class="text-muted" style="font-size: 0.8rem;">₹${trade.minWage} - ₹${trade.maxWage}/दिन</div>
                  </div>
                </div>

                <div>
                  ${isVerified ? `
                    <span class="badge badge-success font-bold" style="padding: 0.4rem 0.75rem;">
                      🟢 Verified
                    </span>
                  ` : (isPending ? `
                    <span class="badge badge-warning font-bold" style="padding: 0.4rem 0.75rem;">
                      🟡 जाँच बाकी
                    </span>
                  ` : `
                    <button class="btn btn-outline btn-sm" onclick="window.startSkillVerificationWizard('${trade.id}')" style="border-radius: var(--radius-full); font-weight: 700;">
                      जाँच कराएं →
                    </button>
                  `)}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- + नई Skill जोड़ें Button -->
      <div class="card p-3 text-center" style="background: var(--bg-surface-muted); border-radius: var(--radius-lg);">
        <button class="btn btn-primary" onclick="window.startSkillVerificationWizard('mason')" style="border-radius: var(--radius-full); font-weight: 700; padding: 0.6rem 1.5rem;">
          + नई skill जोड़ें
        </button>
      </div>
    </div>
  `;
}

function renderSkillWizardContainer() {
  const trade = INITIAL_TRADES.find(t => t.id === verificationWizard.activeTradeId) || INITIAL_TRADES[3];

  return `
    <div style="max-width: 580px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.5rem;">
        <div class="flex justify-between items-center mb-2">
          <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary-dark);">
            ${trade.icon} ${trade.nameHi} - हुनर की जाँच
          </h2>
          <button class="btn btn-ghost btn-sm" onclick="window.exitSkillWizard()">✕ बंद करें</button>
        </div>

        <div class="wizard-progress-bar mb-4">
          <div class="wizard-progress-fill" style="width: ${(verificationWizard.step / 3) * 100}%;"></div>
        </div>

        ${verificationWizard.step === 1 ? `
          <div>
            <h3 class="font-bold mb-3">कदम 1: कार्य अनुभव</h3>

            <select class="form-control mb-4" onchange="verificationWizard.experienceYears = this.value">
              <option value="1">1 वर्ष से कम</option>
              <option value="2">1 से 2 वर्ष</option>
              <option value="3" selected>3 से 5 वर्ष</option>
              <option value="5">5 वर्ष से अधिक</option>
            </select>

            <div class="flex justify-end">
              <button class="btn btn-primary btn-lg" onclick="window.wizardGoToStep(2)">आगे बढ़ें →</button>
            </div>
          </div>
        ` : ''}

        ${verificationWizard.step === 2 ? `
          <div>
            <h3 class="font-bold mb-3">कदम 2: त्वरित प्रश्न</h3>

            <div class="card p-3 mb-3" style="background: #f8fafc;">
              <p class="font-bold mb-2" style="font-size: 0.92rem;">1. पानी का लीकेज रोकने के लिए क्या इस्तेमाल होता है?</p>
              <label style="display: block; margin-bottom: 0.35rem;"><input type="radio" name="sq1" checked /> टेफ्लॉन टेप व सॉल्वेंट</label>
              <label style="display: block;"><input type="radio" name="sq1" /> साधारण धागा</label>
            </div>

            <div class="flex justify-between mt-4">
              <button class="btn btn-secondary" onclick="window.wizardGoToStep(1)">← वापस</button>
              <button class="btn btn-success btn-lg" onclick="window.finishSkillTest()">✓ सबमिट करें</button>
            </div>
          </div>
        ` : ''}

        ${verificationWizard.step === 3 ? `
          <div class="text-center py-3">
            <div style="font-size: 3rem;">🎉</div>
            <h3 style="font-size: 1.3rem; font-weight: 800; color: #166534; margin-bottom: 0.5rem;">
              हुनर सत्यापित हुआ
            </h3>
            <div class="badge badge-success font-bold mb-4" style="font-size: 0.95rem; padding: 0.4rem 1rem;">
              🟢 ${trade.nameHi} Verified
            </div>
            <div>
              <button class="btn btn-primary btn-lg" onclick="window.exitSkillWizard()">
                वापस जाएं →
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

window.startSkillVerificationWizard = function(tradeId) {
  verificationWizard.activeTradeId = tradeId;
  verificationWizard.step = 1;
  router.handleRoute();
};

window.wizardGoToStep = function(stepNum) {
  verificationWizard.step = stepNum;
  router.handleRoute();
};

window.finishSkillTest = async function() {
  await appState.verifySkill(verificationWizard.activeTradeId, 95);
  verificationWizard.step = 3;
  showToast("✓ हुनर सत्यापित हो गया!", "success");
  router.handleRoute();
};

window.exitSkillWizard = function() {
  verificationWizard.step = 0;
  router.handleRoute();
};
