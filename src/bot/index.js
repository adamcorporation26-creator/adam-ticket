import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  Events,
  MessageFlags,
  PermissionFlagsBits
} from 'discord.js';
import dotenv from 'dotenv';
import { dbPanels } from '../db/database.js';
import { 
  handleTicketButtonInteraction, 
  handleTicketSelectMenuInteraction,
  handleTicketControlButtons, 
  handleTicketRatingInteraction, 
  handleTicketSlashCommand,
  rearrangeGuildTickets 
} from './ticketHandler.js';

dotenv.config();

let clientInstance = null;
let wsBroadcastFn = null;

export function getBotClient() {
  return clientInstance;
}

export async function initBot(broadcastWs) {
  wsBroadcastFn = broadcastWs;
  const rawToken = process.env.DISCORD_TOKEN;
  const token = rawToken ? rawToken.trim().replace(/^["']|["']$/g, '') : null;

  console.log('[Discord Bot] 🔄 Initializing Discord Bot...');
  console.log(`[Discord Bot] 🔑 DISCORD_TOKEN is present: ${Boolean(token)} (length: ${token ? token.length : 0})`);

  if (!token) {
    console.error('[Discord Bot] ❌ DISCORD_TOKEN is missing or empty in environment variables! Please configure DISCORD_TOKEN in Render Environment.');
    return null;
  }

  // Use standard non-privileged intents so the bot connects immediately without requiring privileged intent whitelisting
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ]
  });

  clientInstance = client;

  // Debug logger to expose Cloudflare 429s, websocket state, or gateway handshake delays
  client.on('debug', (msg) => {
    if (msg.includes('Hit a 429') || msg.includes('429') || msg.includes('heartbeat') || msg.includes('token') || msg.includes('Ready') || msg.includes('Session') || msg.includes('Connecting') || msg.includes('Identif') || msg.includes('Shard')) {
      console.log('[Discord Bot Debug]', msg);
    }
  });

  // Error listeners to prevent unhandled EventEmitter error crashes
  client.on('error', (err) => {
    console.error('[Discord Bot Client Error]', err);
  });

  client.on('warn', (warning) => {
    console.warn('[Discord Bot Client Warning]', warning);
  });

  client.on('shardDisconnect', (event, id) => {
    console.warn(`[Discord Bot] Shard ${id} disconnected (${event.code}). Gateway will attempt reconnect.`);
  });

  client.on('shardReconnecting', (id) => {
    console.log(`[Discord Bot] Shard ${id} reconnecting to Discord Gateway...`);
  });

  // ClientReady replaces deprecated ready event in discord.js v14/v15
  client.once(Events.ClientReady, async () => {
    console.log(`[Discord Bot] ✅ Logged in successfully as ${client.user.tag}`);
    try {
      for (const [id, g] of client.guilds.cache) {
        try {
          await g.fetch().catch(() => {});
        } catch (e) {}
      }
      await registerSlashCommands(client);
    } catch (readyErr) {
      console.error('[Discord Bot] Error during ready cache/command registration:', readyErr.message);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'panel') {
          const ownerId = process.env.OWNER_ID;
          const isOwner = (ownerId && interaction.user.id === ownerId) || 
                          interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
                          interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

          if (!isOwner) {
            return interaction.reply({
              content: `🚫 **Access Denied**: You need Administrator or Server Management permissions to deploy panels.`,
              flags: MessageFlags.Ephemeral
            }).catch(() => {});
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

          const channel = interaction.options.getChannel('target_channel') || interaction.channel;
          const panelData = dbPanels.get('default-purchase-panel') || Object.values(dbPanels.all())[0];
          if (!panelData) {
            return interaction.editReply({
              content: '❌ Panel configuration not found.'
            }).catch(() => {});
          }

          await deployPanelEmbed(panelData, channel.id);
          await interaction.editReply({
            content: `✅ Panel deployed to <#${channel.id}>!`
          }).catch(() => {});
        } else if (interaction.commandName === 'ticket') {
          await handleTicketSlashCommand(interaction, wsBroadcastFn);
        }
      } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_create_')) {
          await handleTicketButtonInteraction(interaction, wsBroadcastFn);
        } else if (interaction.customId.startsWith('ticket_close_') || interaction.customId.startsWith('ticket_claim_')) {
          await handleTicketControlButtons(interaction, wsBroadcastFn);
        } else if (interaction.customId.startsWith('ticket_rate_')) {
          await handleTicketRatingInteraction(interaction, wsBroadcastFn);
        }
      } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('ticket_select_menu_')) {
          await handleTicketSelectMenuInteraction(interaction, wsBroadcastFn);
        }
      } else if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('ticket_feedback_modal_')) {
          await handleTicketRatingInteraction(interaction, wsBroadcastFn);
        }
      }
    } catch (err) {
      console.error('[Discord Bot] Error processing interaction:', err);
      // If error is Unknown interaction (10062) or Already acknowledged (40060), don't attempt secondary response
      if (err.code === 10062 || err.code === 40060) return;
      try {
        if (interaction.isRepliable()) {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: '❌ An error occurred processing this action.' }).catch(() => {});
          } else {
            await interaction.reply({ content: '❌ An error occurred processing this action.', flags: MessageFlags.Ephemeral }).catch(() => {});
          }
        }
      } catch (replyErr) {
        // Suppress secondary reply failure
      }
    }
  });

  // Real-time message streaming into database and WebSocket for stability and live sync
  client.on(Events.MessageCreate, async (message) => {
    try {
      if (!message.guild || (message.author.bot && message.author.id !== client.user.id)) return;
      
      const { dbTickets } = await import('../db/database.js');
      const tickets = dbTickets.get('tickets', []);
      const ticket = tickets.find(t => t.channelId === message.channel.id && (t.status === 'open' || t.status === 'in_progress'));
      if (!ticket) return;

      const attachments = message.attachments ? Array.from(message.attachments.values()).map(a => ({ name: a.name, url: a.url })) : [];
      const msgItem = {
        id: message.id,
        author: message.author.tag,
        authorAvatar: message.author.displayAvatarURL(),
        content: message.cleanContent || message.content || '',
        attachments,
        timestamp: new Date(message.createdTimestamp).toISOString()
      };

      if (!Array.isArray(ticket.messages)) {
        ticket.messages = [];
      }

      if (!ticket.messages.some(m => m.id === message.id)) {
        ticket.messages.push(msgItem);
        dbTickets.updateTicket(ticket);

        if (wsBroadcastFn) {
          wsBroadcastFn('ticket_message', { ticketId: ticket.id, message: msgItem });
        }
      }
    } catch (err) {
      console.warn('[Discord Bot] Error in real-time message sync:', err.message);
    }
  });

  try {
    console.log('[Discord Bot] ⏳ Connecting to Discord Gateway via client.login()...');
    const loginPromise = client.login(token);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gateway connection timed out after 25 seconds. Discord Gateway handshake took too long.')), 25000)
    );
    await Promise.race([loginPromise, timeoutPromise]);
    console.log('[Discord Bot] 📡 client.login() connected! Gateway handshake completed.');
    return client;
  } catch (err) {
    console.error('[Discord Bot] ❌ Login failed:', err.message);
    return null;
  }
}

