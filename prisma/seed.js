// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD || 'dormdesk2026';
  const hashedPassword = await bcrypt.hash(password, 10);


  
  console.log('Clearing database cleanly...');
  const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations';`;
  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF;`);
  for (const { name } of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
  }
  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);

  console.log('Seeding Authority Levels...');
  const authorities = [
    { name: 'SYSTEM_ADMIN', levelNumber: 100 },
    { name: 'PRINCIPAL', levelNumber: 80 },
    { name: 'HOD', levelNumber: 70 },
    { name: 'FACULTY', levelNumber: 60 },
    { name: 'WARDEN', levelNumber: 50 },
    { name: 'STAFF', levelNumber: 40 },
    { name: 'STUDENT', levelNumber: 10 }
  ];
  const authorityMap = {};
  for (const auth of authorities) {
    const record = await prisma.authorityLevel.upsert({
      where: { name: auth.name },
      update: { levelNumber: auth.levelNumber },
      create: auth
    });
    authorityMap[auth.name] = record.id;
  }

  console.log('Seeding Users (Demo Core)...');
  const users = {
    student: await prisma.user.create({ data: { id: 'usr-student', email: 'student@demo.local', password: hashedPassword, name: 'Student (Judge)', role: 'Student', authorityId: authorityMap['STUDENT'], department: 'Computer Science', year: 2, branch: 'CSE', isResident: true, hostel: 'Hostel A', block: 'North', room: '101' } }),
    warden: await prisma.user.create({ data: { id: 'usr-warden', email: 'warden@demo.local', password: hashedPassword, name: 'Warden', role: 'Warden', authorityId: authorityMap['WARDEN'], hostel: 'Hostel A' } }),
    staff: await prisma.user.create({ data: { id: 'usr-staff', email: 'staff@demo.local', password: hashedPassword, name: 'Staff (Plumbing)', role: 'Staff', authorityId: authorityMap['STAFF'], department: 'Plumbing' } }),
    admin: await prisma.user.create({ data: { id: 'usr-admin', email: 'admin@demo.local', password: hashedPassword, name: 'Admin (Command Center)', role: 'Admin' } }),
  };

  const extraStudents = [];
  for(let i = 1; i <= 3; i++) {
    extraStudents.push(await prisma.user.create({
      data: {
        id: `usr-peer-${i}`,
        email: `peer${i}@demo.local`,
        password: hashedPassword,
        name: `Peer Student ${i}`,
        role: 'Student', authorityId: authorityMap['STUDENT'],
        isResident: true,
        hostel: 'Hostel A',
        block: 'North',
      }
    }));
  }

  console.log('Seeding Policies...');
  await prisma.policy.createMany({
    data: [
      {
        id: 'pol-general',
        name: 'General Complaint SLA',
        description: 'All complaints have a 24-hour target SLA by default',
        requestType: 'COMPLAINT',
        approvalRequired: false,
        slaHours: 24,
        isActive: true,
      },
      {
        id: 'pol-plumbing',
        name: 'Plumbing Escalation Policy',
        description: 'Plumbing complaints escalate to Warden if SLA breached',
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        approvalRequired: false,
        slaHours: 12, // Strict 12h SLA for plumbing
        escalationPolicy: JSON.stringify({ escalateToRole: 'Warden', afterSlaBreach: true }),
        isActive: true,
      },
      {
        id: 'pol-fallback',
        name: 'Default Fallback Policy',
        description: 'Catch-all policy',
        approvalRequired: true,
        isActive: true,
      }
    ]
  });

  console.log('Seeding Deterministic Requests & Incident...');
  
  const now = Date.now();
  const ONE_HOUR = 3600000;

  let ticketCounter = 1;
  const createReq = async (ticketPrefix, type, category, reqId, desc, loc, prio, status, extra = {}) => {
    const ticketId = ticketCounter++;
    return prisma.request.create({
      data: {
        id: `req-${ticketPrefix.toLowerCase()}-${ticketId}`,
        ticketNumber: `${ticketPrefix}-${ticketId.toString().padStart(4, '0')}`,
        requestType: type,
        category,
        requesterId: reqId,
        description: desc,
        location: loc,
        priority: prio,
        status: status,
        ...extra,
        requestSla: extra.SLA ? {
          create: {
            targetHours: extra.SLA,
            dueAt: extra.dueAt || new Date(Date.now() + extra.SLA * 3600000),
            status: extra.status === 'RESOLVED' ? 'RESOLVED' : (extra.dueAt && extra.dueAt < new Date() ? 'BREACHED' : 'ACTIVE')
          }
        } : undefined
      }
    });
  };

  // 1. Two unclustered Plumbing requests from peers (threshold for clustering is 3)
  // When the judge creates the 3rd, it will cluster them and trigger a high impact incident.
  await createReq('PLM', 'COMPLAINT', 'Plumbing', extraStudents[0].id, 'No water in 1st floor washrooms', 'Hostel A, North Block', 'HIGH', 'ASSIGNED', { assignedDepartment: 'Plumbing', assignedAuthorityId: users.staff.id, SLA: 12, dueAt: new Date(now + 8 * ONE_HOUR), createdAt: new Date(now - 4 * ONE_HOUR) });
  await createReq('PLM', 'COMPLAINT', 'Plumbing', extraStudents[1].id, 'Water is completely dry', 'Hostel A, North Block', 'HIGH', 'ASSIGNED', { assignedDepartment: 'Plumbing', assignedAuthorityId: users.staff.id, SLA: 12, dueAt: new Date(now + 9 * ONE_HOUR), createdAt: new Date(now - 3 * ONE_HOUR) });


  // 2. SLA Warning Request (Due in 1 hour)
  await createReq('ELE', 'COMPLAINT', 'Electrical', users.student.id, 'Fan is not working', 'Hostel A, Room 101', 'MEDIUM', 'ASSIGNED', { 
    assignedDepartment: 'Electrical',
    SLA: 24, 
    createdAt: new Date(now - 23 * ONE_HOUR),
    dueAt: new Date(now + 1 * ONE_HOUR) 
  });

  // 3. SLA Breached Request with Escalation (Due 2 hours ago)
  const breached = await createReq('PLM', 'COMPLAINT', 'Plumbing', users.student.id, 'Pipe leaking continuously', 'Hostel A, Room 101', 'HIGH', 'PENDING', { 
    SLA: 12, 
    createdAt: new Date(now - 14 * ONE_HOUR),
    dueAt: new Date(now - 2 * ONE_HOUR) 
  });

  await prisma.escalation.create({
    data: {
      id: 'esc-1',
      requestId: breached.id,
      level: 1,
      createdAt: new Date(now - 1 * ONE_HOUR)
    }
  });

  // 4. Stale Request (Pending for 3 days)
  await createReq('CLN', 'COMPLAINT', 'Cleanliness', extraStudents[0].id, 'Corridor not swept', 'Hostel A, North Block', 'LOW', 'PENDING', { 
    createdAt: new Date(now - 72 * ONE_HOUR)
  });

  console.log('Seeding Notifications...');
  
  // Notification to Warden about the escalation
  await prisma.notification.create({
    data: {
      id: 'notif-1',
      recipientId: users.warden.id,
      title: 'Escalation: SLA Breached',
      message: `Request ${breached.ticketNumber} has breached its SLA. Action required.`,
      type: 'ESCALATION',
      metadata: JSON.stringify({ requestId: breached.id })
    }
  });
  
  // Simulated SMS outbox for the escalation
  await prisma.smsOutbox.create({
    data: {
      id: 'sms-1',
      recipientId: users.warden.id,
      phoneNumber: '+91-555-WARDEN1',
      message: `DORMDESK ESCALATION: Request ${breached.ticketNumber} breached SLA.`,
      type: 'ESCALATION',
      status: 'SIMULATED_SENT',
      referenceId: breached.id,
      sentAt: new Date()
    }
  });

  console.log('\n=========================================');
  console.log('  DEMO DATABASE SEEDED SUCCESSFULLY!     ');
  console.log('=========================================\n');
  
  console.log('Demo Identity Credentials (Password: dormdesk2026):');
  console.log(' - Student : student@demo.local');
  console.log(' - Staff   : staff@demo.local');
  console.log(' - Warden  : warden@demo.local');
  console.log(' - Admin   : admin@demo.local');
  
  console.log('\nDemo Scenario Instructions:');
  console.log(' 1. Log in as student@demo.local');
  console.log(' 2. Submit a new Plumbing complaint for "Hostel A, North Block"');
  console.log(' 3. This will trigger auto-clustering, adding your request to the existing incident.');
  console.log(' 4. The incident impact score will cross 30 (High Impact).');
  console.log(' 5. Log in as admin@demo.local to see the High Impact Incident in Command Center.');
  console.log(' 6. See SLA breaches, Warnings, and Escalations clearly visible.');
  console.log('=========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
