import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import StudentLayoutClient from "./StudentLayoutClient";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const authName = getAuthorityName(user);
  if (authName !== "STUDENT") redirect("/login");
  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
