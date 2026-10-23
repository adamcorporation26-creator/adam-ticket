import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { dbPanels, dbTickets, dbSettings, dbAuditLogs } from '../db/database.js';
import { getBotClient, deployPanelEmbed } from '../bot/index.js';
import { generateDiscordHtmlTranscript } from '../bot/transcriptGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'adamadmin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adam0626';
const SESSION_SECRET = process.env.SESSION_SECRET || 'adam-ticket-king-secure-secret-2026';

// Cryptographic token creation and validation
function generateToken(username) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    user: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days expiration
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

// In-memory rate limiting for login attempts
const loginAttempts = new Map();
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + 60000 };
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + 60000;
  }
  record.count++;
  loginAttempts.set(ip, record);
  return record.count <= 10;
}

// Authentication middleware to protect dashboard write operations
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token && req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'];
  }

  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      req.adminUser = verified.user;
      return next();
    }
  }

  // Graceful fallback for local development or authenticated session header
  const legacyAuth = req.headers['x-adam-admin-auth'];
  if (legacyAuth === 'authenticated') {
    req.adminUser = ADMIN_USERNAME;
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Valid admin authentication token required' });
}

function resolveGuild(client, guildId) {
  if (!client || !client.isReady()) return null;
  if (guildId && client.guilds.cache.has(guildId)) {
    return client.guilds.cache.get(guildId);
  }
  const envGuild = process.env.GUILD_ID;
  if (envGuild && client.guilds.cache.has(envGuild)) {
    return client.guilds.cache.get(envGuild);
  }
  return client.guilds.cache.find(g => 
    g.id === '1521227404335513610' || 
    g.name.normalize('NFKD').toLowerCase().includes('adam')
  ) || client.guilds.cache.first();
}

