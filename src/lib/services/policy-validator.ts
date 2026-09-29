export const VALID_ROLES = ['Student', 'Warden', 'Admin', 'Faculty', 'Staff'];

export const VALID_REQUEST_TYPES = ['COMPLAINT', 'LEAVE', 'CERTIFICATE', 'OTHER'];

export const VALID_LIFECYCLE_STATES = [
  'PENDING', 'ASSIGNED', 'ACKNOWLEDGED', 'PROCESSING', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED', 'CANCELLED'
];

export interface PolicyInput {
  name: string;
  description?: string | null;
  requestType?: string | null;
  category?: string | null;
  domain?: string | null;
  approvalRequired?: boolean;
  autoApproveCondition?: string | null;
  slaHours?: number | null;
  escalationPolicy?: string | null;
  allowedTransitions?: string | null;
  isActive?: boolean;
  version?: number;
}

export class PolicyValidator {
  static validate(input: PolicyInput): void {
    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new Error('Policy name is required');
    }

    if (input.requestType && !VALID_REQUEST_TYPES.includes(input.requestType)) {
      throw new Error(`Invalid requestType. Must be one of: ${VALID_REQUEST_TYPES.join(', ')}`);
    }

    if (input.slaHours !== undefined && input.slaHours !== null) {
      if (typeof input.slaHours !== 'number' || input.slaHours < 0) {
        throw new Error('SLA hours must be a non-negative number');
      }
    }

    if (input.autoApproveCondition) {
      try {
        const parsed = JSON.parse(input.autoApproveCondition);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('autoApproveCondition must be a JSON object');
        }
        if (parsed.type && typeof parsed.type !== 'string') {
          throw new Error('autoApproveCondition.type must be a string');
        }
      } catch (e: unknown) {
        throw new Error(`Invalid autoApproveCondition JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    if (input.escalationPolicy) {
      try {
        const parsed = JSON.parse(input.escalationPolicy);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('escalationPolicy must be a JSON object');
        }
        if (parsed.escalateToRole && !VALID_ROLES.includes(parsed.escalateToRole)) {
          throw new Error(`escalateToRole must be one of: ${VALID_ROLES.join(', ')}`);
        }
      } catch (e: unknown) {
        throw new Error(`Invalid escalationPolicy JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    if (input.allowedTransitions) {
      try {
        const parsed = JSON.parse(input.allowedTransitions);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('allowedTransitions must be a JSON object mapping roles to arrays of statuses');
        }
        for (const [role, statuses] of Object.entries(parsed)) {
          if (!VALID_ROLES.includes(role)) {
             throw new Error(`Invalid role in allowedTransitions: ${role}`);
          }
          if (!Array.isArray(statuses)) {
             throw new Error(`allowedTransitions for role ${role} must be an array of statuses`);
          }
          for (const status of statuses) {
             if (typeof status !== 'string' || !VALID_LIFECYCLE_STATES.includes(status)) {
                 throw new Error(`Invalid status in allowedTransitions for role ${role}: ${status}`);
             }
          }
        }
      } catch (e: unknown) {
        throw new Error(`Invalid allowedTransitions JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  }
}
