import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Instrumentation (SLA Scheduler)', () => {
  let register: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    process.env.NEXT_RUNTIME = 'nodejs';
    
    // Mock the scheduler dynamically to avoid actual DB calls
    vi.doMock('./lib/services/scheduler', () => {
      return {
        SLAScheduler: {
          tick: vi.fn().mockResolvedValue({ processed: 1, errors: 0 })
        }
      };
    });

    const instModule = await import('./instrumentation');
    register = instModule.register;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    delete process.env.NEXT_RUNTIME;
  });

  it('Server runtime starts scheduler', async () => {
    await register();
    expect(vi.getTimerCount()).toBe(1);
    
    const { SLAScheduler } = await import('./lib/services/scheduler');
    await vi.advanceTimersByTimeAsync(300000); // 5 minutes
    
    expect(SLAScheduler.tick).toHaveBeenCalledTimes(1);
  });

  it('Client/non-server runtime does not start scheduler', async () => {
    // Force a fresh reload of the module with edge runtime
    vi.resetModules();
    process.env.NEXT_RUNTIME = 'edge';
    
    // Have to reset the singleton for the test, but since we reset modules it's a new instance
    const instModule = await import('./instrumentation');
    await instModule.register();
    
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Only one interval is registered per process (Singleton)', async () => {
    await register();
    expect(vi.getTimerCount()).toBe(1);
    
    // Call register again
    await register();
    
    // Still only 1 timer
    expect(vi.getTimerCount()).toBe(1);
  });

  it('Scheduler errors are caught and do not kill interval', async () => {
    vi.resetModules();
    const mockTick = vi.fn()
      .mockRejectedValueOnce(new Error('Test error'))
      .mockResolvedValueOnce({ processed: 1, errors: 0 });

    vi.doMock('./lib/services/scheduler', () => {
      return {
        SLAScheduler: {
          tick: mockTick
        }
      };
    });

    const instModule = await import('./instrumentation');
    await instModule.register();
    
    expect(vi.getTimerCount()).toBe(1);

    // First tick throws error
    await vi.advanceTimersByTimeAsync(300000);
    expect(mockTick).toHaveBeenCalledTimes(1);
    
    // Timer should still exist and fire again
    expect(vi.getTimerCount()).toBe(1);
    
    await vi.advanceTimersByTimeAsync(300000);
    expect(mockTick).toHaveBeenCalledTimes(2);
  });
});
