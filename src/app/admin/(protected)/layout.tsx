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

  // Non-system admins need an operational shell
  return <AdminLayoutClient role={authName}>{children}</AdminLayoutClient>;
}
