import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  supabase, 
  isSupabaseConfigured, 
  upsertPanelToSupabase, 
  upsertAllTicketsToSupabase, 
  upsertSettingToSupabase, 
  upsertAuditLogToSupabase 
} from '../src/db/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

dotenv.config();

async function runMigration() {
  console.log('========================================================');
  console.log('🚀 Supabase Migration Tool for Adam Ticket King Bot');
  console.log('========================================================\n');

  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is NOT configured!');
    console.error('Please add the following variables to your .env file:');
    console.error('  SUPABASE_URL=https://<your-project>.supabase.co');
    console.error('  SUPABASE_ANON_KEY=eyJhbGciOi...');
    console.error('\nThen re-run: node scripts/migrate-to-supabase.js');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase at:', process.env.SUPABASE_URL);

  // 1. Migrate Panels
  const panelsPath = path.join(DATA_DIR, 'panels.json');
  if (fs.existsSync(panelsPath)) {
    try {
      const panels = JSON.parse(fs.readFileSync(panelsPath, 'utf8'));
      const count = Object.keys(panels).length;
      console.log(`\n📦 Migrating ${count} ticket panel(s)...`);
      for (const [id, panelData] of Object.entries(panels)) {
        await upsertPanelToSupabase(id, panelData);
        console.log(`   ✓ Panel: "${panelData.name || id}"`);
      }
    } catch (e) {
      console.error('❌ Error migrating panels:', e.message);
    }
  } else {
    console.log('⚠️ No panels.json file found to migrate.');
  }

  // 2. Migrate Tickets
  const ticketsPath = path.join(DATA_DIR, 'tickets.json');
  if (fs.existsSync(ticketsPath)) {
    try {
      const ticketsData = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
      const ticketsList = ticketsData.tickets || [];
      console.log(`\n🎫 Migrating ${ticketsList.length} ticket(s)...`);
      await upsertAllTicketsToSupabase(ticketsList);
      console.log(`   ✓ Successfully synced ${ticketsList.length} tickets to Supabase!`);
    } catch (e) {
      console.error('❌ Error migrating tickets:', e.message);
    }
  } else {
    console.log('⚠️ No tickets.json file found to migrate.');
  }

  // 3. Migrate Settings
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      console.log(`\n⚙️ Migrating settings...`);
      for (const [key, value] of Object.entries(settings)) {
        await upsertSettingToSupabase(key, value);
      }
      console.log(`   ✓ Synced server settings (${Object.keys(settings).length} keys)`);
    } catch (e) {
      console.error('❌ Error migrating settings:', e.message);
    }
  } else {
    console.log('⚠️ No settings.json file found to migrate.');
  }

  // 4. Migrate Audit Logs
  const logsPath = path.join(DATA_DIR, 'audit_logs.json');
  if (fs.existsSync(logsPath)) {
    try {
      const logsData = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
      const logs = logsData.logs || [];
      console.log(`\n📜 Migrating ${logs.length} audit log(s)...`);
      for (const log of logs.slice(0, 50)) {
        await upsertAuditLogToSupabase(log);
      }
      console.log(`   ✓ Synced ${Math.min(logs.length, 50)} audit logs`);
    } catch (e) {
      console.error('❌ Error migrating audit logs:', e.message);
    }
  } else {
    console.log('⚠️ No audit_logs.json file found to migrate.');
  }

  console.log('\n========================================================');
  console.log('✨ MIGRATION COMPLETE! All data is now in Supabase.');
  console.log('========================================================');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('\n❌ Fatal Migration Error:', err);
  process.exit(1);
});
