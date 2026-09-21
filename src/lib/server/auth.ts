import { User } from '@prisma/client';

export type ActionType = 
  | 'CREATE_REQUEST' 
  | 'ASSIGN_REQUEST' 
  | 'PROCESS_REQUEST' 
  | 'RESOLVE_REQUEST' 
  | 'VERIFY_REQUEST' 
  | 'CLOSE_REQUEST' 
  | 'REJECT_REQUEST'
  | 'CANCEL_REQUEST'
  | 'ESCALATE_REQUEST';

export function hasAuthority(user: User, action: ActionType, resourceContext?: { requesterId?: string; domain?: string; assignedAuthorityId?: string }): boolean {
  // Simplistic Role + Domain + Scope check for Week 1
  
  if (user.role === 'ADMIN') return true; // Admins can do anything

  switch (action) {
    case 'CREATE_REQUEST':
      return true; // Anyone can create a request
      
    case 'CANCEL_REQUEST':
    case 'VERIFY_REQUEST':
      // Only the original requester can cancel or verify their own request
      return resourceContext?.requesterId === user.id;
      
    case 'ASSIGN_REQUEST':
    case 'REJECT_REQUEST':
    case 'ESCALATE_REQUEST':
      // Authority (e.g. Warden/HOD/Supervisor) in the same domain can assign/reject
      if (user.role === 'WARDEN' || user.role === 'SUPERVISOR' || user.role === 'HOD') {
        return !resourceContext?.domain || user.domain === resourceContext.domain;
      }
      return false;
      
    case 'PROCESS_REQUEST':
    case 'RESOLVE_REQUEST':
      // The assigned authority or domain supervisor can process/resolve
      if (resourceContext?.assignedAuthorityId === user.id) return true;
      if (user.role === 'WARDEN' || user.role === 'SUPERVISOR') {
        return !resourceContext?.domain || user.domain === resourceContext.domain;
      }
      return false;
      
    case 'CLOSE_REQUEST':
      // Admin or domain authority can close
      return user.role === 'ADMIN' || user.role === 'WARDEN' || user.role === 'SUPERVISOR';
      
    default:
      return false; // Fail safe
  }
}
