"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getProducts,
  checkSlugAvailability,
  duplicateProduct,
  type ProductCategory,
  type ProductImage,
  type ProductOption,
  type ProductVariant,
  type BundleItem,
  type VolumeTier,
} from "@/lib/api";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageManager } from "@/components/image-manager";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Loader2Icon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ProductVariantsEditor } from "./product-variants-editor";

const STEPS = ["basic", "media", "pricing", "variants", "seo", "review"] as const;
type StepId = (typeof STEPS)[number];

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  nutrients: z.string().optional(),
  benefits: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be 0 or more"),
  compareAtPrice: z.number().min(0).optional().nullable(),
  status: z.enum(["draft", "published"]),
  sku: z.string().max(100).optional(),
  tags: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(500).optional(),
  currency: z.string().max(5).optional(),
  vendor: z.string().max(100).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export type ProductFormWizardProps = {
  mode: "create" | "edit";
  productId?: string;
  initialData?: Partial<ProductFormValues> & {
    images?: ProductImage[];
    productType?: "simple" | "variable" | "bundle";
    options?: ProductOption[];
    variants?: ProductVariant[];
    bundleItems?: BundleItem[];
    bundlePricing?: "fixed" | "sum" | "discounted" | null;
    bundlePrice?: number | null;
    bundleDiscountPercent?: number | null;
    volumeTiers?: VolumeTier[];
    trackInventory?: boolean;
    stockQuantity?: number;
    lowStockThreshold?: number | null;
    allowBackorder?: boolean;
    relatedProductIds?: string[];
  };
};

