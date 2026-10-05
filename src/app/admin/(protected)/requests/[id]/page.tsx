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
      statusHistory: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!request) notFound();

  // Scope check - if you're not SYSTEM_ADMIN, it must be in your college
  const authName = getAuthorityName(user);
  console.log("Checking scope. user authName:", authName, "user college:", user.collegeId, "requester college:", request.requester.collegeId);
  if (authName !== "SYSTEM_ADMIN" && request.requester.collegeId !== user.collegeId) {
    console.log("Scope check failed, redirecting...");
    redirect("/admin/login");
  }

  // We map statusHistory to auditLogs for the client component
  const requestWithAuditLogs = {
    ...request,
    auditLogs: request.statusHistory
  };

  return <AuthorityRequestDetailClient request={requestWithAuditLogs} />;
}
