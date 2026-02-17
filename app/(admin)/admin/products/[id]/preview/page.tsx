"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProduct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getStockStatus,
  getStockStatusLabel,
  type StockStatus,
} from "@/lib/stock-status";
import { ArrowLeftIcon, Loader2Icon, ExternalLinkIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@/lib/api";

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

export default function ProductPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  const images = product.images ?? [];
  const mainImage = images[selectedImageIndex] ?? images[0];
  const currency = product.currency ?? "USD";
  const productType = product.productType ?? "simple";
  const options = product.options ?? [];
  const variants = product.variants ?? [];
  const bundleItems = product.bundleItems ?? [];
  const bundlePricing = product.bundlePricing;
  const bundlePrice = product.bundlePrice;
  const bundleDiscountPercent = product.bundleDiscountPercent ?? null;
  const isVariable = productType === "variable";
  const selectedVariant = variants[selectedVariantIndex];
  const volumeTiers = isVariable && selectedVariant
    ? (selectedVariant.volumeTiers ?? [])
    : (product.volumeTiers ?? []);

  const isBundle = productType === "bundle";
  const selectedPack = volumeTiers[selectedPackIndex];
  const displayPrice =
    isVariable && volumeTiers.length > 0 && selectedPack
      ? selectedPack.price
      : isVariable && variants.length > 0
        ? Math.min(...variants.map((v) => v.price))
        : product.price;
  const displayCompareAt =
    isVariable && volumeTiers.length > 0 && selectedPack
      ? selectedPack.compareAtPrice ?? null
      : product.compareAtPrice;

  const stockStatus: StockStatus = isVariable
    ? getStockStatus(
        product.trackInventory ?? true,
        selectedVariant?.stockQuantity ?? 0,
        selectedVariant?.lowStockThreshold,
        selectedVariant?.allowBackorder ?? false
      )
    : getStockStatus(
        product.trackInventory ?? true,
        product.stockQuantity ?? 0,
        product.lowStockThreshold,
        product.allowBackorder ?? false
      );

  const stockBadgeVariant: Record<
    StockStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    in_stock: "default",
    low_stock: "outline",
    out_of_stock: "destructive",
    backorder: "secondary",
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/products/${id}`}>
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Product preview</h2>
            <p className="text-muted-foreground text-sm">
              How this product will appear to customers
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={product.status === "published" ? "default" : "secondary"}
          >
            {product.status}
          </Badge>
          {productType !== "simple" && (
            <Badge variant="outline" className="capitalize">
              {productType}
            </Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products/${id}`}>
              <ExternalLinkIcon className="size-4" />
              Edit product
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-12 lg:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="grid gap-8 p-6 md:grid-cols-2 md:gap-10 md:p-10">
              {/* Image gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {mainImage?.url ? (
                    <Image
                      src={mainImage.url}
                      alt={mainImage.alt || mainImage.title || product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-muted-foreground">
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <button
                        key={img.publicId}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                          selectedImageIndex === idx
                            ? "border-primary"
                            : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={img.alt || img.title || `${product.name} ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex flex-col">
                {product.categoryName && (
                  <p className="text-muted-foreground mb-1 text-sm font-medium uppercase tracking-wider">
                    {product.categoryName}
                  </p>
                )}
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {product.name}
                </h1>
                {productType !== "simple" && (
                  <Badge variant="secondary" className="mt-2 w-fit capitalize">
                    {productType} product
                  </Badge>
                )}
                {product.shortDescription && (
                  <p className="text-muted-foreground mt-3 text-sm">
                    {product.shortDescription}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  {isVariable &&
                  volumeTiers.length === 0 &&
                  variants.length > 0 ? (
                    <span className="text-2xl font-semibold">
                      From {formatPrice(displayPrice, currency)}
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl font-semibold">
                        {formatPrice(displayPrice, currency)}
                      </span>
                      {displayCompareAt != null &&
                        displayCompareAt > displayPrice && (
                          <span className="text-muted-foreground text-lg line-through">
                            {formatPrice(displayCompareAt, currency)}
                          </span>
                        )}
                    </>
                  )}
                  <Badge variant={stockBadgeVariant[stockStatus]}>
                    {getStockStatusLabel(stockStatus)}
                  </Badge>
                </div>
                {displayCompareAt != null &&
                  displayCompareAt > displayPrice && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Save {formatPrice(displayCompareAt - displayPrice, currency)}{" "}
                      (
                      {Math.round(
                        ((displayCompareAt - displayPrice) / displayCompareAt) * 100
                      )}
                      % off)
                    </p>
                  )}

                {/* Variable: size selection pills */}
                {isVariable && variants.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">
                        Size — {selectedVariant?.optionValues.join(" / ") ?? ""}
                      </h3>
                      {volumeTiers.length > 0 && (
                        <span className="bg-destructive/90 text-destructive-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold">
                          {volumeTiers.length} Pack{volumeTiers.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedVariantIndex(i);
                            setSelectedPackIndex(0);
                          }}
                          className={`relative rounded-full border-2 px-4 py-2 text-sm transition-colors ${
                            selectedVariantIndex === i
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/30 hover:border-primary/50"
                          }`}
                        >
                          <span className="font-medium">
                            {v.optionValues.join(" / ")}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            — {formatPrice(v.price, currency)}
                          </span>
                          {v.label === "most_popular" && (
                            <span className="bg-destructive/90 text-destructive-foreground ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                              Most Popular
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bundle & Save divider and pack cards */}
                {volumeTiers.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Bundle & Save
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {volumeTiers.map((tier, i) => {
                        const qty = tier.minQuantity;
                        const packName =
                          qty === 1 ? "Buy 1" : `Pack of ${qty}`;
                        const savings =
                          tier.compareAtPrice != null &&
                          tier.compareAtPrice > tier.price
                            ? tier.compareAtPrice - tier.price
                            : 0;
                        const isSelected = selectedPackIndex === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedPackIndex(i)}
                            className={`flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-muted/20 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex w-full items-start justify-between gap-2">
                              <span className="font-medium">{packName}</span>
                              {tier.label === "most_popular" && (
                                <span className="bg-destructive/90 text-destructive-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                  Most Popular
                                </span>
                              )}
                              {tier.label === "best_seller" && (
                                <span className="bg-emerald-600 text-white shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                                  Best seller
                                </span>
                              )}
                              {tier.label === "super_saver" && (
                                <span className="bg-primary text-primary-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                                  Super saver
                                </span>
                              )}
                            </div>
                            {savings > 0 && (
                              <p className="text-muted-foreground mt-1 text-sm">
                                You save {formatPrice(savings, currency)}
                              </p>
                            )}
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="font-semibold">
                                {formatPrice(tier.price, currency)}
                              </span>
                              {tier.compareAtPrice != null &&
                                tier.compareAtPrice > tier.price && (
                                  <span className="text-muted-foreground text-sm line-through">
                                    {formatPrice(tier.compareAtPrice, currency)}
                                  </span>
                                )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bundle: what's included */}
                {isBundle && bundleItems.length > 0 && (
                  <div className="mt-6 rounded-lg border bg-muted/20 p-4">
                    <h3 className="mb-3 text-sm font-medium">What&apos;s included</h3>
                    <ul className="space-y-2">
                      {bundleItems.map((item) => (
                        <li
                          key={item.productId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{item.productName ?? item.productId}</span>
                          <span className="text-muted-foreground">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-medium">Bundle total</span>
                      <span className="text-lg font-semibold">
                        {formatPrice(product.price, currency)}
                      </span>
                    </div>
                  </div>
                )}

                {product.description && (
                  <div
                    className="text-foreground mt-6 text-sm [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic"
                    dangerouslySetInnerHTML={{
                      __html: product.description,
                    }}
                  />
                )}

                {(product.relatedProducts?.length ?? 0) > 0 && (
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        You may also like
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {product.relatedProducts?.map((rp) => (
                        <Link
                          key={rp.id}
                          href={`/admin/products/${rp.id}/preview`}
                          className="flex flex-col overflow-hidden rounded-lg border border-border bg-muted/20 transition-colors hover:border-primary/30 hover:bg-muted/40"
                        >
                          <div className="relative aspect-square bg-muted">
                            {rp.image?.url ? (
                              <Image
                                src={rp.image.url}
                                alt={rp.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="flex aspect-square items-center justify-center text-muted-foreground text-sm">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-3">
                            <span className="font-medium line-clamp-2">{rp.name}</span>
                            <span className="text-muted-foreground mt-1 text-sm">
                              {formatPrice(rp.price, currency)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {(product.vendor || product.sku) && (
                  <div className="text-muted-foreground mt-6 flex flex-wrap gap-4 text-xs">
                    {product.vendor && <span>Vendor: {product.vendor}</span>}
                    {product.sku && <span>SKU: {product.sku}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
