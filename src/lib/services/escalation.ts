import { prisma } from '@/lib/db/prisma';
import { Request } from '@prisma/client';
import { SLAService } from './sla';
import { NotificationService } from './notification';
import { AuditService } from './audit';

export class EscalationService {
  /**
   * Evaluates the request's SLA and triggers escalation if breached.
   * Provides idempotent escalation creation with separately executed side effects.
   * Full atomicity is not provided (if notification fails, escalation remains),
   * which is appropriate for the MVP scope to avoid distributed transactions.
   */
  static async triggerEscalationIfRequired(request: Request, now: Date) {
    const evaluation = SLAService.evaluate(request, now);
    if (!evaluation || !evaluation.isBreached) return;

    const targetLevel = 1;

    try {
      // 1. Transaction-safe idempotency via Unique Constraint
      await prisma.escalation.create({
        data: {
          requestId: request.id,
          level: targetLevel,
        }
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // P2002 Unique Constraint Violation means it's already escalated to this level.
      if (error.code === 'P2002') return;
      // Re-throw unexpected database errors
      throw error;
    }

    // --- Separately Executed Side Effects ---
    // If these fail, the Escalation record has already been created.
    // The duplicate prevention above will prevent re-triggering these side effects.

    // 2. Identify Administrative Targets
    // Canonical role for administrative authorities is 'Admin'
    const admins = await prisma.user.findMany({ where: { role: 'Admin' } });

    // 3. Notify Target
    for (const admin of admins) {
      try {
        await NotificationService.create({
          recipientId: admin.id,
          title: `SLA Breached: ${request.ticketNumber}`,
          message: `Request ${request.ticketNumber} has breached its ${request.SLA} hour SLA.`,
          type: 'ESCALATION',
        });
      } catch (notificationError) {
        console.error('Failed to notify admin about escalation:', notificationError);
        // Do not swallow completely if we want the caller to know side-effects failed,
        // but for loop resilience, we catch individual failures. We will throw at the end if needed.
        // The requirements say: "Notification failures must not be silently swallowed."
        throw notificationError;
      }
    }

    // 4. Audit
    try {
      await AuditService.log({
        actorId: null, // System event
        action: 'ESCALATION_TRIGGERED',
        domain: 'Request',
        targetId: request.id,
        metadata: { level: targetLevel }
      });
    } catch (auditError) {
      console.error('Failed to audit escalation:', auditError);
      // The requirements say: "Audit failures must not be silently swallowed."
      throw auditError;
    }
  }
}
