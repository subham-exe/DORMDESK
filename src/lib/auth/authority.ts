import { prisma } from '@/lib/db/prisma';

// Canonical authority names
export const SYSTEM_ADMIN = 'SYSTEM_ADMIN';
export const PRINCIPAL = 'PRINCIPAL';

// Serious complaint categories
export const SERIOUS_CATEGORIES = ['abuse', 'harassment', 'ragging', 'safety_threat'] as const;
export type SeriousCategory = typeof SERIOUS_CATEGORIES[number];

export interface AuthorityInfo {
  id: string;
  name: string;
  collegeId: string | null;
  capabilities: Record<string, boolean>;
}

export interface AuthenticatedActor {
  id: string;
  email: string;
  name: string;
  authority: AuthorityInfo | null;
  collegeId: string | null;
  departmentRefId: string | null;
  hostelRefId: string | null;
  // Legacy compatibility
  role: string;
  department: string | null;
  hostel: string | null;
}

/**
 * Resolve the canonical authority for a user.
 * This is the SINGLE source of truth for authorization.
 */
export async function getAuthority(userId: string): Promise<AuthorityInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { authority: true }
  });
  if (!user?.authority) return null;
  
  let capabilities: Record<string, boolean> = {};
  if (user.authority.capabilities) {
    try { capabilities = JSON.parse(user.authority.capabilities); } catch {}
  }
  
  return {
    id: user.authority.id,
    name: user.authority.name,
    collegeId: user.authority.collegeId || user.collegeId,
    capabilities,
  };
}

/**
 * Check if user is the SYSTEM_ADMIN (001).
 */
export function isSystemAdmin(user: { authority?: { name: string } | null, authorityId?: string | null }): boolean {
  return user.authority?.name === SYSTEM_ADMIN;
}

/**
 * Check if user is a PRINCIPAL.
 */
export function isPrincipal(user: { authority?: { name: string } | null }): boolean {
  return user.authority?.name === PRINCIPAL;
}

/**
 * Check if user has any staff/authority role (not a student).
 * Uses canonical authority, NOT User.role string.
 */
export function isStaffAuthority(user: { authority?: { name: string } | null }): boolean {
  if (!user.authority) return false;
  return user.authority.name !== 'STUDENT';
}

/**
 * Get the effective college scope for an actor.
 * SYSTEM_ADMIN has no college scope (platform-level).
 * Everyone else is scoped to their college.
 */
export function getCollegeScope(user: { authority?: { name: string } | null, collegeId?: string | null }): string | null {
  if (isSystemAdmin(user)) return null; // Platform-level, not college-scoped
  return user.collegeId || null;
}

/**
 * Require that the authenticated user has one of the specified authority names.
 * Throws FORBIDDEN if not.
 */
export async function requireAuthority(
  user: { id: string, authorityId?: string | null, authority?: { name: string } | null },
  allowedAuthorities: string[]
): Promise<AuthorityInfo> {
  let authority: AuthorityInfo | null = null;
  
  if (user.authority) {
    let capabilities: Record<string, boolean> = {};
    const auth = user.authority as { id?: string, name: string, collegeId?: string | null, capabilities?: string | null };
    if (auth.capabilities) {
      try { capabilities = JSON.parse(auth.capabilities); } catch {}
    }
    authority = {
      id: auth.id || user.authorityId || '',
      name: auth.name,
      collegeId: auth.collegeId || (user as { collegeId?: string | null }).collegeId || null,
      capabilities,
    };
  } else if (user.authorityId) {
    authority = await getAuthority(user.id);
  }
  
  if (!authority || !allowedAuthorities.includes(authority.name)) {
    throw new Error('FORBIDDEN');
  }
  
  return authority;
}

/**
 * Require that the actor's college matches the target college.
 * SYSTEM_ADMIN bypasses this for platform-level operations.
 * Returns the verified college scope.
 */
export function requireCollegeScope(
  actor: { authority?: { name: string } | null, collegeId?: string | null },
  targetCollegeId: string | null
): void {
  // SYSTEM_ADMIN operates at platform level - can access any college for management
  if (isSystemAdmin(actor)) return;
  
  // Everyone else must have a college and it must match
  if (!actor.collegeId) {
    throw new Error('FORBIDDEN: Actor has no college scope');
  }
  if (targetCollegeId && actor.collegeId !== targetCollegeId) {
    throw new Error('FORBIDDEN: Cross-college access denied');
  }
}

