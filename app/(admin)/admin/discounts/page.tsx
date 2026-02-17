"use client";

import { useState, useEffect } from "react";
import {
  getDiscounts,
  getProducts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  type Discount,
  type Product,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
import { PlusIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    productIds: string[];
    minOrderAmount: number | null;
    maxUsage: number | null;
    expiresAt: string;
    status: "active" | "disabled";
  }>({
    code: "",
    type: "percentage",
    value: 0,
    productIds: [],
    minOrderAmount: null,
    maxUsage: null,
    expiresAt: "",
    status: "active",
  });
  const [newProductId, setNewProductId] = useState("");

  const loadDiscounts = async () => {
    try {
      const data = await getDiscounts();
      setDiscounts(data);
    } catch {
      toast.error("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  useEffect(() => {
    if (sheetOpen) {
      getProducts().then(setProducts).catch(() => []);
    }
  }, [sheetOpen]);

  const openCreate = () => {
    setEditing(null);
    setNewProductId("");
    setForm({
      code: "",
      type: "percentage",
      value: 0,
      productIds: [],
      minOrderAmount: null,
      maxUsage: null,
      expiresAt: "",
      status: "active",
    });
    setSheetOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditing(d);
    setNewProductId("");
    setForm({
      code: d.code,
      type: d.type,
      value: d.value,
      productIds: d.productIds ?? [],
      minOrderAmount: d.minOrderAmount ?? null,
      maxUsage: d.maxUsage ?? null,
      expiresAt: d.expiresAt
        ? new Date(d.expiresAt).toISOString().slice(0, 16)
        : "",
      status: d.status,
    });
    setSheetOpen(true);
  };

  const addProductToForm = () => {
    if (!newProductId || form.productIds.includes(newProductId)) return;
    setForm((f) => ({
      ...f,
      productIds: [...f.productIds, newProductId],
    }));
    setNewProductId("");
  };

  const removeProductFromForm = (productId: string) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.filter((id) => id !== productId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (form.type === "percentage" && (form.value < 0 || form.value > 100)) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDiscount(editing.id, {
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: form.value,
          productIds: form.productIds,
          minOrderAmount: form.minOrderAmount,
          maxUsage: form.maxUsage,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          status: form.status,
        });
        toast.success("Discount updated");
      } else {
        await createDiscount({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: form.value,
          productIds: form.productIds,
          minOrderAmount: form.minOrderAmount,
          maxUsage: form.maxUsage,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          status: form.status,
        });
        toast.success("Discount created");
      }
      setSheetOpen(false);
      loadDiscounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDiscount(deleteId);
      toast.success("Discount deleted");
      setDeleteId(null);
      loadDiscounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const formatValue = (d: Discount) => {
    if (d.type === "percentage") return `${d.value}%`;
    return `$${d.value.toFixed(2)}`;
  };

  const formatExpires = (d: Discount) => {
    if (!d.expiresAt) return "—";
    const date = new Date(d.expiresAt);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const availableProducts = products.filter((p) => !form.productIds.includes(p.id));

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-2 px-4 lg:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Discounts</h2>
            <p className="text-muted-foreground text-sm">
              Promo codes and coupons
            </p>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              Add discount
            </Button>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {editing ? "Edit discount" : "Add discount"}
                </SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code (required)</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="e.g. SUMMER20"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, type: v as "percentage" | "fixed" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      Value {form.type === "percentage" ? "(%)" : "($)"}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      max={form.type === "percentage" ? 100 : undefined}
                      step={form.type === "percentage" ? 1 : 0.01}
                      value={form.value}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          value: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Min order amount (optional)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderAmount ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minOrderAmount: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Max uses (optional)</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    min="0"
                    value={form.maxUsage ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxUsage: e.target.value
                          ? parseInt(e.target.value, 10)
                          : null,
                      }))
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires at (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiresAt: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as "active" | "disabled" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Products (optional, empty = store-wide)</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={newProductId || "__none__"}
                      onValueChange={(v) =>
                        setNewProductId(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select product</SelectItem>
                        {availableProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProductToForm}
                      disabled={!newProductId}
                    >
                      <PlusIcon className="size-4" />
                      Add
                    </Button>
                  </div>
                  {form.productIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.productIds.map((pid) => {
                        const p = products.find((x) => x.id === pid);
                        return (
                          <span
                            key={pid}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                          >
                            {p?.name ?? pid}
                            <button
                              type="button"
                              onClick={() => removeProductFromForm(pid)}
                              className="hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : editing ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <div className="px-4 lg:px-6">
          {loading ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : discounts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">No discounts yet.</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                Add your first discount
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono font-medium">{d.code}</TableCell>
                      <TableCell className="capitalize">{d.type}</TableCell>
                      <TableCell>{formatValue(d)}</TableCell>
                      <TableCell>
                        {d.usedCount}
                        {d.maxUsage != null ? ` / ${d.maxUsage}` : ""}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            d.status === "active"
                              ? "text-emerald-600"
                              : "text-muted-foreground"
                          }
                        >
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatExpires(d)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(d)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(d.id)}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The discount will be permanently
              removed.
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
