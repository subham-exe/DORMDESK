/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === 'production') {
  console.error("FATAL: Cannot run local:reset in production environment.");
  process.exit(1);
}

const dbPaths = [
  path.join(__dirname, '../prisma/campus.db'),
  path.join(__dirname, '../prisma/campus.db-journal'),
  path.join(__dirname, '../campus.db'),
  path.join(__dirname, '../campus.db-journal')
];

for (const p of dbPaths) {
  if (fs.existsSync(p)) {
    try {
      fs.rmSync(p, { force: true });
      console.log('Deleted ' + p);
    } catch (e) {
      console.warn('Could not delete ' + p, e.message);
    }
  }
}

try {
  execSync("npx prisma migrate deploy && npx prisma db seed", { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
