"use client";

import { useState, useEffect } from "react";
import { useAdminSession } from "@/components/admin-shell";
import { authClient } from "@/lib/auth-client";
import { getRoles, assignRoleToUser, type Role } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const SYSTEM_ROLES = ["super_admin", "admin", "user"];

type UserWithRole = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
};

export default function AdminUsersPage() {
  const session = useAdminSession();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const allRoles = [...SYSTEM_ROLES, ...customRoles.map((r) => r.slug)];

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        authClient.admin.listUsers({ query: { limit: 100 } }),
        getRoles().catch(() => []),
      ]);
      const listData = usersRes.data as { users?: UserWithRole[] } | undefined;
      const allUsers = Array.isArray(listData?.users) ? listData.users : [];
      setUsers(allUsers.filter((u) => u.role !== "super_admin"));
      setCustomRoles(rolesRes);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignRole = async (userId: string, role: string) => {
    setAssigningUserId(userId);
    try {
      await assignRoleToUser(userId, role);
      toast.success("Role updated");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign role");
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-lg font-semibold">User Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage users and assign roles
          </p>
        </div>

        <div className="px-4 lg:px-6">
          {loading ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[200px]">Assign role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name ?? "—"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "super_admin"
                              ? "default"
                              : user.role === "admin"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {user.role ?? "user"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session?.user?.role === "super_admin" ? (
                          <Select
                            value={user.role ?? "user"}
                            onValueChange={(value) =>
                              handleAssignRole(user.id, value)
                            }
                            disabled={assigningUserId === user.id}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {allRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role.replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Super Admin only
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
