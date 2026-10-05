import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  
  const authName = getAuthorityName(user);
  const isAuthority = ["WARDEN", "STAFF", "HOD", "PRINCIPAL", "FACULTY", "SYSTEM_ADMIN"].includes(authName);

  if (!isAuthority) {
    redirect("/admin/login");
  }

  if (authName !== "SYSTEM_ADMIN") {
    // Non-system admins just get the content with no admin sidebar
    return <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-full">{children}</div>;
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
