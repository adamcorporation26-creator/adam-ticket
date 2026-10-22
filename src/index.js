import dotenv from 'dotenv';
import { createServer } from './server/index.js';
import { initBot } from './bot/index.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function main() {
  console.log('🚀 Starting Ticket King Bot & Web Server...');
  const { broadcast } = createServer(PORT);
  await initBot(broadcast);
  console.log(`✨ Localhost Web Dashboard ready at http://localhost:${PORT}`);
}

main().catch(err => {
  console.error('Fatal startup error:', err);
});
