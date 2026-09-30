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

  if (!dbExists) {
    console.error('\n[ERROR] Database not found.');
    console.error('Ordinary startup assumes the database schema is already migrated.');
    console.error('Please initialize the database first using explicit migration deployment:');
    console.error('  npm run db:deploy');
    console.error('  npx prisma db seed');
    console.error('Or use the destructive reset command for a fresh local demo environment:');
    console.error('  npm run local:reset\n');
    process.exit(1);
  }

  // We explicitly DO NOT run schema mutating operations here anymore.
  // The schema is assumed to be migrated already.

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
