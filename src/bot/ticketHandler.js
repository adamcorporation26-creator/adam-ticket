import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  MessageFlags
} from 'discord.js';
import { dbPanels, dbTickets, dbSettings, dbAuditLogs } from '../db/database.js';

export function normalizeName(str) {
  if (!str) return '';
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export async function handleTicketButtonInteraction(interaction, broadcastWs) {
  if (!interaction.isButton()) return;

  const { customId, guild, user, member } = interaction;

  if (!customId.startsWith('ticket_create_')) return;
  if (!guild) return;

  // Safe interaction reply helper that handles deferred/non-deferred state and catches expired token errors
  const safeReply = async (payload) => {
    try {
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply(payload);
      } else {
        const replyPayload = typeof payload === 'string' ? { content: payload } : { ...payload };
        return await interaction.reply({ ...replyPayload, flags: MessageFlags.Ephemeral });
      }
    } catch (e) {
      if (e.code !== 10062 && e.code !== 40060) {
        console.warn('[Ticket Button] Reply error:', e.message);
      }
    }
  };

  // Acknowledge interaction quickly to avoid timeout
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    if (err.code === 10062 || err.code === 40060) {
      console.warn(`[Discord Bot] Ticket interaction expired or already acknowledged: ${err.message}`);
      return;
    }
    console.error('[Discord Bot] Failed to defer ticket reply:', err);
    return;
  }

  try {
    const panels = dbPanels.all();
    // Find panel that matches button customId or pick default
    const panelKey = Object.keys(panels).find(k => 
      panels[k].buttons?.some(b => b.customId === customId)
    ) || Object.keys(panels)[0];

    const panel = panels[panelKey];

    if (!panel) {
      return safeReply({ content: '❌ Ticket panel configuration not found.' });
    }

    // Check blocked roles
    if (panel.blockedRoles && panel.blockedRoles.length > 0) {
      const hasBlockedRole = member.roles.cache.some(r => {
        const rNorm = normalizeName(r.name);
        return panel.blockedRoles.some(b => normalizeName(b) === rNorm || b === r.id);
      });
      if (hasBlockedRole) {
        return safeReply({ content: '🚫 You are blocked from creating tickets.' });
      }
    }

    // Check if the user already has an active open ticket in this server
    const tickets = dbTickets.get('tickets', []);
    const existingOpenTicket = tickets.find(t => 
      t.authorId === user.id && 
      t.guildId === guild.id && 
      (t.status === 'open' || t.status === 'in_progress')
    );

    if (existingOpenTicket) {
      // Verify if the active ticket channel still exists in Discord
      let existingChannel = guild.channels.cache.get(existingOpenTicket.channelId);
      if (!existingChannel) {
        try {
          existingChannel = await guild.channels.fetch(existingOpenTicket.channelId).catch(() => null);
        } catch (e) {
          existingChannel = null;
        }
      }

      if (existingChannel) {
        return safeReply({
          content: `❌ **Ticket Limit Reached**: You already have an open ticket in <#${existingOpenTicket.channelId}>!\n\nPlease resolve or close your existing ticket before opening a new one.`
        });
      } else {
        // Channel was deleted manually from Discord, so update ticket status in DB to 'closed'
        dbTickets.updateTicket({
          id: existingOpenTicket.id,
          status: 'closed',
          resolvedTime: new Date().toISOString()
        });
      }
    }

    // Parse custom ticket channel name e.g. "buy-{USER_NAME}"
    let ticketChannelName = panel.customTicketName || 'buy-{USER_NAME}';
    ticketChannelName = ticketChannelName
      .replace(/{USER_NAME}/g, user.username.toLowerCase())
      .replace(/{USERNAME}/g, user.username.toLowerCase())
      .replace(/{USER_ID}/g, user.id);

    // Get sequential ticket count for safe number assignment
    const maxTicketNum = tickets.reduce((max, t) => Math.max(max, Number(t.ticketNumber) || 0), 100);
    const ticketNumber = maxTicketNum + 1;

    let ticketChannel;

    if (panel.channelType === 'thread') {
      // Thread creation
      ticketChannel = await interaction.channel.threads.create({
        name: ticketChannelName,
        autoArchiveDuration: 1440, // 24 hours
        reason: `Ticket created by ${user.tag}`
      });
      await ticketChannel.members.add(user.id);
    } else {
      // Text channel creation directly inside configured category
      const targetCategoryNorm = normalizeName(panel.category || 'tickets');
      let categoryChannel = guild.channels.cache.find(c => 
        c.type === ChannelType.GuildCategory && (
          c.id === panel.category || 
          normalizeName(c.name) === targetCategoryNorm ||
          normalizeName(c.name).includes(targetCategoryNorm)
        )
      );

      // Try fetching channels if not in cache
      if (!categoryChannel && panel.category) {
        try {
          const fetchedChannels = await guild.channels.fetch().catch(() => null);
          if (fetchedChannels) {
            categoryChannel = fetchedChannels.find(c => 
              c.type === ChannelType.GuildCategory && (
                c.id === panel.category || 
                normalizeName(c.name) === targetCategoryNorm ||
                normalizeName(c.name).includes(targetCategoryNorm)
              )
            );
          }
        } catch (e) {}
      }

      // Create category if not exists
      if (!categoryChannel && panel.category) {
        try {
          categoryChannel = await guild.channels.create({
            name: panel.category,
            type: ChannelType.GuildCategory
          });
        } catch (e) {
          console.log('Could not create category, placing channel in root:', e.message);
        }
      }

      // Permission overwrites: deny @everyone, allow user & support roles
      const permissionOverwrites = [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },
        {
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ];

      // Add support roles permission
      if (panel.supportRoles && panel.supportRoles.length > 0) {
        guild.roles.cache.forEach(role => {
          const roleNorm = normalizeName(role.name);
          if (panel.supportRoles.some(r => normalizeName(r) === roleNorm || r === role.id)) {
            permissionOverwrites.push({
              id: role.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages
              ]
            });
          }
        });
      }

      ticketChannel = await guild.channels.create({
        name: ticketChannelName,
        type: ChannelType.GuildText,
        parent: categoryChannel ? categoryChannel.id : null,
        permissionOverwrites
      });
    }

    // Build Support Roles ping text (@Founder, @Staff, @Manager)
    const supportRolesList = panel.supportRoles || ['Founder', 'Staff', 'Manager'];
    const pingMentions = [];

    if (guild.roles?.cache) {
      guild.roles.cache.forEach(role => {
        const roleNorm = normalizeName(role.name);
        if (supportRolesList.some(r => normalizeName(r) === roleNorm || r === role.id)) {
          pingMentions.push(`<@&${role.id}>`);
        }
      });
    }

    const rolePingsText = pingMentions.length > 0 ? pingMentions.join(' ') : '@Founder @Staff @Manager';

    const categoryName = panel.category || 'Purchase';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
      ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';

    const thumbnailUrl = panel.embed?.thumbnailUrl && panel.embed.thumbnailUrl.trim() !== ''
      ? panel.embed.thumbnailUrl.trim()
      : (guild.iconURL({ extension: 'gif' }) || guild.iconURL({ extension: 'png' }) || undefined);

    // Build description based on panel type
    const isSupport = panel.id && panel.id.toLowerCase().includes('support');
    const embedDescription = isSupport
      ? `<@${user.id}>\n\n` +
        `**Thank you for reaching out to ADAM CORPORATION.**\n` +
        `This is your **private support channel**. Staff who were pinged will assist you shortly.\n\n` +
        `**Please share**\n` +
        `🔹 A clear description of your **issue or request**\n` +
        `🔹 Any **error messages** or screenshots if relevant\n` +
        `🔹 Any **prior order or ticket** reference\n\n` +
        `**House rules**\n` +
        `🔸 Keep the thread focused — avoid unnecessary pings.\n` +
        `🔸 Stay respectful; abuse may lead to **restriction**.`
      : `<@${user.id}>\n\n` +
        `**Thank you for choosing ADAM CORPORATION.**\n` +
        `This is your **private purchase channel**. Staff who were pinged will assist with **payment** and **access** shortly.\n\n` +
        `**Please share**\n` +
        `🔹 The **product or package** you want\n` +
        `🔹 **Country / currency** if it changes how we invoice\n` +
        `🔹 Any **prior order or ticket** reference\n\n` +
        `**House rules**\n` +
        `🔸 Keep the thread focused — avoid unnecessary pings.\n` +
        `🔸 Serious buyers only; abuse may lead to **restriction**.`;

    const welcomeEmbed = new EmbedBuilder()
      .setAuthor({ 
        name: `ADAM CORPORATION • ${categoryName} ticket`, 
        iconURL: panel.embed?.authorIconUrl || guild.iconURL({ extension: 'png' }) || undefined 
      })
      .setDescription(embedDescription)
      .setColor(panel.embed?.color || '#eab308');

    if (thumbnailUrl) {
      welcomeEmbed.setThumbnail(thumbnailUrl);
    }

    // Action buttons inside ticket channel (Claim ticket / Close ticket)
    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${ticketChannel.id}`)
        .setLabel('Claim ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketChannel.id}`)
        .setLabel('Close ticket')
        .setStyle(ButtonStyle.Danger)
    );

    // Send role pings + embed + buttons
    await ticketChannel.send({
      content: rolePingsText,
      embeds: [welcomeEmbed],
      components: [controlRow]
    });

    // Send prompt message below buttons (dynamic per panel type)
    const promptMessage = isSupport
      ? '**How can we help you?** Reply here with details about your issue and staff will assist you shortly.'
      : '**What would you like to purchase?** Reply here with the product and any notes for staff.';
    await ticketChannel.send({ content: promptMessage });

    // Save ticket to JSON DB
    const newTicket = {
      id: `ticket-${ticketNumber}`,
      ticketNumber,
      ticketName: ticketChannelName,
      topic: panel.category || 'Purchase',
      status: 'open',
      channelId: ticketChannel.id,
      guildId: guild.id,
      authorId: user.id,
      authorTag: user.tag,
      authorAvatar: user.displayAvatarURL(),
      openTime: new Date().toISOString(),
      resolvedTime: null,
      panelId: panel.id,
      messages: [
        { author: 'System', content: `Ticket created by ${user.tag}`, timestamp: new Date().toISOString() }
      ]
    };

    dbTickets.addTicket(newTicket);

    // Notify dashboard via WebSocket
    if (broadcastWs) {
      broadcastWs('ticket_created', newTicket);
    }

    // Log to log channel (for both Embed 1 & Embed 2)
    const targetLogName = normalizeName((panel.openLogChannel || 'ticket-logs').replace('#', ''));
    let logChannel = guild.channels.cache.find(c => 
      c.isTextBased() && (c.id === panel.openLogChannel || normalizeName(c.name) === targetLogName)
    );
    if (!logChannel) {
      try {
        const fetched = await guild.channels.fetch().catch(() => null);
        if (fetched) {
          logChannel = fetched.find(c => 
            c.isTextBased() && (c.id === panel.openLogChannel || normalizeName(c.name) === targetLogName)
          );
        }
      } catch (e) {}
    }
    if (!logChannel) {
      logChannel = guild.channels.cache.find(c => 
        c.isTextBased() && (normalizeName(c.name).includes('ticket-log') || normalizeName(c.name).includes('log'))
      );
    }

    if (logChannel && logChannel.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🎟️ Ticket Opened')
        .setColor('#22c55e')
        .addFields(
          { name: '🎫 Ticket', value: `<#${ticketChannel.id}>`, inline: true },
          { name: '👤 Opened By', value: `<@${user.id}> (${user.tag})`, inline: true },
          { name: '📁 Category', value: panel.category || 'Purchase', inline: true },
          { name: '📋 Panel Option', value: panel.name || panel.id, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] }).catch((e) => console.log('Error sending open log:', e.message));
    }

    return safeReply({
      content: `✅ Your ticket has been created! Go to <#${ticketChannel.id}>`
    });

  } catch (err) {
    console.error('Error handling ticket creation:', err);
    return safeReply({
      content: `❌ Failed to create ticket: ${err.message}`
    });
  }
}

