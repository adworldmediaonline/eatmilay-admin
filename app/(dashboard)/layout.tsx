import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { isAdminRole } from "@/lib/auth-constants";

async function getSession() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005";
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/api/me`, {
    headers: cookie ? { cookie } : {},
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
