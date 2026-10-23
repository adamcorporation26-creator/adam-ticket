import fs from 'fs';
import dotenv from 'dotenv';
import { createServer } from './server/index.js';
import { initBot } from './bot/index.js';
import { initDatabase } from './db/database.js';

if (fs.existsSync('.env')) {
  dotenv.config();
} else if (fs.existsSync('env')) {
  dotenv.config({ path: 'env' });
} else {
  dotenv.config();
}

const PORT = process.env.PORT || 3001;

// Global process error handlers to prevent crashes from unhandled rejections or Discord API errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

async function main() {
  console.log('🚀 Starting Ticket King Bot & Web Server...');
  
  // 1. Bind HTTP Server FIRST so Render detects the port immediately and health check succeeds
  const { broadcast } = createServer(PORT);
  console.log(`✨ Web Server listening on port ${PORT} (0.0.0.0:${PORT})`);

  // 2. Initialize Database from Supabase asynchronously
  try {
    await initDatabase();
  } catch (dbErr) {
    console.error('[Startup] Warning during Database sync:', dbErr.message);
  }

  // 3. Connect Discord Bot to Gateway
  try {
    const client = await initBot(broadcast);
    if (!client) {
      console.warn('[Startup] ⚠️ Bot did not start. Check your DISCORD_TOKEN environment variable in Render.');
    }
  } catch (botErr) {
    console.error('[Startup] Error connecting Discord Bot:', botErr.message);
  }
}

main().catch(err => {
  console.error('Fatal startup error:', err);
});

