import { prisma } from '@/lib/db/prisma';
import { EscalationService } from './escalation';
import { Clock } from './clock';

export class SLAScheduler {
  /**
   * Executes a single evaluation pass over all active requests.
   * Requires an explicitly injected Clock to maintain deterministic behavior.
   */
  static async tick(clock: Clock) {
    const now = clock.now();

    // Query active requests with configured SLA
    const activeRequests = await prisma.request.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED'] },
        SLA: { not: null }
      }
    });

    let processed = 0;
    let errors = 0;

    for (const request of activeRequests) {
      try {
        await EscalationService.triggerEscalationIfRequired(request, now);
        processed++;
      } catch (error) {
        // Isolate per-request errors so the scheduler loop can continue
        console.error(`[Scheduler] Failed to evaluate SLA for request ${request.id}`, error);
        errors++;
      }
    }

    return { processed, errors, activeRequestsFound: activeRequests.length };
  }
}
