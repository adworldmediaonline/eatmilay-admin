"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getProductCollections,
  createProductCollection,
  updateProductCollection,
  deleteProductCollection,
  getProducts,
  type ProductCollection,
  type ProductImage,
  type Product,
} from "@/lib/api";
import { slugify } from "@/lib/slugify";
import { ImageManager } from "@/components/image-manager";
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
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  SearchIcon,
  ImageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZES = [10, 20, 50] as const;
type SortBy = "name" | "slug" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function ProductCollectionsPage() {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ProductCollection | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const abortRef = useRef<AbortController | null>(null);
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    description: string;
    image: ProductImage | null;
    productIds: string[];
  }>({
    name: "",
    slug: "",
    description: "",
    image: null,
    productIds: [],
  });

  const loadCollections = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    try {
      const params: Parameters<typeof getProductCollections>[0] = {
        sortBy,
        sortOrder,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        signal,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getProductCollections(params);
      if (signal.aborted) return;
      setCollections(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Failed to load collections");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [searchQuery, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, sortOrder, pageSize]);

  useEffect(() => {
    if (sheetOpen) {
      getProducts({ limit: 10000 })
        .then((d) => setProducts(d.items))
        .catch(() => []);
    }
  }, [sheetOpen]);

  const openCreate = () => {
    setEditing(null);
    setSlugManuallyEdited(false);
    setNewProductId("");
    setForm({
      name: "",
      slug: "",
      description: "",
      image: null,
      productIds: [],
    });
    setSheetOpen(true);
  };

  const openEdit = (col: ProductCollection) => {
    setEditing(col);
    setSlugManuallyEdited(true);
    setNewProductId("");
    setForm({
      name: col.name,
      slug: col.slug,
      description: col.description ?? "",
      image: col.image ?? null,
      productIds: col.productIds ?? [],
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
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateProductCollection(editing.id, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          image: form.image,
          productIds: form.productIds,
        });
        toast.success("Collection updated");
      } else {
        await createProductCollection({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          image: form.image,
          productIds: form.productIds,
        });
        toast.success("Collection created");
      }
      setSheetOpen(false);
      loadCollections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProductCollection(deleteId);
      toast.success("Collection deleted");
      setDeleteId(null);
      loadCollections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

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

  const availableProducts = products.filter((p) => !form.productIds.includes(p.id));

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-2 px-4 lg:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Product Collections</h2>
            <p className="text-muted-foreground text-sm">
              Group products (e.g. Summer collection, Best sellers)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] sm:max-w-[280px]">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or slug..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <Button onClick={openCreate}>
                <PlusIcon className="size-4" />
                Add collection
              </Button>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {editing ? "Edit collection" : "Add collection"}
                </SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: slugManuallyEdited ? f.slug : slugify(name),
                      }));
                    }}
                    placeholder="e.g. Summer collection"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (optional)</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setForm((f) => ({ ...f, slug: e.target.value }));
                    }}
                    placeholder="summer-collection"
                  />
                  <p className="text-muted-foreground text-xs">
                    Auto-generated from name when empty
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Collection description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Collection image (optional)</Label>
                  <ImageManager
                    value={form.image ? [form.image] : []}
                    onChange={(imgs) =>
                      setForm((f) => ({ ...f, image: imgs[0] ?? null }))
                    }
                    folder="admin/collections"
                    maxImages={1}
                    onPersistAfterDelete={
                      editing
                        ? async (imgs) => {
                            await updateProductCollection(editing.id, {
                              image: imgs[0] ?? null,
                            });
                            loadCollections();
                          }
                        : undefined
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Products in collection</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={newProductId || "__none__"}
                      onValueChange={(v) =>
                        setNewProductId(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-56">
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
                    <div className="mt-2 rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.productIds.map((productId) => {
                            const prod = products.find((p) => p.id === productId);
                            return (
                              <TableRow key={productId}>
                                <TableCell>
                                  {prod?.name ?? productId}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeProductFromForm(productId)
                                    }
                                  >
                                    <Trash2Icon className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
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
                    <TableHead className="w-[64px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Products</TableHead>
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
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : collections.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">
                {searchQuery
                  ? "No collections match your search."
                  : "No collections yet."}
              </p>
              {searchQuery ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setPage(1);
                  }}
                >
                  Clear search
                </Button>
              ) : (
                <Button variant="outline" className="mt-4" onClick={openCreate}>
                  Add your first collection
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
                      <SortHeader field="slug" label="Slug" />
                      <TableHead>Products</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((col) => (
                      <TableRow key={col.id}>
                        <TableCell>
                          {col.image?.url ? (
                            <Image
                              src={col.image.url}
                              alt={col.image.alt || col.image.title || col.name}
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
                      <TableCell className="font-medium">{col.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {col.slug}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {col.productCount ?? col.productIds?.length ?? 0} product(s)
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(col)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(col.id)}
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
                Showing {startItem}–{endItem} of {total} collections
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
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The collection will be permanently
              removed. Products will not be affected.
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
