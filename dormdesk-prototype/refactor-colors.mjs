import fs from 'fs';
import path from 'path';

const dir = 'C:/Users/shaan/OneDrive/Desktop/PS007/dormdesk---campus-operations-engine/src';

const replacements = [
  { regex: /bg-\[\#0051d5\]/g, replacement: 'bg-slate-900' },
  { regex: /text-\[\#0051d5\]/g, replacement: 'text-slate-900' },
  { regex: /ring-\[\#0051d5\]/g, replacement: 'ring-slate-900' },
  { regex: /border-\[\#0051d5\]/g, replacement: 'border-slate-900' },
  { regex: /bg-\[\#eff4ff\]/g, replacement: 'bg-slate-50' },
  { regex: /border-\[\#dbe1ff\]/g, replacement: 'border-slate-200' },
  { regex: /bg-\[\#f8f9ff\]/g, replacement: 'bg-white' },
  { regex: /bg-\[\#0b1c30\]/g, replacement: 'bg-slate-900' },
  { regex: /text-\[\#0b1c30\]/g, replacement: 'text-slate-900' },
  { regex: /ring-\[\#0b1c30\]/g, replacement: 'ring-slate-900' },
  { regex: /border-\[\#0b1c30\]/g, replacement: 'border-slate-900' },
];

function processDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = content;
      for (const { regex, replacement } of replacements) {
        updated = updated.replace(regex, replacement);
      }
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(dir);
console.log('Color refactor complete.');
