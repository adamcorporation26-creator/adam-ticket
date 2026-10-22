import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import dotenv from 'dotenv';
import { handleTicketButtonInteraction, handleTicketControlButtons, handleTicketRatingInteraction, rearrangeGuildTickets } from './ticketHandler.js';

dotenv.config();

let clientInstance = null;
let wsBroadcastFn = null;

export function getBotClient() {
  return clientInstance;
}

export async function initBot(broadcastWs) {
  wsBroadcastFn = broadcastWs;
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    console.warn('[Discord Bot] DISCORD_TOKEN is missing in environment variables! Please configure DISCORD_TOKEN in Render Environment.');
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers
    ]
  });

  clientInstance = client;

  client.once('ready', async () => {
    console.log(`[Discord Bot] Logged in successfully as ${client.user.tag}`);
    await registerSlashCommands(client);
  });

  client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'panel') {
        const ownerId = process.env.OWNER_ID || '842417480521089054';
        const isOwner = interaction.user.id === ownerId || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);

        if (!isOwner) {
          return interaction.reply({
            content: `🚫 **Access Denied**: This bot is private and can only be controlled by its owner (<@${ownerId}>).`,
            ephemeral: true
          });
        }

        const channel = interaction.options.getChannel('target_channel') || interaction.channel;
        const panelData = reqPanelData();
        await deployPanelEmbed(panelData, channel.id);
        await interaction.reply({ content: `✅ Panel deployed to <#${channel.id}>!`, ephemeral: true });
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('ticket_create_')) {
        await handleTicketButtonInteraction(interaction, wsBroadcastFn);
      } else if (interaction.customId.startsWith('ticket_close_') || interaction.customId.startsWith('ticket_claim_')) {
        await handleTicketControlButtons(interaction, wsBroadcastFn);
      } else if (interaction.customId.startsWith('ticket_rate_')) {
        await handleTicketRatingInteraction(interaction, wsBroadcastFn);
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('ticket_feedback_modal_')) {
        await handleTicketRatingInteraction(interaction, wsBroadcastFn);
      }
    }
  });

  try {
    await client.login(token);
    return client;
  } catch (err) {
    console.error('[Discord Bot] Login failed:', err.message);
    return null;
  }
}

async function registerSlashCommands(client) {
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Deploy ticket creation panel embed')
        .addChannelOption(opt => opt.setName('target_channel').setDescription('Channel to deploy panel into'))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const clientId = process.env.CLIENT_ID || client.user.id;

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('[Discord Bot] Registered guild slash commands');
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('[Discord Bot] Registered global slash commands');
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

  // 2. If no stored message found, search recent 50 channel messages for an existing bot message with ticket buttons
  if (!existingMessage) {
    try {
      const recentMessages = await channel.messages.fetch({ limit: 50 });
      existingMessage = recentMessages.find(msg => 
        msg.author.id === clientInstance.user.id && 
        msg.components?.some(row => row.components?.some(b => b.customId?.startsWith('ticket_create_')))
      );
    } catch (e) {
      console.log('[Discord Bot] Recent messages search error:', e.message);
    }
  }

  let resultMessage;
  let isEdit = false;

  if (existingMessage) {
    // Edit the existing panel message in Discord!
    resultMessage = await existingMessage.edit({
      embeds: [embed],
      components: [actionRow]
    });
    isEdit = true;
  } else {
    // Post new message if no existing panel message was found in channel
    resultMessage = await channel.send({
      embeds: [embed],
      components: [actionRow]
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

function reqPanelData() {
  import('../db/database.js').then(db => db.dbPanels.get('default-purchase-panel'));
}
