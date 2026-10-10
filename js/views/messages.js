/**
 * CGNeeti / कामसाथी - Job-Contextual Messaging View
 * Clear work context at the top, quick response pills for low literacy
 */

async function renderMessagesView(jobId = null) {
  let targetId = jobId;
  if (!targetId || targetId === "job-101") {
    targetId = appState.jobs[0]?.id;
  }
  const job = targetId ? await appState.getJobById(targetId) : null;
  const isEmployer = appState.currentRole === "employer";

  if (!job) {
    return `
      <div class="chat-page" style="max-width: 600px; margin: 0 auto; padding-bottom: 2rem;">
        <button class="btn btn-ghost btn-sm mb-3" onclick="history.back()">
          ${t('backBtn')}
        </button>
        <div class="card p-4 text-center" style="border-radius: var(--radius-xl); background: var(--bg-surface);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💬</div>
          <h2 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 0.35rem;">कोई सक्रिय बातचीत नहीं है</h2>
          <p class="text-secondary" style="font-size: 0.88rem; margin-bottom: 1.25rem;">
            जब आप किसी काम के लिए आवेदन करेंगे या काम स्वीकार होगा, तो आप यहाँ सीधे चैट कर सकेंगे।
          </p>
          <button class="btn btn-primary" onclick="window.location.hash='#/jobs'" style="border-radius: var(--radius-full); font-weight: 700;">
            काम खोजें →
          </button>
        </div>
      </div>
    `;
  }

  const thread = await appState.getMessages(job.id);

  return `
    <div class="chat-page" style="max-width: 600px; margin: 0 auto; padding-bottom: 2rem;">
      <div class="flex justify-between items-center mb-2">
        <button class="btn btn-ghost btn-sm" onclick="history.back()">
          ${t('backBtn')}
        </button>
        <span class="badge badge-success">🔒 सुरक्षित संदेश (Work Chat)</span>
      </div>

      <div class="chat-container">
        <!-- Top Context Header -->
        <div class="chat-job-bar">
          <div>
            <div class="font-bold text-primary-color" style="font-size: 0.95rem;">
              ${escapeHTML(job.titleHi)}
            </div>
            <div class="text-muted" style="font-size: 0.75rem;">
              📍 ${escapeHTML(job.locationName)} • 💰 ${formatCurrency(job.wage)}/दिन
            </div>
          </div>
          <div class="text-right">
            <span class="badge badge-neutral">
              ${isEmployer ? 'बातचीत: कामगार से' : 'बातचीत: नियोक्ता से'}
            </span>
          </div>
        </div>

        <!-- Chat Messages Flow -->
        <div class="chat-messages-area" id="chat-messages-flow">
          ${thread.conversation.map(msg => `
            <div class="chat-bubble ${(msg.sender === 'worker' && !isEmployer) || (msg.sender === 'employer' && isEmployer) ? 'sent' : 'received'}">
              <div>${escapeHTML(msg.text)}</div>
              <div style="font-size: 0.65rem; opacity: 0.8; text-align: right; margin-top: 0.2rem;">
                ${msg.time}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Quick One-Tap Response Pills (For quick communication) -->
        <div class="p-2" style="background: var(--bg-surface-muted); border-top: 1px solid var(--border-subtle); display: flex; gap: 0.4rem; overflow-x: auto;">
          ${!isEmployer ? `
            <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" onclick="window.sendQuickReply('${job.id}', 'नमस्ते, मैं साइट के लिए निकल गया हूँ।')">
              🚶 मैं निकल गया हूँ
            </button>
            <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" onclick="window.sendQuickReply('${job.id}', 'मैं कार्यस्थल पर पहुंच गया हूँ।')">
              📍 साइट पहुंच गया
            </button>
            <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" onclick="window.sendQuickReply('${job.id}', 'आज का काम पूरा हो गया है, कृपया चेक कर लें।')">
              ✓ काम पूरा हो गया
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" onclick="window.sendQuickReply('${job.id}', 'नमस्ते, क्या आप समय पर पहुंच रहे हैं?')">
              ⏰ समय पर पहुंचें
            </button>
            <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" onclick="window.sendQuickReply('${job.id}', 'सामान और चाबी साइट पर चौकीदार के पास है।')">
              🔑 चाबी चौकीदार के पास है
            </button>
            <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" onclick="window.sendQuickReply('${job.id}', 'काम संतोषजनक है, पेमेंट जारी कर दिया गया है।')">
              💳 पेमेंट कर दिया है
            </button>
          `}
        </div>

        <!-- Input Bar -->
        <form class="chat-input-bar" onsubmit="window.handleChatSubmit(event, '${job.id}')">
          <input 
            type="text" 
            id="chat-text-input" 
            class="form-control" 
            placeholder="संदेश लिखें (उदा. लोकेशन भेजें)..." 
            autocomplete="off" 
            required 
            style="min-height: 42px;"
          />
          <button type="submit" class="btn btn-primary" style="min-height: 42px; padding: 0 1.25rem;">
            भेजें →
          </button>
        </form>
      </div>
    </div>
  `;
}

window.sendQuickReply = async function(jobId, text) {
  await appState.sendChatMessage(jobId, text);
  refreshChatMessages(jobId);
};

window.handleChatSubmit = async function(e, jobId) {
  e.preventDefault();
  const input = document.getElementById("chat-text-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await appState.sendChatMessage(jobId, text);
  refreshChatMessages(jobId);
};

async function refreshChatMessages(jobId) {
  const container = document.getElementById("chat-messages-flow");
  if (!container) return;
  const thread = await appState.getMessages(jobId);
  const isEmployer = appState.currentRole === "employer";

  container.innerHTML = thread.conversation.map(msg => `
    <div class="chat-bubble ${(msg.sender === 'worker' && !isEmployer) || (msg.sender === 'employer' && isEmployer) ? 'sent' : 'received'}">
      <div>${escapeHTML(msg.text)}</div>
      <div style="font-size: 0.65rem; opacity: 0.8; text-align: right; margin-top: 0.2rem;">
        ${msg.time}
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}
