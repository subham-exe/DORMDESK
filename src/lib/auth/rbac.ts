import { Role, Domain, Permission, Scope, ROLE_POLICIES } from './policies';

export interface AuthUser {
  id: string;
  role: string;
  hostel?: string | null;
  department?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function authorize(
  user: AuthUser,
  domain: Domain,
  permission: Permission,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resource?: any
): boolean {
  if (!user || !user.role) {
    return false; // Unauthenticated or missing role
  }

  const userRole = user.role as Role;
  const rolePolicy = ROLE_POLICIES[userRole];

  if (!rolePolicy) {
    return false; // Unknown role
  }

  const domainPolicy = rolePolicy[domain];
  if (!domainPolicy) {
    return false; // Unknown domain for this role
  }

  const allowedScopes = domainPolicy[permission];
  if (!allowedScopes || allowedScopes.length === 0) {
    return false; // Permission denied for this domain
  }

  // If Any scope is allowed, automatically authorize
  if (allowedScopes.includes('Any')) {
    return true;
  }

  // For Create operations where the resource might not yet exist or is being created
  // We trust the controller to enforce the ID matches, but we allow the action if they have a scoped permission
  if (permission === 'Create' && !resource) {
    return allowedScopes.length > 0;
  }

  // If resource is missing for non-Create, we must deny if 'Any' was not present
  if (!resource) {
    return false;
  }

  // Evaluate scoped permissions
  for (const scope of allowedScopes) {
    if (evaluateScope(user, scope, domain, resource)) {
      return true; // Return true on first passing scope
    }
  }

  // Deny by default
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evaluateScope(user: AuthUser, scope: Scope, domain: Domain, resource: any): boolean {
  switch (scope) {
    case 'Own':
      if (domain === 'Request') {
        return resource.requesterId === user.id || resource.assignedAuthorityId === user.id;
      }
      if (domain === 'Scholarship') {
        return resource.studentId === user.id;
      }
      if (domain === 'User') {
        return resource.id === user.id;
      }
      if (domain === 'Incident') {
        // Incident ownership is trickier, maybe if they created it?
        // Fallback for MVP: 
        return resource.creatorId === user.id;
      }
      return false;

    case 'Hostel':
      if (!user.hostel) return false;
      // Expecting resource to have a `hostel` field (e.g. injected or from nested requester query)
      // Alternatively, checking if location string contains the hostel name
      if (resource.hostel && resource.hostel === user.hostel) return true;
      if (resource.location && typeof resource.location === 'string') {
        return resource.location.includes(user.hostel);
      }
      return false;

    case 'Department':
      if (!user.department) return false;
      return resource.assignedDepartment === user.department || resource.department === user.department;

    default:
      return false;
  }
}
