const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'Admin' } });
  const staff = await prisma.user.findFirst({ where: { role: 'Staff' } });
  
  const req = await prisma.request.findFirst({ where: { ticketNumber: 'WTR-042' } });

  console.log('--- Initial Request ---');
  console.log(req);

  // ACKNOWLEDGE
  await prisma.request.update({
    where: { id: req.id },
    data: { status: 'ACKNOWLEDGED' }
  });
  console.log('--- Status: ACKNOWLEDGED ---');

  // PROCESSING
  await prisma.request.update({
    where: { id: req.id },
    data: { status: 'PROCESSING' }
  });
  console.log('--- Status: PROCESSING ---');

  // RESOLVED
  await prisma.request.update({
    where: { id: req.id },
    data: { status: 'RESOLVED', resolvedAt: new Date() }
  });
  console.log('--- Status: RESOLVED ---');

  // VERIFIED
  await prisma.request.update({
    where: { id: req.id },
    data: { status: 'VERIFIED' }
  });
  console.log('--- Status: VERIFIED ---');

  // CLOSED
  await prisma.request.update({
    where: { id: req.id },
    data: { status: 'CLOSED' }
  });
  console.log('--- Status: CLOSED ---');
  
  const finalReq = await prisma.request.findUnique({ where: { id: req.id } });
  console.log(finalReq);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
