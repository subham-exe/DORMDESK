import { Request } from '@prisma/client';

export interface SLAEvaluationResult {
  isBreached: boolean;
  remainingMs: number;
  deadline: Date;
}

export class SLAService {
  /**
   * Evaluates if a request has breached its SLA.
   * Deterministic evaluation using injected `now`.
   */
  static evaluate(request: Request, now: Date): SLAEvaluationResult | null {
    // If request is in a terminal/resolved state, SLA no longer applies
    if (['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED'].includes(request.status)) {
      return null;
    }
    
    // If request has no SLA configured, return null
    if (request.SLA === null || request.SLA === undefined) {
      return null;
    }

    // Use explicit dueAt if available, otherwise derive from createdAt + SLA hours
    const deadline = request.dueAt || new Date(request.createdAt.getTime() + request.SLA * 3600000);
    
    // Boundary condition: >= means exact deadline is considered breached
    const isBreached = now.getTime() >= deadline.getTime();
    
    return {
      isBreached,
      remainingMs: deadline.getTime() - now.getTime(),
      deadline,
    };
  }
}
