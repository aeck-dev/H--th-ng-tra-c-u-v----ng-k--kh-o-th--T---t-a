// Schedule periodic sync using node-cron
const cron = require('node-cron');
const { exec } = require('child_process');

const SYNC_INTERVAL = process.env.SYNC_INTERVAL_MINUTES || 5;

console.log(`\n🕐 Starting scheduled sync every ${SYNC_INTERVAL} minutes...\n`);

// Run sync every N minutes
cron.schedule(`*/${SYNC_INTERVAL} * * * *`, () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[$timestamp] 🔄 Running scheduled sync...`);
  
  exec('node sync-users.js new', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Sync error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️  Stderr: ${stderr}`);
    }
    console.log(stdout);
  });
});

// Also run immediately on start
console.log('🚀 Running initial sync...\n');
exec('node sync-users.js new', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Initial sync error: ${error.message}`);
    return;
  }
  console.log(stdout);
  console.log('✅ Scheduler is running. Press Ctrl+C to stop.\n');
});

// Keep process alive
process.stdin.resume();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping scheduler...');
  process.exit(0);
});
