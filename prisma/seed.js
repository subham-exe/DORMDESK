const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.request.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.user.deleteMany();

  // Create Seed Users
  const student = await prisma.user.create({
    data: {
      email: 'student@example.com',
      name: 'Test Student',
      role: 'Student',
      department: 'Computer Science',
      year: 2,
      branch: 'CSE',
      isResident: true,
      hostel: 'Hostel B',
      block: 'Block 2',
      room: '204',
    },
  });

  const warden = await prisma.user.create({
    data: {
      email: 'warden@example.com',
      name: 'Warden John',
      role: 'Warden',
      hostel: 'Hostel B',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'System Admin',
      role: 'Admin',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'maintenance@example.com',
      name: 'Maintenance Staff B',
      role: 'Staff',
      department: 'Maintenance',
    },
  });

  // Create Scholarship
  await prisma.scholarship.create({
    data: {
      studentId: student.id,
      academicYear: '2025-2026',
      status: 'APPROVED',
    },
  });

  // Create a recurring incident
  const incident = await prisma.incident.create({
    data: {
      title: 'Water Supply Failure',
      description: 'Multiple reports of no water in Hostel B Block 2',
      category: 'Water',
      location: 'Hostel B, Block 2',
      assignedDepartment: 'Maintenance',
      status: 'OPEN',
    },
  });

  // Create Request
  const request1 = await prisma.request.create({
    data: {
      ticketNumber: 'WTR-042',
      requestType: 'COMPLAINT',
      category: 'Water',
      requesterId: student.id,
      description: 'No water in the tap',
      location: 'Hostel B, Block 2, Room 204',
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedDepartment: 'Maintenance',
      assignedAuthorityId: staff.id,
      SLA: 4,
      incidentId: incident.id,
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    },
  });

  // Add Audit log
  await prisma.auditLog.create({
    data: {
      requestId: request1.id,
      actorId: student.id,
      action: 'CREATED',
      entity: 'Request',
      entityId: request1.id,
      metadata: JSON.stringify({ priority: 'HIGH' }),
    },
  });
  
  await prisma.auditLog.create({
    data: {
      requestId: request1.id,
      actorId: admin.id,
      action: 'ASSIGNED',
      entity: 'Request',
      entityId: request1.id,
      metadata: JSON.stringify({ assignedTo: staff.name }),
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
