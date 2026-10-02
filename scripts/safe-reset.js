/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');

if (process.env.NODE_ENV === 'production') {
  console.error("FATAL: Cannot run local:reset in production environment.");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || "file:./campus.db";
if (!dbUrl.includes("file:") && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1") && !dbUrl.includes(":memory:")) {
  console.error("FATAL: DATABASE_URL appears to be a remote/production database. Reset aborted.");
  process.exit(1);
}

try {
  execSync("npx prisma migrate reset --force --skip-generate --skip-seed && npx prisma migrate deploy && npx prisma db seed", { stdio: 'inherit' });
} catch (e) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  process.exit(1);
}
