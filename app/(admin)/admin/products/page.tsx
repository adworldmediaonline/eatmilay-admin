"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProducts, deleteProduct, type Product } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import Image from "next/image";
import { DownloadIcon, EyeIcon, PlusIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = async () => {
    try {
      const params =
        statusFilter && statusFilter !== "all"
          ? { status: statusFilter }
          : undefined;
      const data = await getProducts(params);
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const downloadProducts = () => {
    if (products.length === 0) {
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
    const rows = products.map((p) => [
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

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

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
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={downloadProducts}
              disabled={loading || products.length === 0}
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
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">No products yet.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/products/new">Add your first product</Link>
              </Button>
            </div>
          ) : (
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
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.images[0].title || product.name}
                            width={48}
                            height={48}
                            className="size-12 rounded-md object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.categoryName ?? "—"}
                      </TableCell>
                      <TableCell>
                        ${product.price.toFixed(2)}
                        {product.compareAtPrice && (
                          <span className="text-muted-foreground ml-1 text-sm line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = getProductStockStatus(product);
                          const variantMap: Record<
                            StockStatus,
                            "default" | "secondary" | "destructive" | "outline"
                          > = {
                            in_stock: "default",
                            low_stock: "outline",
                            out_of_stock: "destructive",
                            backorder: "secondary",
                          };
                          return (
                            <Badge variant={variantMap[status]}>
                              {getStockStatusLabel(status)}
                            </Badge>
                          );
                        })()}
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
                          {product.productType && product.productType !== "simple" && (
                            <Badge variant="outline" className="capitalize">
                              {product.productType}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/admin/products/${product.id}/preview`}
                              title="Preview"
                            >
                              <EyeIcon className="size-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(product.id)}
                            title="Delete"
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

      <AlertDialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
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