// Handle Close and Claim Ticket buttons inside ticket channel
export async function handleTicketControlButtons(interaction, broadcastWs) {
  if (!interaction.isButton()) return;
  const { customId, channel, user, guild } = interaction;
  if (!guild) return;

  const safeReply = async (payload, ephemeral = false) => {
    try {
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply(payload);
      } else {
        const replyPayload = typeof payload === 'string' ? { content: payload } : { ...payload };
        if (ephemeral) replyPayload.flags = MessageFlags.Ephemeral;
        return await interaction.reply(replyPayload);
      }
    } catch (e) {
      if (e.code !== 10062 && e.code !== 40060) {
        console.warn('[Control Button] Reply error:', e.message);
      }
    }
  };

  // 1. Initial click on Close Ticket button: verify permission & prompt confirmation
  if (customId.startsWith('ticket_close_') && !customId.startsWith('ticket_close_confirm_') && !customId.startsWith('ticket_close_cancel_')) {
    const tickets = dbTickets.get('tickets', []);
    const targetTicket = tickets.find(t => t.channelId === channel.id);
    const panel = (targetTicket?.panelId && dbPanels.get(targetTicket.panelId)) || dbPanels.get('default-purchase-panel');
    const supportRolesList = panel?.supportRoles || ['Founder', 'Staff', 'Manager'];

    const isAuthor = targetTicket && targetTicket.authorId === user.id;
    const isStaff = interaction.member?.permissions?.has(PermissionFlagsBits.ManageChannels) ||
                    interaction.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
                    interaction.member?.roles?.cache?.some(r => supportRolesList.some(sr => normalizeName(sr) === normalizeName(r.name) || sr === r.id));

    if (!isAuthor && !isStaff) {
      return safeReply({
        content: '🚫 **Access Denied**: Only the ticket author or support staff can close this ticket.'
      }, true);
    }

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_close_confirm_${channel.id}`)
        .setLabel('Yes, Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId(`ticket_close_cancel_${channel.id}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    return safeReply({
      content: '⚠️ **Are you sure you want to close this ticket?**\nA transcript will be generated and saved, and this channel will be closed.',
      components: [confirmRow]
    });
  }

  // 2. Cancellation of ticket close
  if (customId.startsWith('ticket_close_cancel_')) {
    try {
      await interaction.update({
        content: '✅ Ticket closure cancelled.',
        components: []
      });
    } catch (e) {}
    return;
  }

  // 3. Confirmed ticket close
  if (customId.startsWith('ticket_close_confirm_')) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.update({
          content: '🔒 **Closing ticket**... Locking channel, archiving messages, and generating transcript...',
          components: []
        }).catch(() => {});
      }
    } catch (e) {}

    const tickets = dbTickets.get('tickets', []);
    const ticketIndex = tickets.findIndex(t => t.channelId === channel.id);
    let targetTicket = ticketIndex !== -1 ? tickets[ticketIndex] : null;

    if (targetTicket) {
      targetTicket.status = 'resolved';
      targetTicket.resolvedTime = new Date().toISOString();
      targetTicket.closedBy = user.tag;
      dbTickets.updateTicket(targetTicket);

      if (broadcastWs) {
        broadcastWs('ticket_closed', targetTicket);
      }

      // Lock channel: revoke send message permission from author
      if (targetTicket.authorId) {
        await channel.permissionOverwrites.edit(targetTicket.authorId, {
          SendMessages: false
        }).catch(() => {});
      }
    }

    // Send DM Receipt & 1-5 Star Feedback buttons to Ticket Author
    if (targetTicket && targetTicket.authorId) {
      try {
        const ticketAuthor = await interaction.client.users.fetch(targetTicket.authorId).catch(() => null);
        if (ticketAuthor) {
          const receiptEmbed = new EmbedBuilder()
            .setTitle('How was your experience?')
            .setDescription(
              `Your **${targetTicket.topic || 'Purchase'}** ticket \`${channel.name}\` was closed.\n\n` +
              `⭐ Tap **1–5** below to rate your experience.\n` +
              `⭐ **1–3 stars**: we'll ask for a short reason so we can improve.\n` +
              `⭐ **4–5 stars**: thank you — your rating is logged for the team.`
            )
            .setColor('#e11d48')
            .setFooter({ text: `${guild.name || 'ADAM CORPORATION'} • Your feedback helps us improve` })
            .setTimestamp();

          const ratingRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ticket_rate_1_${targetTicket.id}`).setLabel('1').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`ticket_rate_2_${targetTicket.id}`).setLabel('2').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`ticket_rate_3_${targetTicket.id}`).setLabel('3').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`ticket_rate_4_${targetTicket.id}`).setLabel('⭐ 4').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`ticket_rate_5_${targetTicket.id}`).setLabel('⭐ 5').setStyle(ButtonStyle.Success)
          );

          await ticketAuthor.send({ embeds: [receiptEmbed], components: [ratingRow] }).catch(() => {
            console.log(`Could not send DM receipt to user ${targetTicket.authorId} (user has DMs closed).`);
          });
        }
      } catch (e) {
        console.error('Error sending DM receipt:', e.message);
      }
    }

    // Generate complete transcript using multi-page pagination loop (up to 500 messages)
    let messageList = [];
    try {
      let lastId = null;
      while (messageList.length < 500) {
        const fetchOptions = { limit: 100 };
        if (lastId) fetchOptions.before = lastId;
        const fetched = await channel.messages.fetch(fetchOptions).catch(() => null);
        if (!fetched || fetched.size === 0) break;
        const arr = Array.from(fetched.values());
        messageList.push(...arr);
        lastId = arr[arr.length - 1].id;
        if (fetched.size < 100) break;
      }
      messageList.reverse();
    } catch (e) {
      console.log('Error fetching channel messages for transcript:', e.message);
    }

    // Save messages in DB ticket record for dashboard transcript viewer
    if (targetTicket && messageList.length > 0) {
      targetTicket.messages = messageList.map(m => {
        let content = m.cleanContent || m.content || '';
        if (m.attachments && m.attachments.size > 0) {
          const attachNames = m.attachments.map(a => `[Attachment: ${a.name}]`).join(' ');
          content = content ? `${content} ${attachNames}` : attachNames;
        }
        return {
          author: m.author ? m.author.tag : 'System',
          content: content || '[Empty / System Message]',
          timestamp: new Date(m.createdTimestamp).toISOString()
        };
      });
      dbTickets.updateTicket(targetTicket);
    }

    // Build Transcript Text File with attachment URLs and clean formatting
    let transcriptText = `====================================================\n`;
    transcriptText += `ADAM CORPORATION — TICKET TRANSCRIPT\n`;
    transcriptText += `Ticket Channel: #${channel.name}\n`;
    transcriptText += `Opened By: ${targetTicket?.authorTag || 'Unknown'} (${targetTicket?.authorId || 'N/A'})\n`;
    transcriptText += `Closed By: ${user.tag} (${user.id})\n`;
    transcriptText += `Date: ${new Date().toLocaleString()}\n`;
    transcriptText += `Total Messages: ${messageList.length}\n`;
    transcriptText += `====================================================\n\n`;

    messageList.forEach(m => {
      const time = new Date(m.createdTimestamp).toLocaleString();
      const author = m.author ? m.author.tag : 'System';
      let content = m.cleanContent || m.content || '';
      if (m.attachments && m.attachments.size > 0) {
        const attachList = m.attachments.map(a => `[Attachment: ${a.name} -> ${a.url}]`).join(' ');
        content = content ? `${content} ${attachList}` : attachList;
      }
      if (m.embeds && m.embeds.length > 0) {
        const embedSummary = m.embeds.map(e => `[Embed: ${e.title || 'Rich Content'}]`).join(' ');
        content = content ? `${content} ${embedSummary}` : embedSummary;
      }
      transcriptText += `[${time}] ${author}: ${content}\n`;
    });

    const buffer = Buffer.from(transcriptText, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

    // Send transcript log embed + file to closeLogChannel
    const panel = (targetTicket?.panelId && dbPanels.get(targetTicket.panelId)) || dbPanels.get('default-purchase-panel');
    const targetCloseLogName = normalizeName((panel?.closeLogChannel || 'ticket-logs').replace('#', ''));
    let logChannel = guild.channels.cache.find(c => 
      c.isTextBased() && (c.id === panel?.closeLogChannel || normalizeName(c.name) === targetCloseLogName)
    );
    if (!logChannel) {
      try {
        const fetched = await guild.channels.fetch().catch(() => null);
        if (fetched) {
          logChannel = fetched.find(c => 
            c.isTextBased() && (c.id === panel?.closeLogChannel || normalizeName(c.name) === targetCloseLogName)
          );
        }
      } catch (e) {}
    }
    if (!logChannel) {
      logChannel = guild.channels.cache.find(c => 
        c.isTextBased() && (normalizeName(c.name).includes('ticket-log') || normalizeName(c.name).includes('log'))
      );
    }

    if (logChannel && logChannel.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Closed — Transcript')
        .setColor('#e11d48')
        .addFields(
          { name: '🎫 Ticket Name', value: `#${channel.name}`, inline: true },
          { name: '👤 Opened By', value: targetTicket ? `<@${targetTicket.authorId}>` : 'Unknown', inline: true },
          { name: '🔒 Closed By', value: `<@${user.id}> (${user.tag})`, inline: true },
          { name: '📁 Category', value: targetTicket?.topic || panel?.category || 'Purchase', inline: true },
          { name: '📋 Panel Option', value: panel?.name || panel?.id || 'Purchase Ticket', inline: true },
          { name: '💬 Total Messages', value: `${messageList.length}`, inline: true },
          { name: '📅 Date & Time', value: new Date().toLocaleString(), inline: true }
        )
        .setFooter({ text: 'ADAM CORPORATION • Ticket Logs' })
        .setTimestamp();

      await logChannel.send({
        embeds: [logEmbed],
        files: [attachment]
      }).catch(e => console.error('Error sending log transcript to channel:', e));
    }

    // Notify channel of countdown and delete safely after 10 seconds
    await channel.send({
      content: '🔒 **Ticket Closed**: Transcript saved. This channel will be permanently deleted in 10 seconds...'
    }).catch(() => {});

    setTimeout(async () => {
      await channel.delete('Ticket closed by user/staff').catch(() => {});
    }, 10000);
  }

  // 4. Handle Claim Button
  if (customId.startsWith('ticket_claim_')) {
    const tickets = dbTickets.get('tickets', []);
    const ticketIndex = tickets.findIndex(t => t.channelId === channel.id);
    const targetTicket = ticketIndex !== -1 ? tickets[ticketIndex] : null;

    // Prevent ticket author from claiming their own ticket
    if (targetTicket && targetTicket.authorId === user.id) {
      return safeReply({
        content: '🚫 **Claim Restricted**: You cannot claim your own ticket! Only staff members can claim tickets.'
      }, true);
    }

    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply().catch(() => {});
      }
    } catch (e) {}
    await safeReply({ content: `🙋‍♂️ Ticket claimed by <@${user.id}>!` });

    // Move channel into Category upon claim
    const panel = (targetTicket?.panelId && dbPanels.get(targetTicket.panelId)) || dbPanels.get('default-purchase-panel');
    const categoryName = panel?.category || targetTicket?.topic || 'Purchase';
    const catNameNorm = normalizeName(categoryName);

    let categoryChannel = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildCategory && (
        c.id === categoryName || 
        normalizeName(c.name) === catNameNorm ||
        normalizeName(c.name).includes(catNameNorm)
      )
    );

    if (!categoryChannel) {
      try {
        categoryChannel = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory
        });
      } catch (e) {
        console.log('Could not create category on claim:', e.message);
      }
    }

    if (categoryChannel && channel.setParent) {
      await channel.setParent(categoryChannel.id, { lockPermissions: false }).catch((err) => {
        console.error('Error moving channel to category on claim:', err.message);
      });
    }

    if (targetTicket) {
      targetTicket.status = 'in_progress';
      targetTicket.claimedBy = user.tag;
      dbTickets.updateTicket(targetTicket);
      if (broadcastWs) broadcastWs('ticket_updated', targetTicket);
    }
  }
}

