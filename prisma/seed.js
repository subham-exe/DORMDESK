// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD || 'dormdesk2026';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Clearing database...');
  await prisma.auditLog.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.request.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Demo Users (Core 9)...');
  const users = {
    student1: await prisma.user.create({ data: { email: 'student1@demo.dormdesk.local', password: hashedPassword, name: 'Aarav Sharma', role: 'Student', department: 'Computer Science', year: 2, branch: 'CSE', isResident: true, hostel: 'Hostel A', block: 'North', room: '101' } }),
    student2: await prisma.user.create({ data: { email: 'student2@demo.dormdesk.local', password: hashedPassword, name: 'Priya Patel', role: 'Student', department: 'Electrical', year: 3, branch: 'EE', isResident: true, hostel: 'Hostel B', block: 'South', room: '205' } }),
    student3: await prisma.user.create({ data: { email: 'student3@demo.dormdesk.local', password: hashedPassword, name: 'Rohan Gupta', role: 'Student', department: 'Mechanical', year: 1, branch: 'ME', isResident: false } }),
    warden: await prisma.user.create({ data: { email: 'warden@demo.dormdesk.local', password: hashedPassword, name: 'Rajesh Kumar', role: 'Warden', hostel: 'Hostel A' } }),
    professor: await prisma.user.create({ data: { email: 'professor@demo.dormdesk.local', password: hashedPassword, name: 'Dr. Neha Singh', role: 'Faculty', department: 'Computer Science' } }),
    hod: await prisma.user.create({ data: { email: 'hod@demo.dormdesk.local', password: hashedPassword, name: 'Dr. Amit Verma', role: 'Faculty', department: 'Computer Science' } }),
    principal: await prisma.user.create({ data: { email: 'principal@demo.dormdesk.local', password: hashedPassword, name: 'Dr. S. K. Reddy', role: 'Admin' } }),
    staff1: await prisma.user.create({ data: { email: 'staff.electrical@demo.dormdesk.local', password: hashedPassword, name: 'Electrical Maintenance', role: 'Staff', department: 'Electrical' } }),
    staff2: await prisma.user.create({ data: { email: 'staff.plumbing@demo.dormdesk.local', password: hashedPassword, name: 'Plumbing Services', role: 'Staff', department: 'Plumbing' } }),
  };

  console.log('Seeding 20 Additional Demo Students...');
  const branches = ['CSE', 'EE', 'ME', 'Civil'];
  const depts = ['Computer Science', 'Electrical', 'Mechanical', 'Civil Engineering'];
  const hostels = ['Hostel A', 'Hostel B', 'Hostel C'];
  const extraStudents = [];
  for(let i = 4; i <= 23; i++) {
    const isRes = i % 4 !== 0; // 75% resident
    extraStudents.push(await prisma.user.create({
      data: {
        email: `student${i}@demo.dormdesk.local`,
        password: hashedPassword,
        name: `Demo Student ${i}`,
        role: 'Student',
        department: depts[i % 4],
        year: (i % 4) + 1,
        branch: branches[i % 4],
        isResident: isRes,
        hostel: isRes ? hostels[i % 3] : null,
        block: isRes ? (i % 2 === 0 ? 'North' : 'South') : null,
        room: isRes ? `${(i%3)+1}0${i%9}` : null
      }
    }));
  }

  const allStudents = [users.student1, users.student2, users.student3, ...extraStudents];

  console.log('Seeding Incidents...');
  const incident1 = await prisma.incident.create({
    data: {
      title: 'No Water Supply in Hostel A (North Block)',
      description: 'Multiple students reporting lack of water in North Block washrooms.',
      category: 'Plumbing',
      location: 'Hostel A, North Block',
      assignedDepartment: 'Plumbing',
      status: 'OPEN',
    }
  });

  const incident1_closed = await prisma.incident.create({
    data: {
      title: 'Power Outage in Hostel B (South Block)',
      description: 'Main breaker tripped causing power loss.',
      category: 'Electrical',
      location: 'Hostel B, South Block',
      assignedDepartment: 'Electrical',
      status: 'RESOLVED',
    }
  });

  console.log('Seeding Requests...');
  const createReq = async (ticketPrefix, type, category, reqId, desc, loc, prio, status, extra = {}) => {
    return prisma.request.create({
      data: {
        ticketNumber: `${ticketPrefix}-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 1000)}`,
        requestType: type,
        category,
        requesterId: reqId,
        description: desc,
        location: loc,
        priority: prio,
        status: status,
        ...extra
      }
    });
  };

  const now = Date.now();
  const ONE_HOUR = 3600000;

  // Core requests from original seed
  await createReq('ELE', 'COMPLAINT', 'Electrical', users.student1.id, 'Ceiling fan is making loud noise', 'Hostel A, Room 101', 'MEDIUM', 'PENDING');
  await createReq('PLM', 'COMPLAINT', 'Plumbing', users.student1.id, 'Washroom tap is dry', 'Hostel A, North Block Washroom', 'HIGH', 'ASSIGNED', { assignedDepartment: 'Plumbing', assignedAuthorityId: users.staff2.id, incidentId: incident1.id, SLA: 4, dueAt: new Date(now + 2 * ONE_HOUR) });
  await createReq('PLM', 'COMPLAINT', 'Plumbing', users.student2.id, 'No water for morning shower', 'Hostel A, North Block 2nd Floor', 'HIGH', 'ACKNOWLEDGED', { assignedDepartment: 'Plumbing', assignedAuthorityId: users.staff2.id, incidentId: incident1.id, SLA: 4, dueAt: new Date(now - 1 * ONE_HOUR) });
  await createReq('ACA', 'CERTIFICATE', 'Bonafide', users.student3.id, 'Need bonafide certificate for bank loan', 'Admin Block', 'LOW', 'PROCESSING', { assignedDepartment: 'Computer Science', assignedAuthorityId: users.professor.id });
  const reqRes = await createReq('MNT', 'COMPLAINT', 'Carpentry', users.student1.id, 'Broken chair in room', 'Hostel A, Room 101', 'LOW', 'RESOLVED', { assignedDepartment: 'Maintenance', assignedAuthorityId: users.staff1.id, resolvedAt: new Date(now - 24 * ONE_HOUR) });
  await createReq('IT', 'COMPLAINT', 'Wi-Fi', users.student2.id, 'Wi-Fi speed is too slow', 'Hostel B, Room 205', 'MEDIUM', 'VERIFIED', { assignedDepartment: 'IT', resolvedAt: new Date(now - 48 * ONE_HOUR) });
  await createReq('IT', 'COMPLAINT', 'Wi-Fi', users.student2.id, 'Cannot connect to campus wifi', 'Hostel B, Room 205', 'MEDIUM', 'CLOSED', { assignedDepartment: 'IT', resolvedAt: new Date(now - 72 * ONE_HOUR) });
  await createReq('LV', 'LEAVE', 'Medical', users.student1.id, 'Going home for weekend (2 days)', 'Home', 'MEDIUM', 'APPROVED');
  await createReq('LV', 'LEAVE', 'Personal', users.student3.id, 'Want to go for a movie', 'City Mall', 'LOW', 'REJECTED', { assignedAuthorityId: users.warden.id });
  await createReq('ELE', 'COMPLAINT', 'Electrical', users.student2.id, 'Tubelight flickering', 'Hostel B, Room 205', 'LOW', 'CANCELLED');

  // Add more requests to hit 40
  // Gate Passes
  for(let i=0; i<3; i++) {
    await createReq('GP', 'GATEPASS', 'Local', allStudents[i].id, 'Going to local market', 'Market', 'LOW', 'APPROVED');
  }
  
  // Breaches (at least 4)
  for(let i=3; i<6; i++) {
    await createReq('ELE', 'COMPLAINT', 'Electrical', allStudents[i].id, 'Sparking socket', 'Hostel C', 'HIGH', 'ASSIGNED', { assignedDepartment: 'Electrical', assignedAuthorityId: users.staff1.id, SLA: 2, dueAt: new Date(now - Math.random() * 5 * ONE_HOUR) });
  }

  // Warnings (at least 3)
  for(let i=6; i<9; i++) {
    await createReq('PLM', 'COMPLAINT', 'Plumbing', allStudents[i].id, 'Leaking pipe', 'Hostel B', 'MEDIUM', 'PENDING', { SLA: 12, dueAt: new Date(now + 0.5 * ONE_HOUR) });
  }

  // Recurring Electrical/Plumbing (closed/verified to form patterns)
  for(let i=9; i<15; i++) {
    await createReq('PLM', 'COMPLAINT', 'Plumbing', allStudents[i].id, 'Blockage in sink', 'Hostel A', 'MEDIUM', 'CLOSED', { resolvedAt: new Date(now - (i*10) * ONE_HOUR) });
  }
  for(let i=15; i<20; i++) {
    await createReq('ELE', 'COMPLAINT', 'Electrical', allStudents[i].id, 'AC not working', 'Hostel C', 'MEDIUM', 'RESOLVED', { resolvedAt: new Date(now - (i*5) * ONE_HOUR) });
  }
  
  // Incident 2 requests (resolved)
  for(let i=0; i<5; i++) {
    await createReq('ELE', 'COMPLAINT', 'Electrical', allStudents[20-i].id, 'Total power outage', 'Hostel B, South Block', 'HIGH', 'CLOSED', { assignedDepartment: 'Electrical', incidentId: incident1_closed.id, resolvedAt: new Date(now - 100 * ONE_HOUR) });
  }

  console.log('Seeding Notifications...');
  await prisma.notification.createMany({
    data: [
      { recipientId: users.student1.id, title: 'Request Assigned', message: 'Your plumbing request has been assigned to Plumbing Services.', type: 'REQUEST_UPDATE' },
      { recipientId: users.student1.id, title: 'Request Resolved', message: 'Your carpentry request has been marked as resolved. Please verify.', type: 'REQUEST_UPDATE', metadata: JSON.stringify({ requestId: reqRes.id }) },
      { recipientId: users.staff2.id, title: 'Incident Assigned', message: 'You have been assigned to incident: No Water Supply in Hostel A', type: 'SYSTEM_ALERT' }
    ]
  });

  console.log('Seeding Scholarships...');
  await prisma.scholarship.createMany({
    data: [
      { studentId: users.student1.id, academicYear: '2025-2026', status: 'SUBMITTED' },
      { studentId: users.student2.id, academicYear: '2025-2026', status: 'APPROVED' },
      { studentId: users.student3.id, academicYear: '2025-2026', status: 'REJECTED' }
    ]
  });

  console.log('Demo database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
