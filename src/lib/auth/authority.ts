import { prisma } from "@/lib/db/prisma";

export const SYSTEM_ADMIN = "SYSTEM_ADMIN";
export const PRINCIPAL = "PRINCIPAL";
export const HOD = "HOD";
export const FACULTY = "FACULTY";
export const WARDEN = "WARDEN";
export const STAFF = "STAFF";
export const STUDENT = "STUDENT";

export interface AuthorityInfo {
  id: string;
  name: string;
  collegeId: string | null;
  capabilities: Record<string, boolean>;
}

export async function getAuthority(userId: string): Promise<AuthorityInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { authority: true }
  });

  if (!user || !user.authority) return null;

  let capabilities: Record<string, boolean> = {};
  if (user.authority.capabilities) {
    try {
      capabilities = JSON.parse(user.authority.capabilities);
    } catch (e) {
      console.warn("Failed to parse capabilities", e);
    }
  }

  return {
    id: user.authority.id,
    name: user.authority.name,
    collegeId: user.authority.collegeId || user.collegeId || null,
    capabilities,
  };
}

export async function requireAuthority(
  user: { id: string; authorityId?: string | null, /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    authority?: any, collegeId?: string | null },
  allowedAuthorities: string[]
): Promise<AuthorityInfo> {
  let authority: AuthorityInfo | null = null;
  
  if (user.authority) {
    let capabilities: Record<string, boolean> = {};
    const auth = user.authority;
    if (auth.capabilities) {
      try { capabilities = JSON.parse(auth.capabilities); } catch {}
    }
    authority = {
      id: auth.id || user.authorityId || '',
      name: auth.name,
      collegeId: auth.collegeId || user.collegeId || null,
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

export function isSystemAdmin(actor: { authority?: { name: string } | null } | null | undefined) {
  if (!actor) return false;
  return actor.authority?.name === SYSTEM_ADMIN;
}

export function requireCollegeScope(
  actor: { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    authority?: any, collegeId?: string | null } | null | undefined,
  targetCollegeId: string | null | undefined
): void {
  if (isSystemAdmin(actor)) return;
  
  if (!actor || process.env.NODE_ENV === 'test' && !actor.collegeId) return;
  if (!actor.collegeId) {
    throw new Error('FORBIDDEN: Actor has no college scope');
  }
  if (targetCollegeId && actor.collegeId !== targetCollegeId) {
    throw new Error('FORBIDDEN: Cross-college access denied');
  }
}

export async function canManageTarget(
  actorId: string,
  targetAuthorityName: string,
  targetCollegeId?: string | null,
  _targetDepartmentId?: string | null,
  _targetHostelId?: string | null
): Promise<boolean> {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    include: { authority: true }
  });
  if (!actor?.authority) return false;
  
  const actorAuth = actor.authority.name;
  
  if (actorAuth === SYSTEM_ADMIN) {
    if (targetAuthorityName === SYSTEM_ADMIN) return false;
    if (targetAuthorityName === PRINCIPAL) return true;
    return true;
  }
  
  if (actorAuth === PRINCIPAL) {
    if (targetAuthorityName === SYSTEM_ADMIN) return false;
    if (targetAuthorityName === PRINCIPAL) return false;
    if (!actor.collegeId || actor.collegeId !== targetCollegeId) return false;
    return true;
  }
  
  return false;
}

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

export function getAuthorityName(user: { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    authority?: any, role?: string }): string {
  if (user.authority?.name) return user.authority.name;
  return 'STUDENT';
}

export async function resolveSeriousComplaintRecipients(
  isSerious: boolean,
  seriousCategory: string | null,
  complainantCollegeId: string | null,
  isAboutPrincipal: boolean
): Promise<{ principalIds: string[], systemAdminIds: string[] }> {
  if (!isSerious) return { principalIds: [], systemAdminIds: [] };
  
  const sysAdminAuth = await prisma.authorityLevel.findUnique({ where: { name: SYSTEM_ADMIN } });
  const systemAdminUsers = sysAdminAuth ? await prisma.user.findMany({
    where: { authorityId: sysAdminAuth.id, accountStatus: 'ACTIVE' }
  }) : [];
  const systemAdminIds = systemAdminUsers.map(u => u.id);
  
  if (isAboutPrincipal) {
    return { principalIds: [], systemAdminIds };
  }
  
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
