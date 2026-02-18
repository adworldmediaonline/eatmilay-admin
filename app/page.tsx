import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export default async function HomePage() {
  const session = await getSession();
  if (session?.user) {
    redirect(isAdminRole(session.user.role) ? "/admin" : "/login");
  }
  redirect("/login");
}
