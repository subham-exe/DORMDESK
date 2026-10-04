import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import FacultyLayoutClient from "./FacultyLayoutClient";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const authName = getAuthorityName(user);
  if (authName !== "FACULTY") redirect("/login");
  return <FacultyLayoutClient>{children}</FacultyLayoutClient>;
}
