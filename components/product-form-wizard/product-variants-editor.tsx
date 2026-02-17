"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  ProductOption,
  ProductVariant,
  BundleItem,
  VolumeTier,
  Product,
} from "@/lib/api";
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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

function VariantBundleSection({
  variantIndex,
  variant,
  variants,
  currency,
  addVolumeTierForVariant,
  updateVolumeTierForVariant,
  removeVolumeTierForVariant,
  copyPacksFromVariant,
}: {
  variantIndex: number;
  variant: ProductVariant;
  variants: ProductVariant[];
  currency: string;
  addVolumeTierForVariant: (i: number) => void;
  updateVolumeTierForVariant: (
    vi: number,
    ti: number,
    f: keyof VolumeTier,
    v: number | string | null
  ) => void;
  removeVolumeTierForVariant: (vi: number, ti: number) => void;
  copyPacksFromVariant: (targetIndex: number, sourceIndex: number) => void;
}) {
  const tiers = variant.volumeTiers ?? [];
  const copyableVariants = variants
    .map((v, i) => ({ v, i }))
    .filter(({ i }) => i !== variantIndex)
    .filter(({ v }) => (v.volumeTiers ?? []).length > 0);
  return (
    <div className="space-y-3 border-x border-b rounded-b-lg border-border bg-background p-4">
      {tiers.length === 0 && copyableVariants.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Copy from:</span>
          <Select
            value="__none__"
            onValueChange={(val) => {
              const src = parseInt(val, 10);
              if (!Number.isNaN(src)) copyPacksFromVariant(variantIndex, src);
            }}
          >
            <SelectTrigger className="h-8 w-48">
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select variant to copy</SelectItem>
              {copyableVariants.map(({ v, i }) => (
                <SelectItem key={i} value={String(i)}>
                  {v.optionValues.join(" / ")} ({(v.volumeTiers ?? []).length} packs)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {tiers.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No pack options. Add packs (Buy 1, Pack of 2, etc.) with prices. Pack of 5 = total
          price for 5 units.
        </p>
      )}
      {tiers.map((t, ti) => {
        const buy1 = tiers.find(
          (x) => x.minQuantity === 1 && (x.maxQuantity === 1 || x.maxQuantity == null)
        );
        const packTotalShouldBeLess =
          t.minQuantity > 1 &&
          buy1 &&
          t.price > buy1.price * t.minQuantity;
        return (
        <div
          key={ti}
          className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
        >
          {packTotalShouldBeLess && (
            <p className="text-amber-600 dark:text-amber-500 w-full text-xs">
              Pack of {t.minQuantity} at {currency} {t.price.toFixed(2)} is more than{" "}
              {t.minQuantity}× Buy 1 ({currency}{(buy1.price * t.minQuantity).toFixed(2)}).
              Consider lowering the pack price.
            </p>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={t.minQuantity}
              onChange={(e) =>
                updateVolumeTierForVariant(
                  variantIndex,
                  ti,
                  "minQuantity",
                  parseInt(e.target.value, 10) || 1
                )
              }
              className="w-20"
              placeholder="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">Price</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={t.price}
              onChange={(e) =>
                updateVolumeTierForVariant(
                  variantIndex,
                  ti,
                  "price",
                  parseFloat(e.target.value) || 0
                )
              }
              className="w-28"
              placeholder="Price"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">Compare at</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={t.compareAtPrice ?? ""}
              onChange={(e) =>
                updateVolumeTierForVariant(
                  variantIndex,
                  ti,
                  "compareAtPrice",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className="w-28"
              placeholder="Original"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">Badge</Label>
            <Select
              value={t.label ?? "__none__"}
              onValueChange={(v) =>
                updateVolumeTierForVariant(
                  variantIndex,
                  ti,
                  "label",
                  v === "__none__"
                    ? null
                    : (v as "most_popular" | "best_seller" | "super_saver")
                )
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="most_popular">Most Popular</SelectItem>
                <SelectItem value="best_seller">Best seller</SelectItem>
                <SelectItem value="super_saver">Super saver</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => removeVolumeTierForVariant(variantIndex, ti)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addVolumeTierForVariant(variantIndex)}
      >
        <PlusIcon className="size-4" />
        Add pack
      </Button>
    </div>
  );
}

export type ProductVariantsEditorProps = {
  productType: "simple" | "variable" | "bundle";
  onProductTypeChange: (t: "simple" | "variable" | "bundle") => void;
  options: ProductOption[];
  onOptionsChange: (o: ProductOption[]) => void;
  variants: ProductVariant[];
  onVariantsChange: (v: ProductVariant[]) => void;
  bundleItems: BundleItem[];
  onBundleItemsChange: (b: BundleItem[]) => void;
  bundlePricing: "fixed" | "sum" | "discounted" | null;
  onBundlePricingChange: (p: "fixed" | "sum" | "discounted" | null) => void;
  bundlePrice: number | null;
  onBundlePriceChange: (p: number | null) => void;
  bundleDiscountPercent: number | null;
  onBundleDiscountPercentChange: (p: number | null) => void;
  volumeTiers: VolumeTier[];
  onVolumeTiersChange: (v: VolumeTier[]) => void;
  products: Product[];
  currency: string;
  /** When editing, exclude this product from bundle selection */
  excludeProductId?: string;
  trackInventory?: boolean;
  onTrackInventoryChange?: (v: boolean) => void;
  relatedProductIds?: string[];
  onRelatedProductIdsChange?: (ids: string[]) => void;
};

export function ProductVariantsEditor({
  productType,
  onProductTypeChange,
  options,
  onOptionsChange,
  variants,
  onVariantsChange,
  bundleItems,
  onBundleItemsChange,
  bundlePricing,
  onBundlePricingChange,
  bundlePrice,
  onBundlePriceChange,
  bundleDiscountPercent,
  onBundleDiscountPercentChange,
  volumeTiers,
  onVolumeTiersChange,
  products,
  currency,
  excludeProductId,
  trackInventory = true,
  onTrackInventoryChange,
  relatedProductIds = [],
  onRelatedProductIdsChange,
}: ProductVariantsEditorProps) {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState("");
  const [newBundleProductId, setNewBundleProductId] = useState("");
  const [newBundleQty, setNewBundleQty] = useState(1);
  const [newRelatedProductId, setNewRelatedProductId] = useState("");
  const [addingValueToOption, setAddingValueToOption] = useState<number | null>(null);
  const [newValueForOption, setNewValueForOption] = useState("");
  const [removeValueTarget, setRemoveValueTarget] = useState<{
    optionIndex: number;
    valueIndex: number;
    value: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<{
    optionIndex: number;
    valueIndex: number;
  } | null>(null);
  const [editingValueText, setEditingValueText] = useState("");

  const addOption = () => {
    if (!newOptionName.trim() || !newOptionValues.trim()) return;
    const values = newOptionValues.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) return;
    onOptionsChange([...options, { name: newOptionName.trim(), values }]);
    setNewOptionName("");
    setNewOptionValues("");
    if (variants.length === 0) {
      onVariantsChange(values.map((v) => ({ optionValues: [v], price: 0 })));
    } else {
      const newVariants: ProductVariant[] = [];
      for (const v of variants) {
        for (const val of values) {
          newVariants.push({
            ...v,
            optionValues: [...v.optionValues, val],
          });
        }
      }
      onVariantsChange(newVariants.length > 0 ? newVariants : variants);
    }
  };

  const moveOption = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= options.length) return;
    const next = [...options];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onOptionsChange(next);
    onVariantsChange(
      variants.map((v) => {
        const vals = [...v.optionValues];
        [vals[index], vals[newIndex]] = [vals[newIndex], vals[index]];
        return { ...v, optionValues: vals };
      })
    );
  };

  const removeOption = (index: number) => {
    const next = options.filter((_, i) => i !== index);
    onOptionsChange(next);
    if (next.length === 0) {
      onVariantsChange([]);
    } else {
      const reduced = variants.map((v) => ({
        ...v,
        optionValues: v.optionValues.filter((_, i) => i !== index),
      }));
      const seen = new Set<string>();
      onVariantsChange(
        reduced.filter((v) => {
          const key = v.optionValues.join("|");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
      );
    }
  };

  const removeValueFromOption = (optionIndex: number, valueIndex: number) => {
    const opt = options[optionIndex];
    const value = opt.values[valueIndex];
    const nextValues = opt.values.filter((_, i) => i !== valueIndex);
    if (nextValues.length === 0) {
      removeOption(optionIndex);
      return;
    }
    onOptionsChange(
      options.map((o, i) =>
        i === optionIndex ? { ...o, values: nextValues } : o
      )
    );
    const nextVariants = variants.filter(
      (v) => v.optionValues[optionIndex] !== value
    );
    onVariantsChange(nextVariants);
    setRemoveValueTarget(null);
  };

  const renameValueInOption = (
    optionIndex: number,
    valueIndex: number,
    newValue: string
  ) => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    const opt = options[optionIndex];
    const oldValue = opt.values[valueIndex];
    if (trimmed === oldValue) {
      setEditingValue(null);
      return;
    }
    if (opt.values.includes(trimmed) && trimmed !== oldValue) return;
    onOptionsChange(
      options.map((o, i) =>
        i === optionIndex
          ? {
              ...o,
              values: o.values.map((v, j) => (j === valueIndex ? trimmed : v)),
            }
          : o
      )
    );
    onVariantsChange(
      variants.map((v) => ({
        ...v,
        optionValues: v.optionValues.map((val, j) =>
          j === optionIndex && val === oldValue ? trimmed : val
        ),
      }))
    );
    setEditingValue(null);
    setEditingValueText("");
  };

  const addValueToOption = (optionIndex: number, newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    const opt = options[optionIndex];
    if (opt.values.includes(trimmed)) return;

    onOptionsChange(
      options.map((o, i) =>
        i === optionIndex ? { ...o, values: [...o.values, trimmed] } : o
      )
    );

    const seen = new Set<string>();
    const newVariants: ProductVariant[] = [];
    for (const v of variants) {
      const other = v.optionValues.filter((_, j) => j !== optionIndex);
      const key = other.join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const newOptionValues = [
        ...other.slice(0, optionIndex),
        trimmed,
        ...other.slice(optionIndex),
      ];
      newVariants.push({
        ...v,
        optionValues: newOptionValues,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
        label: v.label ?? null,
        volumeTiers: v.volumeTiers ? [...v.volumeTiers] : [],
      });
    }
    onVariantsChange([...variants, ...newVariants]);
    setAddingValueToOption(null);
    setNewValueForOption("");
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: unknown) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    onVariantsChange(next);
  };

  const addBundleItem = () => {
    if (!newBundleProductId || newBundleQty < 1) return;
    if (bundleItems.some((b) => b.productId === newBundleProductId)) return;
    onBundleItemsChange([
      ...bundleItems,
      { productId: newBundleProductId, quantity: newBundleQty },
    ]);
    setNewBundleProductId("");
    setNewBundleQty(1);
  };

  const removeBundleItem = (productId: string) => {
    onBundleItemsChange(bundleItems.filter((b) => b.productId !== productId));
  };

  const addVolumeTier = () => {
    const last = volumeTiers[volumeTiers.length - 1];
    const qty = last ? (last.maxQuantity ?? last.minQuantity) + 1 : 1;
    onVolumeTiersChange([
      ...volumeTiers,
      {
        minQuantity: qty,
        maxQuantity: qty,
        price: 0,
        compareAtPrice: null,
        label: null,
      },
    ]);
  };

  const updateVolumeTier = (
    index: number,
    field: keyof VolumeTier,
    value: number | string | null
  ) => {
    const next = [...volumeTiers];
    const tier = { ...next[index], [field]: value };
    if (field === "minQuantity" && typeof value === "number") {
      tier.maxQuantity = value;
    }
    next[index] = tier;
    onVolumeTiersChange(next);
  };

  const removeVolumeTier = (index: number) => {
    onVolumeTiersChange(volumeTiers.filter((_, i) => i !== index));
  };

  const addVolumeTierForVariant = (variantIndex: number) => {
    const tiers = variants[variantIndex]?.volumeTiers ?? [];
    const last = tiers[tiers.length - 1];
    const qty = last ? (last.maxQuantity ?? last.minQuantity) + 1 : 1;
    const newTier: VolumeTier = {
      minQuantity: qty,
      maxQuantity: qty,
      price: 0,
      compareAtPrice: null,
      label: null,
    };
    updateVariant(variantIndex, "volumeTiers", [...tiers, newTier]);
  };

  const updateVolumeTierForVariant = (
    variantIndex: number,
    tierIndex: number,
    field: keyof VolumeTier,
    value: number | string | null
  ) => {
    const tiers = [...(variants[variantIndex]?.volumeTiers ?? [])];
    const tier = { ...tiers[tierIndex], [field]: value };
    if (field === "minQuantity" && typeof value === "number") {
      tier.maxQuantity = value;
    }
    tiers[tierIndex] = tier;
    updateVariant(variantIndex, "volumeTiers", tiers);
  };

  const removeVolumeTierForVariant = (variantIndex: number, tierIndex: number) => {
    const tiers = variants[variantIndex]?.volumeTiers ?? [];
    updateVariant(
      variantIndex,
      "volumeTiers",
      tiers.filter((_, i) => i !== tierIndex)
    );
  };

  const copyPacksFromVariant = (targetIndex: number, sourceIndex: number) => {
    const sourceTiers = variants[sourceIndex]?.volumeTiers ?? [];
    if (sourceTiers.length === 0) return;
    updateVariant(
      targetIndex,
      "volumeTiers",
      sourceTiers.map((t) => ({ ...t }))
    );
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="mb-2 font-medium">Product type</h4>
        <p className="text-muted-foreground mb-3 text-sm">
          Choose how this product is sold. This was set in the Pricing step.
        </p>
        <Select
          value={productType}
          onValueChange={(v) => onProductTypeChange(v as "simple" | "variable" | "bundle")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple — One price, no options</SelectItem>
            <SelectItem value="variable">Variable — Same product, different sizes/weights (e.g. 500g, 1kg)</SelectItem>
            <SelectItem value="bundle">Bundle — Multiple products sold together (e.g. Starter Kit)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {productType === "variable" && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <h4 className="font-medium">Options & variants</h4>
            <p className="text-muted-foreground mt-1 text-sm">
              Define choices like Size or Weight. Each combination gets its own price.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Step 1: Add an option</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Option name (e.g. Size, Weight)"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                className="min-w-[200px] flex-1"
              />
              <Input
                placeholder="Values: 500g, 1kg, 2kg"
                value={newOptionValues}
                onChange={(e) => setNewOptionValues(e.target.value)}
                className="min-w-[200px] flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <PlusIcon className="size-4" />
                Add option
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Enter values separated by commas. Example: Size = 250g, 500g, 1kg
            </p>
          </div>
          {options.length > 0 && (
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded border p-2"
                >
                  <span className="font-medium">{opt.name}:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {opt.values.map((val, vi) => (
                      <span
                        key={`${i}-${vi}`}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm"
                      >
                        {editingValue?.optionIndex === i &&
                        editingValue?.valueIndex === vi ? (
                          <Input
                            value={editingValueText}
                            onChange={(e) => setEditingValueText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameValueInOption(i, vi, editingValueText);
                              }
                              if (e.key === "Escape") {
                                setEditingValue(null);
                                setEditingValueText("");
                              }
                            }}
                            className="h-6 w-20"
                            autoFocus
                          />
                        ) : (
                          <span>{val}</span>
                        )}
                        {editingValue?.optionIndex === i &&
                        editingValue?.valueIndex === vi ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-5"
                              onClick={() =>
                                renameValueInOption(i, vi, editingValueText)
                              }
                            >
                              <span className="sr-only">Save</span>
                              ✓
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-5"
                              onClick={() => {
                                setEditingValue(null);
                                setEditingValueText("");
                              }}
                            >
                              <span className="sr-only">Cancel</span>
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-5"
                              onClick={() => {
                                setEditingValue({ optionIndex: i, valueIndex: vi });
                                setEditingValueText(val);
                              }}
                            >
                              <span className="sr-only">Rename</span>
                              <PencilIcon className="size-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-5 text-destructive hover:text-destructive"
                              onClick={() =>
                                setRemoveValueTarget({
                                  optionIndex: i,
                                  valueIndex: vi,
                                  value: val,
                                })
                              }
                            >
                              <span className="sr-only">Remove</span>
                              <Trash2Icon className="size-3" />
                            </Button>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                  {addingValueToOption === i ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Add value (e.g. 2kg)"
                        value={newValueForOption}
                        onChange={(e) => setNewValueForOption(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addValueToOption(i, newValueForOption);
                          }
                          if (e.key === "Escape") {
                            setAddingValueToOption(null);
                            setNewValueForOption("");
                          }
                        }}
                        className="h-8 w-32"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addValueToOption(i, newValueForOption)}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingValueToOption(null);
                          setNewValueForOption("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingValueToOption(i)}
                    >
                      <PlusIcon className="size-4" />
                      Add value
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={i === 0}
                      onClick={() => moveOption(i, "up")}
                    >
                      <ChevronUpIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={i === options.length - 1}
                      onClick={() => moveOption(i, "down")}
                    >
                      <ChevronDownIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(i)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {variants.length > 0 && (
            <div className="space-y-4">
              {onTrackInventoryChange && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackInventoryVariants"
                    checked={trackInventory}
                    onCheckedChange={(v) => onTrackInventoryChange(v === true)}
                  />
                  <Label
                    htmlFor="trackInventoryVariants"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Track inventory per variant
                  </Label>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground mb-2 block text-xs">
                  Step 2: Set price for each variant
                </Label>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {options.map((o, idx) => (
                          <TableHead key={`opt-${idx}-${o.name}`}>{o.name}</TableHead>
                        ))}
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Compare at</TableHead>
                        <TableHead>Badge</TableHead>
                        {trackInventory && (
                          <>
                            <TableHead>Stock</TableHead>
                            <TableHead>Low</TableHead>
                            <TableHead>Backorder</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((v, i) => (
                        <TableRow key={i}>
                          {v.optionValues.map((val, j) => (
                            <TableCell key={j}>{val}</TableCell>
                          ))}
                          <TableCell>
                            <Input
                              value={v.sku ?? ""}
                              onChange={(e) =>
                                updateVariant(i, "sku", e.target.value || undefined)
                              }
                              placeholder="SKU"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            {(v.volumeTiers ?? []).length > 0 ? (
                              <span className="text-muted-foreground text-sm">
                                From pack
                              </span>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={v.price}
                                onChange={(e) =>
                                  updateVariant(i, "price", parseFloat(e.target.value) || 0)
                                }
                                className="h-8 w-24"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {(v.volumeTiers ?? []).length > 0 ? (
                              <span className="text-muted-foreground text-sm">—</span>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={v.compareAtPrice ?? ""}
                                onChange={(e) =>
                                  updateVariant(
                                    i,
                                    "compareAtPrice",
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                placeholder="—"
                                className="h-8 w-24"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={v.label ?? "__none__"}
                              onValueChange={(val) =>
                                updateVariant(
                                  i,
                                  "label",
                                  val === "__none__" ? null : (val as "most_popular")
                                )
                              }
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                <SelectItem value="most_popular">Most Popular</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {trackInventory && (
                            <>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={v.stockQuantity ?? 0}
                                  onChange={(e) =>
                                    updateVariant(
                                      i,
                                      "stockQuantity",
                                      Math.max(0, parseInt(e.target.value, 10) || 0)
                                    )
                                  }
                                  className="h-8 w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={v.lowStockThreshold ?? ""}
                                  onChange={(e) =>
                                    updateVariant(
                                      i,
                                      "lowStockThreshold",
                                      e.target.value
                                        ? Math.max(0, parseInt(e.target.value, 10) || 0)
                                        : null
                                    )
                                  }
                                  placeholder="—"
                                  className="h-8 w-16"
                                />
                              </TableCell>
                              <TableCell>
                                <Checkbox
                                  checked={v.allowBackorder ?? false}
                                  onCheckedChange={(val) =>
                                    updateVariant(i, "allowBackorder", val === true)
                                  }
                                />
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block text-xs">
                  Step 3: Bundle & Save per variant (optional)
                </Label>
                <p className="text-muted-foreground mb-3 text-xs">
                  Each size/variant can have its own pack options (Buy 1, Pack of 2, etc.)
                  with different prices. Pack of 5 = total price for 5 units.
                </p>
                {(() => {
                  const withPacks = variants.filter(
                    (v) => (v.volumeTiers ?? []).length > 0
                  );
                  const withoutPacks = variants.filter(
                    (v) => (v.volumeTiers ?? []).length === 0
                  );
                  if (withPacks.length > 0 && withoutPacks.length > 0) {
                    return (
                      <p className="text-amber-600 dark:text-amber-500 mb-3 text-xs font-medium">
                        Some variants have no pack options. Consider adding packs for
                        consistency.
                      </p>
                    );
                  }
                  return null;
                })()}
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <Collapsible key={i}>
                      <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-2">
                        <span className="font-medium">
                          {v.optionValues.join(" / ")}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {(v.volumeTiers ?? []).length} pack(s)
                        </span>
                        <CollapsibleTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="group"
                          >
                            <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <VariantBundleSection
                          variantIndex={i}
                          variant={v}
                          variants={variants}
                          currency={currency}
                          addVolumeTierForVariant={addVolumeTierForVariant}
                          updateVolumeTierForVariant={updateVolumeTierForVariant}
                          removeVolumeTierForVariant={removeVolumeTierForVariant}
                          copyPacksFromVariant={copyPacksFromVariant}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {productType === "bundle" && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <h4 className="font-medium">Bundle items</h4>
            <p className="text-muted-foreground mt-1 text-sm">
              Add products that are included in this bundle. Customers get all items together.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={newBundleProductId || "__none__"}
              onValueChange={(v) => setNewBundleProductId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select product</SelectItem>
                {products
                  .filter((p) => !excludeProductId || p.id !== excludeProductId)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({currency} {p.price.toFixed(2)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="1"
              value={newBundleQty}
              onChange={(e) => setNewBundleQty(parseInt(e.target.value, 10) || 1)}
              className="w-20"
            />
            <Button type="button" variant="outline" size="sm" onClick={addBundleItem}>
              <PlusIcon className="size-4" />
              Add
            </Button>
          </div>
          {bundleItems.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price override</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundleItems.map((b) => {
                    const prod = products.find((p) => p.id === b.productId);
                    return (
                      <TableRow key={b.productId}>
                        <TableCell>{prod?.name ?? b.productName ?? b.productId}</TableCell>
                        <TableCell>{b.quantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={b.priceOverride ?? ""}
                            onChange={(e) => {
                              const val = e.target.value
                                ? parseFloat(e.target.value)
                                : null;
                              onBundleItemsChange(
                                bundleItems.map((x) =>
                                  x.productId === b.productId
                                    ? { ...x, priceOverride: val }
                                    : x
                                )
                              );
                            }}
                            placeholder="Use product price"
                            className="h-8 w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBundleItem(b.productId)}
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
          {bundleItems.length > 0 && (
            <div className="space-y-2 rounded-md bg-muted/30 p-3">
              <Label>How is the bundle priced?</Label>
              <Select
                value={bundlePricing ?? "sum"}
                onValueChange={(v) =>
                  onBundlePricingChange(v as "fixed" | "sum" | "discounted")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum of items — Add up each product&apos;s price</SelectItem>
                  <SelectItem value="fixed">Fixed price — Set one price for the whole bundle</SelectItem>
                  <SelectItem value="discounted">Discounted — Sum of items minus a % discount</SelectItem>
                </SelectContent>
              </Select>
              {bundlePricing === "fixed" && (
                <div className="flex items-center gap-2">
                  <Label>{currency}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bundlePrice ?? ""}
                    onChange={(e) =>
                      onBundlePriceChange(
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="w-32"
                  />
                </div>
              )}
              {bundlePricing === "discounted" && (
                <div className="flex items-center gap-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={bundleDiscountPercent ?? ""}
                    onChange={(e) =>
                      onBundleDiscountPercentChange(
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="w-24"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {productType === "simple" && (
      <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
        <div>
          <h4 className="font-medium">Bundle & Save (optional)</h4>
          <p className="text-muted-foreground mt-1 text-sm">
            Define pack options (Buy 1, Pack of 2, etc.) with prices and savings.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Each pack can have a compare-at price for &quot;You save ₹X&quot; and an optional badge.
          </p>
        </div>
        {volumeTiers.map((t, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
          >
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-xs">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={t.minQuantity}
                onChange={(e) =>
                  updateVolumeTier(i, "minQuantity", parseInt(e.target.value, 10) || 1)
                }
                className="w-20"
                placeholder="1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-xs">Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={t.price}
                onChange={(e) =>
                  updateVolumeTier(i, "price", parseFloat(e.target.value) || 0)
                }
                className="w-28"
                placeholder="Price"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-xs">Compare at</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={t.compareAtPrice ?? ""}
                onChange={(e) =>
                  updateVolumeTier(
                    i,
                    "compareAtPrice",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                className="w-28"
                placeholder="Original"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-xs">Badge</Label>
              <Select
                value={t.label ?? "__none__"}
                onValueChange={(v) =>
                  updateVolumeTier(
                    i,
                    "label",
                    v === "__none__"
                      ? null
                      : (v as "most_popular" | "best_seller" | "super_saver")
                  )
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="most_popular">Most Popular</SelectItem>
                  <SelectItem value="best_seller">Best seller</SelectItem>
                  <SelectItem value="super_saver">Super saver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => removeVolumeTier(i)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addVolumeTier}>
          <PlusIcon className="size-4" />
          Add pack
        </Button>
      </div>
      )}

      {onRelatedProductIdsChange && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <h4 className="font-medium">Related products</h4>
            <p className="text-muted-foreground mt-1 text-sm">
              Cross-sell / &quot;You may also like&quot; — products to recommend alongside this one.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={newRelatedProductId || "__none__"}
              onValueChange={(v) =>
                setNewRelatedProductId(v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select product</SelectItem>
                {products
                  .filter((p) => !excludeProductId || p.id !== excludeProductId)
                  .filter((p) => !relatedProductIds.includes(p.id))
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({currency} {p.price.toFixed(2)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (newRelatedProductId && !relatedProductIds.includes(newRelatedProductId)) {
                  onRelatedProductIdsChange([
                    ...relatedProductIds,
                    newRelatedProductId,
                  ]);
                  setNewRelatedProductId("");
                }
              }}
              disabled={!newRelatedProductId}
            >
              <PlusIcon className="size-4" />
              Add
            </Button>
          </div>
          {relatedProductIds.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedProductIds.map((productId) => {
                    const prod = products.find((p) => p.id === productId);
                    return (
                      <TableRow key={productId}>
                        <TableCell>
                          {prod?.name ?? productId}
                          {prod && (
                            <span className="text-muted-foreground ml-2 text-sm">
                              ({currency} {prod.price.toFixed(2)})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              onRelatedProductIdsChange(
                                relatedProductIds.filter((id) => id !== productId)
                              )
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
      )}

      <AlertDialog
        open={!!removeValueTarget}
        onOpenChange={() => setRemoveValueTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove option value?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing &quot;{removeValueTarget?.value}&quot; will delete{" "}
              {removeValueTarget
                ? variants.filter(
                    (v) =>
                      v.optionValues[removeValueTarget.optionIndex] ===
                      removeValueTarget.value
                  ).length
                : 0}{" "}
              variant(s). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                removeValueTarget &&
                removeValueFromOption(
                  removeValueTarget.optionIndex,
                  removeValueTarget.valueIndex
                )
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
