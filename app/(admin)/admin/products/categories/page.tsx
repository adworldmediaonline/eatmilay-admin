"use client";

import { useState, useEffect } from "react";
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  type ProductCategory,
  type ProductImage,
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
import Image from "next/image";
import { PlusIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    description: string;
    image: ProductImage | null;
  }>({ name: "", slug: "", description: "", image: null });

  const loadCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setSlugManuallyEdited(false);
    setForm({ name: "", slug: "", description: "", image: null });
    setSheetOpen(true);
  };

  const openEdit = (cat: ProductCategory) => {
    setEditing(cat);
    setSlugManuallyEdited(true); // Existing slug is treated as user-set
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      image: cat.image ?? null,
    });
    setSheetOpen(true);
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
        await updateProductCategory(editing.id, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          image: form.image,
        });
        toast.success("Category updated");
      } else {
        await createProductCategory({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          image: form.image,
        });
        toast.success("Category created");
      }
      setSheetOpen(false);
      loadCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProductCategory(deleteId);
      toast.success("Category deleted");
      setDeleteId(null);
      loadCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-2 px-4 lg:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Product Categories</h2>
            <p className="text-muted-foreground text-sm">
              Manage product categories for your store
            </p>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              Add category
            </Button>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {editing ? "Edit category" : "Add category"}
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
                    placeholder="e.g. Electronics"
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
                    placeholder="electronics"
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
                    placeholder="Category description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category image (optional)</Label>
                  <ImageManager
                    value={form.image ? [form.image] : []}
                    onChange={(imgs) =>
                      setForm((f) => ({ ...f, image: imgs[0] ?? null }))
                    }
                    folder="admin/categories"
                    maxImages={1}
                    onPersistAfterDelete={
                      editing
                        ? async (imgs) => {
                            await updateProductCategory(editing.id, {
                              image: imgs[0] ?? null,
                            });
                            loadCategories();
                          }
                        : undefined
                    }
                  />
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
          ) : categories.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">No categories yet.</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                Add your first category
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[64px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        {cat.image?.url ? (
                          <Image
                            src={cat.image.url}
                            alt={cat.image.alt || cat.image.title || cat.name}
                            width={48}
                            height={48}
                            className="size-12 rounded-md object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {cat.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(cat)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(cat.id)}
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
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Products in this category will have
              their category unset.
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
