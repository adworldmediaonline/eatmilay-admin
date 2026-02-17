"use client";

import { useAdminSession } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const session = useAdminSession();
  const role = session?.user?.role ?? "admin";

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-row items-center justify-between px-4 lg:px-6">
          <div>
            <h2 className="text-lg font-semibold">
              Welcome back, {session?.user?.name ?? "Admin"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Manage users, roles, and system settings
            </p>
          </div>
          <Badge variant={role === "super_admin" ? "default" : "secondary"}>
            {role.replace("_", " ")}
          </Badge>
        </div>
        <div className="px-4 lg:px-6">
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm">
              Admin dashboard content. Add user management, analytics, and
              system controls here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
