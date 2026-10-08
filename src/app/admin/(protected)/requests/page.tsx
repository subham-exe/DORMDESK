import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import OperationalRequestQueueClient from "./OperationalRequestQueueClient";

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const authName = getAuthorityName(user);
  if (!["WARDEN", "STAFF", "HOD", "PRINCIPAL", "FACULTY", "SYSTEM_ADMIN"].includes(authName)) {
    redirect("/login");
  }

  // Construct scope identical to CommandCenterService
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestWhere: any = {};
  
  if (authName !== "SYSTEM_ADMIN") {
    if (authName === "WARDEN" && user.hostel) {
      requestWhere.location = { contains: user.hostel };
    } else if (["FACULTY", "STAFF", "HOD"].includes(authName) && user.department) {
      requestWhere.assignedDepartment = user.department;
    } else if (authName === "PRINCIPAL") {
      // Principal sees all
    } else {
      requestWhere.id = 'NO_ACCESS';
    }
  }

  const requests = await prisma.request.findMany({
    where: requestWhere,
    include: {
      requester: { select: { name: true, id: true, room: true, hostel: true } },
      assignedAuthority: { select: { name: true, id: true } }
    },
    orderBy: [
      { dueAt: 'asc' }, // SLA priority
      { createdAt: 'desc' }
    ]
  });

  return <OperationalRequestQueueClient initialRequests={requests} />;
}
