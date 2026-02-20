"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getDiscounts,
  getProducts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  type Discount,
  type Product,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
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
    description: string;
    allowAutoApply: boolean;
    type: "percentage" | "fixed";
    value: number;
    productIds: string[];
    minOrderAmount: number | null;
    maxUsage: number | null;
    startsAt: string;
    expiresAt: string;
    status: "active" | "disabled" | "scheduled";
  }>({
    code: "",
    description: "",
    allowAutoApply: true,
    type: "percentage",
    value: 0,
    productIds: [],
    minOrderAmount: null,
    maxUsage: null,
    startsAt: "",
    expiresAt: "",
    status: "active",
  });
  const [newProductId, setNewProductId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"code" | "createdAt" | "updatedAt" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadDiscounts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    try {
      const params: Parameters<typeof getDiscounts>[0] = {
        sortBy,
        sortOrder,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        signal,
      };
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getDiscounts(params);
      if (signal.aborted) return;
      setDiscounts(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Failed to load discounts");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [statusFilter, searchQuery, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortBy, sortOrder, pageSize]);

  useEffect(() => {
    if (sheetOpen) {
      getProducts({ limit: 10000 })
        .then((data) => setProducts(data.items))
        .catch(() => []);
    }
  }, [sheetOpen]);

  const openCreate = () => {
    setEditing(null);
    setNewProductId("");
    setForm({
      code: "",
      description: "",
      allowAutoApply: true,
      type: "percentage",
      value: 0,
      productIds: [],
      minOrderAmount: null,
      maxUsage: null,
      startsAt: "",
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
      description: d.description ?? "",
      allowAutoApply: d.allowAutoApply ?? true,
      type: d.type,
      value: d.value,
      productIds: d.productIds ?? [],
      minOrderAmount: d.minOrderAmount ?? null,
      maxUsage: d.maxUsage ?? null,
      startsAt: d.startsAt ? toLocalDatetimeString(d.startsAt) : "",
      expiresAt: d.expiresAt ? toLocalDatetimeString(d.expiresAt) : "",
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
          description: form.description.trim() || null,
          allowAutoApply: form.allowAutoApply,
          type: form.type,
          value: form.value,
          productIds: form.productIds,
          minOrderAmount: form.minOrderAmount,
          maxUsage: form.maxUsage,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          status: form.status,
        });
        toast.success("Discount updated");
      } else {
        await createDiscount({
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
          allowAutoApply: form.allowAutoApply,
          type: form.type,
          value: form.value,
          productIds: form.productIds,
          minOrderAmount: form.minOrderAmount,
          maxUsage: form.maxUsage,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
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

  /** Format ISO date for datetime-local input (uses local timezone) */
  const toLocalDatetimeString = (isoString: string): string => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  const getEffectiveStatusBadge = (d: Discount) => {
    const status = d.effectiveStatus ?? d.status;
    const variant =
      status === "active"
        ? "default"
        : status === "scheduled"
          ? "secondary"
          : status === "expired"
            ? "destructive"
            : "outline";
    const label =
      status === "active"
        ? "Active"
        : status === "scheduled"
          ? "Scheduled"
          : status === "expired"
            ? "Expired"
            : "Disabled";
    return { variant, label };
  };

  const handleSort = (field: "code" | "createdAt" | "updatedAt" | "status") => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const SortHeader = ({
    field,
    label,
  }: {
    field: "code" | "createdAt" | "updatedAt" | "status";
    label: string;
  }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && (
          <span className="text-muted-foreground">
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </TableHead>
  );

  const availableProducts = products.filter((p) => !form.productIds.includes(p.id));

  const PAGE_SIZES = [10, 20, 50] as const;

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
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] sm:max-w-[280px]">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
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
                <div className="space-y-2">
                  <Label htmlFor="description">Display description (optional)</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Custom text shown to customers"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom text shown to customers. Leave empty to auto-generate.
                  </p>
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
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="allowAutoApply">Allow auto-apply</Label>
                    <p className="text-muted-foreground text-xs">
                      When store auto-apply is on, this coupon can be automatically
                      applied. Disable for manual-only coupons.
                    </p>
                    {form.allowAutoApply && (
                      <p className="text-amber-600 dark:text-amber-500 mt-1 text-xs">
                        Also enable &quot;Auto-apply best coupon&quot; in{" "}
                        <Link
                          href="/admin/settings"
                          className="underline hover:no-underline"
                        >
                          Settings → Coupon behavior
                        </Link>{" "}
                        for this to apply site-wide.
                      </p>
                    )}
                  </div>
                  <Switch
                    id="allowAutoApply"
                    checked={form.allowAutoApply}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, allowAutoApply: checked }))
                    }
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
                  <Label htmlFor="startsAt">Starts at (optional)</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startsAt: e.target.value }))
                    }
                  />
                  <p className="text-muted-foreground text-xs">
                    Leave empty for immediate. Discount auto-activates when start
                    time is reached.
                  </p>
                  {form.startsAt && new Date(form.startsAt) > new Date() && (
                    <p className="text-amber-600 dark:text-amber-500 text-xs">
                      This coupon will only be available after{" "}
                      {new Date(form.startsAt).toLocaleString()}. Leave empty for
                      immediate availability.
                    </p>
                  )}
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
                      setForm((f) => ({
                        ...f,
                        status: v as "active" | "disabled" | "scheduled",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
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
        </div>

        <div className="px-4 lg:px-6">
          {loading ? (
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
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : discounts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">
                {searchQuery || statusFilter !== "all"
                  ? "No discounts match your filters."
                  : "No discounts yet."}
              </p>
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setStatusFilter("all");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" className="mt-4" onClick={openCreate}>
                  Add your first discount
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHeader field="code" label="Code" />
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Usage</TableHead>
                      <SortHeader field="status" label="Status" />
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
                        <Badge
                          variant={
                            getEffectiveStatusBadge(d).variant as
                              | "default"
                              | "secondary"
                              | "destructive"
                              | "outline"
                          }
                        >
                          {getEffectiveStatusBadge(d).label}
                        </Badge>
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

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {startItem}–{endItem} of {total} discounts
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Rows per page
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <span className="text-muted-foreground min-w-[100px] text-center text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            </>
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
