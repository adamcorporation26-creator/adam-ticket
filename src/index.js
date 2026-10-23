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
  await initDatabase();
  const { broadcast } = createServer(PORT);
  await initBot(broadcast);
  console.log(`✨ Localhost Web Dashboard ready at http://localhost:${PORT}`);
}

main().catch(err => {
  console.error('Fatal startup error:', err);
});

