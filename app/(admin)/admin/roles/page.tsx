"use client";

import { useState, useEffect } from "react";
import { useAdminSession } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
  PERMISSION_OPTIONS,
} from "@/lib/api";
import { slugify } from "@/lib/slugify";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";

export default function AdminRolesPage() {
  const session = useAdminSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<{ user: string[]; session: string[] }>({
    user: [],
    session: [],
  });

  const isSuperAdmin = session?.user?.role === "super_admin";

  const loadRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setName("");
    setSlug("");
    setDescription("");
    setPermissions({ user: [], session: [] });
    setSheetOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setSlug(role.slug);
    setDescription(role.description ?? "");
    setPermissions({
      user: role.permissions.user ?? [],
      session: role.permissions.session ?? [],
    });
    setSheetOpen(true);
  };

  const togglePermission = (resource: "user" | "session", permission: string) => {
    setPermissions((prev) => {
      const arr = prev[resource];
      const next = arr.includes(permission)
        ? arr.filter((p) => p !== permission)
        : [...arr, permission];
      return { ...prev, [resource]: next };
    });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingRole) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setFormLoading(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name,
          slug: slug || undefined,
          description,
          permissions,
        });
        toast.success("Role updated");
      } else {
        await createRole({ name, slug: slug || undefined, description, permissions });
        toast.success("Role created");
      }
      setSheetOpen(false);
      loadRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.id);
      toast.success("Role deleted");
      setDeleteTarget(null);
      loadRoles();
    } catch {
      toast.error("Failed to delete role");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">Roles & Permissions</h2>
            <p className="text-muted-foreground text-sm">
              Super Admin access required
            </p>
          </div>
          <div className="px-4 lg:px-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Only Super Admins can manage roles and permissions. Contact your
                Super Admin for access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-row items-center justify-between px-4 lg:px-6">
          <div>
            <h2 className="text-lg font-semibold">Roles & Permissions</h2>
            <p className="text-muted-foreground text-sm">
              Create roles and assign permissions to users
            </p>
          </div>
          <Button onClick={openCreate}>
            <PlusIcon className="mr-2 size-4" />
            Create role
          </Button>
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
                    <TableHead>Slug</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Super Admin</TableCell>
                    <TableCell>
                      <Badge variant="default">super_admin</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      Full access (system)
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Admin</TableCell>
                    <TableCell>
                      <Badge variant="secondary">admin</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      Full access (system)
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">User</TableCell>
                    <TableCell>
                      <Badge variant="outline">user</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      No admin access (system)
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{role.slug}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {[
                          ...(role.permissions.user ?? []),
                          ...(role.permissions.session ?? []),
                        ].join(", ") || "None"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(role)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(role)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <SheetHeader>
              <SheetTitle>
                {editingRole ? "Edit role" : "Create role"}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Content Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="content-manager"
                />
                <p className="text-muted-foreground text-xs">
                  Auto-generated from name when empty
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Manages content and proposals"
                />
              </div>
              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-sm font-medium">User</p>
                    <div className="flex flex-wrap gap-2">
                      {PERMISSION_OPTIONS.user.map((p) => (
                        <label
                          key={p}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Checkbox
                            checked={permissions.user.includes(p)}
                            onCheckedChange={() =>
                              togglePermission("user", p)
                            }
                          />
                          <span className="text-sm">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Session</p>
                    <div className="flex flex-wrap gap-2">
                      {PERMISSION_OPTIONS.session.map((p) => (
                        <label
                          key={p}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Checkbox
                            checked={permissions.session.includes(p)}
                            onCheckedChange={() =>
                              togglePermission("session", p)
                            }
                          />
                          <span className="text-sm">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Saving..." : editingRole ? "Update" : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              Users with this role will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
