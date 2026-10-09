import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: process.env.TEST_DATABASE_URL ? { db: { url: process.env.TEST_DATABASE_URL } } : undefined,
});

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

  // Helper to safely upsert users without triggering SQLite unique insert constraints during conflict resolution
  async function safeUserUpsert(args: { where: Prisma.UserWhereInput, update: Prisma.UserUncheckedUpdateInput, create: Prisma.UserUncheckedCreateInput }) {
    const existing = await prisma.user.findFirst({ where: args.where });
    if (existing) {
      return prisma.user.update({ where: { id: existing.id }, data: args.update });
    }
    return prisma.user.create({ data: args.create });
  }

  // 3. Demo Authorities
  const systemAdmin = await safeUserUpsert({
    where: { id: '001' },
    update: { email: 'system@dormdesk.test', authorityId: authMap['SYSTEM_ADMIN'] },
    create: { id: '001', name: 'System Admin', email: 'system@dormdesk.test', role: 'SystemAdmin', authorityId: authMap['SYSTEM_ADMIN'], password: hashedPass }
  });

  const principal = await safeUserUpsert({
    where: { email: 'principal.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-principal', name: 'Dr. Principal', email: 'principal.demo@dormdesk.local', role: 'Admin', authorityId: authMap['PRINCIPAL'], collegeId: college.id, password: hashedPass }
  });

  const hod = await safeUserUpsert({
    where: { email: 'hod.cse.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-hod', name: 'HOD CSE', email: 'hod.cse.demo@dormdesk.local', role: 'Admin', authorityId: authMap['HOD'], department: 'CSE', departmentRefId: cseDept.id, collegeId: college.id, password: hashedPass }
  });

  const faculty = await safeUserUpsert({
    where: { email: 'faculty.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-faculty', name: 'Prof. Demo', email: 'faculty.demo@dormdesk.local', role: 'Faculty', authorityId: authMap['FACULTY'], department: 'CSE', departmentRefId: cseDept.id, collegeId: college.id, password: hashedPass }
  });

  const warden = await safeUserUpsert({
    where: { email: 'warden.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-warden', name: 'Warden Demo', email: 'warden.demo@dormdesk.local', role: 'Warden', authorityId: authMap['WARDEN'], hostel: 'Block A', collegeId: college.id, password: hashedPass }
  });

  const staff = await safeUserUpsert({
    where: { email: 'staff.demo@dormdesk.local' },
    update: { collegeId: college.id, password: hashedPass },
    create: { id: 'demo-staff', name: 'Maintenance Staff', email: 'staff.demo@dormdesk.local', role: 'Staff', authorityId: authMap['STAFF'], department: 'Plumbing', collegeId: college.id, password: hashedPass }
  });
  console.log('? Authority accounts seeded.');

  // 4. Students
  for (const stu of STUDENTS) {
    await safeUserUpsert({
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


  // ==========================================
  // PHASE: CAMPUS SIMULATION DATA
  // ==========================================
  console.log('--- STARTING EXTENDED CAMPUS SIMULATION SEED ---');

  const SIM_DEPTS = [
    { id: 'sim-dept-cse', name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 'sim-dept-ece', name: 'Electronics & Communication Engineering', code: 'ECE' },
    { id: 'sim-dept-ee', name: 'Electrical Engineering', code: 'EE' },
    { id: 'sim-dept-me', name: 'Mechanical Engineering', code: 'ME' },
    { id: 'sim-dept-ce', name: 'Civil Engineering', code: 'CE' }
  ];

  for (const d of SIM_DEPTS) {
    await prisma.department.upsert({
      where: { name_collegeId: { name: d.name, collegeId: college.id } },
      update: { id: d.id },
      create: { id: d.id, name: d.name, collegeId: college.id }
    });
  }

  // HODs and Faculty
  const simHods = [];
  const simFaculty = [];
  for (const d of SIM_DEPTS) {
    const hodId = `sim-hod-${d.code.toLowerCase()}`;
    const hod = await safeUserUpsert({
      where: { email: `hod.${d.code.toLowerCase()}@dormdesk.local` },
      update: { collegeId: college.id, password: hashedPass, mustChangePassword: false },
      create: {
        id: hodId, name: `HOD ${d.code}`, email: `hod.${d.code.toLowerCase()}@dormdesk.local`,
        role: 'Admin', authorityId: authMap['HOD'], department: d.code, departmentRefId: d.id,
        collegeId: college.id, password: hashedPass, mustChangePassword: false
      }
    });
    simHods.push(hod);

    for (let i = 1; i <= 3; i++) {
      const facId = `sim-faculty-${d.code.toLowerCase()}-0${i}`;
      const fac = await safeUserUpsert({
        where: { email: `faculty.${d.code.toLowerCase()}.0${i}@dormdesk.local` },
        update: { collegeId: college.id, password: hashedPass, mustChangePassword: false },
        create: {
          id: facId, name: `Prof. ${d.code} ${i}`, email: `faculty.${d.code.toLowerCase()}.0${i}@dormdesk.local`,
          role: 'Faculty', authorityId: authMap['FACULTY'], department: d.code, departmentRefId: d.id,
          collegeId: college.id, password: hashedPass, mustChangePassword: false
        }
      });
      simFaculty.push(fac);
    }
  }

  // WARDENS
  const simWardens = [
    { id: 'sim-warden-boys', name: 'Warden Boys Hostel', email: 'warden.boys@dormdesk.local', hostel: 'Boys Hostel A' },
    { id: 'sim-warden-girls', name: 'Warden Girls Hostel', email: 'warden.girls@dormdesk.local', hostel: 'Girls Hostel' },
    { id: 'sim-warden-annex', name: 'Warden Annex', email: 'warden.annex@dormdesk.local', hostel: 'Hostel Annex' }
  ];
  for (const w of simWardens) {
    await safeUserUpsert({
      where: { email: w.email },
      update: { collegeId: college.id, password: hashedPass, mustChangePassword: false },
      create: {
        id: w.id, name: w.name, email: w.email, role: 'Warden', authorityId: authMap['WARDEN'],
        hostel: w.hostel, collegeId: college.id, password: hashedPass, mustChangePassword: false
      }
    });
  }

  // STAFF
  const simStaffConfigs = [
    { id: 'sim-staff-maintenance-01', name: 'Maint Staff 1', email: 'staff.maint.1@dormdesk.local', dept: 'Maintenance' },
    { id: 'sim-staff-maintenance-02', name: 'Maint Staff 2', email: 'staff.maint.2@dormdesk.local', dept: 'Maintenance' },
    { id: 'sim-staff-maintenance-03', name: 'Maint Staff 3', email: 'staff.maint.3@dormdesk.local', dept: 'Maintenance' },
    { id: 'sim-staff-maintenance-04', name: 'Maint Staff 4', email: 'staff.maint.4@dormdesk.local', dept: 'Maintenance' },
    { id: 'sim-staff-maintenance-05', name: 'Maint Staff 5', email: 'staff.maint.5@dormdesk.local', dept: 'Maintenance' },
    { id: 'sim-staff-office-01', name: 'Office Staff 1', email: 'staff.office.1@dormdesk.local', dept: 'Administration' },
    { id: 'sim-staff-office-02', name: 'Office Staff 2', email: 'staff.office.2@dormdesk.local', dept: 'Administration' },
    { id: 'sim-staff-mess-01', name: 'Mess Staff 1', email: 'staff.mess.1@dormdesk.local', dept: 'Mess' },
    { id: 'sim-staff-mess-02', name: 'Mess Staff 2', email: 'staff.mess.2@dormdesk.local', dept: 'Mess' }
  ];
  for (const s of simStaffConfigs) {
    await safeUserUpsert({
      where: { email: s.email },
      update: { collegeId: college.id, password: hashedPass, mustChangePassword: false },
      create: {
        id: s.id, name: s.name, email: s.email, role: 'Staff', authorityId: authMap['STAFF'],
        department: s.dept, collegeId: college.id, password: hashedPass, mustChangePassword: false
      }
    });
  }

  // STUDENTS
  const fNames = ['Aarav', 'Vihaan', 'Ananya', 'Diya', 'Advik', 'Kabir', 'Anika', 'Navya', 'Ojas', 'Riya', 'Kavya', 'Arjun', 'Sai', 'Ishaan', 'Krish', 'Dhruv', 'Zara', 'Mira', 'Rudra', 'Ira', 'Myra', 'Aryan', 'Neha', 'Pranav', 'Rohan', 'Aditi', 'Rahul', 'Sneha', 'Vikram', 'Pooja'];
  const lNames = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Singh', 'Patel', 'Reddy', 'Rao', 'Kumar', 'Das', 'Roy', 'Menon', 'Jain', 'Mehta', 'Mishra', 'Pandey', 'Tiwari', 'Deshmukh', 'Patil'];

  const deptDist = { CSE: 25, ECE: 20, EE: 20, ME: 20, CE: 15 };
  let deptArr = [];
  for (const [d, c] of Object.entries(deptDist)) {
    for (let i = 0; i < c; i++) deptArr.push(d);
  }

  for (let i = 1; i <= 100; i++) {
    const id = `sim-stu-${i.toString().padStart(3, '0')}`;
    const email = `student${i.toString().padStart(3, '0')}@dormdesk.local`;
    const fname = fNames[i % fNames.length];
    const lname = lNames[i % lNames.length];
    const deptCode = deptArr[i - 1];
    const dept = SIM_DEPTS.find(d => d.code === deptCode)!;
    const isHostelite = i <= 60; // 60 hostelites, 40 day scholars
    const hostel = isHostelite ? (i <= 30 ? 'Boys Hostel A' : (i <= 50 ? 'Boys Hostel B' : 'Girls Hostel')) : null;
    const year = (i % 4) + 1;

    await safeUserUpsert({
      where: { email },
      update: { collegeId: college.id, password: hashedPass, mustChangePassword: false },
      create: {
        id, name: `${fname} ${lname}`, email, role: 'Student', authorityId: authMap['STUDENT'],
        department: deptCode, departmentRefId: dept.id, year, branch: deptCode,
        isResident: isHostelite, hostel, room: isHostelite ? `Room ${100 + (i % 20)}` : null,
        collegeId: college.id, password: hashedPass, mustChangePassword: false
      }
    });
  }

  console.log('? 100 Simulation students seeded.');

  // SAFE REQUEST CREATOR
  // Ensure we don't reset requests if they already exist, to preserve manual edits.
  type SimReqData = { id: string; ticketNumber: string; requestType: string; category: string; requesterId: string; description: string; status: string };
  type SimReqOptions = { priority?: string; location?: string; isSerious?: boolean; seriousCategory?: string; createdAt?: Date; dueAt?: Date; incidentId?: string; assignedAuthorityId?: string; slaHours?: number; slaStatus?: string };
  async function safeSimReq(reqData: SimReqData, options: SimReqOptions) {
    let req = await prisma.request.findUnique({ where: { id: reqData.id } });
    if (req) return req; // DO NOT reset manually modified non-seed data

    req = await prisma.request.create({
      data: {
        id: reqData.id,
        ticketNumber: reqData.ticketNumber,
        requestType: reqData.requestType,
        category: reqData.category,
        requesterId: reqData.requesterId,
        description: reqData.description,
        status: reqData.status,
        priority: options.priority || 'LOW',
        location: options.location,
        isSerious: options.isSerious || false,
        seriousCategory: options.seriousCategory,
        createdAt: options.createdAt || new Date(),
        updatedAt: options.createdAt || new Date(), // updated with creation time, will update on edits
        dueAt: options.dueAt,
        resolvedAt: reqData.status === 'RESOLVED' || reqData.status === 'CLOSED' ? new Date() : undefined,
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

    await prisma.auditLog.create({
      data: {
        actorId: reqData.requesterId, action: 'REQUEST_CREATED', entity: 'Request', entityId: req.id,
        metadata: JSON.stringify({ status: 'PENDING' }), timestamp: options.createdAt || new Date()
      }
    });

    if (options.assignedAuthorityId) {
      await prisma.auditLog.create({
        data: {
          actorId: reqData.requesterId, action: 'REQUEST_ASSIGNED', entity: 'Request', entityId: req.id,
          timestamp: new Date((options.createdAt || new Date()).getTime() + 1000)
        }
      });
    }
    return req;
  }

  // Create 4 Recurring Incidents naturally
  async function safeSimInc(incData: Prisma.IncidentUncheckedCreateInput) {
    let inc = await prisma.incident.findUnique({ where: { id: incData.id } });
    if (!inc) {
      inc = await prisma.incident.create({ data: incData });
    }
    return inc;
  }

  const rInc1 = await safeSimInc({ id: 'sim-inc-1', title: 'Water leakage', description: 'Multiple water leakage issues', category: 'Plumbing', location: 'Boys Hostel A', assignedDepartment: 'Maintenance', status: 'ACTIVE', impactScore: 30 });
  const rInc2 = await safeSimInc({ id: 'sim-inc-2', title: 'Network outage', description: 'Repeated Wi-Fi drops', category: 'Internet', location: 'CSE Block', assignedDepartment: 'IT', status: 'ACTIVE', impactScore: 25 });
  const rInc3 = await safeSimInc({ id: 'sim-inc-3', title: 'Washroom maintenance', description: 'Repeated washroom complaints', category: 'Cleaning', location: 'Girls Hostel', assignedDepartment: 'Maintenance', status: 'ACTIVE', impactScore: 20 });
  const rInc4 = await safeSimInc({ id: 'sim-inc-4', title: 'Electrical faults', description: 'Power tripping issues', category: 'Electrical', location: 'ECE Block', assignedDepartment: 'Maintenance', status: 'ACTIVE', impactScore: 25 });

  // 55 Simulation Requests
  let simReqCounter = 1;
  const reqsToCreate = [
    // Incident 1 - Water Leakage (Boys Hostel A)
    { t: 'COMPLAINT', c: 'Plumbing', u: 'sim-stu-001', d: 'Water leakage in 1st floor bathroom', s: 'PENDING', o: { location: 'Boys Hostel A', incidentId: rInc1.id, createdAt: new Date(now - 1*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Plumbing', u: 'sim-stu-002', d: 'Tap is leaking continuously', s: 'ASSIGNED', o: { location: 'Boys Hostel A', incidentId: rInc1.id, assignedAuthorityId: 'sim-staff-maintenance-01', createdAt: new Date(now - 3*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Plumbing', u: 'sim-stu-003', d: 'Pipe burst near room 105', s: 'PROCESSING', o: { location: 'Boys Hostel A', incidentId: rInc1.id, assignedAuthorityId: 'sim-staff-maintenance-01', createdAt: new Date(now - 25*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Plumbing', u: 'sim-stu-004', d: 'Water dripping from ceiling', s: 'RESOLVED', o: { location: 'Boys Hostel A', incidentId: rInc1.id, assignedAuthorityId: 'sim-warden-boys', createdAt: new Date(now - 28*ONE_HOUR) } },

    // Incident 2 - Network outage (CSE Block)
    { t: 'COMPLAINT', c: 'Internet', u: 'sim-stu-010', d: 'Wi-Fi drops repeatedly during afternoon lab sessions', s: 'ACKNOWLEDGED', o: { location: 'CSE Block', incidentId: rInc2.id, assignedAuthorityId: 'sim-hod-cse', createdAt: new Date(now - 2*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Internet', u: 'sim-stu-011', d: 'No internet access in Lab 2', s: 'PROCESSING', o: { location: 'CSE Block', incidentId: rInc2.id, assignedAuthorityId: 'sim-faculty-cse-01', createdAt: new Date(now - 5*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Internet', u: 'sim-stu-012', d: 'Network very slow', s: 'PENDING', o: { location: 'CSE Block', incidentId: rInc2.id, createdAt: new Date(now - 6*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Internet', u: 'sim-stu-013', d: 'Cannot connect to Eduroam', s: 'CLOSED', o: { location: 'CSE Block', incidentId: rInc2.id, assignedAuthorityId: 'sim-hod-cse', createdAt: new Date(now - 48*ONE_HOUR) } },

    // Incident 3 - Washroom (Girls Hostel)
    { t: 'COMPLAINT', c: 'Cleaning', u: 'sim-stu-055', d: 'Washroom extremely dirty', s: 'PENDING', o: { location: 'Girls Hostel', incidentId: rInc3.id, createdAt: new Date(now - 4*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Cleaning', u: 'sim-stu-056', d: 'No handwash in washrooms', s: 'ASSIGNED', o: { location: 'Girls Hostel', incidentId: rInc3.id, assignedAuthorityId: 'sim-staff-maintenance-02', createdAt: new Date(now - 12*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Cleaning', u: 'sim-stu-057', d: 'Toilets are blocked', s: 'PROCESSING', o: { location: 'Girls Hostel', incidentId: rInc3.id, assignedAuthorityId: 'sim-warden-girls', createdAt: new Date(now - 24*ONE_HOUR), slaHours: 24, slaStatus: 'BREACHED', dueAt: new Date(now - 1*ONE_HOUR) } },

    // Incident 4 - Electrical (ECE Block)
    { t: 'COMPLAINT', c: 'Electrical', u: 'sim-stu-030', d: 'Sockets not working in class', s: 'PENDING', o: { location: 'ECE Block', incidentId: rInc4.id, createdAt: new Date(now - 2*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Electrical', u: 'sim-stu-031', d: 'Projector power issue', s: 'ASSIGNED', o: { location: 'ECE Block', incidentId: rInc4.id, assignedAuthorityId: 'sim-staff-maintenance-03', createdAt: new Date(now - 10*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Electrical', u: 'sim-stu-032', d: 'Lights flickering', s: 'VERIFIED', o: { location: 'ECE Block', incidentId: rInc4.id, assignedAuthorityId: 'sim-faculty-ece-01', createdAt: new Date(now - 30*ONE_HOUR) } },

    // Serious complaints (2-3)
    { t: 'COMPLAINT', c: 'Safety', u: 'sim-stu-040', d: 'Hostel safety concern near back gate', s: 'SERIOUS_REVIEW', o: { location: 'Hostel Annex', isSerious: true, seriousCategory: 'SAFETY', priority: 'CRITICAL', assignedAuthorityId: principal.id, createdAt: new Date(now - 1*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Harassment', u: 'sim-stu-045', d: 'Harassment/safety concern reported', s: 'SERIOUS_REVIEW', o: { location: 'Sports Complex', isSerious: true, seriousCategory: 'HARASSMENT', priority: 'CRITICAL', assignedAuthorityId: principal.id, createdAt: new Date(now - 2*ONE_HOUR) } },
    { t: 'COMPLAINT', c: 'Facility', u: 'sim-stu-048', d: 'Serious facility issue: structural crack', s: 'PROCESSING', o: { location: 'Mechanical Block', isSerious: true, seriousCategory: 'FACILITY', priority: 'CRITICAL', assignedAuthorityId: systemAdmin.id, createdAt: new Date(now - 24*ONE_HOUR) } },

    // Various regular complaints and requests
    ...Array.from({ length: 15 }).map((_, i) => ({ t: 'COMPLAINT', c: 'Mess', u: `sim-stu-${(i+5).toString().padStart(3, '0')}`, d: 'Mess water purifier showing service warning', s: i % 3 === 0 ? 'PENDING' : 'CLOSED', o: { location: 'Main Mess', assignedAuthorityId: i%3!==0?'sim-warden-boys':undefined, createdAt: new Date(now - (5+i)*ONE_HOUR) } })),
    ...Array.from({ length: 10 }).map((_, i) => ({ t: 'CERTIFICATE', c: 'Academic', u: `sim-stu-${(i+20).toString().padStart(3, '0')}`, d: 'Certificate request awaiting office verification', s: i % 2 === 0 ? 'ASSIGNED' : 'PROCESSING', o: { location: 'Administrative Block', assignedAuthorityId: 'sim-staff-office-01', createdAt: new Date(now - (12+i)*ONE_HOUR) } })),
    ...Array.from({ length: 12 }).map((_, i) => ({ t: 'COMPLAINT', c: 'Facility', u: `sim-stu-${(i+60).toString().padStart(3, '0')}`, d: 'Three ceiling fans not functioning in CSE Lab 2', s: i % 4 === 0 ? 'VERIFIED' : 'RESOLVED', o: { location: 'CSE Block', assignedAuthorityId: 'sim-staff-maintenance-04', createdAt: new Date(now - (40+i)*ONE_HOUR) } }))
  ];

  for (const req of reqsToCreate) {
    await safeSimReq({
      id: `sim-req-${simReqCounter.toString().padStart(3, '0')}`,
      ticketNumber: `SIM-${1000 + simReqCounter}`,
      requestType: req.t,
      category: req.c,
      requesterId: req.u,
      description: req.d,
      status: req.s
    }, req.o);
    simReqCounter++;
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
        id: 'demo-ann-2', title: 'Hostel Maintenance Inspection � Block B', body: 'Routine maintenance check tomorrow at 10 AM.',
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




