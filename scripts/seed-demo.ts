import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_COLLEGE_ID = 'demo-synergy-college';
const PASS = 'dormdesk2026';

const STUDENTS = [
  { id: 'demo-stu-1', name: 'Aarav Mishra', email: 'aarav.demo@dormdesk.local', branch: 'CSE', year: 2, hostel: 'Block A', room: '101' },
  { id: 'demo-stu-2', name: 'Ananya Patnaik', email: 'ananya.demo@dormdesk.local', branch: 'ECE', year: 3, hostel: 'Block B', room: '205' },
  { id: 'demo-stu-3', name: 'Riya Das', email: 'riya.demo@dormdesk.local', branch: 'CSE', year: 1, hostel: 'Block A', room: '110' },
  { id: 'demo-stu-4', name: 'Soham Behera', email: 'soham.demo@dormdesk.local', branch: 'MECH', year: 4, hostel: 'Block C', room: '401' },
  { id: 'demo-stu-5', name: 'Sneha Rout', email: 'sneha.demo@dormdesk.local', branch: 'IT', year: 2, hostel: 'Block B', room: '210' },
  { id: 'demo-stu-6', name: 'Aditya Pradhan', email: 'aditya.demo@dormdesk.local', branch: 'CIVIL', year: 3, hostel: 'Block C', room: '302' },
  { id: 'demo-stu-7', name: 'Priya Mohanty', email: 'priya.demo@dormdesk.local', branch: 'EE', year: 1, hostel: 'Block A', room: '105' },
  { id: 'demo-stu-8', name: 'Rahul Sahu', email: 'rahul.demo@dormdesk.local', branch: 'CSE', year: 4, hostel: 'Block C', room: '410' },
  { id: 'demo-stu-9', name: 'Ishita Nayak', email: 'ishita.demo@dormdesk.local', branch: 'ECE', year: 2, hostel: 'Block B', room: '215' },
  { id: 'demo-stu-10', name: 'Arjun Panda', email: 'arjun.demo@dormdesk.local', branch: 'IT', year: 3, hostel: 'Block C', room: '305' },
];

