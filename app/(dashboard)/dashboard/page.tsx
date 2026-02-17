"use client";

import { useDashboardSession } from "@/components/dashboard-shell";

export default function DashboardPage() {
  const session = useDashboardSession();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-1 px-4 lg:px-6">
          <h2 className="text-lg font-semibold">
            Welcome back, {session?.user?.name ?? "User"}
          </h2>
          <p className="text-muted-foreground text-sm">
            Your dashboard
          </p>
        </div>
        <div className="px-4 lg:px-6">
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <p className="text-sm">
              Get started by exploring the features available to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
