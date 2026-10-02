/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { spawnSync } = require('child_process');
const readline = require('readline');
const pc = require('picocolors');

function runCommand(command, args, hideOutput = false) {
  const isWin = process.platform === 'win32';
  const execCmd = isWin ? 'cmd.exe' : command;
  const execArgs = isWin ? ['/c', command, ...args] : args;

  const options = {};
  if (!hideOutput) {
    options.stdio = 'inherit';
  }
  const result = spawnSync(execCmd, execArgs, options);
  return result;
}

function clearScreen() {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

function centerText(text, totalWidth) {
  const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
  const padding = Math.max(0, totalWidth - visibleLength);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

function isUnicodeSafe() {
  if (process.platform !== 'win32') return true;
  if (process.env.WT_SESSION) return true;
  if (process.env.TERM_PROGRAM === 'vscode') return true;
  if (process.env.CI) return true;
  return false;
}

function printHeader() {
  const width = 76;
  const innerWidth = width - 2;

  const logoLines = [
    pc.blue(pc.bold('██████╗  ██████╗ ██████╗ ███╗   ███╗██████╗ ███████╗███████╗██╗  ██╗')),
    pc.blue(pc.bold('██╔══██╗██╔═══██╗██╔══██╗████╗ ████║██╔══██╗██╔════╝██╔════╝██║ ██╔╝')),
    pc.blue(pc.bold('██║  ██║██║   ██║██████╔╝██╔████╔██║██║  ██║█████╗  ███████╗█████╔╝ ')),
    pc.blue(pc.bold('██║  ██║██║   ██║██╔══██╗██║╚██╔╝██║██║  ██║██╔══╝  ╚════██║██╔═██╗ ')),
    pc.blue(pc.bold('██████╔╝╚██████╔╝██║  ██║██║ ╚═╝ ██║██████╔╝███████╗███████║██║  ██╗')),
    pc.blue(pc.bold('╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝'))
  ];

  const subtitle = 'ONE CAMPUS, ONE PLATFORM';

  if (isUnicodeSafe()) {
    console.log(pc.cyan('╔' + '═'.repeat(innerWidth) + '╗'));
    console.log(pc.cyan('║' + ' '.repeat(innerWidth) + '║'));
    console.log(pc.cyan('║' + ' '.repeat(innerWidth) + '║'));

    for (const line of logoLines) {
      console.log(pc.cyan('║') + centerText(line, innerWidth) + pc.cyan('║'));
    }

    console.log(pc.cyan('║' + ' '.repeat(innerWidth) + '║'));
    console.log(pc.cyan('║' + ' '.repeat(innerWidth) + '║'));
    console.log(pc.cyan('║') + centerText(pc.cyan(subtitle), innerWidth) + pc.cyan('║'));
    console.log(pc.cyan('║' + ' '.repeat(innerWidth) + '║'));
    console.log(pc.cyan('║' + ' '.repeat(innerWidth) + '║'));
    console.log(pc.cyan('╚' + '═'.repeat(innerWidth) + '╝\n'));

    console.log(centerText(pc.magenta('♥') + pc.cyan(' MADE WITH LOVE BY 404 ') + pc.magenta('♥'), width) + '\n');
  } else {
    console.log(pc.cyan('='.repeat(width)));
    console.log('');
    console.log('');
    console.log(centerText(pc.blue(pc.bold('DORMDESK')), width));
    console.log('');
    console.log('');
    console.log(centerText(pc.cyan(subtitle), width));
    console.log('');
    console.log('');
    console.log(pc.cyan('='.repeat(width)) + '\n');
    console.log(centerText(pc.magenta('<3') + pc.cyan(' MADE WITH LOVE BY 404 ') + pc.magenta('<3'), width) + '\n');
  }
}

function exitSequence() {
  console.log('\n' + pc.cyan('=================================================================='));
  console.log(pc.blue(pc.bold('                         DORMDESK')));
  console.log(pc.cyan('                       SESSION CLOSING'));
  console.log(pc.cyan('==================================================================\n'));
  console.log('  Closing the session ................. ' + pc.green('FINISHED'));
  console.log('  Signing off ........................ ' + pc.green('FINISHED\n'));
  console.log(pc.cyan('------------------------------------------------------------------\n'));
  console.log(pc.cyan('                    See you again.'));
  console.log(pc.magenta('                       Adios.\n'));
  console.log(pc.blue('                 <3 MADE WITH LOVE BY 404 <3\n'));
  console.log(pc.cyan('=================================================================='));
  process.exit(0);
}

function initialSetup() {
  clearScreen();
  printHeader();

  console.log(pc.white('------------------------------------------------------------------'));
  console.log(pc.white('  DORMDESK INITIALIZATION'));
  console.log(pc.white('------------------------------------------------------------------\n'));

  // 1. Prisma Client
  process.stdout.write('  [1/4] Preparing Prisma ............ ');
  const res1 = runCommand('npx', ['prisma', 'generate'], true);
  if (res1.error || res1.status !== 0) {
    console.log(pc.red('FAILED'));
    console.error(pc.red('\nError generating Prisma client. Ensure dependencies are installed (npm install).'));
    process.exit(1);
  }
  console.log(pc.green('OK'));

  // 2. Preparing database
  process.stdout.write('  [2/4] Preparing database .......... ');
  const res2 = runCommand('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-generate', '--skip-seed'], true);
  if (res2.error || res2.status !== 0) {
    console.log(pc.red('FAILED'));
    console.error(pc.red('\nError resetting database.'));
    process.exit(1);
  }
  console.log(pc.green('OK'));

  // 3. Applying migrations
  process.stdout.write('  [3/4] Applying migrations ......... ');
  const res3 = runCommand('npx', ['prisma', 'migrate', 'deploy'], true);
  if (res3.error || res3.status !== 0) {
    console.log(pc.red('FAILED'));
    console.error(pc.red('\nError applying migrations.'));
    process.exit(1);
  }
  console.log(pc.green('OK'));

  // 4. Seeding demo data
  process.stdout.write('  [4/4] Seeding demo data ........... ');
  const res4 = runCommand('npx', ['prisma', 'db', 'seed'], true);
  if (res4.error || res4.status !== 0) {
    console.log(pc.red('FAILED'));
    console.error(pc.red('\nError seeding database.'));
    process.exit(1);
  }
  console.log(pc.green('OK\n'));

  showCompletionScreen();
}

function showCompletionScreen() {
  console.log(pc.cyan('=================================================================='));
  console.log(pc.blue(pc.bold('                    DORMDESK IS READY')));
  console.log(pc.cyan('==================================================================\n'));

  console.log(`  Database       ${pc.green('OK')} Ready`);
  console.log(`  Migrations     ${pc.green('OK')} Current`);
  console.log(`  Demo accounts  ${pc.green('OK')} Seeded\n`);

  console.log('  Demo accounts:');
  console.log('    Student : student@demo.local');
  console.log('    Staff   : staff@demo.local');
  console.log('    Warden  : warden@demo.local');
  console.log('    Admin   : admin@demo.local\n');

  console.log('  Password: dormdesk2026\n');
  
  showMenu();
}

function showMenu() {
  console.log(pc.white('------------------------------------------------------------------'));
  console.log(pc.white('  WHAT WOULD YOU LIKE TO DO?'));
  console.log(pc.white('------------------------------------------------------------------\n'));
  console.log(pc.yellow('  [1]') + ' Start DORMDESK');
  console.log(pc.yellow('  [2]') + ' Reset & reseed database');
  console.log(pc.yellow('  [3]') + ' Check database status');
  console.log(pc.yellow('  [4]') + ' Exit\n');

  promptMenu();
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('SIGINT', () => {
  exitSequence();
});

function promptMenu() {
  rl.question('  Select an option: ', (answer) => {
    const choice = answer.trim();
    if (choice === '1') {
      console.log('\nStarting DORMDESK...\n');
      runCommand('npm', ['run', 'local']);
      showMenu();
    } else if (choice === '2') {
      console.log('\nResetting and reseeding database...\n');
      const res = runCommand('npm', ['run', 'local:reset']);
      if (res.error || res.status !== 0) {
        console.log(pc.red('\n[ERROR] Database reset failed.\n'));
      } else {
        console.log(pc.green('\n[SUCCESS] Database successfully reset and reseeded.\n'));
      }
      showMenu();
    } else if (choice === '3') {
      console.log('\nChecking database status...\n');
      runCommand('npx', ['prisma', 'migrate', 'status']);
      console.log();
      showMenu();
    } else if (choice === '4') {
      exitSequence();
    } else {
      console.log(pc.red('  Invalid option. Please choose 1, 2, 3, or 4.\n'));
      promptMenu();
    }
  });
}

// Start everything
initialSetup();