async function main() {
  console.log('--- STARTING DEMO SEED ---');
  const hashedPass = await bcrypt.hash(PASS, 10);

  // 1. College
  const college = await prisma.college.upsert({
    where: { name: 'Synergy Institute of Engineering & Technology' },
    update: { id: DEMO_COLLEGE_ID, status: 'ACTIVE' } as any, // fallback if status doesn't exist
    create: {
      id: DEMO_COLLEGE_ID,
      name: 'Synergy Institute of Engineering & Technology'
    }
  });
  console.log('? College seeded:', college.name);

  const cseDept = await prisma.department.upsert({
    where: { id: 'demo-dept-cse' },
    update: { collegeId: college.id },
    create: { id: 'demo-dept-cse', name: 'Computer Science and Engineering', collegeId: college.id }
  });


  // 2. Authority Levels
  const authorities = [
    { name: 'SYSTEM_ADMIN', levelNumber: 100 },
      { name: 'PRINCIPAL', levelNumber: 80 },
    { name: 'HOD', levelNumber: 70 },
    { name: 'FACULTY', levelNumber: 60 },
    { name: 'WARDEN', levelNumber: 50 },
    { name: 'STAFF', levelNumber: 40 },
    { name: 'STUDENT', levelNumber: 10 }
  ];
  const authMap: Record<string, string> = {};
  for (const auth of authorities) {
    const record = await prisma.authorityLevel.upsert({
      where: { name: auth.name },
      update: { levelNumber: auth.levelNumber },
      create: auth
    });
    authMap[auth.name] = record.id;
  }
  console.log('? Authority levels verified.');

  // 3. Demo Authorities
  const systemAdmin = await prisma.user.upsert({
    where: { id: '001' },
    update: { email: 'system@dormdesk.test', authorityId: authMap['SYSTEM_ADMIN'] },
    create: { id: '001', name: 'System Admin', email: 'system@dormdesk.test', role: 'SystemAdmin', authorityId: authMap['SYSTEM_ADMIN'], password: hashedPass }
  });

  const principal = await prisma.user.upsert({
    where: { email: 'principal.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-principal', name: 'Dr. Principal', email: 'principal.demo@dormdesk.local', role: 'Admin', authorityId: authMap['PRINCIPAL'], collegeId: college.id, password: hashedPass }
  });
  
  const hod = await prisma.user.upsert({
    where: { email: 'hod.cse.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-hod', name: 'HOD CSE', email: 'hod.cse.demo@dormdesk.local', role: 'Admin', authorityId: authMap['HOD'], department: 'CSE', departmentRefId: cseDept.id, collegeId: college.id, password: hashedPass }
  });

  const faculty = await prisma.user.upsert({
    where: { email: 'faculty.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-faculty', name: 'Prof. Demo', email: 'faculty.demo@dormdesk.local', role: 'Faculty', authorityId: authMap['FACULTY'], department: 'CSE', departmentRefId: cseDept.id, collegeId: college.id, password: hashedPass }
  });

  const warden = await prisma.user.upsert({
    where: { email: 'warden.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-warden', name: 'Warden Demo', email: 'warden.demo@dormdesk.local', role: 'Warden', authorityId: authMap['WARDEN'], hostel: 'Block A', collegeId: college.id, password: hashedPass }
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-staff', name: 'Maintenance Staff', email: 'staff.demo@dormdesk.local', role: 'Staff', authorityId: authMap['STAFF'], department: 'Plumbing', collegeId: college.id, password: hashedPass }
  });
  console.log('? Authority accounts seeded.');

  // 4. Students
  for (const stu of STUDENTS) {
    await prisma.user.upsert({
      where: { email: stu.email },
      update: { collegeId: college.id, password: hashedPass },
      create: {
        id: stu.id, name: stu.name, email: stu.email, role: 'Student', authorityId: authMap['STUDENT'],
        department: stu.branch, departmentRefId: cseDept.id, year: stu.year, branch: stu.branch, hostel: stu.hostel, room: stu.room,
        isResident: true, collegeId: college.id, password: hashedPass
      }
    });
  }
  console.log(`? ${STUDENTS.length} Student accounts seeded.`);

  // Clean old demo requests to ensure idempotency is clean
  await prisma.auditLog.deleteMany({ where: { entityId: { startsWith: 'demo-req-' } } });
  await prisma.notification.deleteMany({ where: { metadata: { contains: 'demo-req-' } } });
  await prisma.requestSLA.deleteMany({ where: { requestId: { startsWith: 'demo-req-' } } });
  await prisma.requestAssignment.deleteMany({ where: { requestId: { startsWith: 'demo-req-' } } });
  await prisma.requestStatusHistory.deleteMany({ where: { requestId: { startsWith: 'demo-req-' } } });
  await prisma.request.deleteMany({ where: { id: { startsWith: 'demo-req-' } } });
  await prisma.incident.deleteMany({ where: { id: { startsWith: 'demo-inc-' } } });

  // 5. Requests Data
  const now = Date.now();
  const ONE_HOUR = 3600000;
  let counter = 100;
  
  async function createDemoReq(idSuffix: string, type: string, category: string, reqId: string, desc: string, status: string, options: any = {}) {
    const rId = `demo-req-${idSuffix}`;
    const req = await prisma.request.create({
      data: {
        id: rId,
        ticketNumber: `DEMO-${counter++}`,
        requestType: type,
        category,
        requesterId: reqId,
        description: desc,
        status,
        priority: options.priority || 'LOW',
        location: options.location,
        isSerious: options.isSerious || false,
        seriousCategory: options.seriousCategory,
        createdAt: options.createdAt || new Date(),
        updatedAt: options.updatedAt || new Date(),
        dueAt: options.dueAt,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
        incidentId: options.incidentId,
        assignedAuthorityId: options.assignedAuthorityId,
        requestSla: options.slaHours ? {
          create: {
            targetHours: options.slaHours,
            dueAt: options.dueAt || new Date(now + options.slaHours * ONE_HOUR),
            status: options.slaStatus || 'ACTIVE'
          }
        } : undefined
      }
    });
    
    // Add audit log
    await prisma.auditLog.create({
      data: {
        actorId: reqId, action: 'REQUEST_CREATED', entity: 'Request', entityId: rId,
        metadata: JSON.stringify({ status: 'PENDING' }), timestamp: options.createdAt || new Date()
      }
    });

    if (options.assignedAuthorityId) {
      await prisma.auditLog.create({
        data: {
          actorId: reqId, action: 'REQUEST_ASSIGNED', entity: 'Request', entityId: rId,
          timestamp: new Date((options.createdAt || new Date()).getTime() + 1000)
        }
      });
      await prisma.notification.create({
        data: {
          recipientId: options.assignedAuthorityId, title: 'New Request Assigned',
          message: `Request ${req.ticketNumber} assigned`, type: 'REQUEST_ASSIGNED',
          metadata: JSON.stringify({ requestId: rId })
        }
      });
    }
    
    return req;
  }

  // Mixed Requests
  await createDemoReq('1', 'COMPLAINT', 'Electrical', 'demo-stu-1', 'Ceiling fan in Room A-101 is not working.', 'PENDING', {
    location: 'Block A, 101', timestamp: new Date(now - 2 * ONE_HOUR), slaHours: 24
  });
  
  await createDemoReq('2', 'COMPLAINT', 'Internet', 'demo-stu-2', 'Hostel Wi-Fi has been unavailable since yesterday evening.', 'ASSIGNED', {
    location: 'Block B, 205', assignedAuthorityId: warden.id, timestamp: new Date(now - 12 * ONE_HOUR), slaHours: 24, priority: 'MEDIUM'
  });
  
  await createDemoReq('3', 'COMPLAINT', 'Plumbing', 'demo-stu-3', 'Water leakage near the second-floor washroom.', 'RESOLVED', {
    location: 'Block A, 2nd Floor', assignedAuthorityId: staff.id, timestamp: new Date(now - 48 * ONE_HOUR), slaHours: 12
  });

  await createDemoReq('4', 'CERTIFICATE', 'Academic', 'demo-stu-4', 'Request for bonafide certificate for education loan.', 'ACKNOWLEDGED', {
    assignedAuthorityId: hod.id, timestamp: new Date(now - 5 * ONE_HOUR), slaHours: 48
  });
  
  await createDemoReq('5', 'LEAVE', 'GatePass', 'demo-stu-5', 'Need gate-pass approval for weekend travel.', 'PROCESSING', {
    assignedAuthorityId: warden.id, timestamp: new Date(now - 8 * ONE_HOUR), slaHours: 24, priority: 'MEDIUM'
  });

  await createDemoReq('6', 'COMPLAINT', 'Mess', 'demo-stu-6', 'Mess dinner menu was not followed today.', 'PENDING', {
    timestamp: new Date(now - 1 * ONE_HOUR), slaHours: 24
  });

  await createDemoReq('7', 'COMPLAINT', 'Facility', 'demo-stu-7', 'Classroom projector is not displaying HDMI input.', 'ASSIGNED', {
    assignedAuthorityId: faculty.id, location: 'Room 302', timestamp: new Date(now - 3 * ONE_HOUR), slaHours: 24
  });

  // SLA Ageing / Overdue / Warning
  await createDemoReq('8', 'COMPLAINT', 'Plumbing', 'demo-stu-8', 'Shower head broken in washroom.', 'ASSIGNED', {
    assignedAuthorityId: staff.id, location: 'Block C', timestamp: new Date(now - 22 * ONE_HOUR), 
    slaHours: 24, dueAt: new Date(now + 2 * ONE_HOUR), slaStatus: 'WARNING', priority: 'HIGH'
  });
  
  await createDemoReq('9', 'COMPLAINT', 'Electrical', 'demo-stu-9', 'No power in the room.', 'ASSIGNED', {
    assignedAuthorityId: staff.id, location: 'Block B, 215', timestamp: new Date(now - 26 * ONE_HOUR), 
    slaHours: 24, dueAt: new Date(now - 2 * ONE_HOUR), slaStatus: 'BREACHED', priority: 'HIGH'
  });

  // Incidents
  const inc1 = await prisma.incident.create({
    data: { id: 'demo-inc-1', title: 'Hostel Block B Water Supply Issue', description: 'Multiple plumbing complaints regarding water supply in Block B', category: 'Plumbing', location: 'Block B', assignedDepartment: 'Plumbing', status: 'ACTIVE', impactScore: 40 }
  });
  await createDemoReq('10', 'COMPLAINT', 'Plumbing', 'demo-stu-2', 'No water in Block B morning.', 'PENDING', { incidentId: inc1.id, location: 'Block B' });
  await createDemoReq('11', 'COMPLAINT', 'Plumbing', 'demo-stu-5', 'Taps are dry.', 'PENDING', { incidentId: inc1.id, location: 'Block B' });
  await createDemoReq('12', 'COMPLAINT', 'Plumbing', 'demo-stu-9', 'Washroom water not available.', 'ASSIGNED', { assignedAuthorityId: staff.id, incidentId: inc1.id, location: 'Block B' });

  const inc2 = await prisma.incident.create({
    data: { id: 'demo-inc-2', title: 'Engineering Block Wi-Fi Outage', description: 'Students reporting Wi-Fi connectivity drop across the engineering block', category: 'Internet', location: 'Engineering Block', assignedDepartment: 'IT Support', status: 'ACTIVE', impactScore: 25 }
  });
  await createDemoReq('13', 'COMPLAINT', 'Internet', 'demo-stu-1', 'Wi-Fi down in lab.', 'ASSIGNED', { assignedAuthorityId: hod.id, incidentId: inc2.id, location: 'CSE Lab' });
  await createDemoReq('14', 'COMPLAINT', 'Internet', 'demo-stu-8', 'Cannot connect to campus wifi.', 'PENDING', { incidentId: inc2.id, location: 'Library' });

  // Serious Complaint Demo
  const rSerious = await createDemoReq('15', 'COMPLAINT', 'Safety', 'demo-stu-10', 'Unauthorized person entered hostel block during night.', 'PENDING', {
    isSerious: true, seriousCategory: 'SAFETY', location: 'Block C', priority: 'CRITICAL', timestamp: new Date(now - 1 * ONE_HOUR)
  });
  await prisma.auditLog.create({
    data: { actorId: 'demo-stu-10', action: 'SERIOUSNESS_CLASSIFIED', entity: 'Request', entityId: rSerious.id, metadata: JSON.stringify({ category: 'SAFETY' }) }
  });
  await prisma.notification.create({
    data: { recipientId: principal.id, title: 'SERIOUS COMPLAINT SUBMITTED', message: `Safety issue reported by student.`, type: 'REQUEST_ASSIGNED', metadata: JSON.stringify({ requestId: rSerious.id }) }
  });
  await prisma.notification.create({
    data: { recipientId: systemAdmin.id, title: 'SERIOUS COMPLAINT (PLATFORM OVERSIGHT)', message: `Safety issue reported at ${college.name}.`, type: 'REQUEST_ASSIGNED', metadata: JSON.stringify({ requestId: rSerious.id }) }
  });

  console.log('? Requests & Incidents seeded (mix of fresh, warning, overdue, serious, resolved).');

  
  for(let i=0; i<10; i++) {
    await createDemoReq('xtra-'+i, 'COMPLAINT', 'Plumbing', 'demo-stu-'+((i%10)+1), 'Minor leak in sink.', i%2===0?'PENDING':'RESOLVED', {
      location: 'Block A', createdAt: new Date(now - (24 + i) * ONE_HOUR)
    });
  }

  // Consent Ledger
  const consentData = [
    { u: 'demo-stu-1', p: 'EMAIL_REQUEST_NOTIFICATIONS', s: 'student-portal' },
    { u: 'demo-stu-1', p: 'EMAIL_SLA_NOTIFICATIONS', s: 'student-portal' },
    { u: 'demo-stu-2', p: 'EMAIL_REQUEST_NOTIFICATIONS', s: 'student-portal' },
    { u: 'demo-stu-2', p: 'EMAIL_SLA_NOTIFICATIONS', s: 'student-portal' },
    { u: 'demo-stu-2', p: 'EMAIL_CAMPUS_ANNOUNCEMENTS', s: 'student-portal' },
  ];
  for (const c of consentData) {
    const existing = await prisma.consentRecord.findFirst({ where: { userId: c.u, purpose: c.p } });
    if (!existing) {
      await prisma.consentRecord.create({
        data: { userId: c.u, purpose: c.p, status: 'GRANTED', consentVersion: 'v1', consentTextHash: 'hash', method: 'WEB', source: c.s  }
      });
    }
  }
  console.log('? Consent records verified.');

  // PS07: Announcements (if supported)
  const existingAnnouncements = await prisma.announcement.count();
  if (existingAnnouncements === 0) {
    await prisma.announcement.create({
      data: {
        id: 'demo-ann-1', title: 'Mid-Semester Examination Schedule Released', body: 'The mid-semester schedule is now available. Please check the portal.', 
        targetBranch: 'CSE', targetYear: 2, priority: 'HIGH', createdById: principal.id 
      }
    });
    await prisma.announcement.create({
      data: {
        id: 'demo-ann-2', title: 'Hostel Maintenance Inspection ï¿½ Block B', body: 'Routine maintenance check tomorrow at 10 AM.', 
        targetHostel: 'Block B', priority: 'MEDIUM', createdById: warden.id 
      }
    });
    console.log('? Announcements seeded.');
  }

  // Dashboard Balance Metrics
  const counts = {
    total: await prisma.request.count({ where: { id: { startsWith: 'demo-req-' } } }),
    incidents: await prisma.incident.count({ where: { id: { startsWith: 'demo-inc-' } } }),
    users: await prisma.user.count({ where: { id: { startsWith: 'demo-' } } })
  };
  
  console.log('--- SEED COMPLETE ---');
  console.log(`Demo Data: ${counts.users} Users, ${counts.total} Requests, ${counts.incidents} Incidents`);
  console.log('\n=============================================');
  console.log(' DEMO CREDENTIALS (All passwords: dormdesk2026)');
  console.log(' SYSTEM ADMIN: system@dormdesk.test');
  console.log(' PRINCIPAL:    principal.demo@dormdesk.local');
  console.log(' HOD:          hod.cse.demo@dormdesk.local');
  console.log(' FACULTY:      faculty.demo@dormdesk.local');
  console.log(' WARDEN:       warden.demo@dormdesk.local');
  console.log(' STAFF:        staff.demo@dormdesk.local');
  console.log(' STUDENT (eg): aarav.demo@dormdesk.local');
  console.log('=============================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
