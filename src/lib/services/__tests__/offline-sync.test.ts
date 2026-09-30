import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncOfflineMutations } from '../sync-engine-client';
import * as offlineStore from '../offline-store';
import { QueuedMutation } from '../offline-store';

vi.mock('../offline-store', () => ({
  getOfflineMutations: vi.fn(),
  deleteOfflineMutation: vi.fn(),
  saveOfflineMutation: vi.fn()
}));

describe('Offline Synchronization & PWA (R1)', () => {
  let mutations: QueuedMutation[] = [];
  
  beforeEach(() => {
    mutations = [];
    vi.spyOn(offlineStore, 'getOfflineMutations').mockImplementation(async (userId) => mutations.filter(m => m.userId === userId));
    vi.spyOn(offlineStore, 'saveOfflineMutation').mockImplementation(async (m: QueuedMutation) => {
      const idx = mutations.findIndex(x => x.idempotencyKey === m.idempotencyKey);
      if (idx >= 0) mutations[idx] = m;
      else mutations.push(m);
      return m;
    });
    vi.spyOn(offlineStore, 'deleteOfflineMutation').mockImplementation(async (key) => {
      mutations = mutations.filter(m => m.idempotencyKey !== key);
      return true;
    });

    global.fetch = vi.fn();

    // Mock navigator online
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('syncs pending mutations successfully and deletes from queue', async () => {
    mutations.push({
      idempotencyKey: 'key-1',
      userId: 'user-a',
      type: 'CREATE_REQUEST',
      payload: { requestType: 'COMPLAINT' },
      status: 'PENDING_SYNC',
      timestamp: Date.now()
    });

    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    await syncOfflineMutations('user-a');

    expect(fetch).toHaveBeenCalledWith('/api/requests', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ requestType: 'COMPLAINT' })
    }));

    // Should have been deleted on success
    expect(mutations.length).toBe(0);
  });

  it('preserves transient failures as SYNC_ERROR for retry', async () => {
    mutations.push({
      idempotencyKey: 'key-2',
      userId: 'user-a',
      type: 'CREATE_REQUEST',
      payload: { requestType: 'LEAVE' },
      status: 'PENDING_SYNC',
      timestamp: Date.now()
    });

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response);

    await syncOfflineMutations('user-a');

    expect(mutations.length).toBe(1);
    expect(mutations[0].status).toBe('SYNC_ERROR');
  });

  it('flags permanent failures on 4xx responses', async () => {
    mutations.push({
      idempotencyKey: 'key-3',
      userId: 'user-a',
      type: 'CREATE_REQUEST',
      payload: { requestType: 'INVALID' },
      status: 'PENDING_SYNC',
      timestamp: Date.now()
    });

    vi.mocked(fetch).mockResolvedValueOnce({ 
      ok: false, 
      status: 400, 
      json: async () => ({ error: 'Validation failed' }) 
    } as Response);

    await syncOfflineMutations('user-a');

    expect(mutations.length).toBe(1);
    expect(mutations[0].status).toBe('FAILED_PERMANENTLY');
    expect(mutations[0].error).toBe('Validation failed');
  });

  it('halts sync with AUTH_REQUIRED on 401 Unauthorized', async () => {
    mutations.push({
      idempotencyKey: 'key-4',
      userId: 'user-a',
      type: 'CREATE_REQUEST',
      payload: {},
      status: 'PENDING_SYNC',
      timestamp: Date.now()
    });

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response);

    await syncOfflineMutations('user-a');

    expect(mutations[0].status).toBe('AUTH_REQUIRED');
  });

  it('isolates user syncs securely', async () => {
    mutations.push({
      idempotencyKey: 'key-user-a',
      userId: 'user-a',
      type: 'CREATE_REQUEST',
      payload: {},
      status: 'PENDING_SYNC',
      timestamp: Date.now()
    });
    
    mutations.push({
      idempotencyKey: 'key-user-b',
      userId: 'user-b',
      type: 'CREATE_REQUEST',
      payload: {},
      status: 'PENDING_SYNC',
      timestamp: Date.now()
    });

    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    // Sync user-b
    await syncOfflineMutations('user-b');

    // Only user-b's mutation should have been processed and removed
    expect(mutations.length).toBe(1);
    expect(mutations[0].userId).toBe('user-a');
  });
});
