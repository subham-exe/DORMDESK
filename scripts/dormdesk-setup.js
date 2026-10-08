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

function clearStaleProcesses() {
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      const psCmd = `Get-CimInstance Win32_Process | Where-Object Name -eq 'node.exe' | Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress`;
      const output = execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      
      let processes = [];
      try {
        if (output.trim()) {
           processes = JSON.parse(output);
           if (!Array.isArray(processes)) processes = [processes];
        }
      } catch(e) {}
      
      const currentPid = process.pid;
      const pidsToKill = [];
      const projectPath = require('path').resolve(__dirname, '..');
      
      for (const proc of processes) {
        const cmd = proc.CommandLine || '';
        if (proc.ProcessId !== currentPid) {
          const isDormdesk = cmd.includes('DORMDESK') || cmd.includes('dormdesk');
          const isSetup = cmd.includes('dormdesk-setup.js') || (cmd.includes('npm-cli.js') && cmd.includes('run DORMDESK')); 
          
          if (isDormdesk && !isSetup) {
            pidsToKill.push(proc.ProcessId);
          } else if (cmd.includes('scripts/local.js') || cmd.includes('scripts\\local.js')) {
            pidsToKill.push(proc.ProcessId);
          }
        }
      }
      
      if (pidsToKill.length > 0) {
        process.stdout.write('  [preflight] Clearing stale DORMDESK process .... ');
        for (const pid of pidsToKill) {
          try { process.kill(pid, 'SIGINT'); } catch(e) {}
        }
        
        const start = Date.now();
        while (Date.now() - start < 1500) {}
        
        for (const pid of pidsToKill) {
          try { process.kill(pid, 'SIGKILL'); } catch(e) {}
        }
        console.log(pc.green('OK'));
      }
    } catch(e) {
      // safely ignore WMI/permissions errors
    }
  }
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
  const isReset = process.argv.includes('--reset');

  clearScreen();
  printHeader();

  if (isReset) {
    console.log(pc.yellow('  DORMDESK RESET'));
    console.log(pc.yellow('  Database will be recreated with deterministic demo data.'));
    rl.question(pc.yellow('  Continue? [y/N] '), (answer) => {
      if (answer.trim().toLowerCase() !== 'y') {
        console.log(pc.red('  Aborted.'));
        process.exit(0);
      }
      runSetupFlow(true).catch(console.error);
    });
  } else {
    runSetupFlow(false).catch(console.error);
  }
}

async function runSetupFlow(isReset) {
  const fs = require('fs');
  const path = require('path');
  
  console.log(pc.white('\n------------------------------------------------------------------'));
  console.log(pc.white('  DORMDESK INITIALIZATION'));
  console.log(pc.white('------------------------------------------------------------------\n'));

  clearStaleProcesses();

  // 1. Prisma Client
  process.stdout.write('  [1/4] Preparing Prisma ............ ');
  const res1 = runCommand('npx', ['prisma', 'generate'], true);
  if (res1.error || res1.status !== 0) {
    console.log(pc.red('FAILED'));
    console.error(pc.red('\nError generating Prisma client. Ensure dependencies are installed (npm install).'));
    if (res1.stderr) console.error(res1.stderr.toString());
    process.exit(1);
  }
  console.log(pc.green('OK'));

  const { execSync } = require('child_process');

  let isDbReadyAndSeeded = false;
  try {
    const out = execSync('node scripts/db-verify.js check_ready', { encoding: 'utf-8' });
    isDbReadyAndSeeded = out.includes('READY');
  } catch(e) {
    isDbReadyAndSeeded = false;
  }

  let needsInitialization = false;

  // 2. Preparing database
  process.stdout.write('  [2/4] Preparing database .......... ');
  if (isReset) {
    console.log(pc.yellow('RESETTING'));
    const res2 = runCommand('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-generate', '--skip-seed'], true);
    if (res2.error || res2.status !== 0) {
       const dbPath = path.resolve(__dirname, '../prisma/campus.db');
       try { fs.rmSync(dbPath, { force: true }); } catch(e){}
       try { fs.rmSync(dbPath + '-journal', { force: true }); } catch(e){}
       try { fs.rmSync(dbPath + '-wal', { force: true }); } catch(e){}
       try { fs.rmSync(dbPath + '-shm', { force: true }); } catch(e){}
    }
    needsInitialization = true;
  } else if (!isDbReadyAndSeeded) {
    console.log(pc.yellow('INITIALIZING'));
    needsInitialization = true;
  } else {
    console.log(pc.green('EXISTING'));
    const resDeploy = runCommand('npx', ['prisma', 'migrate', 'deploy'], true);
    if (resDeploy.error || resDeploy.status !== 0) {
      console.error(pc.red('\nError verifying existing database migrations.'));
      process.exit(1);
    }
  }

  if (needsInitialization) {
    const res3 = runCommand('npx', ['prisma', 'migrate', 'deploy'], true);
    if (res3.error || res3.status !== 0) {
      console.error(pc.red('\nError applying migrations.'));
      process.exit(1);
    }
    const res4 = runCommand('npx', ['prisma', 'db', 'seed'], true);
    if (res4.error || res4.status !== 0) {
      console.error(pc.red('\nError seeding database.'));
      process.exit(1);
    }

    try {
      execSync('node scripts/db-verify.js verify', { stdio: 'pipe' });
    } catch (err) {
      if (err.stdout) console.error(pc.red('\n[ERROR] Seed verification failed: ' + err.stdout.toString().trim()));
      if (err.stderr) console.error(pc.red(err.stderr.toString().trim()));
      console.error(pc.red('Initialization/seed failed. The database is empty or unusable.'));
      process.exit(1);
    }
  }

  process.stdout.write('  [3/4] Starting DORMDESK ........... ');
  console.log(pc.green('OK'));
  process.stdout.write('  [4/4] Ready ....................... ');
  console.log(pc.cyan('http://localhost:3000\n'));

  console.log(pc.cyan('=================================================================='));
  console.log('  Demo accounts (Password: dormdesk2026):');
  console.log('    SYSTEM ADMIN : system@dormdesk.test');
  console.log('    PRINCIPAL    : principal.demo@dormdesk.local');
  console.log('    CSE HOD      : hod.cse@dormdesk.local');
  console.log('    WARDEN       : warden.boys@dormdesk.local');
  console.log('    STUDENT      : student001@dormdesk.local');
  console.log(pc.cyan('==================================================================\n'));

  runCommand('npm', ['run', 'local']);
  
  showCompletionScreen();
}

function showCompletionScreen() {
  console.log(pc.cyan('=================================================================='));
  console.log(pc.blue(pc.bold('                    DORMDESK IS READY')));
  console.log(pc.cyan('==================================================================\n'));

  console.log(`  Database       ${pc.green('OK')} Ready`);
  console.log(`  Migrations     ${pc.green('OK')} Current`);
  console.log(`  Demo accounts  ${pc.green('OK')} Seeded\n`);
  
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
      runSetupFlow(true).catch(console.error);
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

initialSetup();