// Handle star rating button clicks (1-5 stars) and feedback modal submission
export async function handleTicketRatingInteraction(interaction, broadcastWs) {
  const safeReply = async (payload, ephemeral = true) => {
    try {
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply(payload);
      } else {
        const replyPayload = typeof payload === 'string' ? { content: payload } : { ...payload };
        if (ephemeral && interaction.guild) replyPayload.flags = MessageFlags.Ephemeral;
        return await interaction.reply(replyPayload);
      }
    } catch (e) {
      if (e.code !== 10062 && e.code !== 40060) {
        console.warn('[Rating Button] Reply error:', e.message);
      }
    }
  };

  // 1. Star Rating Button Click
  if (interaction.isButton() && interaction.customId.startsWith('ticket_rate_')) {
    const parts = interaction.customId.split('_');
    const stars = parseInt(parts[2]);
    const ticketId = parts.slice(3).join('_');

    if (stars <= 3) {
      // 1-3 stars: Show modal asking for a reason
      const modal = new ModalBuilder()
        .setCustomId(`ticket_feedback_modal_${stars}_${ticketId}`)
        .setTitle('Feedback Reason');

      const feedbackInput = new TextInputBuilder()
        .setCustomId('feedback_reason')
        .setLabel('Why did you give this rating?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('We’ll ask for a short reason so we can improve...')
        .setRequired(false)
        .setMaxLength(500);

      const firstRow = new ActionRowBuilder().addComponents(feedbackInput);
      modal.addComponents(firstRow);

      try {
        await interaction.showModal(modal);
      } catch (err) {
        console.warn('[Discord Bot] Error showing feedback modal:', err.message);
      }
      return;
    } else {
      // 4-5 stars: Log rating immediately and reply
      const tickets = dbTickets.get('tickets', []);
      const ticketIndex = tickets.findIndex(t => t.id === ticketId || t.ticketName === ticketId);
      let updatedTicket = null;

      if (ticketIndex !== -1) {
        tickets[ticketIndex].rating = stars;
        tickets[ticketIndex].feedback = 'Logged for team (4-5 stars)';
        tickets[ticketIndex].feedbackTime = new Date().toISOString();
        updatedTicket = dbTickets.updateTicket(tickets[ticketIndex]);
        if (broadcastWs) broadcastWs('ticket_updated', updatedTicket);
      }

      await safeReply({
        content: '• **Thank you.** We appreciate your rating.'
      }, true);

      // Post Feedback Log to Guild Log Channel
      sendFeedbackLogToGuild(interaction, updatedTicket, stars, 'Logged for team (4-5 stars)');
      return;
    }
  }

  // 2. Feedback Modal Submission (1-3 stars reason)
  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_feedback_modal_')) {
    const parts = interaction.customId.split('_');
    const stars = parseInt(parts[3]);
    const ticketId = parts.slice(4).join('_');
    const userMessage = interaction.fields.getTextInputValue('feedback_reason') || 'No additional details provided';

    // Update DB record
    const tickets = dbTickets.get('tickets', []);
    const ticketIndex = tickets.findIndex(t => t.id === ticketId || t.ticketName === ticketId);
    let updatedTicket = null;

    if (ticketIndex !== -1) {
      tickets[ticketIndex].rating = stars;
      tickets[ticketIndex].feedback = userMessage;
      tickets[ticketIndex].feedbackTime = new Date().toISOString();
      updatedTicket = dbTickets.updateTicket(tickets[ticketIndex]);
      if (broadcastWs) broadcastWs('ticket_updated', updatedTicket);
    }

    await safeReply({
      content: '• **Thank you.** We appreciate your rating.'
    }, true);

    // Post Feedback Log to Guild Log Channel
    sendFeedbackLogToGuild(interaction, updatedTicket, stars, userMessage);
  }
}

