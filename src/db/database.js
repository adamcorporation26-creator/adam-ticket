import { 
  isSupabaseConfigured,
  fetchPanelsFromSupabase,
  upsertPanelToSupabase,
  fetchTicketsFromSupabase,
  upsertTicketToSupabase,
  upsertAllTicketsToSupabase,
  fetchSettingsFromSupabase,
  upsertSettingToSupabase,
  fetchAuditLogsFromSupabase,
  upsertAuditLogToSupabase
} from './supabase.js';

class SupabaseDatabase {
  constructor(initialData = {}, collectionType = null) {
    this.data = initialData;
    this.collectionType = collectionType; // 'panels' | 'tickets' | 'settings' | 'audit_logs'
  }

  get(key, defaultValue = null) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  set(key, value) {
    this.data[key] = value;

    // Asynchronously persist to Supabase in the background
    if (isSupabaseConfigured()) {
      if (this.collectionType === 'panels') {
        upsertPanelToSupabase(key, value).catch(e => console.error('[Supabase Sync Panel Error]', e));
      } else if (this.collectionType === 'tickets' && key === 'tickets') {
        upsertAllTicketsToSupabase(value).catch(e => console.error('[Supabase Sync Tickets Error]', e));
      } else if (this.collectionType === 'settings') {
        upsertSettingToSupabase(key, value).catch(e => console.error('[Supabase Sync Setting Error]', e));
      } else if (this.collectionType === 'audit_logs' && key === 'logs') {
        if (Array.isArray(value) && value.length > 0) {
          upsertAuditLogToSupabase(value[0]).catch(e => console.error('[Supabase Sync Log Error]', e));
        }
      }
    }

    return value;
  }

  // Efficient single-ticket operations to avoid bulk-upserting all tickets on every event
  addTicket(ticket) {
    if (!ticket || !ticket.id) return ticket;
    if (!Array.isArray(this.data.tickets)) {
      this.data.tickets = [];
    }
    const idx = this.data.tickets.findIndex(t => t.id === ticket.id);
    if (idx !== -1) {
      this.data.tickets[idx] = ticket;
    } else {
      this.data.tickets.push(ticket);
    }

    if (isSupabaseConfigured()) {
      upsertTicketToSupabase(ticket).catch(e => console.error(`[Supabase Ticket Add Error ${ticket.id}]`, e));
    }
    return ticket;
  }

  updateTicket(ticket) {
    if (!ticket || !ticket.id) return ticket;
    if (!Array.isArray(this.data.tickets)) {
      this.data.tickets = [];
    }
    const idx = this.data.tickets.findIndex(t => t.id === ticket.id || (ticket.channelId && t.channelId === ticket.channelId));
    if (idx !== -1) {
      this.data.tickets[idx] = { ...this.data.tickets[idx], ...ticket };
      ticket = this.data.tickets[idx];
    } else {
      this.data.tickets.push(ticket);
    }

    if (isSupabaseConfigured()) {
      upsertTicketToSupabase(ticket).catch(e => console.error(`[Supabase Ticket Update Error ${ticket.id}]`, e));
    }
    return ticket;
  }

  // Directly log an audit entry
  addAuditLog(action, details, user = 'System') {
    const logItem = {
      id: Date.now(),
      action,
      details,
      user,
      timestamp: new Date().toISOString()
    };
    if (!Array.isArray(this.data.logs)) {
      this.data.logs = [];
    }
    this.data.logs = [logItem, ...this.data.logs.slice(0, 49)];

    if (isSupabaseConfigured()) {
      upsertAuditLogToSupabase(logItem).catch(e => console.error('[Supabase Log Add Error]', e));
    }
    return logItem;
  }

  all() {
    return this.data;
  }

  // Called during startup to synchronize in-memory cache with Supabase
  syncData(newData) {
    if (newData && typeof newData === 'object') {
      this.data = newData;
    }
  }
}

