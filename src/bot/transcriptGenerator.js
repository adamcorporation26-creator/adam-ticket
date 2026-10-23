/**
 * HTML Transcript Generator for Adam Ticket King Bot
 * Generates Discord-styled, responsive HTML transcripts with dark mode aesthetics,
 * avatars, embedded attachments, message grouping, markdown formatting, and ticket metadata.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseDiscordMarkdown(text) {
  if (!text) return '';
  let parsed = escapeHtml(text);

  // Multiline code blocks ```lang\ncode\n```
  parsed = parsed.replace(/```(?:([a-zA-Z0-9_-]+)\n)?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block"><code class="${lang ? `language-${lang}` : ''}">${code}</code></pre>`;
  });

  // Inline code `code`
  parsed = parsed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold **text**
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *text* or _text_
  parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  parsed = parsed.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Underline __text__
  parsed = parsed.replace(/__([^_]+)__/g, '<u>$1</u>');

  // Strikethrough ~~text~~
  parsed = parsed.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Discord Mentions <@123456789>, <#123456789>, <@&123456789>
  parsed = parsed.replace(/&lt;@!?(\d+)&gt;/g, '<span class="discord-mention">@User</span>');
  parsed = parsed.replace(/&lt;#(\d+)&gt;/g, '<span class="discord-mention channel">#channel</span>');
  parsed = parsed.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="discord-mention role">@Role</span>');

  // Line breaks
  parsed = parsed.replace(/\n/g, '<br>');

  return parsed;
}

export function generateDiscordHtmlTranscript({ ticket, messages = [], guild = null, closedBy = 'Staff' }) {
  const guildName = escapeHtml(guild?.name || 'ADAM CORPORATION');
  const guildIcon = guild?.iconURL?.({ extension: 'png', size: 128 }) || '/adam_corp_logo.jpg';
  const ticketName = escapeHtml(ticket?.ticketName || 'ticket');
  const ticketTopic = escapeHtml(ticket?.topic || 'General');
  const ticketId = escapeHtml(ticket?.id || 'ticket-unknown');
  const authorTag = escapeHtml(ticket?.authorTag || 'Customer');
  const authorAvatar = ticket?.authorAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const openTime = ticket?.openTime ? new Date(ticket.openTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown';
  const resolvedTime = ticket?.resolvedTime ? new Date(ticket.resolvedTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const stars = ticket?.rating ? '⭐'.repeat(ticket.rating) + ` (${ticket.rating}/5)` : null;
  const feedback = ticket?.feedback ? escapeHtml(ticket.feedback) : null;
  const intake = ticket?.intakeData || null;

  // Render intake data cards if available
  let intakeHtml = '';
  if (intake) {
    const intakeRows = [];
    if (intake.product) intakeRows.push(`<div class="intake-item"><span class="intake-label">🛍️ Product:</span> <span class="intake-val">${escapeHtml(intake.product)}</span></div>`);
    if (intake.paymentMethod) intakeRows.push(`<div class="intake-item"><span class="intake-label">💳 Payment Method:</span> <span class="intake-val">${escapeHtml(intake.paymentMethod)}</span></div>`);
    if (intake.issueSubject) intakeRows.push(`<div class="intake-item"><span class="intake-label">📌 Subject:</span> <span class="intake-val">${escapeHtml(intake.issueSubject)}</span></div>`);
    if (intake.issueDetails) intakeRows.push(`<div class="intake-item"><span class="intake-label">📝 Description:</span> <span class="intake-val">${escapeHtml(intake.issueDetails)}</span></div>`);
    if (intake.notes) intakeRows.push(`<div class="intake-item"><span class="intake-label">📋 Notes:</span> <span class="intake-val">${escapeHtml(intake.notes)}</span></div>`);
    if (intake.reference) intakeRows.push(`<div class="intake-item"><span class="intake-label">🔗 Reference:</span> <span class="intake-val">${escapeHtml(intake.reference)}</span></div>`);

    if (intakeRows.length > 0) {
      intakeHtml = `
      <div class="intake-card">
        <div class="intake-header">📋 Customer Intake Details</div>
        <div class="intake-grid">
          ${intakeRows.join('\n')}
        </div>
      </div>`;
    }
  }

  // Render messages
  let messagesHtml = '';
  let lastAuthor = null;
  let lastTimestamp = 0;

  messages.forEach((msg, idx) => {
    const author = escapeHtml(msg.author || 'System');
    const authorAvatar = msg.authorAvatar || 'https://cdn.discordapp.com/embed/avatars/1.png';
    const isBot = author.toLowerCase().includes('bot') || author.toLowerCase().includes('king') || author === 'System';
    const rawTime = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const timeFormatted = rawTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDate = rawTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const timeDelta = rawTime.getTime() - lastTimestamp;
    const isGrouped = lastAuthor === author && timeDelta < 3 * 60 * 1000;

    lastAuthor = author;
    lastTimestamp = rawTime.getTime();

    // Attachments HTML
    let attachmentsHtml = '';
    if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
      attachmentsHtml = '<div class="msg-attachments">';
      msg.attachments.forEach(att => {
        const attName = escapeHtml(att.name || 'file');
        const attUrl = escapeHtml(att.url || '#');
        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(attName);
        if (isImage) {
          attachmentsHtml += `
            <a href="${attUrl}" target="_blank" rel="noopener noreferrer" class="attachment-img-link">
              <img src="${attUrl}" alt="${attName}" class="attachment-img" loading="lazy" />
            </a>`;
        } else {
          attachmentsHtml += `
            <a href="${attUrl}" target="_blank" rel="noopener noreferrer" class="attachment-file-pill">
              📁 ${attName}
            </a>`;
        }
      });
      attachmentsHtml += '</div>';
    }

    const contentHtml = parseDiscordMarkdown(msg.content);

    if (isGrouped) {
      messagesHtml += `
        <div class="msg-row msg-grouped">
          <div class="msg-gutter"><span class="msg-hover-time">${timeFormatted}</span></div>
          <div class="msg-body">
            <div class="msg-content">${contentHtml}</div>
            ${attachmentsHtml}
          </div>
        </div>`;
    } else {
      messagesHtml += `
        <div class="msg-row ${idx > 0 ? 'msg-break' : ''}">
          <div class="msg-avatar-col">
            <img src="${authorAvatar}" class="msg-avatar" alt="${author}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" />
          </div>
          <div class="msg-body">
            <div class="msg-meta">
              <span class="msg-author ${isBot ? 'bot-author' : ''}">${author}</span>
              ${isBot ? '<span class="bot-badge">APP</span>' : ''}
              <span class="msg-time" title="${fullDate}">${timeFormatted}</span>
            </div>
            <div class="msg-content">${contentHtml}</div>
            ${attachmentsHtml}
          </div>
        </div>`;
    }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ticketName} — Transcript | ${guildName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #313338;
      --bg-secondary: #2b2d31;
      --bg-tertiary: #1e1f22;
      --bg-hover: rgba(255, 255, 255, 0.04);
      --text-normal: #dbdee1;
      --text-muted: #949ba4;
      --text-header: #f2f3f5;
      --accent: #5865f2;
      --accent-gold: #f0b232;
      --accent-danger: #f23f43;
      --accent-success: #23a55a;
      --border-color: #3f4147;
      --font-main: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      --font-code: 'JetBrains Mono', Consolas, Monaco, monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-normal);
      font-family: var(--font-main);
      font-size: 15px;
      line-height: 1.45;
      overflow-x: hidden;
      min-height: 100vh;
    }

    /* Top banner */
    .top-header {
      background: linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
      border-bottom: 1px solid var(--border-color);
      padding: 24px 32px;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }

    .header-content {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .guild-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .guild-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      border: 2px solid var(--border-color);
      object-fit: cover;
      background: #000;
    }

    .guild-title h1 {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-header);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .guild-title p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .ticket-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(88, 101, 242, 0.15);
      border: 1px solid rgba(88, 101, 242, 0.35);
      color: #818cf8;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Meta Cards Banner */
    .meta-container {
      max-width: 1100px;
      margin: 20px auto 0;
      padding: 0 32px;
    }

    .meta-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .meta-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 12px 16px;
    }

    .meta-card-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }

    .meta-card-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-header);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Intake Card */
    .intake-card {
      background: rgba(240, 178, 50, 0.08);
      border: 1px solid rgba(240, 178, 50, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 14px;
    }

    .intake-header {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent-gold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .intake-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 8px 16px;
    }

    .intake-item {
      font-size: 13.5px;
    }

    .intake-label {
      font-weight: 600;
      color: var(--text-muted);
    }

    .intake-val {
      font-weight: 600;
      color: var(--text-header);
    }

    /* Chat Messages Stream */
    .chat-container {
      max-width: 1100px;
      margin: 24px auto 40px;
      padding: 0 32px;
    }

    .chat-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    .msg-row {
      display: flex;
      padding: 6px 24px;
      transition: background 0.15s ease;
      position: relative;
    }

    .msg-row:hover {
      background-color: var(--bg-hover);
    }

    .msg-break {
      margin-top: 14px;
      padding-top: 8px;
    }

    .msg-avatar-col {
      width: 48px;
      flex-shrink: 0;
      margin-right: 14px;
    }

    .msg-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      background: var(--bg-tertiary);
    }

    .msg-gutter {
      width: 48px;
      flex-shrink: 0;
      margin-right: 14px;
      text-align: right;
    }

    .msg-hover-time {
      font-size: 11px;
      color: var(--text-muted);
      opacity: 0;
      user-select: none;
    }

    .msg-row:hover .msg-hover-time {
      opacity: 1;
    }

    .msg-body {
      flex: 1;
      min-width: 0;
    }

    .msg-meta {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 3px;
    }

    .msg-author {
      font-weight: 700;
      font-size: 14.5px;
      color: var(--text-header);
    }

    .bot-badge {
      background: var(--accent);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      letter-spacing: 0.3px;
      vertical-align: middle;
    }

    .msg-time {
      font-size: 12px;
      color: var(--text-muted);
    }

    .msg-content {
      color: var(--text-normal);
      font-size: 14.5px;
      line-height: 1.5;
      word-break: break-word;
    }

    /* Markdown Styling */
    .inline-code {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      padding: 2px 5px;
      border-radius: 4px;
      font-family: var(--font-code);
      font-size: 13px;
      color: #e2e8f0;
    }

    .code-block {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 14px;
      margin: 8px 0;
      overflow-x: auto;
      font-family: var(--font-code);
      font-size: 13px;
      color: #e2e8f0;
    }

    .discord-mention {
      background: rgba(88, 101, 242, 0.2);
      color: #c7d2fe;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 600;
      font-size: 13.5px;
    }

    .discord-mention.channel {
      background: rgba(148, 155, 164, 0.15);
      color: #cbd5e1;
    }

    .discord-mention.role {
      background: rgba(240, 178, 50, 0.18);
      color: #fde047;
    }

    /* Attachments */
    .msg-attachments {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .attachment-img {
      max-width: 420px;
      max-height: 320px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      display: block;
      transition: transform 0.2s ease;
    }

    .attachment-img:hover {
      transform: scale(1.01);
    }

    .attachment-file-pill {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      padding: 8px 14px;
      border-radius: 8px;
      color: #60a5fa;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .attachment-file-pill:hover {
      text-decoration: underline;
    }

    /* Footer */
    .transcript-footer {
      text-align: center;
      padding: 24px;
      color: var(--text-muted);
      font-size: 12px;
      border-top: 1px solid var(--border-color);
      margin-top: 40px;
      background: var(--bg-tertiary);
    }

    @media (max-width: 768px) {
      .top-header, .meta-container, .chat-container {
        padding-left: 16px;
        padding-right: 16px;
      }
      .msg-row {
        padding-left: 12px;
        padding-right: 12px;
      }
    }
  </style>
</head>
<body>
  <header class="top-header">
    <div class="header-content">
      <div class="guild-info">
        <img src="${guildIcon}" alt="${guildName}" class="guild-icon" onerror="this.src='/adam_corp_logo.jpg'" />
        <div class="guild-title">
          <h1>${ticketName} <span class="ticket-badge">🔒 Closed</span></h1>
          <p>${guildName} • Official Ticket Archive</p>
        </div>
      </div>
      <div>
        <span class="ticket-badge" style="background: rgba(240,178,50,0.15); border-color: rgba(240,178,50,0.3); color: #facc15;">
          ${ticketTopic}
        </span>
      </div>
    </div>
  </header>

  <div class="meta-container">
    <div class="meta-cards-grid">
      <div class="meta-card">
        <div class="meta-card-label">👤 Opened By</div>
        <div class="meta-card-value">${authorTag}</div>
      </div>
      <div class="meta-card">
        <div class="meta-card-label">🔒 Closed By</div>
        <div class="meta-card-value">${escapeHtml(closedBy)}</div>
      </div>
      <div class="meta-card">
        <div class="meta-card-label">📅 Date Created</div>
        <div class="meta-card-value">${openTime}</div>
      </div>
      <div class="meta-card">
        <div class="meta-card-label">🏁 Date Resolved</div>
        <div class="meta-card-value">${resolvedTime}</div>
      </div>
      <div class="meta-card">
        <div class="meta-card-label">💬 Total Messages</div>
        <div class="meta-card-value">${messages.length}</div>
      </div>
      ${stars ? `
      <div class="meta-card" style="border-color: rgba(250, 204, 21, 0.4);">
        <div class="meta-card-label">⭐ Rating & Review</div>
        <div class="meta-card-value" style="color: #facc15;">${stars}</div>
        ${feedback ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-style: italic;">"${feedback}"</div>` : ''}
      </div>` : ''}
    </div>

    ${intakeHtml}
  </div>

  <main class="chat-container">
    <div class="chat-box">
      ${messages.length > 0 ? messagesHtml : '<div style="text-align:center; padding: 40px; color: var(--text-muted);">No messages logged in this ticket.</div>'}
    </div>
  </main>

  <footer class="transcript-footer">
    <p>Generated by <strong>Ticket King Bot</strong> for <strong>${guildName}</strong></p>
    <p style="margin-top: 4px; opacity: 0.7;">Secure Transcript Archival System • ${new Date().getFullYear()}</p>
  </footer>
</body>
</html>`;
}
