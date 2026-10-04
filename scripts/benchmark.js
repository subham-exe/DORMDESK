const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { performance } = require('perf_hooks');

async function measure(name, fn) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

async function run() {
  console.log('--- DORMDESK DB BENCHMARK ---');

  // Baseline data fetching
  const user = await measure('Lookup System Admin', () => 
    prisma.user.findFirst({ where: { email: 'admin001@dormdesk.local' } })
  );

  const student = await measure('Lookup Student', () => 
    prisma.user.findFirst({ where: { email: 'student1@dormdesk.local' } })
  );

  if (student) {
    await measure('Student Request List (findMany)', () => 
      prisma.request.findMany({
        where: { requesterId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { requestSla: true }
      })
    );
  }

  const req = await measure('Lookup Single Request (findFirst)', () => 
    prisma.request.findFirst({ include: { statusHistory: true, evidences: true } })
  );

  await measure('Command Center Query (Dashboard)', () => 
    prisma.request.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { requester: true, assignedAuthority: true }
    })
  );

  await measure('Notifications List', () => 
    prisma.notification.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' }
    })
  );

  await measure('AuditLog List', () => 
    prisma.auditLog.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' }
    })
  );

  await measure('Count Requests by Status (Group By)', () => 
    prisma.request.groupBy({
      by: ['status'],
      _count: true
    })
  );

  await prisma.$disconnect();
}

run().catch(console.error);
