import { prisma } from '@/lib/db/prisma';
import { AuditService } from './audit';
import { PolicyService } from './policy';

export interface CreateEvidencePayload {
  requestId: string;
  type: string;
  description?: string;
  reference: string;
  actorId: string;
}

export class EvidenceService {
  static async addEvidence(payload: CreateEvidencePayload) {
    const request = await prisma.request.findUnique({
      where: { id: payload.requestId }
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const actor = await prisma.user.findUnique({ where: { id: payload.actorId } });
    if (!actor) {
      throw new Error('Actor not found');
    }

    // Authorization
    // 1. Staff assigned to this request can add evidence
    // 2. Admin can add evidence
    // 3. Request creator (student) can add evidence (e.g., initial photos)
    if (actor.role === 'Student' && request.requesterId !== actor.id) { throw new Error('Not authorized'); }
    const isAssignee = request.assignedAuthorityId === actor.id;
    const isCreator = request.requesterId === actor.id;
    const isAdmin = actor.role === 'Admin';

    if (!isAssignee && !isCreator && !isAdmin) {
      // Check if domain policy allows them generally?
      const check = await PolicyService.validateTransition(
        request,
        'PROCESSING', // A proxy for edit rights
        { id: actor.id, role: actor.role, domain: actor.department || undefined }
      );
      if (!check.valid) {
        throw new Error('Not authorized to add evidence to this request');
      }
    }

    const evidence = await prisma.evidence.create({
      data: {
        requestId: payload.requestId,
        type: payload.type,
        description: payload.description,
        reference: payload.reference,
        createdBy: payload.actorId
      }
    });

    await AuditService.log({
      actorId: payload.actorId,
      action: 'EVIDENCE_ADDED',
      domain: 'Request',
      targetId: payload.requestId,
      metadata: { evidenceId: evidence.id, type: payload.type }
    });

    return evidence;
  }

  static async getEvidenceForRequest(requestId: string, actorId: string) {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Request not found');

    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new Error('Actor not found');

    if (actor.role === 'Student' && request.requesterId !== actor.id) {
      throw new Error('Not authorized to view this request evidence');
    } else if (actor.role !== 'Admin' && actor.role !== 'Student') {
      let isAllowed = false;
      if (request.assignedAuthorityId === actor.id) {
        isAllowed = true;
      } else if (actor.role === 'Warden' && actor.hostel && request.location && request.location.includes(actor.hostel)) {
        isAllowed = true;
      } else if ((actor.role === 'Staff' || actor.role === 'Faculty') && actor.department && request.assignedDepartment === actor.department) {
        isAllowed = true;
      }
      if (!isAllowed) {
        throw new Error('Not authorized to view this request evidence');
      }
    }

    return prisma.evidence.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
