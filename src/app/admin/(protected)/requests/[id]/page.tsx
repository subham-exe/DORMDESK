import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import AuthorityRequestDetailClient from "./AuthorityRequestDetailClient";

export default async function AuthorityRequestPage({ params }: { params: any }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await params;

  const request = await prisma.request.findUnique({
    where: { id: resolvedParams.id },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true, collegeId: true } },
      assignedAuthority: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!request) notFound();

  // Scope check - if you're not SYSTEM_ADMIN, it must be in your college
  const authName = getAuthorityName(user);
  if (authName !== "SYSTEM_ADMIN" && request.requester.collegeId !== user.collegeId) {
    redirect("/admin/login");
  }

  // Fetch assignable staff for assignment UX (Warden, Staff, Faculty)
  const assignableStaff = await prisma.user.findMany({
    where: {
      collegeId: request.requester.collegeId,
      role: { in: ['Warden', 'Staff', 'Faculty'] }
    },
    select: { id: true, name: true, role: true, department: true }
  });

  // We map statusHistory to auditLogs for the client component
  const requestWithAuditLogs = {
    ...request,
    auditLogs: request.statusHistory
  };

  return <AuthorityRequestDetailClient request={requestWithAuditLogs} assignableStaff={assignableStaff} currentUserId={user.id} />;
}
