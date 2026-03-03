"use client";

import * as React from "react";
import { NavAdmin } from "@/components/nav-admin";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  UsersIcon,
  ShieldCheckIcon,
  Settings2Icon,
  PackageIcon,
  FolderIcon,
  LayersIcon,
  ShoppingCartIcon,
  PercentIcon,
  MessageSquareIcon,
} from "lucide-react";

const getAdminNavMain = (isSuperAdmin: boolean) => [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: <UsersIcon />,
  },
  {
    title: "Ecommerce Management",
    icon: <PackageIcon />,
    items: [
      { title: "Products", url: "/admin/products", icon: <PackageIcon /> },
      {
        title: "Orders",
        url: "/admin/orders",
        icon: <ShoppingCartIcon />,
      },
      {
        title: "Categories",
        url: "/admin/products/categories",
        icon: <FolderIcon />,
      },
      {
        title: "Collections",
        url: "/admin/products/collections",
        icon: <LayersIcon />,
      },
      {
        title: "Discounts",
        url: "/admin/discounts",
        icon: <PercentIcon />,
      },
      {
        title: "Reviews",
        url: "/admin/reviews",
        icon: <MessageSquareIcon />,
      },
    ],
  },
  ...(isSuperAdmin
    ? [
        {
          title: "Roles & Permissions",
          url: "/admin/roles",
          icon: <ShieldCheckIcon />,
        },
      ]
    : []),
];

const adminNavSecondary = [
  {
    title: "Settings",
    url: "/admin/settings",
    icon: <Settings2Icon />,
  },
];

type AdminSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
  role?: string;
  onSignOut?: () => void;
};

export function AdminSidebar({ user, role, onSignOut, ...props }: AdminSidebarProps) {
  const navUser = user ?? {
    name: "Admin",
    email: "admin@example.com",
    avatar: "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/admin">
                <ShieldCheckIcon className="size-5!" />
                <span className="text-base font-semibold">Admin Panel</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavAdmin items={getAdminNavMain(role === "super_admin")} />
        <NavSecondary items={adminNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} onSignOut={onSignOut} />
      </SidebarFooter>
    </Sidebar>
  );
}