async function sendFeedbackLogToGuild(interaction, ticket, stars, feedbackText) {
  const client = interaction.client;
  const targetGuildId = ticket?.guildId || process.env.GUILD_ID || '1521227404335513610';
  const guild = (targetGuildId && client.guilds.cache.get(targetGuildId)) 
    || client.guilds.cache.find(g => normalizeName(g.name).includes('adam'))
    || client.guilds.cache.first();
  if (!guild) return;

  const panel = (ticket?.panelId && dbPanels.get(ticket.panelId)) || dbPanels.get('default-purchase-panel');
  const targetCloseLogName = normalizeName((panel?.closeLogChannel || 'ticket-logs').replace('#', ''));
  let logChannel = guild.channels.cache.find(c => 
    c.isTextBased() && (c.id === panel?.closeLogChannel || normalizeName(c.name) === targetCloseLogName)
  );
  if (!logChannel) {
    try {
      const fetched = await guild.channels.fetch().catch(() => null);
      if (fetched) {
        logChannel = fetched.find(c => 
          c.isTextBased() && (c.id === panel?.closeLogChannel || normalizeName(c.name) === targetCloseLogName)
        );
      }
    } catch (e) {}
  }

  if (logChannel && logChannel.isTextBased()) {
    const starString = '⭐'.repeat(stars);
    const feedbackEmbed = new EmbedBuilder()
      .setTitle('🌟 Ticket Rating & Feedback Received')
      .setColor('#facc15')
      .addFields(
        { name: '🎫 Ticket', value: `#${ticket?.ticketName || 'ticket'}`, inline: true },
        { name: '👤 User', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
        { name: '⭐ Rating', value: `${starString} (${stars}/5 Stars)`, inline: true },
        { name: '💬 Feedback Reason', value: `"${feedbackText}"`, inline: false }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [feedbackEmbed] }).catch(() => {});
  }
}

