/**
 * CGNeeti / कामसाथी - Notifications View
 */

async function renderNotificationsView() {
  const notifications = appState.notifications;

  return `
    <div class="notifications-page" style="max-width: 600px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            🔔 सूचनाएं (Notifications)
          </h1>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="window.markAllNotifsRead()">
          सभी को पढ़ा हुआ मार्क करें
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${notifications.map(notif => `
          <div class="card card-interactive" onclick="window.handleNotifClick('${notif.id}', '${notif.linkHash}')" style="background: ${notif.read ? 'var(--bg-surface)' : '#eff6ff'}; border-left: 4px solid ${notif.read ? 'var(--border-subtle)' : 'var(--color-primary)'};">
            <div class="flex justify-between items-start gap-2">
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0;">
                  ${escapeHTML(getCurrentLanguage() === 'hi' ? notif.titleHi : notif.titleEn)}
                </h4>
                <p class="text-secondary mt-1" style="font-size: 0.85rem; line-height: 1.4;">
                  ${escapeHTML(getCurrentLanguage() === 'hi' ? notif.messageHi : notif.messageEn)}
                </p>
              </div>
              <div class="text-right">
                <span class="text-muted" style="font-size: 0.75rem;">${notif.time}</span>
                ${!notif.read ? `<div class="badge badge-primary mt-1" style="font-size: 0.65rem;">नया</div>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.handleNotifClick = function(id, hash) {
  const notif = appState.notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  appState.save();
  if (hash) window.location.hash = hash;
};

window.markAllNotifsRead = function() {
  appState.notifications.forEach(n => n.read = true);
  appState.save();
  showToast("✓ सभी सूचनाएं पढ़ी गईं", "info");
  window.location.hash = "#/notifications";
};
