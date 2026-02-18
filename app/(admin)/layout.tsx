import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
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

async function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user?.role ?? "user";
  if (!isAdminRole(role)) {
    redirect("/login");
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center">Loading...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
