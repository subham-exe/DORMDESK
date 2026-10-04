const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const journalMode = await prisma.$queryRawUnsafe("PRAGMA journal_mode;");
  const synchronous = await prisma.$queryRawUnsafe("PRAGMA synchronous;");
  const busyTimeout = await prisma.$queryRawUnsafe("PRAGMA busy_timeout;");
  const foreignKeys = await prisma.$queryRawUnsafe("PRAGMA foreign_keys;");
  
  const counts = {};
  counts.user = await prisma.user.count();
  counts.request = await prisma.request.count();
  counts.auditLog = await prisma.auditLog.count();
  counts.notification = await prisma.notification.count();
  counts.emailDeliveryLog = await prisma.emailDeliveryLog.count();
  
  console.log("Journal Mode:", journalMode);
  console.log("Synchronous:", synchronous);
  console.log("Busy Timeout:", busyTimeout);
  console.log("Foreign Keys:", foreignKeys);
  console.log("Counts:", counts);
  
  await prisma.$disconnect();
}
run();
