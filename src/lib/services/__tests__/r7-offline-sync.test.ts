import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { syncOfflineMutations } from '../sync-engine-client';
import * as offlineStore from '../offline-store';
import { POST } from '../../../app/api/requests/route';
import { NextRequest } from 'next/server';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../auth/session';

// Mock dependencies
vi.mock('../offline-store', () => ({
  getOfflineMutations: vi.fn(),
  deleteOfflineMutation: vi.fn(),
  saveOfflineMutation: vi.fn()
}));

vi.mock('../../auth/session', () => ({
  requireAuth: vi.fn()
}));

// Mock global fetch to bridge to the Next.js API route directly
global.fetch = vi.fn(async (url, options) => {
  if (url === '/api/requests' && options.method === 'POST') {
    const req = new NextRequest('http://localhost/api/requests', {
      method: 'POST',
      body: options.body
    });
    const res = await POST(req);
    return {
      ok: res.status === 201 || res.status === 200,
      json: async () => res.json()
    };
  }
  return { ok: false, json: async () => ({ error: 'Not found' }) };
}) as unknown as typeof fetch;

describe('R7 - REAL Offline Sync Integration', () => {
  const userId = 'offline-user-1';

  beforeEach(async () => {
    vi.clearAllMocks();
    
    vi.stubGlobal('navigator', { onLine: true });

    await prisma.evidence.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestAssignment.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.request.deleteMany();
    await prisma.recurringIssue.deleteMany();
    await prisma.policy.deleteMany();

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: 'offline@dormdesk.local', name: 'Offline Student', role: 'Student', password: 'hash' }
    });

    (requireAuth as Mock).mockResolvedValue({ id: userId, role: 'Student' });
  });

  it('Flow: Full offline sync pipeline execution', async () => {
    const idempotencyKey = 'offline-sync-123';
    const mockPayload = {
      requestType: 'COMPLAINT',
      category: 'Electrical',
      description: 'Power outage',
      location: 'Block-A-102',
      idempotencyKey
    };

    // 1. Simulate queued mutation in IndexedDB
    (offlineStore.getOfflineMutations as Mock).mockResolvedValue([
      {
        idempotencyKey,
        userId,
        type: 'CREATE_REQUEST',
        payload: mockPayload,
        status: 'PENDING_SYNC',
        timestamp: Date.now()
      }
    ]);

    // 2. Trigger sync
    await syncOfflineMutations(userId);

    // 3. Verify fetch was called bridging to API
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // 4. Verify request was persisted correctly in DB
    const reqs = await prisma.request.findMany({ where: { idempotencyKey } });
    expect(reqs.length).toBe(1);
    const req = reqs[0];
    expect(req.description).toBe('Power outage');
    
    // 5. Verify cleanup was called on successful sync
    expect(offlineStore.deleteOfflineMutation).toHaveBeenCalledWith(idempotencyKey);
  });

  it('Flow: Idempotency blocks duplicate side effects on retry', async () => {
    const idempotencyKey = 'retry-sync-123';
    const mockPayload = {
      requestType: 'COMPLAINT',
      category: 'Plumbing',
      description: 'Tap leak',
      location: 'Block-A-102',
      idempotencyKey
    };

    // 1. Seed existing request to simulate already processed
    await prisma.request.create({
      data: {
        ticketNumber: 'COM-001',
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        requesterId: userId,
        description: 'Tap leak',
        location: 'Block-A-102',
        status: 'PENDING',
        idempotencyKey
      }
    });

    // 2. Queue mutation again (simulate dropped ACK)
    (offlineStore.getOfflineMutations as Mock).mockResolvedValue([
      {
        idempotencyKey,
        userId,
        type: 'CREATE_REQUEST',
        payload: mockPayload,
        status: 'PENDING_SYNC',
        timestamp: Date.now()
      }
    ]);

    await syncOfflineMutations(userId);

    // 3. Ensure no duplicate was created
    const count = await prisma.request.count({ where: { idempotencyKey } });
    expect(count).toBe(1);

    // 4. Delete should STILL be called so it removes the retry loop
    expect(offlineStore.deleteOfflineMutation).toHaveBeenCalledWith(idempotencyKey);
  });
});
