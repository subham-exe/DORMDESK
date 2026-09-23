import { prisma } from '@/lib/db/prisma';
import { AuditService } from './audit';
import { NotificationService } from './notification';
import { User } from '@prisma/client';

export type ScholarshipState =
  | 'ELIGIBLE'
  | 'APPLIED'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'APPROVED'
  | 'SANCTIONED'
  | 'DISBURSED'
  | 'REJECTED'
  | 'CANCELLED';

export const TERMINAL_STATES: ScholarshipState[] = ['DISBURSED', 'REJECTED', 'CANCELLED'];

// Strictly defined state transition matrix
const STATE_TRANSITIONS: Record<ScholarshipState, ScholarshipState[]> = {
  ELIGIBLE: ['APPLIED', 'CANCELLED'],
  APPLIED: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_VERIFICATION', 'CANCELLED'],
  UNDER_VERIFICATION: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['SANCTIONED', 'CANCELLED'],
  SANCTIONED: ['DISBURSED', 'CANCELLED'],
  DISBURSED: [],
  REJECTED: [],
  CANCELLED: []
};

// Deterministic eligibility check based purely on existing schema
function isEligible(user: User): boolean {
  // MVP Rule: We can only deterministically verify the user is a student.
  // No other eligibility rules are explicitly documented in the repository.
  return user.role === 'Student';
}

export class ScholarshipService {
  /**
   * Evaluates the student's eligibility using deterministic rules without mutating DB.
   */
  static checkEligibility(user: User): boolean {
    return isEligible(user);
  }

  /**
   * Initializes the scholarship record. Only succeeds if student is eligible.
   * Fully idempotent: returns the existing record if already initialized.
   */
  static async initialize(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    if (!this.checkEligibility(user)) {
      throw new Error('User is not eligible for scholarship');
    }

    // Idempotency: check if already exists
    let scholarship = await prisma.scholarship.findUnique({
      where: { studentId: userId }
    });

    if (scholarship) {
      return scholarship; // Already initialized, return safely
    }

    scholarship = await prisma.scholarship.create({
      data: {
        studentId: userId,
        academicYear: new Date().getFullYear().toString(),
        status: 'ELIGIBLE'
      }
    });

    await AuditService.log({
      actorId: userId,
      action: 'SCHOLARSHIP_CREATED',
      domain: 'Scholarship',
      targetId: scholarship.id
    });

    return scholarship;
  }

  /**
   * Atomic state transition using updateMany to prevent concurrent overlaps.
   * Validates transition against canonical STATE_TRANSITIONS matrix.
   */
  static async transitionState(
    id: string,
    from: ScholarshipState,
    to: ScholarshipState,
    actorId: string,
    _actorRole: string
  ) {
    // 1. Verify valid transition path
    const allowedNext = STATE_TRANSITIONS[from];
    if (!allowedNext || !allowedNext.includes(to)) {
      throw new Error(`Invalid state transition from ${from} to ${to}`);
    }

    // 2. Perform atomic database update
    const result = await prisma.scholarship.updateMany({
      where: {
        id: id,
        status: from
      },
      data: {
        status: to,
        updatedAt: new Date()
      }
    });

    if (result.count !== 1) {
      throw new Error('Invalid state transition or concurrent update detected.');
    }

    // 3. Post-mutation side effects
    const scholarship = await prisma.scholarship.findUnique({ where: { id } });
    if (!scholarship) throw new Error('Failed to load updated scholarship');

    // Audit
    await AuditService.log({
      actorId: actorId,
      action: 'STATUS_CHANGED',
      domain: 'Scholarship',
      targetId: id,
      metadata: { from, to }
    });

    // Notifications
    const notificationMessages: Partial<Record<ScholarshipState, { title: string, message: string }>> = {
      SUBMITTED: { title: 'Application Submitted', message: 'Your scholarship application has been successfully submitted and is pending review.' },
      APPROVED: { title: 'Application Approved', message: 'Your scholarship application has been approved and is awaiting sanction.' },
      REJECTED: { title: 'Application Rejected', message: 'Your scholarship application has been rejected during verification.' },
      DISBURSED: { title: 'Funds Disbursed', message: 'Your scholarship funds have been successfully disbursed.' },
      CANCELLED: { title: 'Application Cancelled', message: 'Your scholarship application has been cancelled.' }
    };

    const notif = notificationMessages[to];
    if (notif) {
      // Intentionally not failing the transition if notification fails
      try {
        await NotificationService.create({
          recipientId: scholarship.studentId,
          title: notif.title,
          message: notif.message,
          type: 'SCHOLARSHIP_UPDATE'
        });
      } catch (e) {
        console.error(`Failed to send notification for scholarship ${id}:`, e);
      }
    }

    return scholarship;
  }
}
