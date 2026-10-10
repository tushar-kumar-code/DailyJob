/**
 * CGNeeti / कामसाथी - More Options Hub (Progressive Disclosure)
 * Secondary features organized cleanly without congesting the main screens
 */

async function renderMoreView() {
  const currentRole = appState.currentRole;
  const unreadNotifs = appState.notifications.filter(n => !n.read).length;
  const savedCount = appState.savedJobIds.length;

  return `
    <div class="more-options-page" style="max-width: 680px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="mb-4">
        <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0;">
          ☰ और विकल्प (Menu)
        </h1>
      </div>

      <!-- Quick Role Switch Banner -->
      <div class="card mb-4" style="background: var(--bg-surface-muted); border-radius: var(--radius-lg); padding: 1rem 1.25rem;">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-muted" style="font-size: 0.8rem;">वर्तमान मोड:</div>
            <div class="font-bold text-primary-color" style="font-size: 1.05rem;">
              ${currentRole === 'worker' ? '👷 कामगार (Worker)' : (currentRole === 'employer' ? '🏪 नियोक्ता (Employer)' : '🛡️ व्यवस्थापक (Admin)')}
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.openRoleSwitchModal()">
            रोल बदलें →
          </button>
        </div>
      </div>

      <!-- Category: सुविधाएं -->
      <h2 class="font-bold text-secondary mb-2" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
        सुविधाएं
      </h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        ${currentRole === 'worker' ? `
          <a href="#/earnings" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
            <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">💰</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">मेरी कमाई</div>
          </a>

          <a href="#/skills" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
            <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">🛠️</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">हुनर की जाँच</div>
          </a>

          <a href="#/jobs?saved=1" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
            <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">❤️</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">सेव किए गए काम</div>
          </a>
        ` : `
          <a href="#/post-job" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
            <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">➕</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">काम डालें</div>
          </a>

          <a href="#/active-work" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
            <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">🔨</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">चालू कार्य</div>
          </a>

          <a href="#/applicants" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
            <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">👥</div>
            <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">आवेदक</div>
          </a>
        `}

        <a href="#/messages" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
          <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">💬</div>
          <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">बातचीत</div>
        </a>

        <a href="#/notifications" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
          <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">🔔</div>
          <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">सूचनाएं</div>
        </a>
      </div>

      <!-- Category: सुरक्षा एवं सहायता -->
      <h2 class="font-bold text-secondary mb-2" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
        सुरक्षा एवं सहायता
      </h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        <a href="#/safety" class="card card-interactive" style="padding: 1.1rem; text-decoration: none; border-left: 4px solid var(--color-danger);">
          <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">🛡️</div>
          <div class="font-bold text-danger" style="font-size: 1rem;">सुरक्षा & SOS</div>
        </a>

        <a href="#/disputes" class="card card-interactive" style="padding: 1.1rem; text-decoration: none; border-left: 4px solid var(--color-warning);">
          <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">⚖️</div>
          <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">समस्या व विवाद</div>
        </a>

        <a href="#/landing" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
          <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">❓</div>
          <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">मदद और नियम</div>
        </a>

        <a href="#/admin" class="card card-interactive" style="padding: 1.1rem; text-decoration: none;">
          <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">⚙️</div>
          <div class="font-bold" style="font-size: 1rem; color: var(--text-primary);">व्यवस्थापक (Admin)</div>
        </a>
      </div>
    </div>
  `;
}
