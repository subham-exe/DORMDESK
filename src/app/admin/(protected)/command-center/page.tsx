import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || getAuthorityName(user) !== "SYSTEM_ADMIN") redirect("/admin/login");

  return (
    <div className="space-y-6">
      <p className="text-text-secondary">Welcome to the DormDesk Operations Command Center.</p>
    </div>
  );
}
