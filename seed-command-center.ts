import { PrismaClient } from '@prisma/client';
import { IncidentIntelligenceService } from './src/lib/services/incident-intelligence';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Command Center data...');
  
  // Find a student and a staff
  const student = await prisma.user.findFirst({ where: { role: 'Student' } });
  const staff = await prisma.user.findFirst({ where: { role: 'Warden' } });
  const admin = await prisma.user.findFirst({ where: { role: 'Admin' } });

  if (!student || !staff || !admin) {
    console.error("Run standard seed first.");
    return;
  }

  // 1. SLA Breached Request
  await prisma.request.create({
    data: {
      ticketNumber: `COM-BREACH-1`,
      requestType: 'COMPLAINT',
      category: 'Electrical',
      description: 'Power outage in room since 2 days',
      location: 'Hostel A',
      priority: 'HIGH',
      status: 'PENDING',
      requesterId: student.id,
      SLA: 24,
      createdAt: new Date(Date.now() - 48 * 3600000), // 48h ago
    }
  });

  // 2. SLA Warning Request
  await prisma.request.create({
    data: {
      ticketNumber: `COM-WARN-1`,
      requestType: 'COMPLAINT',
      category: 'Plumbing',
      description: 'Leaking tap',
      location: 'Hostel B',
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      requesterId: student.id,
      assignedAuthorityId: staff.id,
      SLA: 24,
      createdAt: new Date(Date.now() - 22 * 3600000), // 22h ago (2h left)
    }
  });

  // 3. Stale Pending Request (No progress > 24h)
  await prisma.request.create({
    data: {
      ticketNumber: `COM-STALE-1`,
      requestType: 'OTHER',
      category: 'General',
      description: 'Need dustbin replacement',
      location: 'Hostel C',
      priority: 'LOW',
      status: 'PENDING',
      requesterId: student.id,
      createdAt: new Date(Date.now() - 30 * 3600000), // 30h ago
    }
  });

  // 4. Incident Cluster (High Impact)
  // Create 5 identical requests
  for (let i = 0; i < 5; i++) {
    await prisma.request.create({
      data: {
        ticketNumber: `COM-INC-${i}`,
        requestType: 'COMPLAINT',
        category: 'Water Supply',
        description: `No water on floor 3, request ${i}`,
        location: 'Hostel D - Floor 3',
        priority: 'CRITICAL',
        status: 'PENDING',
        requesterId: student.id,
        createdAt: new Date(Date.now() - 2 * 3600000),
      }
    });
  }

  // Run intelligence service to auto-cluster
  await IncidentIntelligenceService.autoClusterIncidents(admin.id);
  
  console.log('Command Center seeded successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
