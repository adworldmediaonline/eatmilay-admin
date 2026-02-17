"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
};

const SessionContext = createContext<Session | null>(null);

export function useAdminSession() {
  const session = useContext(SessionContext);
  return session;
}

export function AdminShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <SessionContext.Provider value={session}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AdminSidebar
          user={{
            name: session.user.name ?? "Admin",
            email: session.user.email ?? "",
            avatar: session.user.image ?? "",
          }}
          role={session.user.role}
          onSignOut={handleSignOut}
        />
        <SidebarInset>
          <AdminHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SessionContext.Provider>
  );
}
