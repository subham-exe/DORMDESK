// Imports moved to dynamic imports to prevent Edge runtime tracing issues

// Global singleton to prevent multiple intervals in dev mode or multiple module loads
let isSchedulerRegistered = false;

export async function register() {
  // Only start the scheduler in the Node.js server runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (isSchedulerRegistered) {
      return;
    }
    
    isSchedulerRegistered = true;
    console.log('[Scheduler] SLA Scheduler registered in Node.js runtime');

    const { SystemClock } = await import('./lib/services/clock');
    const { SLAScheduler } = await import('./lib/services/scheduler');
    const clock = new SystemClock();

    const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    setInterval(async () => {
      try {
        const result = await SLAScheduler.tick(clock);
        if (result.processed > 0 || result.errors > 0) {
           console.log(`[Scheduler] Tick completed. Processed: ${result.processed}, Errors: ${result.errors}`);
        }
      } catch (error) {
        // Catch all errors so the interval is NEVER killed
        console.error('[Scheduler] Critical error during SLA tick execution:', error);
      }
    }, INTERVAL_MS);
  }
}
