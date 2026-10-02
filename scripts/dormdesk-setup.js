/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require('fs');
const { spawnSync } = require('child_process');

function runCommand(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.error) {
    console.error(`Failed to execute: ${command} ${args.join(' ')}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}: ${command} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

try {
  console.log('\n[1/4] Ensuring dependencies are installed...');
  console.log('Skipping npm install to avoid script policy issues.'); // runCommand('npm', ['install', '--ignore-scripts']);

  console.log('\n[2/4] Generating Prisma client...');
  runCommand('npx', ['prisma', 'generate']);

  console.log('\n[3/4] Resetting and migrating database to a clean deterministic state...');
  runCommand('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-generate', '--skip-seed']);
  runCommand('npx', ['prisma', 'migrate', 'deploy']);

  console.log('\n[4/4] Seeding the database...');
  runCommand('npx', ['prisma', 'db', 'seed']);

  console.log('\n=========================================');
  console.log('  DORMDESK SETUP COMPLETE!             ');
  console.log('  Database is seeded with demo accounts.');
  console.log('  Run "npm run local" to start the app.');
  console.log('=========================================\n');
} catch (error) {
  console.error('Setup failed:', error.message);
  process.exit(1);
}


