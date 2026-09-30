const fs = require('fs');

let content = fs.readFileSync('src/lib/services/request-engine.ts', 'utf8');

const targetFunctionStart = content.indexOf('static async createRequest(payload: CreateRequestPayload) {');
const targetFunctionEnd = content.indexOf('static async updateStatus', targetFunctionStart);

const before = content.slice(0, targetFunctionStart);
const after = content.slice(targetFunctionEnd);

const newFunction = \static async createRequest(payload: CreateRequestPayload) {
    if (payload.idempotencyKey) {
      const existing = await prisma.request.findUnique({ where: { idempotencyKey: payload.idempotencyKey } });
      if (existing) return existing;
    }

    // 1. Classification & Routing
    const routeResult = await RoutingEngine.classifyAndRoute({
      requestType: payload.requestType,
      category: payload.category,
      description: payload.description,
      location: payload.location
    });

    // 2. Policy Evaluation
    const policyResult = await PolicyService.resolvePolicyForRequest(
      { requestType: payload.requestType, category: payload.category, domain: routeResult.domain },
      { request: { metadata: payload.metadata ? JSON.stringify(payload.metadata) : null } }
    );

    const autoApprove = policyResult.autoApproveAllowed;
    const ticketNumber = \\\\-\\\\;
    
    // Determine initial status
    let initialStatus = 'PENDING';
    if (autoApprove) {
       initialStatus = 'APPROVED';
    } else if (routeResult.authorityUserId) {
       initialStatus = 'ASSIGNED';
    }

    try {
      const request = await prisma.request.create({
        data: {
          ticketNumber,
          requestType: payload.requestType,
          category: payload.category,
          requesterId: payload.requesterId,
          description: payload.description,
          location: payload.location,
          priority: payload.priority || 'LOW',
          status: initialStatus,
          assignedDepartment: routeResult.department || null,
          assignedAuthorityId: autoApprove ? null : (routeResult.authorityUserId || null),
          metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
          idempotencyKey: payload.idempotencyKey || null,
          SLA: policyResult.slaHours,
          dueAt: policyResult.slaHours ? new Date(Date.now() + policyResult.slaHours * 3600000) : null,
          policyId: policyResult.policyId || null,
          requestSla: policyResult.slaHours ? {
            create: {
              targetHours: policyResult.slaHours,
              dueAt: new Date(Date.now() + policyResult.slaHours * 3600000)
            }
          } : undefined,
          statusHistory: {
            create: {
              toStatus: initialStatus,
              actorId: payload.requesterId
            }
          },
          assignmentHistory: (!autoApprove && routeResult.authorityUserId) ? {
            create: {
              assigneeId: routeResult.authorityUserId,
              assignedBy: 'system-router',
              reason: routeResult.reason
            }
          } : undefined
        },
      });

      await logAudit(request.id, payload.requesterId, 'CREATED');
      await triggerNotification(request.id, 'CREATED');

      // Audit Routing
      await logAudit(request.id, 'system-router', 'ROUTED', {
         domain: routeResult.domain,
         department: routeResult.department,
         reason: routeResult.reason,
         manualReviewRequired: routeResult.manualReviewRequired
      });

      // Audit Policy
      await logAudit(request.id, 'system-policy-engine', 'POLICY_EVALUATED', {
         policyId: policyResult.policyId,
         policyName: policyResult.policyName,
         reason: policyResult.explanation
      });
      
      if (autoApprove) {
        await logAudit(request.id, payload.requesterId, 'AUTO_APPROVED', { reason: policyResult.explanation, policyId: policyResult.policyId });
      } else if (routeResult.authorityUserId) {
        await logAudit(request.id, 'system-router', 'ASSIGNED', { assigneeId: routeResult.authorityUserId, reason: routeResult.reason });
        await triggerNotification(request.id, 'ASSIGNED', routeResult.authorityUserId);
      }

      return request;
    } catch (error: any) {
      if (
        error && 
        typeof error === 'object' && 
        'code' in error && 
        error.code === 'P2002' && 
        payload.idempotencyKey
      ) {
        const existing = await prisma.request.findUnique({ where: { idempotencyKey: payload.idempotencyKey } });
        if (existing) return existing;
      }
      throw error;
    }
  }

  \;

fs.writeFileSync('src/lib/services/request-engine.ts', before + newFunction + after);