export function ProductFormWizard({
  mode,
  productId,
  initialData,
}: ProductFormWizardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const stepIndex = STEPS.includes(stepParam as StepId)
    ? STEPS.indexOf(stepParam as StepId)
    : 0;
  const [step, setStep] = useState(stepIndex);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? []);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const slugProgrammaticUpdateRef = useRef(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugCheckDebounce, setSlugCheckDebounce] = useState<NodeJS.Timeout | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [productType, setProductType] = useState<"simple" | "variable" | "bundle">(
    initialData?.productType ?? "simple"
  );
  const [options, setOptions] = useState<ProductOption[]>(
    initialData?.options ?? []
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialData?.variants ?? []
  );
  const [bundleItems, setBundleItems] = useState<BundleItem[]>(
    initialData?.bundleItems ?? []
  );
  const [bundlePricing, setBundlePricing] = useState<
    "fixed" | "sum" | "discounted" | null
  >(initialData?.bundlePricing ?? null);
  const [bundlePrice, setBundlePrice] = useState<number | null>(
    initialData?.bundlePrice ?? null
  );
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState<number | null>(
    initialData?.bundleDiscountPercent ?? null
  );
  const [volumeTiers, setVolumeTiers] = useState<VolumeTier[]>(
    initialData?.volumeTiers ?? []
  );
  const [trackInventory, setTrackInventory] = useState<boolean>(
    initialData?.trackInventory ?? true
  );
  const [stockQuantity, setStockQuantity] = useState<number>(
    initialData?.stockQuantity ?? 0
  );
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(
    initialData?.lowStockThreshold ?? null
  );
  const [allowBackorder, setAllowBackorder] = useState<boolean>(
    initialData?.allowBackorder ?? false
  );
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(
    initialData?.relatedProductIds ?? []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      shortDescription: initialData?.shortDescription ?? "",
      description: initialData?.description ?? "",
      nutrients: initialData?.nutrients ?? "",
      benefits: initialData?.benefits ?? "",
      categoryId: initialData?.categoryId ?? null,
      price: initialData?.price ?? 0,
      compareAtPrice: initialData?.compareAtPrice ?? null,
      status: initialData?.status ?? "draft",
      sku: initialData?.sku ?? "",
      tags: (Array.isArray(initialData?.tags)
        ? initialData.tags.join(", ")
        : initialData?.tags) ?? "",
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
      metaKeywords: initialData?.metaKeywords ?? "",
      currency: initialData?.currency ?? "USD",
      vendor: initialData?.vendor ?? "",
    },
  });

  const description = watch("description");
  const nutrients = watch("nutrients");
  const benefits = watch("benefits");
  const categoryId = watch("categoryId");
  const name = watch("name");
  const slug = watch("slug");
  const imagesDirty =
    (mode === "create" && images.length > 0) ||
    (mode === "edit" &&
      JSON.stringify(images) !==
        JSON.stringify(initialData?.images ?? []));
  const bundleDirty =
    productType !== (initialData?.productType ?? "simple") ||
    JSON.stringify(options) !== JSON.stringify(initialData?.options ?? []) ||
    JSON.stringify(variants) !== JSON.stringify(initialData?.variants ?? []) ||
    JSON.stringify(bundleItems) !==
      JSON.stringify(initialData?.bundleItems ?? []) ||
    bundlePricing !== (initialData?.bundlePricing ?? null) ||
    bundlePrice !== (initialData?.bundlePrice ?? null) ||
    bundleDiscountPercent !== (initialData?.bundleDiscountPercent ?? null) ||
    (productType === "simple" &&
      JSON.stringify(volumeTiers) !==
        JSON.stringify(initialData?.volumeTiers ?? [])) ||
    trackInventory !== (initialData?.trackInventory ?? true) ||
    stockQuantity !== (initialData?.stockQuantity ?? 0) ||
    lowStockThreshold !== (initialData?.lowStockThreshold ?? null) ||
    allowBackorder !== (initialData?.allowBackorder ?? false) ||
    JSON.stringify(relatedProductIds) !==
      JSON.stringify(initialData?.relatedProductIds ?? []);
  const isDirtyState = isDirty || imagesDirty || bundleDirty;

  useEffect(() => {
    getProductCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 3 || productType === "bundle") {
      getProducts().then(setProducts).catch(() => {});
    }
  }, [step, productType]);

  useEffect(() => {
    const s = searchParams.get("step");
    const idx = STEPS.includes(s as StepId) ? STEPS.indexOf(s as StepId) : 0;
    setStep(idx);
  }, [searchParams]);

  const navigateStep = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(STEPS.length - 1, step + delta));
      setStep(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", STEPS[next]);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [step, router, pathname, searchParams]
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyState) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirtyState]);

  const checkSlug = useCallback(
    async (s: string) => {
      if (!s.trim()) {
        setSlugAvailable(null);
        return;
      }
      const normalized = slugify(s.trim()) || s.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      if (!normalized) {
        setSlugAvailable(null);
        return;
      }
      try {
        const res = await checkSlugAvailability(
          normalized,
          mode === "edit" ? productId : undefined
        );
        setSlugAvailable(res.available);
      } catch {
        setSlugAvailable(null);
      }
    },
    [mode, productId]
  );

  useEffect(() => {
    const s = slug?.trim() || slugify(name || "").trim();
    if (!s) {
      setSlugAvailable(null);
      return;
    }
    if (slugCheckDebounce) clearTimeout(slugCheckDebounce);
    const t = setTimeout(() => checkSlug(s), 400);
    setSlugCheckDebounce(t);
    return () => clearTimeout(t);
  }, [slug, name, checkSlug]);

  const onSubmit = async (data: ProductFormValues, asDraft: boolean) => {
    const tags = data.tags
      ? data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const variantsToSend =
      productType === "variable"
        ? variants.map((v) => {
            const tiers = v.volumeTiers ?? [];
            const buy1 = tiers.find(
              (t) => t.minQuantity === 1 && (t.maxQuantity === 1 || t.maxQuantity == null)
            );
            if (tiers.length > 0 && buy1) {
              return {
                ...v,
                price: buy1.price,
                compareAtPrice: buy1.compareAtPrice ?? null,
              };
            }
            return v;
          })
        : [];

    const price =
      productType === "simple"
        ? data.price
        : productType === "variable" && variantsToSend.length > 0
          ? Math.min(...variantsToSend.map((v) => v.price))
          : productType === "bundle" && bundlePricing === "fixed" && bundlePrice != null
            ? bundlePrice
            : productType === "bundle" && bundleItems.length > 0
              ? 0
              : data.price;

    const payload = {
      name: data.name,
      slug: slugManuallyEdited ? (data.slug || undefined) : undefined,
      description: data.description || undefined,
      nutrients: data.nutrients || undefined,
      benefits: data.benefits || undefined,
      shortDescription: data.shortDescription || undefined,
      categoryId: data.categoryId || undefined,
      price,
      compareAtPrice: data.compareAtPrice ?? undefined,
      status: asDraft ? "draft" : data.status,
      images,
      sku: data.sku || undefined,
      tags,
      metaTitle: data.metaTitle || undefined,
      metaDescription: data.metaDescription || undefined,
      metaKeywords: data.metaKeywords || undefined,
      currency: data.currency || "USD",
      vendor: data.vendor || undefined,
      productType,
      options: productType === "variable" ? options : [],
      variants: productType === "variable" ? variantsToSend : [],
      ...(productType === "bundle" && {
        bundleItems: bundleItems.map(({ productId, quantity, priceOverride }) => ({
          productId,
          quantity,
          priceOverride: priceOverride ?? undefined,
        })),
        bundlePricing: bundlePricing ?? undefined,
        bundlePrice: bundlePrice ?? undefined,
        bundleDiscountPercent: bundleDiscountPercent ?? undefined,
      }),
      ...(productType === "simple" && { volumeTiers }),
      trackInventory,
      ...(productType === "variable"
        ? {}
        : {
            stockQuantity,
            lowStockThreshold: lowStockThreshold ?? undefined,
            allowBackorder,
          }),
      relatedProductIds,
    };

    try {
      if (mode === "create") {
        await createProduct({
          ...payload,
          status: asDraft ? "draft" : "published",
        });
        toast.success(asDraft ? "Draft saved" : "Product created");
      } else if (productId) {
        await updateProduct(productId, payload);
        toast.success(asDraft ? "Draft saved" : "Product updated");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDuplicate = async () => {
    if (!productId) return;
    try {
      const created = await duplicateProduct(productId);
      toast.success("Product duplicated");
      router.push(`/admin/products/${created.id}?step=basic`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    setDeleting(true);
    try {
      await deleteProduct(productId);
      toast.success("Product deleted");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "New product" : "Edit product"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === "create"
                ? "Add a new product to your store"
                : "Update product details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && productId && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/products/${productId}/preview`}>
                  <EyeIcon className="size-4" />
                  Preview
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={isSubmitting}
              >
                <CopyIcon className="size-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isSubmitting}
              >
                <Trash2Icon className="size-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="px-4 lg:px-6">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStep(i);
                const params = new URLSearchParams(searchParams.toString());
                params.set("step", s);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }}
              className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                step === i
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  step >= i ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {step > i ? <CheckIcon className="size-3" /> : i + 1}
              </span>
              <span className="capitalize">{s.replace("_", " ")}</span>
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit(
          (data) => onSubmit(data, false),
          () => toast.error("Please fix validation errors")
        )}
        className="space-y-6 px-4 pb-8 lg:px-6"
      >
        {step === 0 && (
          <div className="space-y-6">
            <h3 className="text-base font-medium">Basic information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name", {
                    onChange: (e) => {
                      if (!slugManuallyEdited) {
                        slugProgrammaticUpdateRef.current = true;
                        setValue("slug", slugify(e.target.value));
                      }
                    },
                  })}
                  placeholder="Product name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...register("slug", {
                    onChange: () => {
                      if (slugProgrammaticUpdateRef.current) {
                        slugProgrammaticUpdateRef.current = false;
                      } else {
                        setSlugManuallyEdited(true);
                      }
                    },
                  })}
                  placeholder="product-slug"
                  className={errors.slug ? "border-destructive" : ""}
                />
                {slugAvailable === false && (
                  <p className="text-destructive text-sm">
                    This slug is already in use
                  </p>
                )}
                {slugAvailable === true && (
                  <p className="text-emerald-600 text-sm">Slug is available</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shortDescription">Short description</Label>
                <Input
                  id="shortDescription"
                  {...register("shortDescription")}
                  placeholder="Brief summary for listings"
                  maxLength={500}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={description ?? ""}
                  onChange={(v) => setValue("description", v)}
                  placeholder="Product description..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nutrients">Nutrients</Label>
                <RichTextEditor
                  value={nutrients ?? ""}
                  onChange={(v) => setValue("nutrients", v)}
                  placeholder="Nutritional information, vitamins, minerals..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="benefits">Benefits</Label>
                <RichTextEditor
                  value={benefits ?? ""}
                  onChange={(v) => setValue("benefits", v)}
                  placeholder="Health benefits, usage benefits..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={
                    categoryId && categoryId !== "__none__" ? categoryId : "__none__"
                  }
                  onValueChange={(v) =>
                    setValue("categoryId", v === "__none__" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  placeholder="e.g. PROD-001"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  {...register("tags")}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-medium">Media</h3>
            <div className="space-y-2">
              <Label>Images</Label>
              <p className="text-muted-foreground text-sm">
                Drag to reorder; first image is the primary product image.
              </p>
              <ImageManager
                value={images}
                onChange={setImages}
                folder="admin/products"
                onPersistAfterDelete={
                  mode === "edit" && productId
                    ? async (next) => {
                        await updateProduct(productId, { images: next });
                        setImages(next);
                      }
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-medium">Pricing & details</h3>
            <div className="space-y-2">
              <Label>Product type</Label>
              <Select
                value={productType}
                onValueChange={(v) =>
                  setProductType(v as "simple" | "variable" | "bundle")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (single price)</SelectItem>
                  <SelectItem value="variable">Variable (sizes, weights)</SelectItem>
                  <SelectItem value="bundle">Bundle (multiple products)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {productType === "simple" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { valueAsNumber: true })}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && (
                  <p className="text-destructive text-sm">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at price (optional)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("compareAtPrice", { valueAsNumber: true })}
                  placeholder="Original price for strikethrough"
                />
              </div>
                </>
              )}
              {productType !== "simple" && (
                <p className="text-muted-foreground text-sm md:col-span-2">
                  {productType === "variable"
                    ? "Configure variants and pricing in the next step."
                    : "Configure bundle items and pricing in the next step."}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watch("currency") || "USD"}
                  onValueChange={(v) => setValue("currency", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor / Brand</Label>
                <Input
                  id="vendor"
                  {...register("vendor")}
                  placeholder="Brand or vendor name"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) =>
                    setValue("status", v as "draft" | "published")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(productType === "simple" || productType === "bundle") && (
                <div className="space-y-4 rounded-lg border p-4 md:col-span-2">
                  <h4 className="text-sm font-medium">Inventory</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackInventory"
                      checked={trackInventory}
                      onCheckedChange={(v) =>
                        setTrackInventory(v === true)
                      }
                    />
                    <Label
                      htmlFor="trackInventory"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Track inventory
                    </Label>
                  </div>
                  {trackInventory && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="stockQuantity">Stock quantity</Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          min="0"
                          step="1"
                          value={stockQuantity}
                          onChange={(e) =>
                            setStockQuantity(
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lowStockThreshold">
                          Low stock threshold (optional)
                        </Label>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          min="0"
                          step="1"
                          value={lowStockThreshold ?? ""}
                          onChange={(e) =>
                            setLowStockThreshold(
                              e.target.value
                                ? Math.max(
                                    0,
                                    parseInt(e.target.value, 10) || 0
                                  )
                                : null
                            )
                          }
                          placeholder="e.g. 5"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="allowBackorder"
                            checked={allowBackorder}
                            onCheckedChange={(v) =>
                              setAllowBackorder(v === true)
                            }
                          />
                          <Label
                            htmlFor="allowBackorder"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Allow backorder when out of stock
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-base font-medium">Variants & bundles</h3>
            <ProductVariantsEditor
              productType={productType}
              onProductTypeChange={setProductType}
              options={options}
              onOptionsChange={setOptions}
              variants={variants}
              onVariantsChange={setVariants}
              bundleItems={bundleItems}
              onBundleItemsChange={setBundleItems}
              bundlePricing={bundlePricing}
              onBundlePricingChange={setBundlePricing}
              bundlePrice={bundlePrice}
              onBundlePriceChange={setBundlePrice}
              bundleDiscountPercent={bundleDiscountPercent}
              onBundleDiscountPercentChange={setBundleDiscountPercent}
              volumeTiers={volumeTiers}
              onVolumeTiersChange={setVolumeTiers}
              products={products}
              currency={watch("currency") || "USD"}
              excludeProductId={productId}
              trackInventory={trackInventory}
              onTrackInventoryChange={setTrackInventory}
              relatedProductIds={relatedProductIds}
              onRelatedProductIdsChange={setRelatedProductIds}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-medium">SEO</h3>
            <p className="text-muted-foreground text-sm">
              Optimize how this product appears in search results.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta title</Label>
                <Input
                  id="metaTitle"
                  {...register("metaTitle")}
                  placeholder="SEO title (max 70 chars)"
                  maxLength={70}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="metaDescription">Meta description</Label>
                <Input
                  id="metaDescription"
                  {...register("metaDescription")}
                  placeholder="SEO description (max 160 chars)"
                  maxLength={160}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="metaKeywords">Meta keywords</Label>
                <Input
                  id="metaKeywords"
                  {...register("metaKeywords")}
                  placeholder="Comma-separated keywords (e.g. visa, travel, passport)"
                  maxLength={500}
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-base font-medium">Review</h3>
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-3 font-medium">Review summary</h4>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{watch("name") || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Slug</dt>
                  <dd>{watch("slug") || slugify(watch("name") || "") || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>
                    {categoryId
                      ? categories.find((c) => c.id === categoryId)?.name ?? "—"
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Price</dt>
                  <dd>
                    {productType === "simple"
                      ? `${watch("currency") || "USD"} ${watch("price") ?? 0}`
                      : productType === "variable" && variants.length > 0
                        ? `From ${watch("currency") || "USD"} ${Math.min(...variants.map((v) => v.price)).toFixed(2)}`
                        : productType === "bundle" && bundlePricing === "fixed" && bundlePrice != null
                          ? `${watch("currency") || "USD"} ${bundlePrice.toFixed(2)}`
                          : productType === "bundle"
                            ? "Sum of items"
                            : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="capitalize">{productType}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Images</dt>
                  <dd>{images.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{watch("status")}</dd>
                </div>
                {(productType === "simple" || productType === "bundle") && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Track inventory</dt>
                      <dd>{trackInventory ? "Yes" : "No"}</dd>
                    </div>
                    {trackInventory && (
                      <>
                        <div>
                          <dt className="text-muted-foreground">Stock</dt>
                          <dd>{stockQuantity}</dd>
                        </div>
                        {lowStockThreshold != null && (
                          <div>
                            <dt className="text-muted-foreground">Low stock at</dt>
                            <dd>{lowStockThreshold}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-muted-foreground">Allow backorder</dt>
                          <dd>{allowBackorder ? "Yes" : "No"}</dd>
                        </div>
                      </>
                    )}
                  </>
                )}
                {productType === "variable" && (
                  <div>
                    <dt className="text-muted-foreground">Track inventory</dt>
                    <dd>{trackInventory ? "Yes (per variant)" : "No"}</dd>
                  </div>
                )}
                {relatedProductIds.length > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Related products</dt>
                    <dd>{relatedProductIds.length} cross-sell(s)</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => navigateStep(-1)}>
                <ArrowLeftIcon className="size-4" />
                Previous
              </Button>
            )}
            {step < STEPS.length - 1 && (
              <Button type="button" onClick={() => navigateStep(1)}>
                Next
                <ArrowRightIcon className="size-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(
                (data) => onSubmit(data, true),
                () => toast.error("Name and price are required")
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Save draft"
              )}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Publish"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>

      {mode === "edit" && productId && (
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={() => !deleting && setDeleteConfirmOpen(false)}
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
      )}
    </div>
  );
}
