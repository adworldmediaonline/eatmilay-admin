"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import Link from "next/link";
import {
  getProducts,
  getProductCategories,
  deleteProduct,
  duplicateProduct,
  type Product,
  type ProductCategory,
} from "@/lib/api";
import {
  getProductStockStatus,
  getStockStatusLabel,
  type StockStatus,
} from "@/lib/stock-status";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import {
  DownloadIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  CopyIcon,
  Trash2Icon,
  Loader2Icon,
  SearchIcon,
  ImageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

function formatPrice(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  return `${sym}${amount.toFixed(2)}`;
}

function getDisplayStockQty(product: Product): number {
  if (product.productType === "variable" && (product.variants?.length ?? 0) > 0) {
    return (product.variants ?? []).reduce(
      (sum, v) => sum + (v.stockQuantity ?? 0),
      0
    );
  }
  return product.stockQuantity ?? 0;
}

const PAGE_SIZES = [10, 20, 50] as const;

type SortBy = "name" | "price" | "updatedAt" | "stockQuantity";
type SortOrder = "asc" | "desc";

const STOCK_VARIANT_MAP: Record<
  StockStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  in_stock: "default",
  low_stock: "outline",
  out_of_stock: "destructive",
  backorder: "secondary",
};

const ProductTableRow = memo(function ProductTableRow({
  product,
  onDuplicate,
  onDelete,
  duplicatingId,
}: {
  product: Product;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  duplicatingId: string | null;
}) {
  const status = getProductStockStatus(product);
  const qty = getDisplayStockQty(product);
  const label = getStockStatusLabel(status);
  const showQty = product.trackInventory !== false && qty >= 0;

  return (
    <TableRow>
      <TableCell>
        {product.images?.[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={
              product.images[0].alt ||
              product.images[0].title ||
              product.name
            }
            width={48}
            height={48}
            className="size-12 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-md border bg-muted/50">
            <ImageIcon className="size-5 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Link
            href={`/admin/products/${product.id}`}
            className="font-medium hover:underline"
          >
            {product.name}
          </Link>
          {product.sku && (
            <Badge
              variant="secondary"
              className="w-fit text-xs font-normal"
            >
              {product.sku}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {product.categoryName ?? "—"}
      </TableCell>
      <TableCell>
        {formatPrice(product.price, product.currency ?? "USD")}
        {product.compareAtPrice && (
          <span className="text-muted-foreground ml-1 text-sm line-through">
            {formatPrice(product.compareAtPrice, product.currency ?? "USD")}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={STOCK_VARIANT_MAP[status]}>
          {showQty ? `${label} (${qty})` : label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={
              product.status === "published"
                ? "default"
                : "secondary"
            }
          >
            {product.status}
          </Badge>
          {product.productType &&
            product.productType !== "simple" && (
              <Badge
                variant="outline"
                className="capitalize"
              >
                {product.productType}
              </Badge>
            )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {product.updatedAt
            ? new Date(product.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}`}>
                <PencilIcon className="size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}/preview`}>
                <EyeIcon className="size-4" />
                Preview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDuplicate(product.id)}
              disabled={duplicatingId === product.id}
            >
              {duplicatingId === product.id ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(product.id)}
            >
              <Trash2Icon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadProducts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    try {
      const params: Parameters<typeof getProducts>[0] = {
        sortBy,
        sortOrder,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        signal,
      };
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter && categoryFilter !== "all")
        params.categoryId = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getProducts(params);
      if (signal.aborted) return;
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Failed to load products");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    getProductCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, categoryFilter, sortBy, sortOrder, pageSize]);

  const handleSort = (field: SortBy) => {
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

  const downloadProducts = async () => {
    try {
      const params: Parameters<typeof getProducts>[0] = {
        sortBy,
        sortOrder,
        limit: 10000,
        offset: 0,
      };
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter && categoryFilter !== "all")
        params.categoryId = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getProducts(params);
      const toExport = data.items;
      if (toExport.length === 0) {
        toast.error("No products to download");
        return;
      }
      const frontendUrl =
        (process.env.NEXT_PUBLIC_FRONTEND_USER_URL ?? "").replace(/\/$/, "") ||
        "https://www.eatmilay.com";
      const headers = ["Product Name", "Product URL", "Price", "Images", "SKU"];
      const escapeCsv = (val: string): string => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const rows = toExport.map((p) => [
        escapeCsv(p.name),
        escapeCsv(`${frontendUrl}/products/${p.slug}`),
        escapeCsv(String(p.price)),
        escapeCsv(
          (p.images ?? [])
            .map((img) => img.url)
            .filter(Boolean)
            .join(" | ")
        ),
        escapeCsv(p.sku ?? ""),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Products downloaded");
    } catch {
      toast.error("Failed to download products");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
      loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      await duplicateProduct(id);
      toast.success("Product duplicated");
      loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    } finally {
      setDuplicatingId(null);
    }
  };

  const SortHeader = ({
    field,
    label,
  }: {
    field: SortBy;
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

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-2 px-4 lg:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-muted-foreground text-sm">
              Manage your store products
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] sm:max-w-[280px]">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={downloadProducts}
              disabled={loading || total === 0}
            >
              <DownloadIcon className="size-4" />
              Download Products
            </Button>
            <Button asChild>
              <Link href="/admin/products/new">
                <PlusIcon className="size-4" />
                Add product
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-4 lg:px-6">
          {loading ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[64px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="size-12 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-1 h-3 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? `No products match your filters.`
                  : "No products yet."}
              </p>
              {searchQuery ||
              statusFilter !== "all" ||
              categoryFilter !== "all" ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/admin/products/new">Add your first product</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[64px]">Image</TableHead>
                      <SortHeader field="name" label="Name" />
                      <TableHead>Category</TableHead>
                      <SortHeader field="price" label="Price" />
                      <SortHeader field="stockQuantity" label="Stock" />
                      <TableHead>Status</TableHead>
                      <SortHeader field="updatedAt" label="Updated" />
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        onDuplicate={handleDuplicate}
                        onDelete={setDeleteId}
                        duplicatingId={duplicatingId}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {startItem}–{endItem} of {total} products
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

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => !deleting && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
