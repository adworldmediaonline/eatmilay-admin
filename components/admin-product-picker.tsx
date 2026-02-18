"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Product, ProductVariant, VolumeTier } from "@/lib/api";
import type { OrderItem } from "@/lib/store-api";

function formatPrice(amount: number, currency: string): string {
  const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency + " ";
  return `${sym}${amount.toFixed(2)}`;
}

type AdminProductPickerProps = {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: OrderItem) => void;
};

export function AdminProductPicker({
  products,
  open,
  onOpenChange,
  onAdd,
}: AdminProductPickerProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === selectedProductId);
  const currency = product?.currency ?? "INR";
  const productType = product?.productType ?? "simple";
  const variants = product?.variants ?? [];
  const bundleItems = product?.bundleItems ?? [];
  const isVariable = productType === "variable";
  const isBundle = productType === "bundle";
  const selectedVariant = variants[selectedVariantIndex];
  const volumeTiers =
    isVariable && selectedVariant
      ? selectedVariant.volumeTiers ?? []
      : product?.volumeTiers ?? [];
  const selectedTier = volumeTiers[selectedTierIndex];

  const displayPrice =
    isVariable && volumeTiers.length > 0 && selectedTier
      ? selectedTier.price
      : isVariable && variants.length > 0
        ? selectedVariant?.price ?? Math.min(...variants.map((v) => v.price))
        : isBundle
          ? product?.bundlePrice ?? product?.price ?? 0
          : product?.price ?? 0;

  const resolvedQuantity =
    isBundle
      ? quantity
      : volumeTiers.length > 0 && selectedTier
        ? selectedTier.minQuantity * quantity
        : quantity;

  const unitPrice =
    isBundle
      ? displayPrice
      : volumeTiers.length > 0 && selectedTier
        ? selectedTier.price / selectedTier.minQuantity
        : displayPrice;

  const resolvedUnitPrice = isBundle ? displayPrice : unitPrice;
  const lineTotal = resolvedUnitPrice * resolvedQuantity;

  const handleAdd = () => {
    if (!product) return;
    onAdd({
      productId: product.id,
      productName: product.name,
      variantIndex: isVariable ? selectedVariantIndex : undefined,
      quantity: resolvedQuantity,
      unitPrice: resolvedUnitPrice,
      lineTotal,
    });
    setSelectedProductId("");
    setSelectedVariantIndex(0);
    setSelectedTierIndex(0);
    setQuantity(1);
    onOpenChange(false);
  };

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    setSelectedVariantIndex(0);
    setSelectedTierIndex(0);
    setQuantity(1);
  };

  const publishedProducts = products.filter((p) => p.status === "published");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              value={selectedProductId || "__none__"}
              onValueChange={(v) => handleProductChange(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select product</SelectItem>
                {publishedProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {product && (
            <>
              {isVariable && variants.length > 0 && (
                <div className="space-y-2">
                  <Label>Variant</Label>
                  <Select
                    value={String(selectedVariantIndex)}
                    onValueChange={(v) => {
                      setSelectedVariantIndex(parseInt(v, 10));
                      setSelectedTierIndex(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.map((v: ProductVariant, i: number) => (
                        <SelectItem key={i} value={String(i)}>
                          {v.optionValues.join(" / ")} – {formatPrice(v.price, currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {volumeTiers.length > 0 && (
                <div className="space-y-2">
                  <Label>Bundle option</Label>
                  <Select
                    value={String(selectedTierIndex)}
                    onValueChange={(v) => setSelectedTierIndex(parseInt(v, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {volumeTiers.map((tier: VolumeTier, i: number) => {
                        const packName =
                          tier.minQuantity === 1
                            ? "Buy 1"
                            : `Pack of ${tier.minQuantity}`;
                        return (
                          <SelectItem key={i} value={String(i)}>
                            {packName} – {formatPrice(tier.price, currency)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isBundle && bundleItems.length > 0 && (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <h3 className="mb-2 text-sm font-medium">What&apos;s included</h3>
                  <ul className="space-y-1 text-sm">
                    {bundleItems.map((item) => (
                      <li
                        key={item.productId}
                        className="flex justify-between"
                      >
                        <span>{item.productName ?? item.productId}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(volumeTiers.length === 0 || isBundle) && (
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                  />
                </div>
              )}

              {volumeTiers.length > 0 && selectedTier && (
                <div className="space-y-2">
                  <Label htmlFor="packQty">Number of packs</Label>
                  <Input
                    id="packQty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                  />
                  <p className="text-muted-foreground text-xs">
                    {selectedTier.minQuantity} × {quantity} = {resolvedQuantity} units
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-medium">
                  Total: {formatPrice(lineTotal, currency)}
                </span>
                <Button onClick={handleAdd}>
                  Add to order
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
