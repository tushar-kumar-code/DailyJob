/**
 * CGNeeti / कामसाथी - Simplified Landing Page View
 * Clean, uncluttered, trust-first landing page
 */

function renderLandingView() {
  return `
    <div class="landing-page-wrapper" style="max-width: 680px; margin: 0 auto; padding-bottom: 2rem;">
      <!-- Hero Section -->
      <section class="card mb-4" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 60%, #e0e7ff 100%); border: 2px solid #bfdbfe; padding: 2rem 1.25rem; text-align: center; border-radius: var(--radius-xl);">
        <span class="badge badge-primary mb-2 font-bold" style="font-size: 0.85rem; padding: 0.35rem 0.8rem;">
          🤝 DailyJob Platform
        </span>
        
        <h1 style="font-size: clamp(1.5rem, 5vw, 2.2rem); font-weight: 800; color: var(--color-primary-dark); line-height: 1.25; margin-bottom: 0.75rem;">
          Local Work & Skilled Workforce Matching
        </h1>
        <p class="text-secondary mb-4" style="font-size: 1rem; max-width: 480px; margin: 0 auto 1.5rem auto;">
          Connect directly with verified local workers and employers with transparent daily wages.
        </p>

        <!-- Two Dominant Primary CTAs -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 420px; margin: 0 auto;">
          <button class="btn btn-primary btn-lg" onclick="window.chooseRoleAndNavigate('worker')" style="font-size: 1.15rem; font-weight: 800; border-radius: var(--radius-full); min-height: 54px; box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);">
            👷 Find Work (Job Seeker)
          </button>

          <button class="btn btn-success btn-lg" onclick="window.chooseRoleAndNavigate('employer')" style="font-size: 1.15rem; font-weight: 800; border-radius: var(--radius-full); min-height: 54px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);">
            🏪 Hire Workers (Employer)
          </button>
        </div>

        <!-- Voice Posting Shortcut -->
        <div class="mt-3">
          <button class="btn btn-outline btn-sm" onclick="triggerVoiceJobModal()" style="background: #fff; border-color: var(--color-accent); color: var(--color-accent); font-weight: 700; border-radius: var(--radius-full);">
            🎤 बोलकर काम डालें
          </button>
        </div>
      </section>

      <!-- 3 Trust Pillars -->
      <section class="mb-4">
        <h2 class="font-bold text-center mb-3" style="font-size: 1.2rem; color: var(--text-primary);">
          भरोसे के 3 नियम
        </h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
          <div class="card p-3 text-center" style="border-radius: var(--radius-lg);">
            <div style="font-size: 2rem; margin-bottom: 0.25rem;">🛡️</div>
            <div class="font-bold" style="font-size: 0.95rem;">सत्यापित लोग</div>
          </div>

          <div class="card p-3 text-center" style="border-radius: var(--radius-lg);">
            <div style="font-size: 2rem; margin-bottom: 0.25rem;">💰</div>
            <div class="font-bold" style="font-size: 0.95rem;">उचित मजदूरी</div>
          </div>

          <div class="card p-3 text-center" style="border-radius: var(--radius-lg);">
            <div style="font-size: 2rem; margin-bottom: 0.25rem;">🚲</div>
            <div class="font-bold" style="font-size: 0.95rem;">आसपास का काम</div>
          </div>
        </div>
      </section>

      <!-- 3 Simple Steps -->
      <section class="card mb-4" style="border-radius: var(--radius-xl); padding: 1.5rem;">
        <h2 class="font-bold text-center mb-3" style="font-size: 1.2rem;">
          3 आसान कदम
        </h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; text-align: center;">
          <div>
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; font-weight: 800; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem auto;">
              1
            </div>
            <div class="font-bold" style="font-size: 0.95rem;">काम देखें या डालें</div>
          </div>

          <div>
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #dcfce7; color: #15803d; font-weight: 800; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem auto;">
              2
            </div>
            <div class="font-bold" style="font-size: 0.95rem;">Check-In करें</div>
          </div>

          <div>
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #fef3c7; color: #b45309; font-weight: 800; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem auto;">
              3
            </div>
            <div class="font-bold" style="font-size: 0.95rem;">पूरा पैसा पाएं</div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer style="text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
        <div class="flex justify-center gap-3 mb-2">
          <a href="#/safety">सुरक्षा केंद्र</a>
          <span>•</span>
          <a href="#/disputes">विवाद निवारण</a>
          <span>•</span>
          <a href="#/admin">व्यवस्थापक</a>
        </div>
        <p>© 2026 CGNeeti (कामसाथी) • छत्तीसगढ़ का अपना स्थानीय कामगार मंच</p>
      </footer>
    </div>
  `;
}
