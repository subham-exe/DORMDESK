import { prisma } from '@/lib/db/prisma';
import { Request } from '@prisma/client';
import { SLAService } from './sla';
import { NotificationService, NotificationType } from './notification';
import { AuditService } from './audit';
import { PolicyService } from './policy';
import { SmsService } from './sms';

export class EscalationService {
  /**
   * Evaluates the request's SLA and triggers escalation if breached or warns if approaching.
   * Provides idempotent escalation creation with separately executed side effects.
   */
  static async triggerEscalationIfRequired(request: Request, now: Date) {
    const evaluation = await SLAService.evaluate(request, now);
    if (!evaluation) return;

    const policy = await PolicyService.resolvePolicyForRequest({
      requestType: request.requestType,
      category: request.category,
      domain: request.assignedDepartment || undefined
    });

    if (evaluation.isBreached) {
      // Level 1: Breach
      if (await this.tryCreateEscalationLevel(request.id, 1)) {
        await this.handleSlaBreach(request, policy);
      }
    } else if (evaluation.remainingMs > 0 && evaluation.remainingMs <= 3600000) { // < 1 hour remaining
      // Level 0: Warning
      if (await this.tryCreateEscalationLevel(request.id, 0)) {
        await this.handleSlaWarning(request, evaluation.remainingMs);
      }
    }
  }

  private static async tryCreateEscalationLevel(requestId: string, level: number): Promise<boolean> {
    try {
      await prisma.escalation.create({
        data: { requestId, level }
      });
      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'P2002') return false; // Already created
      throw error;
    }
  }

  private static async handleSlaWarning(request: Request, remainingMs: number) {
    const hours = Math.round(remainingMs / 3600000 * 10) / 10;
    const message = `Request ${request.ticketNumber} is approaching its ${request.SLA}h SLA. ${hours}h remaining.`;
    
    if (request.assignedAuthorityId) {
      await NotificationService.create({
        recipientId: request.assignedAuthorityId,
        title: 'SLA Warning',
        message,
        type: NotificationType.SLA_WARNING,
        metadata: { requestId: request.id }
      });
    }

    await AuditService.log({
      actorId: null,
      action: 'SLA_WARNING',
      domain: 'Request',
      targetId: request.id,
      metadata: { remainingMs, ticketNumber: request.ticketNumber }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static async handleSlaBreach(request: Request, policy: any) {
    const message = `Request ${request.ticketNumber} has breached its ${request.SLA}h SLA.`;

    // 1. Notify Assignee
    if (request.assignedAuthorityId) {
      await NotificationService.create({
        recipientId: request.assignedAuthorityId,
        title: 'SLA Breached',
        message,
        type: NotificationType.SLA_BREACH,
        metadata: { requestId: request.id }
      });
    }

    // 2. Escalation Logic
    let escalatedToUserIds: string[] = [];
    if (policy.escalationPolicy && policy.escalationPolicy.escalateToRole) {
      const targetRole = policy.escalationPolicy.escalateToRole;
      const targets = await prisma.user.findMany({ where: { role: targetRole } });
      escalatedToUserIds = targets.map((t: { id: string }) => t.id);
      
      for (const target of targets) {
        await NotificationService.create({
          recipientId: target.id,
          title: `Escalation: SLA Breached ${request.ticketNumber}`,
          message,
          type: NotificationType.ESCALATION,
          metadata: { requestId: request.id }
        });
        
        if (policy.escalationPolicy.sendSms && target.phone) {
           await SmsService.simulateSendSms({
             recipientId: target.id,
             phoneNumber: target.phone,
             message: `DORMDESK ESCALATION: ${request.ticketNumber} breached. Action required.`,
             type: 'ESCALATION',
             referenceId: request.id
           }, 'SYSTEM');
        }
      }
    } else {
      // Safe fallback
      const admins = await prisma.user.findMany({ where: { role: 'Admin' } });
      escalatedToUserIds = admins.map((a: { id: string }) => a.id);
      for (const admin of admins) {
        await NotificationService.create({
          recipientId: admin.id,
          title: `Escalation: SLA Breached ${request.ticketNumber}`,
          message,
          type: NotificationType.ESCALATION,
          metadata: { requestId: request.id }
        });
      }
    }

    await AuditService.log({
      actorId: null,
      action: 'ESCALATION_TRIGGERED',
      domain: 'Request',
      targetId: request.id,
      metadata: { level: 1, escalatedToUserIds, ticketNumber: request.ticketNumber }
    });
  }
}