export async function rearrangeGuildTickets(guild) {
  if (!guild || !guild.channels) return;
  try {
    const ticketsInDb = dbTickets.get('tickets', []);

    // Filter text channels that are tickets (e.g. starting with buy- or registered in dbTickets)
    const ticketChannels = guild.channels.cache.filter(c => 
      c.isTextBased() && (c.name.startsWith('buy-') || ticketsInDb.some(t => t.channelId === c.id))
    );

    if (ticketChannels.size <= 1) return;

    // Sort ticket channels descending by creationTimestamp (newest ticket first)
    const sorted = Array.from(ticketChannels.values()).sort((a, b) => {
      return (b.createdTimestamp || 0) - (a.createdTimestamp || 0);
    });

    // Bulk reposition using guild.channels.setPositions to avoid rate limits
    const positionsPayload = sorted.map((ch, index) => ({
      channel: ch.id,
      position: index
    }));
    await guild.channels.setPositions(positionsPayload).catch(() => {});
  } catch (err) {
    console.error('Error rearranging guild tickets:', err.message);
  }
}

// Handler for slash command actions (/ticket close, /ticket add, /ticket remove, /ticket rename, /ticket claim)
export async function handleTicketSlashCommand(interaction, broadcastWs) {
  const { options, channel, guild, user, member } = interaction;
  if (!guild) return;

  const subcommand = options.getSubcommand();
  const tickets = dbTickets.get('tickets', []);
  const targetTicket = tickets.find(t => t.channelId === channel.id);

  if (subcommand === 'close') {
    const panel = (targetTicket?.panelId && dbPanels.get(targetTicket.panelId)) || dbPanels.get('default-purchase-panel');
    const supportRolesList = panel?.supportRoles || ['Founder', 'Staff', 'Manager'];
    const isAuthor = targetTicket && targetTicket.authorId === user.id;
    const isStaff = member.permissions.has(PermissionFlagsBits.ManageChannels) ||
                    member.permissions.has(PermissionFlagsBits.Administrator) ||
                    member.roles.cache.some(r => supportRolesList.some(sr => normalizeName(sr) === normalizeName(r.name) || sr === r.id));

    if (!isAuthor && !isStaff) {
      return interaction.reply({
        content: '🚫 **Access Denied**: Only the ticket author or staff can close this ticket.',
        flags: MessageFlags.Ephemeral
      });
    }

    const reason = options.getString('reason');
    if (reason && targetTicket) {
      targetTicket.closeReason = reason;
      dbTickets.updateTicket(targetTicket);
    }

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_close_confirm_${channel.id}`)
        .setLabel('Yes, Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId(`ticket_close_cancel_${channel.id}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content: `⚠️ **Are you sure you want to close this ticket?**${reason ? `\n**Reason:** ${reason}` : ''}`,
      components: [confirmRow]
    });
  }

  if (subcommand === 'add') {
    const targetUser = options.getUser('target_user');
    if (!targetUser) return interaction.reply({ content: '❌ Target user not specified.', flags: MessageFlags.Ephemeral });

    await channel.permissionOverwrites.edit(targetUser.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    }).catch(err => {
      return interaction.reply({ content: `❌ Failed to add user: ${err.message}`, flags: MessageFlags.Ephemeral });
    });

    return interaction.reply({ content: `✅ Added <@${targetUser.id}> to this ticket channel.` });
  }

  if (subcommand === 'remove') {
    const targetUser = options.getUser('target_user');
    if (!targetUser) return interaction.reply({ content: '❌ Target user not specified.', flags: MessageFlags.Ephemeral });

    await channel.permissionOverwrites.delete(targetUser.id).catch(err => {
      return interaction.reply({ content: `❌ Failed to remove user: ${err.message}`, flags: MessageFlags.Ephemeral });
    });

    return interaction.reply({ content: `✅ Removed <@${targetUser.id}> from this ticket channel.` });
  }

  if (subcommand === 'rename') {
    const newName = options.getString('new_name');
    if (!newName) return interaction.reply({ content: '❌ New name required.', flags: MessageFlags.Ephemeral });

    const safeName = newName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 32);
    await channel.setName(safeName).catch(err => {
      return interaction.reply({ content: `❌ Failed to rename channel: ${err.message}`, flags: MessageFlags.Ephemeral });
    });

    if (targetTicket) {
      targetTicket.ticketName = safeName;
      dbTickets.updateTicket(targetTicket);
    }

    return interaction.reply({ content: `✅ Channel renamed to \`${safeName}\`.` });
  }

  if (subcommand === 'claim') {
    if (targetTicket && targetTicket.authorId === user.id) {
      return interaction.reply({ content: '🚫 You cannot claim your own ticket.', flags: MessageFlags.Ephemeral });
    }

    if (targetTicket) {
      targetTicket.status = 'in_progress';
      targetTicket.claimedBy = user.tag;
      dbTickets.updateTicket(targetTicket);
      if (broadcastWs) broadcastWs('ticket_updated', targetTicket);
    }

    return interaction.reply({ content: `🙋‍♂️ Ticket claimed by <@${user.id}>!` });
  }
}
