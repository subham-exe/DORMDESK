import { PolicyConditionEvaluator } from './policy-evaluator';
import { prisma } from '../db/prisma';
import { Request } from '@prisma/client';
import { PolicyInput, PolicyValidator } from './policy-validator';
import { AuditService } from './audit';

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
      orderBy: [
        { updatedAt: 'desc' }, // Explicit tie-breaking: most recently updated wins
        { id: 'asc' }          // Absolute deterministic fallback
      ]
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

    if (selectedPolicy.autoApproveCondition) {
      try {
        const condition = JSON.parse(selectedPolicy.autoApproveCondition);
        const metadataObj = context?.request?.metadata ? JSON.parse(context.request.metadata) : {};
        
        // Build evaluation context securely
        const evalContext = {
           ...metadataObj, // Untrusted fields first
           requestType: payload.requestType, // Trusted fields last to prevent overwrite
           category: payload.category,
           domain: payload.domain
        };

        const isApproved = PolicyConditionEvaluator.evaluate(condition, evalContext);

        if (isApproved) {
           autoApproveAllowed = true;
           autoApproveExplanation = 'Auto-approved because policy conditions were successfully met.';
        } else {
           autoApproveExplanation = 'Not auto-approved because policy conditions were not met.';
        }
      } catch (e) {
         console.error('Failed to parse or evaluate autoApproveCondition', e);
         autoApproveExplanation = 'Auto-approval bypassed due to condition evaluation error.';
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

  // --- CRUD Operations ---

  static async listPolicies() {
    return prisma.policy.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }]
    });
  }

  static async getPolicy(id: string) {
    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new Error('NOT_FOUND');
    return policy;
  }

  static async createPolicy(input: PolicyInput, actorId: string) {
    PolicyValidator.validate(input);

    const created = await prisma.policy.create({
      data: {
        name: input.name,
        description: input.description,
        requestType: input.requestType,
        category: input.category,
        domain: input.domain,
        approvalRequired: input.approvalRequired ?? true,
        autoApproveCondition: input.autoApproveCondition,
        slaHours: input.slaHours,
        escalationPolicy: input.escalationPolicy,
        allowedTransitions: input.allowedTransitions,
        isActive: input.isActive ?? true,
      }
    });

    await AuditService.log({
      actorId,
      action: 'POLICY_CREATED',
      domain: 'System',
      targetId: created.id,
      metadata: { name: created.name }
    });

    return created;
  }

  static async updatePolicy(id: string, input: PolicyInput, actorId: string) {
    PolicyValidator.validate(input);

    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');
    if (input.version !== undefined && existing.version !== input.version) {
      throw new Error('CONCURRENCY_CONFLICT');
    }

    if (!input.isActive && existing.isActive) {
      // Trying to deactivate. Check if this is the only default fallback.
      const isDefaultFallback = !existing.requestType && !existing.category && !existing.domain;
      if (isDefaultFallback) {
        const activeFallbacksCount = await prisma.policy.count({
          where: { isActive: true, requestType: null, category: null, domain: null }
        });
        if (activeFallbacksCount <= 1) {
          throw new Error('SAFETY_VIOLATION: Cannot deactivate the only active global fallback policy.');
        }
      }
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        requestType: input.requestType,
        category: input.category,
        domain: input.domain,
        approvalRequired: input.approvalRequired ?? true,
        autoApproveCondition: input.autoApproveCondition,
        slaHours: input.slaHours,
        escalationPolicy: input.escalationPolicy,
        allowedTransitions: input.allowedTransitions,
        isActive: input.isActive,
        version: { increment: 1 }
      }
    });

    const action = (!input.isActive && existing.isActive) ? 'POLICY_DEACTIVATED' :
                   (input.isActive && !existing.isActive) ? 'POLICY_ACTIVATED' : 'POLICY_UPDATED';

    await AuditService.log({
      actorId,
      action,
      domain: 'System',
      targetId: updated.id,
      metadata: { name: updated.name, version: updated.version }
    });

    return updated;
  }

  static async deletePolicy(id: string, actorId: string) {
    // Soft delete/deactivate is preferred over hard delete. 
    return this.deactivatePolicy(id, actorId);
  }

  static async deactivatePolicy(id: string, actorId: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');
    return this.updatePolicy(id, {
      name: existing.name,
      description: existing.description,
      requestType: existing.requestType,
      category: existing.category,
      domain: existing.domain,
      approvalRequired: existing.approvalRequired,
      autoApproveCondition: existing.autoApproveCondition,
      slaHours: existing.slaHours,
      escalationPolicy: existing.escalationPolicy,
      allowedTransitions: existing.allowedTransitions,
      version: existing.version,
      isActive: false
    }, actorId);
  }
}


