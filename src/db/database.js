import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonDatabase {
  constructor(filename, initialData = {}) {
    this.filepath = path.join(DATA_DIR, filename);
    this.data = initialData;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const raw = fs.readFileSync(this.filepath, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error(`Error loading database file ${this.filepath}:`, err);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error(`Error saving database file ${this.filepath}:`, err);
    }
  }

  get(key, defaultValue = null) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
    return value;
  }

  all() {
    return this.data;
  }
}

// Initial default settings and sample panel based on Ticket King / Adam Corporation images
export const dbPanels = new JsonDatabase('panels.json', {
  'default-purchase-panel': {
    id: 'default-purchase-panel',
    name: 'Purchase Ticket Panel',
    channelType: 'text', // 'text' or 'thread'
    category: 'Purchase',
    supportRoles: ['Founder', 'Staff', 'Manager'],
    blockedRoles: [],
    customTicketName: 'buy-{USER_NAME}',
    openLogChannel: '#ticket-logs',
    closeLogChannel: '#ticket-logs',
    embed: {
      authorName: 'ADAM CORPORATION',
      authorUrl: '',
      authorIconUrl: '',
      title: 'ADAM CORPORATION STORE',
      titleUrl: '',
      description: 'Welcome to the **ADAM CORPORATION** Store.\n\nExperience the power of **ADAM CORPORATION**. Secure your access now and dominate the competition.\n\n🛒 **How to Purchase**\n\n• Click Buy below to open a purchase ticket. Our team will guide you through the secure payment process.\n\n• Rules\n• Tickets are for purchases and pre-sale inquiries only.\n• Time-wasters may be banned without warning.\n• Respect our staff and community guidelines.\n\n**ADAM CORPORATION • Safe • Trusted • Premium**',
      color: '#e11d48', // Red accent
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
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
        style: 'Primary', // Primary, Secondary, Success, Danger
        emoji: '🛒',
        customId: 'ticket_create_buy'
      }
    ]
  }
});

export const dbTickets = new JsonDatabase('tickets.json', {
  'tickets': [
    {
      id: 'ticket-101',
      ticketNumber: 101,
      ticketName: 'buy-abinayaxsuriya',
      topic: 'Buy',
      status: 'resolved', // 'open', 'in_progress', 'resolved', 'closed'
      channelId: '12345678901',
      guildId: '99999999999',
      authorId: '1540639959470313532',
      authorTag: 'SURIYA#0001',
      authorAvatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
      openTime: new Date(Date.now() - 3600000 * 48).toISOString(),
      resolvedTime: new Date(Date.now() - 3600000 * 47).toISOString(),
      panelId: 'default-purchase-panel',
      messages: [
        { author: 'System', content: 'Ticket created by SURIYA#0001', timestamp: new Date(Date.now() - 3600000 * 48).toISOString() },
        { author: 'SURIYA#0001', content: 'Hi, I would like to buy access.', timestamp: new Date(Date.now() - 3600000 * 47.9).toISOString() },
        { author: 'Staff', content: 'Hello! Process completed. Closing ticket.', timestamp: new Date(Date.now() - 3600000 * 47).toISOString() }
      ]
    },
    {
      id: 'ticket-102',
      ticketNumber: 102,
      ticketName: 'buy-alex',
      topic: 'Buy',
      status: 'open',
      channelId: '12345678902',
      guildId: '99999999999',
      authorId: '1540639959470313533',
      authorTag: 'AlexDev#1234',
      authorAvatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
      openTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      resolvedTime: null,
      panelId: 'default-purchase-panel',
      messages: [
        { author: 'System', content: 'Ticket created by AlexDev#1234', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
        { author: 'AlexDev#1234', content: 'Need assistance with purchase options.', timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString() }
      ]
    }
  ]
});

export const dbSettings = new JsonDatabase('settings.json', {
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
});

export const dbAuditLogs = new JsonDatabase('audit_logs.json', {
  logs: [
    { id: 1, action: 'PANEL_UPDATE', details: 'Updated Purchase Ticket Panel embed text', user: 'Admin', timestamp: new Date().toISOString() },
    { id: 2, action: 'TICKET_CREATE', details: 'Ticket buy-alex created by AlexDev#1234', user: 'AlexDev#1234', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
  ]
});
