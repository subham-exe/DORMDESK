const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- STARTING E2E DB SETUP ---');
const dbDir = path.resolve(__dirname, '../test_db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.resolve(dbDir, 'e2e.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
if (fs.existsSync(dbPath + '-journal')) fs.unlinkSync(dbPath + '-journal');
if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
const e2eSchemaPath = path.resolve(__dirname, '../prisma/schema.e2e.prisma');

let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace('"file:./campus.db"', '"file:../test_db/e2e.db"');
fs.writeFileSync(e2eSchemaPath, schema);

try {
  execSync('npx prisma migrate deploy --schema=prisma/schema.e2e.prisma', { stdio: 'inherit' });
  process.env.TEST_DATABASE_URL = `file:${dbPath}`;
  execSync('npx tsx scripts/seed-demo.ts', { stdio: 'inherit', env: process.env });
} finally {
  if (fs.existsSync(e2eSchemaPath)) fs.unlinkSync(e2eSchemaPath);
}
console.log('--- E2E DB SETUP COMPLETE ---');