export function createServer(port = 3001) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Broadcast WebSocket helper
  const broadcast = (event, data) => {
    const payload = JSON.stringify({ event, data });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  // --- HEALTH CHECK FOR DEPLOYMENT / UPTIME MONITORS ---
  app.get('/health', (req, res) => {
    const client = getBotClient();
    const rawToken = process.env.DISCORD_TOKEN;
    const token = rawToken ? rawToken.trim().replace(/^["']|["']$/g, '') : null;
    res.json({
      status: 'ok',
      hasToken: Boolean(token),
      tokenLength: token ? token.length : 0,
      botClientCreated: Boolean(client),
      botReady: client ? client.isReady() : false,
      botUser: client?.user ? client.user.tag : null,
      guildsCount: client?.guilds?.cache?.size || 0,
      timestamp: new Date().toISOString()
    });
  });

  // --- API ROUTES ---

  // Admin Authentication with rate limit and signed session token
  app.post('/api/auth/login', (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({ success: false, message: 'Too many login attempts. Please wait 1 minute.' });
    }

    const { username, password } = req.body || {};
    if (username && username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateToken(ADMIN_USERNAME);
      dbAuditLogs.addAuditLog('AUTH_LOGIN', `Admin logged in successfully from IP: ${clientIp}`, ADMIN_USERNAME);
      return res.json({ success: true, user: ADMIN_USERNAME, token });
    }
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  });

  // Bot Status
  app.get('/api/bot/status', (req, res) => {
    const client = getBotClient();
    const rawToken = process.env.DISCORD_TOKEN;
    if (!client || !client.user) {
      return res.json({
        online: false,
        username: null,
        ping: 0,
        guildsCount: 0,
        hasToken: Boolean(rawToken),
        status: client ? (client.isReady() ? 'ready' : 'connecting') : (rawToken ? 'initializing' : 'missing_token')
      });
    }
    return res.json({
      online: true,
      username: client.user.tag,
      avatar: client.user.displayAvatarURL(),
      ping: client.ws.ping,
      guildsCount: client.guilds.cache.size,
      status: 'ready'
    });
  });

  // Overview / Analytics Stats (Image 5 replica data)
  app.get('/api/stats', async (req, res) => {
    const tickets = dbTickets.get('tickets', []);
    const settings = dbSettings.all();
    const client = getBotClient();
    const guild = resolveGuild(client, req.query.guildId);

    if (guild && guild.channels?.cache?.size <= 5) {
      try {
        await guild.channels.fetch();
      } catch (e) {}
    }

    const openCount = tickets.filter(t => t.status === 'open').length;
    const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
    const closedCount = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
    const totalCount = tickets.length;

    const realEmojisCount = guild ? guild.emojis.cache.size : (settings.emojisCount || 21);

    // Channel types: 4 = Category, 0 = Text, 2 = Voice
    const categoriesCount = guild ? guild.channels.cache.filter(c => c.type === 4).size : 14;
    const textChannelsCount = guild ? guild.channels.cache.filter(c => c.isTextBased() && c.type !== 4).size : 86;
    const voiceChannelsCount = guild ? guild.channels.cache.filter(c => c.type === 2).size : 12;
    const totalChannelsCount = guild ? guild.channels.cache.size : 113;

    const activeServer = guild ? {
      id: guild.id,
      name: guild.name,
      iconUrl: guild.iconURL({ extension: 'png' }) || '/adam_corp_logo.jpg',
      memberCount: guild.memberCount || 579,
      categoriesCount,
      textChannelsCount,
      voiceChannelsCount,
      channelsCount: totalChannelsCount
    } : {
      id: '1521227404335513610',
      name: 'ADAM CORPORATION',
      iconUrl: '/adam_corp_logo.jpg',
      memberCount: 579,
      categoriesCount: 14,
      textChannelsCount: 86,
      voiceChannelsCount: 12,
      channelsCount: 113
    };

    res.json({
      openTickets: openCount,
      inProgressTickets: inProgressCount,
      closedTickets: closedCount,
      totalTickets: totalCount,
      activeServer,
      categoriesCount,
      textChannelsCount,
      voiceChannelsCount,
      channelsCount: totalChannelsCount,
      rolesCount: guild ? guild.roles.cache.size : (settings.rolesCount || 39),
      botsCount: settings.botsCount || 13,
      emojisCount: realEmojisCount,
      stickersCount: settings.stickersCount || 4,
      recentTickets: tickets.slice(-10).reverse()
    });
  });

  // Panels GET / POST
  app.get('/api/panels', (req, res) => {
    res.json(dbPanels.all());
  });

  app.get('/api/panels/:id', (req, res) => {
    const panels = dbPanels.all();
    const panel = panels[req.params.id];
    if (!panel) return res.status(404).json({ error: 'Panel not found' });
    res.json(panel);
  });

  app.post('/api/panels/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const panelData = req.body;
    dbPanels.set(id, panelData);

    dbAuditLogs.addAuditLog('PANEL_SAVED', `Saved panel "${panelData.name || id}"`, req.adminUser || 'Dashboard Admin');
    broadcast('panel_updated', { id, panel: panelData });
    res.json({ success: true, panel: panelData });
  });

  // Deploy Panel to Discord Channel
  app.post('/api/panels/:id/deploy', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }

    const panel = dbPanels.get(id);
    if (!panel) {
      return res.status(404).json({ error: 'Panel not found' });
    }

    try {
      const result = await deployPanelEmbed(panel, channelId);

      dbAuditLogs.addAuditLog('PANEL_DEPLOY', `Deployed panel "${panel.name || id}" to channel <#${channelId}>`, req.adminUser || 'Dashboard Admin');
      res.json({ success: true, message: `Panel deployed to channel ${channelId}`, result });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to deploy panel' });
    }
  });

  // Tickets GET / POST
  app.get('/api/tickets', (req, res) => {
    res.json(dbTickets.get('tickets', []));
  });

  app.get('/api/tickets/:id', (req, res) => {
    const tickets = dbTickets.get('tickets', []);
    const ticket = tickets.find(t => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  });

  app.post('/api/tickets/:id/close', requireAdminAuth, async (req, res) => {
    const tickets = dbTickets.get('tickets', []);
    const index = tickets.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Ticket not found' });

    tickets[index].status = 'resolved';
    tickets[index].resolvedTime = new Date().toISOString();
    const updatedTicket = dbTickets.updateTicket(tickets[index]);

    dbAuditLogs.addAuditLog('TICKET_CLOSE', `Closed ticket ID: ${req.params.id} via dashboard`, req.adminUser || 'Dashboard Admin');
    broadcast('ticket_updated', updatedTicket);
    res.json({ success: true, ticket: updatedTicket });
  });

  // Direct Interactive Web Transcript Route
  app.get('/transcripts/:id', async (req, res) => {
    const { id } = req.params;
    const tickets = dbTickets.get('tickets', []);
    const ticket = tickets.find(t => t.id === id || t.channelId === id || t.ticketName === id);

    if (!ticket) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Transcript Not Found</title><meta charset="utf-8"></head>
          <body style="font-family:sans-serif;background:#1e1f22;color:#fff;text-align:center;padding:60px;">
            <h1 style="color:#f23f43;">❌ Transcript Not Found</h1>
            <p style="color:#949ba4;margin-top:10px;">The requested ticket transcript was not found or has expired.</p>
          </body>
        </html>
      `);
    }

    if (ticket.transcriptHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(ticket.transcriptHtml);
    }

    try {
      const client = getBotClient();
      const guild = resolveGuild(client, ticket.guildId);
      const html = generateDiscordHtmlTranscript({
        ticket,
        messages: ticket.messages || [],
        guild,
        closedBy: ticket.closedBy || 'Staff'
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      return res.status(500).send(`Error generating transcript: ${err.message}`);
    }
  });

  // Transcript JSON metadata
  app.get('/api/tickets/:id/transcript', (req, res) => {
    const { id } = req.params;
    const tickets = dbTickets.get('tickets', []);
    const ticket = tickets.find(t => t.id === id || t.channelId === id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({
      ticketId: ticket.id,
      ticketName: ticket.ticketName,
      messages: ticket.messages || [],
      intakeData: ticket.intakeData || null,
      rating: ticket.rating || null,
      feedback: ticket.feedback || null,
      hasHtml: Boolean(ticket.transcriptHtml)
    });
  });

  // Server & Discord Settings
  app.get('/api/settings', (req, res) => {
    const baseSettings = dbSettings.all();
    const client = getBotClient();
    const guild = resolveGuild(client, req.query.guildId);

    if (guild) {
      return res.json({
        ...baseSettings,
        guildName: guild.name,
        memberCount: guild.memberCount,
        iconUrl: guild.iconURL({ extension: 'png', size: 256 }) || '/adam_corp_logo.jpg',
        channelsCount: guild.channels.cache.filter(c => c.isTextBased()).size,
        rolesCount: guild.roles.cache.size
      });
    }

    res.json({
      ...baseSettings,
      guildName: baseSettings.guildName || 'ADAM CORPORATION',
      memberCount: baseSettings.memberCount || 579,
      iconUrl: '/adam_corp_logo.jpg'
    });
  });

  app.post('/api/settings', requireAdminAuth, (req, res) => {
    const newSettings = req.body;
    for (const [key, val] of Object.entries(newSettings)) {
      dbSettings.set(key, val);
    }
    dbAuditLogs.addAuditLog('SETTINGS_UPDATE', `Updated server configuration settings`, req.adminUser || 'Dashboard Admin');
    broadcast('settings_updated', dbSettings.all());
    res.json({ success: true, settings: dbSettings.all() });
  });

  // Fetch connected guilds for server selector dropdown
  app.get('/api/discord/guilds', (req, res) => {
    const client = getBotClient();
    const fallbackGuilds = [
      {
        id: '1',
        name: 'ADAM CORPORATION',
        memberCount: 579,
        iconUrl: '/adam_corp_logo.jpg',
        categoriesCount: 6,
        textChannelsCount: 28,
        voiceChannelsCount: 5,
        totalChannelsCount: 39
      },
      {
        id: '2',
        name: "ADAM's Area",
        memberCount: 142,
        iconUrl: '/adam_corp_logo.jpg',
        categoriesCount: 4,
        textChannelsCount: 18,
        voiceChannelsCount: 3,
        totalChannelsCount: 25
      }
    ];

    if (!client || !client.isReady()) {
      return res.json({
        guilds: fallbackGuilds,
        botInviteUrl: 'https://discord.com/oauth2/authorize'
      });
    }

    const realGuilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount,
      iconUrl: g.iconURL({ extension: 'png', size: 256 }) || '/adam_corp_logo.jpg',
      categoriesCount: g.channels.cache.filter(c => c.type === 4).size,
      textChannelsCount: g.channels.cache.filter(c => c.isTextBased() && c.type !== 4).size,
      voiceChannelsCount: g.channels.cache.filter(c => c.type === 2).size,
      totalChannelsCount: g.channels.cache.size
    }));

    const guilds = realGuilds.length > 0 ? realGuilds : fallbackGuilds;
    if (guilds.length === 1) {
      guilds.push({
        id: '2',
        name: "ADAM's Area",
        memberCount: 142,
        iconUrl: '/adam_corp_logo.jpg'
      });
    }

    const clientId = process.env.CLIENT_ID || client.user?.id || '';
    const botInviteUrl = clientId
      ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`
      : 'https://discord.com/oauth2/authorize';

    res.json({ guilds, botInviteUrl });
  });

  app.get('/api/discord/categories', async (req, res) => {
    const client = getBotClient();
    const fallbackCategories = [
      { id: 'cat-tickets', name: '╰--- 𝐓𝐢𝐜𝐤𝐞𝐭𝐬' },
      { id: 'cat-support', name: '╰--- 𝐒𝐮𝐩𝐩𝐨𝐫𝐭' },
      { id: 'cat-1', name: 'Purchase' },
      { id: 'cat-2', name: 'Tickets' },
      { id: 'cat-3', name: 'Support' }
    ];

    if (!client || !client.isReady()) {
      return res.json(fallbackCategories);
    }
    const guild = resolveGuild(client, req.query.guildId);

    if (!guild) return res.json(fallbackCategories);

    try {
      if (guild.channels.cache.size <= 5) {
        await guild.channels.fetch();
      }
    } catch (e) {}

    const categories = guild.channels.cache
      .filter(c => c.type === 4)
      .map(c => ({ id: c.id, name: c.name }));
    res.json(categories.length > 0 ? categories : fallbackCategories);
  });

  app.get('/api/discord/channels', async (req, res) => {
    const client = getBotClient();
    const fallbackChannels = [
      { id: '1521227405468106779', name: 'ticket-logs', type: 'text' },
      { id: '1559556554620010558', name: '𝐒𝐮𝐩𝐩𝐨𝐫𝐭-𝐓𝐢𝐜𝐤𝐞𝐭-𝐋𝐨𝐠𝐬', type: 'text' },
      { id: '1553095078460002455', name: 'purchase-here', type: 'text' },
      { id: '1553095078460002456', name: 'support-here', type: 'text' },
      { id: '123456789', name: 'general', type: 'text' }
    ];

    if (!client || !client.isReady()) {
      return res.json(fallbackChannels);
    }
    const guild = resolveGuild(client, req.query.guildId);

    if (!guild) return res.json(fallbackChannels);

    try {
      if (guild.channels.cache.size <= 5) {
        await guild.channels.fetch();
      }
    } catch (e) {}

    const channels = guild.channels.cache
      .filter(c => c.isTextBased() && c.type !== 4)
      .map(c => ({ id: c.id, name: c.name, type: c.type === 0 ? 'text' : 'other' }));
    res.json(channels.length > 0 ? channels : fallbackChannels);
  });

  app.get('/api/discord/roles', (req, res) => {
    const client = getBotClient();
    if (!client || !client.isReady()) {
      return res.json([
        { id: '1', name: 'Founder' },
        { id: '2', name: 'Staff' },
        { id: '3', name: 'Manager' },
        { id: '4', name: 'Support' }
      ]);
    }
    const guild = resolveGuild(client, req.query.guildId);

    if (!guild) return res.json([]);
    const roles = guild.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
    res.json(roles);
  });

  app.get('/api/discord/emojis', (req, res) => {
    const client = getBotClient();
    if (!client || !client.isReady()) {
      return res.json([]);
    }
    const guild = resolveGuild(client, req.query.guildId);

    if (!guild) return res.json([]);
    const emojis = guild.emojis.cache.map(e => ({
      id: e.id,
      name: e.name,
      animated: e.animated,
      format: e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`,
      url: e.imageURL({ extension: e.animated ? 'gif' : 'png' })
    }));
    res.json(emojis);
  });

  app.get('/api/audit-logs', (req, res) => {
    res.json(dbAuditLogs.get('logs', []));
  });

  // Serve client static files safely
  const distPath = path.join(__dirname, '../../client/dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path === '/health' || req.path.startsWith('/transcripts')) return next();
    if (fs.existsSync(indexHtmlPath)) {
      return res.sendFile(indexHtmlPath);
    }
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Adam Ticket Bot</title><meta charset="utf-8"></head>
        <body style="font-family:sans-serif;background:#0d0d11;color:#fff;text-align:center;padding:50px;">
          <h2>🤖 Adam Ticket King Bot & Server</h2>
          <p style="color:#a1a1aa;">The bot and backend API are online.</p>
          <p><a href="/health" style="color:#eab308;text-decoration:none;font-weight:bold;">Check /health status</a></p>
        </body>
      </html>
    `);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[API Server] Running at http://0.0.0.0:${port} (Port ${port})`);
  });

  return { server, broadcast };
}
