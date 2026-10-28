import dotenv from 'dotenv';
import { fetchPanelsFromSupabase, upsertPanelToSupabase } from '../src/db/supabase.js';
import { initBot, deployPanelEmbed } from '../src/bot/index.js';

dotenv.config();

async function run() {
  console.log('🔄 Fetching current panels from Supabase...');
  const remotePanels = (await fetchPanelsFromSupabase()) || {};

  // 1. Prepare Purchase Panel (Buy tickets)
  const purchasePanel = remotePanels['default-purchase-panel'] || {
    id: 'default-purchase-panel',
    name: 'Purchase Ticket Panel',
    channelType: 'text',
    category: '╰--- 𝐓𝐢𝐜𝐤𝐞𝐭𝐬',
    customTicketName: 'buy-{USER_NAME}',
    openLogChannel: '#ticket-logs',
    closeLogChannel: '#ticket-logs',
    embed: {
      authorName: 'ADAM Corporation Tickets',
      description: '<:140268information:1559615872409272419> Rules\n• Tickets Are For **Purchases** Only.\n• Any Other Requests = **Instant Ban**.\n• Stay **Respectful** Or Risk **Removal**.\n',
      color: '#ff0037',
      imageUrl: 'https://cdn.discordapp.com/attachments/1469382427985186829/1560177770300973136/image.png'
    }
  };

  purchasePanel.selectionMode = 'buttons';
  delete purchasePanel.selectPlaceholder;
  delete purchasePanel.useSelectMenu;
  delete purchasePanel.selectOptions;
  purchasePanel.buttons = [
    {
      id: 'buy_btn',
      label: 'Buy',
      style: 'Danger',
      emoji: '<:ClientsEmoji:1553290801528836136>',
      customId: 'ticket_create_buy'
    }
  ];

  // 2. Prepare Support Panel (Support tickets)
  const supportPanel = remotePanels['default-support-panel'] || {
    id: 'default-support-panel',
    name: 'Support Ticket Panel',
    channelType: 'text',
    category: '╰--- 𝐒𝐮𝐩𝐩𝐨𝐫𝐭',
    customTicketName: 'support-{USER_NAME}',
    openLogChannel: '#ticket-logs',
    closeLogChannel: '#ticket-logs',
    embed: {
      authorName: 'ADAM Corporation Support',
      description: '<:140268information:1559615872409272419> Rules\n• Tickets Are For **Support** Only.\n• Any Other Requests = **Instant Ban**.\n• Stay **Respectful** Or Risk **Removal**.\n',
      color: '#ff0037',
      imageUrl: 'https://cdn.discordapp.com/attachments/1469382427985186829/1560177770300973136/image.png'
    }
  };

  supportPanel.selectionMode = 'buttons';
  delete supportPanel.selectPlaceholder;
  delete supportPanel.useSelectMenu;
  delete supportPanel.selectOptions;
  supportPanel.buttons = [
    {
      id: 'support_btn',
      label: 'Get Support',
      style: 'Danger',
      emoji: '<:952298discordstaff:1560162157860102264>',
      customId: 'ticket_create_support'
    }
  ];

  console.log('💾 Saving updated panels to Supabase...');
  await upsertPanelToSupabase('default-purchase-panel', purchasePanel);
  await upsertPanelToSupabase('default-support-panel', supportPanel);
  console.log('✅ Supabase panels successfully updated with buttons.');

  console.log('🤖 Connecting Discord bot to update embed messages in Discord guild...');
  const client = await initBot(() => {});

  // Wait for client to be ready
  if (!client.isReady()) {
    await new Promise((resolve) => {
      client.once('clientReady', resolve);
    });
  }

  // Update Buy Ticket Panel in Discord
  const purchaseChannelId = purchasePanel.deployedChannelId || '1521227405468106779';
  console.log(`🚀 Updating Purchase Panel in Discord channel <#${purchaseChannelId}>...`);
  try {
    const resBuy = await deployPanelEmbed(purchasePanel, purchaseChannelId);
    console.log(`✅ Purchase Panel updated in Discord:`, resBuy);
  } catch (err) {
    console.error(`❌ Failed updating Purchase Panel in Discord:`, err.message);
  }

  // Update Support Ticket Panel in Discord
  const supportChannelId = supportPanel.deployedChannelId || '1559556554620010558';
  console.log(`🚀 Updating Support Panel in Discord channel <#${supportChannelId}>...`);
  try {
    const resSup = await deployPanelEmbed(supportPanel, supportChannelId);
    console.log(`✅ Support Panel updated in Discord:`, resSup);
  } catch (err) {
    console.error(`❌ Failed updating Support Panel in Discord:`, err.message);
  }

  console.log('🎉 All panels updated successfully in Discord and Supabase!');
  setTimeout(() => process.exit(0), 1000);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
