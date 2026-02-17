"use client";

import { useRouter, useParams } from "next/navigation";
import { getProduct, type ProductVariant } from "@/lib/api";
import {
  ProductFormWizard,
  type ProductFormWizardProps,
} from "@/components/product-form-wizard/product-form-wizard";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<
    ProductFormWizardProps["initialData"] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(id)
      .then((product) => {
        const productType = product.productType ?? "simple";
        const variants = product.variants ?? [];
        const productVolumeTiers = product.volumeTiers ?? [];

        const migratedVariants =
          productType === "variable" &&
          variants.length > 0 &&
          productVolumeTiers.length > 0 &&
          variants.every((v) => !v.volumeTiers?.length)
            ? variants.map((v) => ({
                ...v,
                volumeTiers: productVolumeTiers,
              }))
            : variants;

        setInitialData({
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          categoryId: product.categoryId ?? null,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          status: product.status,
          sku: product.sku ?? "",
          tags: (product.tags ?? []).join(", "),
          metaTitle: product.metaTitle ?? "",
          metaDescription: product.metaDescription ?? "",
          metaKeywords: product.metaKeywords ?? "",
          currency: product.currency ?? "USD",
          vendor: product.vendor ?? "",
          productType,
          options: product.options ?? [],
          variants: migratedVariants as ProductVariant[],
          bundleItems: product.bundleItems ?? [],
          bundlePricing: product.bundlePricing ?? null,
          bundlePrice: product.bundlePrice ?? null,
          bundleDiscountPercent: product.bundleDiscountPercent ?? null,
          volumeTiers: productType === "simple" ? productVolumeTiers : [],
          images: product.images ?? [],
          trackInventory: product.trackInventory ?? true,
          stockQuantity: product.stockQuantity ?? 0,
          lowStockThreshold: product.lowStockThreshold ?? null,
          allowBackorder: product.allowBackorder ?? false,
          relatedProductIds: product.relatedProductIds ?? [],
        });
      })
      .catch(() => {
        toast.error("Product not found");
        router.push("/admin/products");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading || !initialData) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ProductFormWizard
      mode="edit"
      productId={id}
      initialData={initialData}
    />
  );
}
