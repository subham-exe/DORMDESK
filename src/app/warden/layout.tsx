import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import WardenLayoutClient from "./WardenLayoutClient";

export default async function WardenLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const authName = getAuthorityName(user);
  if (authName !== "WARDEN") redirect("/login");
  return <WardenLayoutClient>{children}</WardenLayoutClient>;
}
