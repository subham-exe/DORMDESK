/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { spawnSync } = require('child_process');

function runCommand(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.error) {
    console.error(`Failed to start command: ${command} ${args.join(' ')}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}: ${command} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

try {
  console.log('Ensuring Prisma client is generated...');
  runCommand('npx', ['prisma', 'generate']);

  const dbExists = fs.existsSync('prisma/campus.db');

  console.log('Synchronizing database schema...');
  // Using db push to ensure schema is synced without unexpected data loss.
  runCommand('npx', ['prisma', 'db', 'push', '--skip-generate']);

  if (!dbExists) {
    console.log('Local database was newly created. Seeding initial data...');
    runCommand('npx', ['prisma', 'db', 'seed']);
  }

  console.log('\n=========================================');
  console.log('  DORMDESK STARTING                      ');
  console.log('  No separate backend server required.   ');
  console.log('  Next.js will print the local URL below.');
  console.log('=========================================\n');

  runCommand('npm', ['run', 'dev']);
} catch (error) {
  console.error('Local startup failed:', error.message);
  process.exit(1);
}
