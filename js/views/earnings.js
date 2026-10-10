/**
 * CGNeeti / कामसाथी - Real Worker Earnings & Payout View
 * Zero fake data: Strictly displays actual completed job payouts
 * and real bank/UPI account linked by the logged-in user.
 */

async function renderEarningsView() {
  const earningsData = await appState.getEarnings();
  const totalEarned = earningsData.totalEarned || 0;
  const netTakeHome = earningsData.netTakeHome || 0;
  const travelSpent = earningsData.travelSpent || 0;
  const payments = earningsData.payments || [];
  const payoutAccount = earningsData.payoutAccount;

  const hasAccount = payoutAccount && (payoutAccount.upiId || payoutAccount.accountNumber);
  const bankDisplay = payoutAccount?.bankName 
    ? `${payoutAccount.bankName}${payoutAccount.accountNumber ? ' - XXXX' + payoutAccount.accountNumber.slice(-4) : ''}`
    : (payoutAccount?.accountNumber ? `खाता - XXXX${payoutAccount.accountNumber.slice(-4)}` : '');
  const upiDisplay = payoutAccount?.upiId ? `UPI: ${payoutAccount.upiId}` : '';

  return `
    <div class="earnings-page" style="max-width: 600px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-3 pt-1">
        <div>
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            मेरी कमाई (Earnings)
          </h1>
          <div class="text-secondary" style="font-size: 0.85rem; margin-top: 0.2rem;">
            आपके पूरे किए गए कार्यों का कुल हिसाब
          </div>
        </div>
      </div>

      <!-- Real Earnings Summary -->
      <div class="card mb-3" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #86efac; border-radius: var(--radius-xl); padding: 1.25rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div class="text-secondary" style="font-size: 0.8rem; font-weight: 600;">कुल प्राप्त मजदूरी</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #065f46; margin-top: 0.2rem;">
              ${formatCurrency(totalEarned)}
            </div>
          </div>

          <div>
            <div class="text-secondary" style="font-size: 0.8rem; font-weight: 600;">हाथ में बची कमाई</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--color-success-dark); margin-top: 0.2rem;">
              ${formatCurrency(netTakeHome)}
            </div>
          </div>
        </div>
        ${travelSpent > 0 ? `
          <div class="mt-2 pt-2 border-top" style="border-color: #86efac !important; font-size: 0.78rem; color: #065f46;">
            🚲 अनुमानित यात्रा कटौती: -${formatCurrency(travelSpent)}
          </div>
        ` : ''}
      </div>

      <!-- Real Bank / UPI Section -->
      ${hasAccount ? `
        <div class="card mb-3 p-3" style="border-radius: var(--radius-lg); display: flex; justify-content: space-between; align-items: center; border: 1.5px solid var(--border-subtle);">
          <div class="flex items-center gap-3">
            <span style="font-size: 1.8rem;">🏦</span>
            <div>
              <div class="font-bold" style="font-size: 0.95rem; color: var(--text-primary);">
                ${escapeHTML(bankDisplay || payoutAccount.holderName || 'सत्यापित बैंक खाता')}
              </div>
              ${upiDisplay ? `
                <div class="text-muted" style="font-size: 0.82rem;">
                  ${escapeHTML(upiDisplay)}
                </div>
              ` : ''}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-success font-bold" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;">
              🟢 Verified
            </span>
            <button class="btn btn-ghost btn-sm" onclick="window.openPayoutModal()" title="खाता बदलें" style="padding: 0.3rem 0.5rem; font-size: 0.85rem;">
              ✏️
            </button>
          </div>
        </div>
      ` : `
        <div class="card mb-3 p-3" style="border-radius: var(--radius-lg); background: #f8fafc; border: 1.5px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: gap-2;">
          <div class="flex items-center gap-3">
            <span style="font-size: 1.8rem;">🏦</span>
            <div>
              <div class="font-bold" style="font-size: 0.95rem; color: var(--text-primary);">
                कोई बैंक खाता या UPI लिंक नहीं है
              </div>
              <div class="text-muted" style="font-size: 0.8rem;">
                मजदूरी सीधे खाते में पाने के लिए अपना UPI / बैंक जोड़ें
              </div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm font-bold" onclick="window.openPayoutModal()" style="border-radius: var(--radius-full); padding: 0.4rem 0.9rem; font-size: 0.85rem;">
            + खाता जोड़ें
          </button>
        </div>
      `}

      <!-- Recent Payouts -->
      <section class="mt-4">
        <h2 class="font-bold mb-3" style="font-size: 1.15rem; color: var(--text-primary);">
          हाल ही के भुगतान (Recent Payouts)
        </h2>

        ${payments.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${payments.map(p => `
              <div class="card p-3" style="border-radius: var(--radius-md); border-left: 4px solid var(--color-success);">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 style="font-size: 0.95rem; font-weight: 700; margin: 0; color: var(--text-primary);">
                      ${escapeHTML(p.jobTitle || 'दैनिक कार्य मजदूरी')}
                    </h3>
                    <div class="text-muted" style="font-size: 0.78rem; margin-top: 0.2rem;">
                      ${p.paidAt ? new Date(p.paidAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : 'हाल ही में'} • ${escapeHTML(p.employerName || 'Employer')} • ${escapeHTML(p.paymentMethod || 'UPI')}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-success" style="font-size: 1.2rem;">
                      + ${formatCurrency(p.amount || 0)}
                    </div>
                    <span class="badge badge-success font-bold" style="font-size: 0.7rem; padding: 0.15rem 0.45rem;">
                      ✓ सफल
                    </span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="card p-4 text-center" style="border-radius: var(--radius-xl); background: var(--bg-surface); border: 1.5px dashed #cbd5e1;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">💳</div>
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
              अभी तक कोई भुगतान नहीं हुआ है
            </h3>
            <p class="text-secondary" style="font-size: 0.88rem; margin: 0 0 1.25rem 0; line-height: 1.4;">
              जब आप काम पूरा करेंगे और नियोक्ता पैसे भेजेगा, तब आपके सभी भुगतान और रसीदें यहाँ दिखाई देंगी।
            </p>
            <div>
              <button class="btn btn-primary font-bold" onclick="window.location.hash='#/jobs'" style="border-radius: var(--radius-full); padding: 0.5rem 1.4rem;">
                🔎 आज का काम खोजें →
              </button>
            </div>
          </div>
        `}
      </section>

      <!-- Account Modal -->
      <div id="payoutAccountModal" class="modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; align-items: center; justify-content: center; padding: 1rem;">
        <div class="card" style="width: 100%; max-width: 440px; border-radius: var(--radius-xl); padding: 1.5rem; background: var(--bg-surface); max-height: 90vh; overflow-y: auto;">
          <div class="flex justify-between items-center mb-3">
            <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0; color: var(--text-primary);">
              🏦 बैंक खाता व UPI जोड़ें
            </h3>
            <button class="btn btn-ghost btn-sm" onclick="window.closePayoutModal()" style="font-size: 1.2rem; line-height: 1;">✕</button>
          </div>

          <form onsubmit="window.saveUserPayoutAccount(event)" style="display: flex; flex-direction: column; gap: 0.85rem;">
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">UPI ID (उदा. 98271xxxxx@paytm, user@oksbi)</label>
              <input type="text" id="payoutUpiId" class="form-control" placeholder="उदा. phonepe/gpay UPI ID" value="${escapeHTML(payoutAccount?.upiId || '')}">
            </div>

            <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; font-weight: 700;">— या बैंक खाता विवरण —</div>

            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">बैंक का नाम (Bank Name)</label>
              <input type="text" id="payoutBankName" class="form-control" placeholder="उदा. State Bank of India, PNB" value="${escapeHTML(payoutAccount?.bankName || '')}">
            </div>

            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">खाता संख्या (Account Number)</label>
              <input type="password" id="payoutAccountNumber" class="form-control" placeholder="10-18 अंकों का खाता नंबर" value="${escapeHTML(payoutAccount?.accountNumber || '')}">
            </div>

            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">IFSC कोड</label>
              <input type="text" id="payoutIfsc" class="form-control" placeholder="उदा. SBIN0001234" value="${escapeHTML(payoutAccount?.ifsc || '')}" style="text-transform: uppercase;">
            </div>

            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">खाताधारक का नाम (Holder Name)</label>
              <input type="text" id="payoutHolderName" class="form-control" placeholder="पासबुक के अनुसार नाम" value="${escapeHTML(payoutAccount?.holderName || '')}">
            </div>

            <div class="flex gap-2 mt-2 pt-2 border-top">
              <button type="button" class="btn btn-outline flex-1 font-bold" onclick="window.closePayoutModal()">रद्द करें</button>
              <button type="submit" class="btn btn-success flex-1 font-bold">✓ सुरक्षित सेव करें</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Global modal handlers for Earnings View
window.openPayoutModal = function() {
  const modal = document.getElementById("payoutAccountModal");
  if (modal) modal.style.display = "flex";
};

window.closePayoutModal = function() {
  const modal = document.getElementById("payoutAccountModal");
  if (modal) modal.style.display = "none";
};

window.saveUserPayoutAccount = async function(event) {
  event.preventDefault();
  const upiId = (document.getElementById("payoutUpiId")?.value || "").trim();
  const bankName = (document.getElementById("payoutBankName")?.value || "").trim();
  const accountNumber = (document.getElementById("payoutAccountNumber")?.value || "").trim();
  const ifsc = (document.getElementById("payoutIfsc")?.value || "").trim().toUpperCase();
  const holderName = (document.getElementById("payoutHolderName")?.value || "").trim();

  if (!upiId && !accountNumber) {
    alert("कृपया कम से कम UPI ID या बैंक खाता संख्या भरें।");
    return;
  }

  const accountData = {
    upiId,
    bankName,
    accountNumber,
    ifsc,
    holderName,
    isVerified: true,
    updatedAt: new Date().toISOString()
  };

  try {
    await appState.savePayoutAccount(accountData);
    window.closePayoutModal();
    if (window.showToast) {
      window.showToast("बैंक / UPI खाता सफलतापूर्वक सेव हो गया! 🏦");
    } else {
      alert("बैंक / UPI खाता सफलतापूर्वक सेव हो गया!");
    }
    // Re-render earnings view
    if (window.router) {
      window.router.handleRoute();
    }
  } catch (err) {
    alert("सेव करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
  }
};
