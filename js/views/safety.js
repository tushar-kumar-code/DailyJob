/**
 * CGNeeti / कामसाथी - Safety Center & Emergency SOS
 */

function renderSafetyView() {
  return `
    <div class="safety-page" style="max-width: 640px; margin: 0 auto; padding-bottom: 2rem;">
      <!-- Emergency SOS Hero Banner -->
      <div class="card mb-4" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; padding: 1.5rem; text-align: center; border-radius: var(--radius-xl);">
        <div style="font-size: 2.8rem; margin-bottom: 0.25rem;">🚨</div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: #991b1b; margin-bottom: 1rem;">
          ${t('sosEmergency')}
        </h1>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; max-width: 520px; margin: 0 auto;">
          <button class="btn btn-danger btn-lg" onclick="window.triggerEmergencySOS()" style="font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
            🆘 तुरंत SOS मदद मांगें
          </button>
          
          <button class="btn btn-outline btn-lg" onclick="window.shareJobLocationWithFamily()" style="border-color: #dc2626; color: #dc2626; background: #fff;">
            📲 परिवार को लोकेशन भेजें
          </button>
        </div>
      </div>

      <!-- Safety Rules -->
      <div class="card mb-4">
        <h2 class="font-bold mb-3" style="font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
          🛡️ कामगार सुरक्षा नियम
        </h2>

        <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.95rem;">
          <div class="flex items-center gap-2">
            <span class="text-success font-bold">✓</span>
            <span>हमेशा समय पर चेक-इन करें</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-success font-bold">✓</span>
            <span>सुरक्षा उपकरण (PPE) जांचें</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-success font-bold">✓</span>
            <span>तय काम ही करें</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-success font-bold">✓</span>
            <span>पेमेंट ऐप में ही दर्ज करें</span>
          </div>
        </div>
      </div>

      <!-- Direct Reporting Options -->
      <div class="grid-cols-2 mb-4">
        <div class="card card-interactive" onclick="window.location.hash='#/disputes'" style="border-left: 4px solid var(--color-warning);">
          <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem;">
            ⚠️ मजदूरी न मिलना / विवाद
          </h3>
          <div class="text-warning font-semibold" style="font-size: 0.88rem;">शिकायत दर्ज करें →</div>
        </div>

        <div class="card card-interactive" onclick="window.reportUnsafeWorkplaceModal()" style="border-left: 4px solid var(--color-danger);">
          <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem;">
            🚩 असुरक्षित कार्यस्थल
          </h3>
          <div class="text-danger font-semibold" style="font-size: 0.88rem;">रिपोर्ट करें →</div>
        </div>
      </div>
    </div>
  `;
}

window.triggerEmergencySOS = function() {
  const bodyHTML = `
    <div class="text-center py-2">
      <div style="font-size: 3rem;">🚨</div>
      <h3 style="color: #991b1b; font-weight: 800; font-size: 1.25rem;">SOS अलर्ट सक्रिय हो गया</h3>
      <p class="text-secondary mt-2" style="font-size: 0.9rem;">
        आपके पंजीकृत आपातकालीन संपर्क <strong>+91 94252 88XXX</strong> और स्थानीय पुलिस कंट्रोल रूम को आपकी वर्तमान कार्यस्थल लोकेशन (शंकर नगर, रायपुर) के साथ SMS भेज दिया गया है।
      </p>
      <div class="mt-4 p-2" style="background: #fee2e2; border-radius: var(--radius-md); font-size: 0.82rem; color: #991b1b;">
        हेल्पलाइन: 112 (आपातकालीन) • कामसाथी सपोर्ट: 1800-XXX-XXXX
      </div>
    </div>
  `;

  openModal("🚨 आपातकालीन मदद (SOS Alert)", bodyHTML, `<button class="btn btn-secondary" onclick="closeModal()">अलर्ट बंद करें</button>`);
};

window.shareJobLocationWithFamily = function() {
  showToast("📲 लोकेशन लिंक तैयार हुआ: 'Ravi is working at Shankar Nagar, Raipur (CGNeeti verified)'", "success", 4000);
};

window.reportUnsafeWorkplaceModal = function() {
  window.location.hash = "#/disputes";
};
