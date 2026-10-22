import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { dbPanels, dbTickets, dbSettings, dbAuditLogs } from '../db/database.js';
import { getBotClient, deployPanelEmbed } from '../bot/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // --- API ROUTES ---

  // Bot Status
  app.get('/api/bot/status', (req, res) => {
    const client = getBotClient();
    if (!client || !client.user) {
      return res.json({
        online: false,
        username: null,
        ping: 0,
        guildsCount: 0
      });
    }
    return res.json({
      online: true,
      username: client.user.tag,
      avatar: client.user.displayAvatarURL(),
      ping: client.ws.ping,
      guildsCount: client.guilds.cache.size
    });
  });

  // Overview / Analytics Stats (Image 5 replica data)
  app.get('/api/stats', (req, res) => {
    const tickets = dbTickets.get('tickets', []);
    const settings = dbSettings.all();
    const client = getBotClient();
    const guildId = req.query.guildId;
    const guild = (guildId && client?.guilds?.cache?.has(guildId))
      ? client.guilds.cache.get(guildId)
      : client?.guilds?.cache?.first();

    const openCount = tickets.filter(t => t.status === 'open').length;
    const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
    const closedCount = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
    const totalCount = tickets.length;

    const realEmojisCount = guild ? guild.emojis.cache.size : (settings.emojisCount || 21);

    // Channel types: 4 = Category, 0 = Text, 2 = Voice
    const categoriesCount = guild ? guild.channels.cache.filter(c => c.type === 4).size : 6;
    const textChannelsCount = guild ? guild.channels.cache.filter(c => c.isTextBased() && c.type !== 4).size : 28;
    const voiceChannelsCount = guild ? guild.channels.cache.filter(c => c.type === 2).size : 5;
    const totalChannelsCount = guild ? guild.channels.cache.size : (settings.channelsCount || 39);

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
      id: 'default',
      name: 'ADAM CORPORATION',
      iconUrl: '/adam_corp_logo.jpg',
      memberCount: 579,
      categoriesCount,
      textChannelsCount,
      voiceChannelsCount,
      channelsCount: totalChannelsCount
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

  app.post('/api/panels/:id', (req, res) => {
    const { id } = req.params;
    const panelData = req.body;
    dbPanels.set(id, panelData);

    dbAuditLogs.set('logs', [
      {
        id: Date.now(),
        action: 'PANEL_SAVED',
        details: `Saved panel ${panelData.name || id}`,
        user: 'Dashboard User',
        timestamp: new Date().toISOString()
      },
      ...dbAuditLogs.get('logs', []).slice(0, 49)
    ]);

    broadcast('panel_updated', { id, panel: panelData });
    res.json({ success: true, panel: panelData });
  });

  // Deploy Panel to Discord Channel
  app.post('/api/panels/:id/deploy', async (req, res) => {
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

      dbAuditLogs.set('logs', [
        {
          id: Date.now(),
          action: 'PANEL_DEPLOY',
          details: `Deployed panel "${panel.name || id}" to channel ID ${channelId}`,
          user: 'Dashboard User',
          timestamp: new Date().toISOString()
        },
        ...dbAuditLogs.get('logs', []).slice(0, 49)
      ]);

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

  app.post('/api/tickets/:id/close', async (req, res) => {
    const tickets = dbTickets.get('tickets', []);
    const index = tickets.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Ticket not found' });

    tickets[index].status = 'resolved';
    tickets[index].resolvedTime = new Date().toISOString();
    dbTickets.set('tickets', tickets);

    broadcast('ticket_updated', tickets[index]);
    res.json({ success: true, ticket: tickets[index] });
  });

  // Server & Discord Settings
  app.get('/api/settings', (req, res) => {
    const baseSettings = dbSettings.all();
    const client = getBotClient();

    if (client && client.isReady()) {
      const guild = client.guilds.cache.first();
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
    }

    res.json({
      ...baseSettings,
      guildName: baseSettings.guildName || 'ADAM CORPORATION',
      memberCount: baseSettings.memberCount || 579,
      iconUrl: '/adam_corp_logo.jpg'
    });
  });

  app.post('/api/settings', (req, res) => {
    const newSettings = req.body;
    for (const [key, val] of Object.entries(newSettings)) {
      dbSettings.set(key, val);
    }
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

  app.get('/api/discord/categories', (req, res) => {
    const client = getBotClient();
    const guildId = req.query.guildId;
    if (!client || !client.isReady()) {
      return res.json([
        { id: 'cat-1', name: 'Purchase' },
        { id: 'cat-2', name: 'Tickets' },
        { id: 'cat-3', name: 'Support' }
      ]);
    }
    const guild = (guildId && client.guilds.cache.has(guildId)) 
      ? client.guilds.cache.get(guildId) 
      : client.guilds.cache.first();

    if (!guild) return res.json([]);
    const categories = guild.channels.cache
      .filter(c => c.type === 4)
      .map(c => ({ id: c.id, name: c.name }));
    res.json(categories);
  });

  app.get('/api/discord/channels', (req, res) => {
    const client = getBotClient();
    const guildId = req.query.guildId;
    if (!client || !client.isReady()) {
      return res.json([
        { id: '123456789', name: 'general', type: 'text' },
        { id: '987654321', name: 'ticket-logs', type: 'text' },
        { id: '555555555', name: 'purchase-here', type: 'text' }
      ]);
    }
    const guild = (guildId && client.guilds.cache.has(guildId)) 
      ? client.guilds.cache.get(guildId) 
      : client.guilds.cache.first();

    if (!guild) return res.json([]);
    const channels = guild.channels.cache
      .filter(c => c.isTextBased())
      .map(c => ({ id: c.id, name: c.name, type: c.type === 0 ? 'text' : 'other' }));
    res.json(channels);
  });

  app.get('/api/discord/roles', (req, res) => {
    const client = getBotClient();
    const guildId = req.query.guildId;
    if (!client || !client.isReady()) {
      return res.json([
        { id: '1', name: 'Founder' },
        { id: '2', name: 'Staff' },
        { id: '3', name: 'Manager' },
        { id: '4', name: 'Support' }
      ]);
    }
    const guild = (guildId && client.guilds.cache.has(guildId)) 
      ? client.guilds.cache.get(guildId) 
      : client.guilds.cache.first();

    if (!guild) return res.json([]);
    const roles = guild.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
    res.json(roles);
  });

  app.get('/api/discord/emojis', (req, res) => {
    const client = getBotClient();
    const guildId = req.query.guildId;
    if (!client || !client.isReady()) {
      return res.json([]);
    }
    const guild = (guildId && client.guilds.cache.has(guildId)) 
      ? client.guilds.cache.get(guildId) 
      : client.guilds.cache.first();

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

  // Serve client static files
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });

  server.listen(port, () => {
    console.log(`[API Server] Running at http://localhost:${port}`);
  });

  return { server, broadcast };
}