async function registerSlashCommands(client) {
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Deploy ticket creation panel embed')
        .addChannelOption(opt => opt.setName('target_channel').setDescription('Channel to deploy panel into')),
      new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket management commands')
        .addSubcommand(sub => 
          sub.setName('close')
            .setDescription('Close current ticket')
            .addStringOption(opt => opt.setName('reason').setDescription('Reason for closing the ticket'))
        )
        .addSubcommand(sub => 
          sub.setName('claim')
            .setDescription('Claim current ticket')
        )
        .addSubcommand(sub => 
          sub.setName('add')
            .setDescription('Add a user to this ticket')
            .addUserOption(opt => opt.setName('target_user').setDescription('User to add').setRequired(true))
        )
        .addSubcommand(sub => 
          sub.setName('remove')
            .setDescription('Remove a user from this ticket')
            .addUserOption(opt => opt.setName('target_user').setDescription('User to remove').setRequired(true))
        )
        .addSubcommand(sub => 
          sub.setName('rename')
            .setDescription('Rename this ticket channel')
            .addStringOption(opt => opt.setName('new_name').setDescription('New name for ticket channel').setRequired(true))
        )
    ].map(cmd => cmd.toJSON());

    const token = process.env.DISCORD_TOKEN;
    const rest = new REST({ version: '10' }).setToken(token);
    const clientId = process.env.CLIENT_ID || client.user.id;

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('[Discord Bot] Registered guild slash commands (/panel, /ticket)');
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('[Discord Bot] Registered global slash commands (/panel, /ticket)');
    }
  } catch (err) {
    console.error('[Discord Bot] Error registering slash commands:', err.message);
  }
}

