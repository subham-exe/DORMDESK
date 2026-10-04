import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  
  const authName = getAuthorityName(user);
  if (authName !== "SYSTEM_ADMIN") {
    redirect("/admin/login");
  }
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
