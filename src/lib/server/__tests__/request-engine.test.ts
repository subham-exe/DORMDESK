import test from 'node:test';
import assert from 'node:assert';
import { RequestEngine } from '../request-engine';
import { IncidentService } from '../incident-service';
import { db } from '../db';

// Mock users for testing
const mockStudent = {
  id: 'test-student-1',
  email: 'student1@example.com',
  name: 'Test Student',
  studentId: 'STU123',
  staffId: null,
  role: 'STUDENT',
  domain: null,
  scope: null,
  department: 'CS',
  hostel: 'Hostel A',
  room: '101',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWarden = {
  id: 'test-warden-1',
  email: 'warden@example.com',
  name: 'Test Warden',
  studentId: null,
  staffId: 'STAFF123',
  role: 'WARDEN',
  domain: 'HOSTEL',
  scope: 'Hostel A',
  department: null,
  hostel: 'Hostel A',
  room: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('Universal Request Engine Integration', async (t) => {
  // Setup: Ensure mock users exist in DB
  await db.user.upsert({ where: { id: mockStudent.id }, create: mockStudent, update: mockStudent });
  await db.user.upsert({ where: { id: mockWarden.id }, create: mockWarden, update: mockWarden });

  let requestId: string;
  let incidentId: string;

  await t.test('1. Creation & SLA', async () => {
    const req = await RequestEngine.createRequest(mockStudent, {
      requestType: 'COMPLAINT',
      category: 'WATER',
      description: 'No water in bathroom',
      slaDurationHours: 4
    });
    
    assert.ok(req.id);
    assert.strictEqual(req.status, 'CREATE');
    assert.ok(req.ticketNumber.startsWith('COM-'));
    assert.ok(req.dueAt);
    
    requestId = req.id;
  });

  await t.test('2. Lifecycle Transitions & Authorization', async () => {
    // Student cannot classify
    await assert.rejects(
      RequestEngine.classifyRequest(mockStudent, requestId, 'WATER_ISSUE'),
      /Unauthorized/
    );

    // Warden can classify
    const req1 = await RequestEngine.classifyRequest(mockWarden, requestId, 'WATER_ISSUE');
    assert.strictEqual(req1.status, 'CLASSIFY');

    // Warden routes
    const req2 = await RequestEngine.routeRequest(mockWarden, requestId, 'MAINTENANCE');
    assert.strictEqual(req2.status, 'ROUTE');
  });

  await t.test('3. Incident Grouping', async () => {
    const incident = await IncidentService.createIncident(mockWarden, {
      title: 'Water Main Break',
      category: 'WATER',
      location: 'Hostel A',
    });
    
    assert.ok(incident.id);
    incidentId = incident.id;

    // Attach request
    const req = await IncidentService.attachRequestToIncident(mockWarden, incidentId, requestId);
    assert.strictEqual(req.incidentId, incidentId);

    const requests = await IncidentService.getIncidentRequests(incidentId);
    assert.strictEqual(requests.length, 1);
  });

  await t.test('4. Audit Trail Verification', async () => {
    const audits = await db.auditLog.findMany({ where: { requestId } });
    // CREATE, CLASSIFY, ROUTE, ATTACH
    assert.ok(audits.length >= 3); 
    const actions = audits.map(a => a.action);
    assert.ok(actions.includes('REQUEST_CREATED'));
    assert.ok(actions.includes('REQUEST_CLASSIFIED'));
    assert.ok(actions.includes('REQUEST_ROUTED'));
  });

  await t.test('5. Invalid Transition', async () => {
    // Currently ROUTE status. Trying to CLOSE directly should fail.
    await assert.rejects(
      RequestEngine.closeRequest(mockWarden, requestId),
      /Invalid state transition/
    );
  });

  await t.test('6. Exception Transitions: Cancel', async () => {
    // Create new request just to cancel
    const reqToCancel = await RequestEngine.createRequest(mockStudent, {
      requestType: 'LEAVE',
      category: 'PERSONAL',
      description: 'Going home',
    });

    // Student cancels their own request
    const cancelled = await RequestEngine.cancelRequest(mockStudent, reqToCancel.id);
    assert.strictEqual(cancelled.status, 'CANCEL');
  });
});