// Function called by REST API or command to deploy embed to channel
export async function deployPanelEmbed(panelData, channelId) {
  if (!clientInstance || !clientInstance.isReady()) {
    throw new Error('Discord Bot is not connected or logged in yet.');
  }

  const channel = await clientInstance.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error('Target channel not found or is not a text channel.');
  }

  const embedConfig = panelData.embed || {};

  const embed = new EmbedBuilder()
    .setColor(embedConfig.color || '#e11d48');

  if (embedConfig.title && embedConfig.title.trim()) {
    embed.setTitle(embedConfig.title.trim());
  }

  if (embedConfig.description) {
    embed.setDescription(embedConfig.description);
  } else {
    embed.setDescription('Click button below to open a ticket.');
  }

  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
    if (trimmed.includes('example.com')) return false;
    return true;
  };

  if (embedConfig.authorName) {
    const authorOptions = { name: embedConfig.authorName };
    if (isValidUrl(embedConfig.authorIconUrl)) {
      authorOptions.iconURL = embedConfig.authorIconUrl.trim();
    }
    if (isValidUrl(embedConfig.authorUrl)) {
      authorOptions.url = embedConfig.authorUrl.trim();
    }
    embed.setAuthor(authorOptions);
  }

  if (isValidUrl(embedConfig.thumbnailUrl)) {
    embed.setThumbnail(embedConfig.thumbnailUrl.trim());
  }

  if (isValidUrl(embedConfig.imageUrl)) {
    embed.setImage(embedConfig.imageUrl.trim());
  }

  if (embedConfig.footerText && embedConfig.footerText.trim()) {
    const footerOptions = { text: embedConfig.footerText.trim() };
    if (isValidUrl(embedConfig.footerIconUrl)) {
      footerOptions.iconURL = embedConfig.footerIconUrl.trim();
    }
    embed.setFooter(footerOptions);
  }

  const components = [];
  const selectionMode = panelData.selectionMode || 'buttons'; // 'buttons' | 'dropdown' | 'both'

  // 1. Dropdown Select Menu component if enabled or configured
  if (selectionMode === 'dropdown' || selectionMode === 'both' || panelData.useSelectMenu || (panelData.selectOptions && panelData.selectOptions.length > 0)) {
    const selectOptions = (panelData.selectOptions && panelData.selectOptions.length > 0)
      ? panelData.selectOptions.map(opt => ({
          label: opt.label || 'Select Category',
          value: opt.value || opt.id || 'buy',
          description: opt.description || undefined,
          emoji: opt.emoji || undefined
        }))
      : [
          {
            label: 'Buy / Purchase',
            value: 'buy',
            description: 'Order products, packages, or services',
            emoji: '🛒'
          },
          {
            label: 'Technical Support',
            value: 'support',
            description: 'Assistance with existing orders or account',
            emoji: '🛠️'
          },
          {
            label: 'Billing & Invoices',
            value: 'billing',
            description: 'Invoices, refunds, and payment queries',
            emoji: '💼'
          },
          {
            label: 'General Inquiries',
            value: 'general',
            description: 'Partnerships, questions, or general help',
            emoji: '❓'
          }
        ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`ticket_select_menu_${panelData.id || 'default'}`)
      .setPlaceholder(panelData.selectPlaceholder || '📂 Select a category to open a ticket...')
      .addOptions(selectOptions.slice(0, 25)); // Discord max 25 options

    components.push(new ActionRowBuilder().addComponents(selectMenu));
  }

  // 2. Button Action Row if selectionMode is 'buttons' or 'both'
  if (selectionMode !== 'dropdown') {
    const buttons = panelData.buttons || [];
    const actionRow = new ActionRowBuilder();

    if (buttons.length > 0) {
      buttons.forEach(b => {
        let style = ButtonStyle.Primary;
        if (b.style === 'Secondary') style = ButtonStyle.Secondary;
        if (b.style === 'Success') style = ButtonStyle.Success;
        if (b.style === 'Danger') style = ButtonStyle.Danger;

        const btn = new ButtonBuilder()
          .setCustomId(b.customId || `ticket_create_${b.id || 'default'}`)
          .setLabel(b.label || 'Open Ticket')
          .setStyle(style);

        if (b.emoji) btn.setEmoji(b.emoji);
        actionRow.addComponents(btn);
      });
    } else {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create_buy')
          .setLabel('Buy')
          .setEmoji('🛒')
          .setStyle(ButtonStyle.Primary)
      );
    }
    components.push(actionRow);
  }

  // Check if we can edit an existing message sent by this bot in this channel!
  let existingMessage = null;

  // 1. Check if panelData has a stored messageId for this channel
  if (panelData.deployedMessageId && panelData.deployedChannelId === channelId) {
    try {
      existingMessage = await channel.messages.fetch(panelData.deployedMessageId);
    } catch (e) {
      console.log('[Discord Bot] Stored message not found, searching recent channel messages...');
    }
  }

  // 2. If no stored message found, search recent 50 channel messages for an existing bot message with ticket buttons or select menu
  if (!existingMessage) {
    try {
      const recentMessages = await channel.messages.fetch({ limit: 50 });
      existingMessage = recentMessages.find(msg => 
        msg.author.id === clientInstance.user.id && 
        msg.components?.some(row => row.components?.some(c => 
          c.customId?.startsWith('ticket_create_') || c.customId?.startsWith('ticket_select_menu_')
        ))
      );
    } catch (e) {
      console.log('[Discord Bot] Recent messages search error:', e.message);
    }
  }

  let resultMessage;
  let isEdit = false;

  if (existingMessage) {
    resultMessage = await existingMessage.edit({
      embeds: [embed],
      components
    });
    isEdit = true;
  } else {
    resultMessage = await channel.send({
      embeds: [embed],
      components
    });
  }

  // Update DB with stored messageId and channelId so future updates always edit!
  try {
    const { dbPanels } = await import('../db/database.js');
    const updatedPanel = {
      ...panelData,
      deployedMessageId: resultMessage.id,
      deployedChannelId: channelId
    };
    dbPanels.set(panelData.id, updatedPanel);
  } catch (e) {
    console.error('Error updating panel DB with deployedMessageId:', e);
  }

  return {
    success: true,
    isEdit,
    messageId: resultMessage.id,
    channelId,
    message: isEdit ? 'Updated existing embed message in Discord' : 'Created new embed message in Discord'
  };
}

