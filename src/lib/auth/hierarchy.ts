import { prisma } from "@/lib/db/prisma";

export async function canManageTarget(
  actorId: string,
  targetAuthorityName: string,
  targetCollegeId?: string | null,
  targetDepartmentId?: string | null,
  targetHostelId?: string | null
): Promise<boolean> {
  const actor = await prisma.user.findUnique({ where: { id: actorId }, include: { authority: true } });
  if (!actor || !actor.authority) return false;

  const targetAuth = await prisma.authorityLevel.findUnique({ where: { name: targetAuthorityName } });
  if (!targetAuth) return false;

  // Cannot manage equal or higher authority
  if (actor.authority.levelNumber <= targetAuth.levelNumber) {
    return false;
  }

  if (actor.authority.name === "OWNER_001" || actor.authority.name === "ADMIN") {
    return true;
  }

  if (actor.authority.name === "PRINCIPAL") {
    if (!actor.collegeId || actor.collegeId !== targetCollegeId) return false;
    return true;
  }

  if (actor.authority.name === "HOD") {
    if (!actor.departmentRefId || actor.departmentRefId !== targetDepartmentId) return false;
    // They could potentially manage Faculty or Students in their department
    return true;
  }

  return false;
}