/**
 * Check if actor can manage a target user's authority.
 * Replaces the old levelNumber-based canManageTarget().
 */
export async function canManageTarget(
  actorId: string,
  targetAuthorityName: string,
  targetCollegeId?: string | null,
  targetDepartmentId?: string | null,
  targetHostelId?: string | null
): Promise<boolean> {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    include: { authority: true }
  });
  if (!actor?.authority) return false;
  
  const actorAuth = actor.authority.name;
  
  // SYSTEM_ADMIN management rules:
  if (actorAuth === SYSTEM_ADMIN) {
    // Cannot create another SYSTEM_ADMIN
    if (targetAuthorityName === SYSTEM_ADMIN) return false;
    // Can create/manage PRINCIPAL (any college)
    if (targetAuthorityName === PRINCIPAL) return true;
    // Can create/manage college-specific authorities for any college
    return true;
  }
  
  // PRINCIPAL management rules:
  if (actorAuth === PRINCIPAL) {
    // Cannot create SYSTEM_ADMIN
    if (targetAuthorityName === SYSTEM_ADMIN) return false;
    // Cannot create another PRINCIPAL
    if (targetAuthorityName === PRINCIPAL) return false;
    // Must be in same college
    if (!actor.collegeId || actor.collegeId !== targetCollegeId) return false;
    // Can manage college-specific authorities within own college
    return true;
  }
  
  // No other authority can manage users
  return false;
}

/**
 * Determine the legacy role string from a canonical authority name.
 * Used ONLY for backward compatibility during migration.
 * This NEVER grants privileges - it's for display/routing only.
 */
export function deriveLegacyRole(authorityName: string): string {
  switch (authorityName) {
    case SYSTEM_ADMIN: return 'SystemAdmin';
    case PRINCIPAL: return 'Admin';
    case 'HOD': return 'Admin';
    case 'FACULTY': return 'Faculty';
    case 'WARDEN': return 'Warden';
    case 'STAFF': return 'Staff';
    case 'STUDENT': return 'Student';
    default: return 'Student';
  }
}

/**
 * Get the canonical authority name from a user, with authority included.
 * Falls back to legacy role mapping if authority is not set.
 */
export function getAuthorityName(user: { authority?: { name: string } | null, role?: string }): string {
  if (user.authority?.name) return user.authority.name;
  // Legacy fallback - ONLY for reading, never for privilege granting
  return 'STUDENT';
}

/**
 * Check if a serious complaint should bypass normal routing.
 * Returns the list of user IDs who should receive it.
 */
export async function resolveSeriousComplaintRecipients(
  isSerious: boolean,
  seriousCategory: string | null,
  complainantCollegeId: string | null,
  isAboutPrincipal: boolean
): Promise<{ principalIds: string[], systemAdminIds: string[] }> {
  if (!isSerious) return { principalIds: [], systemAdminIds: [] };
  
  // Always include SYSTEM_ADMIN
  const sysAdminAuth = await prisma.authorityLevel.findUnique({ where: { name: SYSTEM_ADMIN } });
  const systemAdminUsers = sysAdminAuth ? await prisma.user.findMany({
    where: { authorityId: sysAdminAuth.id, accountStatus: 'ACTIVE' }
  }) : [];
  const systemAdminIds = systemAdminUsers.map(u => u.id);
  
  // If complaint is about Principal, only 001 gets it
  if (isAboutPrincipal) {
    return { principalIds: [], systemAdminIds };
  }
  
  // Otherwise, include own college Principal
  let principalIds: string[] = [];
  if (complainantCollegeId) {
    const principalAuth = await prisma.authorityLevel.findUnique({ where: { name: PRINCIPAL } });
    if (principalAuth) {
      const principals = await prisma.user.findMany({
        where: {
          authorityId: principalAuth.id,
          collegeId: complainantCollegeId,
          accountStatus: 'ACTIVE'
        }
      });
      principalIds = principals.map(p => p.id);
    }
  }
  
  return { principalIds, systemAdminIds };
}
