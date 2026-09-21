import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding minimal development data...');

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'John Doe',
      studentId: 'STU-1001',
      role: 'STUDENT',
      department: 'Computer Science',
      hostel: 'Hostel A',
      room: 'A-101'
    }
  });

  const warden = await prisma.user.upsert({
    where: { email: 'warden@example.com' },
    update: {},
    create: {
      email: 'warden@example.com',
      name: 'Jane Smith',
      staffId: 'STAFF-2001',
      role: 'WARDEN',
      domain: 'HOSTEL',
      scope: 'Hostel A',
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      staffId: 'ADMIN-001',
      role: 'ADMIN',
      domain: 'INSTITUTION',
      scope: 'ALL',
    }
  });

  // Create an incident
  const incident = await prisma.incident.upsert({
    where: { ticketNumber: 'INC-WTR-001' },
    update: {},
    create: {
      ticketNumber: 'INC-WTR-001',
      title: 'No water in Block A',
      category: 'WATER',
      location: 'Hostel A, Block A',
      severity: 'HIGH',
      status: 'OPEN',
      assignedTeam: 'Maintenance Team Alpha'
    }
  });

  // Create requests
  const req1 = await prisma.request.create({
    data: {
      ticketNumber: 'COM-' + Date.now() + '-1',
      requestType: 'COMPLAINT',
      category: 'WATER',
      description: 'Tap is completely dry since morning.',
      location: 'Hostel A, Room A-101',
      status: 'ACKNOWLEDGE',
      priority: 'HIGH',
      requesterId: student.id,
      incidentId: incident.id,
      assignedDepartment: 'MAINTENANCE',
      assignedAuthorityId: warden.id
    }
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      actorId: student.id,
      action: 'REQUEST_CREATED',
      entity: 'REQUEST',
      entityId: req1.id,
      requestId: req1.id,
    }
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
