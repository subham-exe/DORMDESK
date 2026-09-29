import { prisma } from '../db/prisma';
import { Request } from '@prisma/client';

export interface PolicyEvaluationResult {
  policyId?: string;
  policyName?: string;
  explanation: string;
  approvalRequired: boolean;
  autoApproveAllowed: boolean;
  slaHours?: number;
  escalationPolicy?: Record<string, unknown>;
  allowedTransitions?: Record<string, string[]>;
}

export class PolicyService {
  static async resolvePolicyForRequest(
    payload: { requestType: string; category: string; domain?: string },
    context?: { request?: { metadata?: string | null } }
  ): Promise<PolicyEvaluationResult> {
    const policies = await prisma.policy.findMany({
      where: { isActive: true },
    });

    let selectedPolicy = null;
    let matchType = 'default fallback';

    const categoryRequestTypeMatch = policies.find(p => p.category === payload.category && p.requestType === payload.requestType);
    const categoryMatch = policies.find(p => p.category === payload.category && !p.requestType);
    const requestTypeMatch = policies.find(p => p.requestType === payload.requestType && !p.category);
    const domainMatch = payload.domain ? policies.find(p => p.domain === payload.domain && !p.requestType && !p.category) : undefined;
    const defaultMatch = policies.find(p => !p.requestType && !p.category && !p.domain);

    if (categoryRequestTypeMatch) {
      selectedPolicy = categoryRequestTypeMatch;
      matchType = 'specific request-type and category policy';
    } else if (categoryMatch) {
      selectedPolicy = categoryMatch;
      matchType = 'specific category policy';
    } else if (requestTypeMatch) {
      selectedPolicy = requestTypeMatch;
      matchType = 'specific request-type policy';
    } else if (domainMatch) {
      selectedPolicy = domainMatch;
      matchType = 'domain policy';
    } else if (defaultMatch) {
      selectedPolicy = defaultMatch;
      matchType = 'global default policy';
    }

    if (!selectedPolicy) {
      return {
        explanation: 'No configured policy found, falling back to system defaults.',
        approvalRequired: true,
        autoApproveAllowed: false,
      };
    }

    let autoApproveAllowed = false;
    let autoApproveExplanation = '';

    if (selectedPolicy.autoApproveCondition && context?.request) {
      try {
        const condition = JSON.parse(selectedPolicy.autoApproveCondition);
        if (condition.type === 'LEAVE_DAYS_LESS_THAN_OR_EQUAL' && payload.requestType === 'LEAVE') {
          const metadata = context.request.metadata ? JSON.parse(context.request.metadata) : {};
          if (metadata.leaveDays && metadata.leaveDays <= condition.days) {
            autoApproveAllowed = true;
            autoApproveExplanation = `Auto-approved because leave duration is ${metadata.leaveDays} days or less (<= ${condition.days}).`;
          } else {
             autoApproveExplanation = `Not auto-approved because leave duration is greater than ${condition.days} days.`;
          }
        }
      } catch (e) {
         console.error('Failed to parse autoApproveCondition', e);
      }
    }

    let explanation = `Policy selected: ${selectedPolicy.name} (Matched by ${matchType}). `;
    if (autoApproveAllowed) {
      explanation += autoApproveExplanation;
    } else if (selectedPolicy.slaHours) {
      explanation += `SLA target is ${selectedPolicy.slaHours} hours because this request matches the ${selectedPolicy.requestType || selectedPolicy.category || 'default'} policy.`;
    } else {
      explanation += `Approval required: ${selectedPolicy.approvalRequired}.`;
    }
    if (autoApproveExplanation && !autoApproveAllowed) {
       explanation += ` ${autoApproveExplanation}`;
    }

    let escalationPolicy;
    if (selectedPolicy.escalationPolicy) {
      try { escalationPolicy = JSON.parse(selectedPolicy.escalationPolicy); } catch {}
    }

    let allowedTransitions;
    if (selectedPolicy.allowedTransitions) {
      try { allowedTransitions = JSON.parse(selectedPolicy.allowedTransitions); } catch {}
    }

    return {
      policyId: selectedPolicy.id,
      policyName: selectedPolicy.name,
      explanation: explanation.trim(),
      approvalRequired: selectedPolicy.approvalRequired,
      autoApproveAllowed,
      slaHours: selectedPolicy.slaHours || undefined,
      escalationPolicy,
      allowedTransitions,
    };
  }

  static async validateTransition(
     request: Request,
     newStatus: string,
     actor: { id: string, role: string, domain?: string }
  ): Promise<{ valid: boolean, explanation: string }> {
     const policyResult = await this.resolvePolicyForRequest({
        requestType: request.requestType,
        category: request.category,
        domain: actor.domain
     });

     if (policyResult.allowedTransitions && policyResult.allowedTransitions[actor.role]) {
         const validNextStatuses = policyResult.allowedTransitions[actor.role];
         if (!validNextStatuses.includes(newStatus)) {
             return { valid: false, explanation: `Transition rejected because the actor role (${actor.role}) does not have permission for this transition within this domain.` };
         }
     }

     return { valid: true, explanation: 'Transition permitted by policy.' };
  }
}