// Initial fallback settings and sample panel
export const dbPanels = new SupabaseDatabase({
  'default-purchase-panel': {
    id: 'default-purchase-panel',
    name: 'Purchase Ticket Panel',
    channelType: 'text',
    category: '╰--- 𝐓𝐢𝐜𝐤𝐞𝐭𝐬',
    supportRoles: ['𝐒𝐭𝐚𝐟𝐟', '𝐌𝐚𝐧𝐚𝐠𝐞𝐫', '𝐅𝐨𝐮𝐧𝐝𝐞𝐫'],
    blockedRoles: [],
    customTicketName: 'buy-{USER_NAME}',
    openLogChannel: '#ticket-logs',
    closeLogChannel: '#ticket-logs',
    embed: {
      authorName: '𝐀𝐃𝐀𝐌 𝐂𝐎𝐑𝐏𝐎𝐑𝐀𝐓𝐈𝐎𝐍 𝐓𝐢𝐜𝐤𝐞𝐭𝐬',
      authorUrl: '',
      authorIconUrl: '',
      title: '',
      titleUrl: '',
      description: '<:140268information:1559615872409272419> Rules\n• Tickets Are For **Purchases** Only.\n• Any Other Requests = **Instant Ban**.\n• Stay **Respectful** Or Risk **Removal**.\n',
      color: '#ff0037',
      thumbnailUrl: '',
      imageUrl: 'https://cdn.discordapp.com/attachments/1469382427985186829/1560177770300973136/image.png',
      footerIconUrl: '',
      footerText: ''
    },
    welcomeMessage: {
      content: 'Welcome {USER}. You can continue your purchase in 🛒 {GUILD_NAME} here.\n\nWait for a moment our Staffs will help you!',
      embedTitle: 'Ticket Created!',
      embedDescription: 'Please describe your request in detail. Staff will respond shortly.',
      color: '#e11d48'
    },
    buttons: [
      {
        id: 'buy_btn',
        label: 'Buy',
        style: 'Danger',
        emoji: '🛒',
        customId: 'ticket_create_buy'
      }
    ],
    permissions: {
      addReactions: true,
      attachFiles: true,
      embedLinks: false,
      sendVoiceMessages: true,
      useExternalEmojis: true,
      useExternalStickers: true,
      useAppCommands: false
    }
  }
}, 'panels');

export const dbTickets = new SupabaseDatabase({
  'tickets': []
}, 'tickets');

export const dbSettings = new SupabaseDatabase({
  guildName: 'ADAM CORPORATION',
  memberCount: 579,
  channelsCount: 118,
  rolesCount: 39,
  botsCount: 13,
  emojisCount: 16,
  stickersCount: 4,
  supportRoles: ['Founder', 'Staff', 'Manager'],
  blockedRoles: [],
  defaultCategory: 'Purchase',
  logChannel: '#ticket-logs'
}, 'settings');

export const dbAuditLogs = new SupabaseDatabase({
  logs: []
}, 'audit_logs');

// ============================================================================
// DATABASE INITIALIZATION & SUPABASE SYNC
// ============================================================================
export async function initDatabase() {
  if (!isSupabaseConfigured()) {
    console.log('[Database] ⚠️ Supabase not configured in .env - running on in-memory storage.');
    return;
  }

  console.log('[Database] 🔄 Loading all data from Supabase...');
  try {
    // 1. Fetch Panels from Supabase
    const remotePanels = await fetchPanelsFromSupabase();
    if (remotePanels && Object.keys(remotePanels).length > 0) {
      dbPanels.syncData(remotePanels);
      console.log(`[Database]  ✓ Loaded ${Object.keys(remotePanels).length} panel(s) from Supabase.`);
    }

    // 2. Fetch Tickets from Supabase
    const remoteTickets = await fetchTicketsFromSupabase();
    if (remoteTickets && remoteTickets.length > 0) {
      dbTickets.syncData({ tickets: remoteTickets });
      console.log(`[Database]  ✓ Loaded ${remoteTickets.length} ticket(s) from Supabase.`);
    }

    // 3. Fetch Settings from Supabase
    const remoteSettings = await fetchSettingsFromSupabase();
    if (remoteSettings && Object.keys(remoteSettings).length > 0) {
      dbSettings.syncData(remoteSettings);
      console.log(`[Database]  ✓ Loaded settings from Supabase.`);
    }

    // 4. Fetch Audit Logs from Supabase
    const remoteLogs = await fetchAuditLogsFromSupabase();
    if (remoteLogs && remoteLogs.length > 0) {
      dbAuditLogs.syncData({ logs: remoteLogs });
      console.log(`[Database]  ✓ Loaded ${remoteLogs.length} audit log(s) from Supabase.`);
    }

    console.log('[Database] 🚀 Supabase fully loaded and ready!');
  } catch (err) {
    console.error('[Database] ⚠️ Supabase load warning:', err.message);
  }
}
