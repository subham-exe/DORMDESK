import { Request } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface SLAEvaluationResult {
  isBreached: boolean;
  remainingMs: number;
  deadline: Date;
  slaStatus: string;
}

export class SLAService {
  /**
   * Pure calculation of SLA state based on timestamps
   */
  static calculate(request: Request, now: Date) {
    if (request.SLA === null || request.SLA === undefined) {
      return null;
    }

    const deadline = request.dueAt || new Date(request.createdAt.getTime() + request.SLA * 3600000);
    const remainingMs = deadline.getTime() - now.getTime();
    const isBreached = now.getTime() >= deadline.getTime();
    
    let slaStatus = 'ACTIVE';
    if (isBreached) {
      slaStatus = 'BREACHED';
    } else if (remainingMs > 0 && remainingMs <= 3600000) { // < 1 hour
      slaStatus = 'WARNING';
    }

    return {
      isBreached,
      remainingMs,
      deadline,
      slaStatus
    };
  }

  /**
   * Evaluates if a request has breached its SLA and synchronously persists the state to RequestSLA.
   * Deterministic evaluation using injected `now`.
   */
  static async evaluate(request: Request, now: Date): Promise<SLAEvaluationResult | null> {
    const isTerminal = ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED', 'CANCELLED'].includes(request.status);
    
    const calc = this.calculate(request, now);
    
    // Resolve terminal state in RequestSLA
    if (isTerminal) {
      if (request.SLA !== null) {
        // Ensure RequestSLA reflects resolved status
        await prisma.requestSLA.updateMany({
          where: { requestId: request.id, status: { not: 'RESOLVED' } },
          data: { 
            status: 'RESOLVED',
            resolvedAt: request.resolvedAt || now
          }
        });
      }
      return null;
    }

    if (!calc) return null;

    // Update RequestSLA state transition deterministically
    const currentSla = await prisma.requestSLA.findUnique({ where: { requestId: request.id } });
    if (currentSla) {
      if (currentSla.status !== calc.slaStatus) {
        const updateData: Record<string, unknown> = { status: calc.slaStatus };
        if (calc.slaStatus === 'WARNING' && !currentSla.warningAt) {
          updateData.warningAt = now;
        } else if (calc.slaStatus === 'BREACHED' && !currentSla.breachedAt) {
          updateData.breachedAt = now;
        }
        await prisma.requestSLA.update({
          where: { id: currentSla.id },
          data: updateData
        });
      }
    }

    return calc;
  }
}
