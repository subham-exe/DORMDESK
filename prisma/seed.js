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

  console.log('Seeding Demo Users...');
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

  console.log('Seeding Incident (Water Issue in Hostel A)...');
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

  // 1. PENDING - Electrical Issue
  await createReq('ELE', 'COMPLAINT', 'Electrical', users.student1.id, 'Ceiling fan is making loud noise', 'Hostel A, Room 101', 'MEDIUM', 'PENDING');

  // 2. ASSIGNED - Part of Incident
  await createReq('PLM', 'COMPLAINT', 'Plumbing', users.student1.id, 'Washroom tap is dry', 'Hostel A, North Block Washroom', 'HIGH', 'ASSIGNED', {
    assignedDepartment: 'Plumbing',
    assignedAuthorityId: users.staff2.id,
    incidentId: incident1.id,
    SLA: 4,
    dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // SLA demo: Due in 2 hours
  });

  // 3. ACKNOWLEDGED - Part of Incident
  await createReq('PLM', 'COMPLAINT', 'Plumbing', users.student2.id, 'No water for morning shower', 'Hostel A, North Block 2nd Floor', 'HIGH', 'ACKNOWLEDGED', {
    assignedDepartment: 'Plumbing',
    assignedAuthorityId: users.staff2.id,
    incidentId: incident1.id,
    SLA: 4,
    dueAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // SLA demo: Breached 1 hour ago
  });

  // 4. PROCESSING - Academic Issue
  await createReq('ACA', 'CERTIFICATE', 'Bonafide', users.student3.id, 'Need bonafide certificate for bank loan', 'Admin Block', 'LOW', 'PROCESSING', {
    assignedDepartment: 'Computer Science',
    assignedAuthorityId: users.professor.id,
  });

  // 5. RESOLVED - Maintenance Issue
  const reqRes = await createReq('MNT', 'COMPLAINT', 'Carpentry', users.student1.id, 'Broken chair in room', 'Hostel A, Room 101', 'LOW', 'RESOLVED', {
    assignedDepartment: 'Maintenance',
    assignedAuthorityId: users.staff1.id,
    resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  });

  // 6. VERIFIED
  await createReq('IT', 'COMPLAINT', 'Wi-Fi', users.student2.id, 'Wi-Fi speed is too slow', 'Hostel B, Room 205', 'MEDIUM', 'VERIFIED', {
    assignedDepartment: 'IT',
    resolvedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
  });
  
  // 6. CLOSED
  await createReq('IT', 'COMPLAINT', 'Wi-Fi', users.student2.id, 'Cannot connect to campus wifi', 'Hostel B, Room 205', 'MEDIUM', 'CLOSED', {
    assignedDepartment: 'IT',
    resolvedAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
  });

  // 7. APPROVED - Leave request (Zero-touch auto approve)
  await createReq('LV', 'LEAVE', 'Medical', users.student1.id, 'Going home for weekend (2 days)', 'Home', 'MEDIUM', 'APPROVED');

  // 8. REJECTED - Leave request
  await createReq('LV', 'LEAVE', 'Personal', users.student3.id, 'Want to go for a movie', 'City Mall', 'LOW', 'REJECTED', {
    assignedAuthorityId: users.warden.id
  });

  // 9. CANCELLED
  await createReq('ELE', 'COMPLAINT', 'Electrical', users.student2.id, 'Tubelight flickering', 'Hostel B, Room 205', 'LOW', 'CANCELLED');

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
