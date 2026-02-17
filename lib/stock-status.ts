export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "backorder";

export function getStockStatus(
  trackInventory: boolean,
  stockQuantity: number,
  lowStockThreshold: number | null | undefined,
  allowBackorder: boolean
): StockStatus {
  if (!trackInventory) return "in_stock";
  const qty = stockQuantity ?? 0;
  const threshold = lowStockThreshold ?? 0;
  if (qty === 0) {
    return allowBackorder ? "backorder" : "out_of_stock";
  }
  if (qty <= threshold) return "low_stock";
  return "in_stock";
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "low_stock":
      return "Low stock";
    case "out_of_stock":
      return "Out of stock";
    case "backorder":
      return "Backorder";
    default:
      return "In stock";
  }
}

export function getProductStockStatus(product: {
  productType?: "simple" | "variable" | "bundle";
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  allowBackorder?: boolean;
  variants?: Array<{
    stockQuantity?: number;
    lowStockThreshold?: number | null;
    allowBackorder?: boolean;
  }>;
}): StockStatus {
  const productType = product.productType ?? "simple";
  const variants = product.variants ?? [];
  if (productType === "variable" && variants.length > 0) {
    const statuses = variants.map((v) =>
      getStockStatus(
        product.trackInventory ?? true,
        v.stockQuantity ?? 0,
        v.lowStockThreshold,
        v.allowBackorder ?? false
      )
    );
    if (statuses.some((s) => s === "in_stock")) return "in_stock";
    if (statuses.some((s) => s === "low_stock")) return "low_stock";
    if (statuses.some((s) => s === "backorder")) return "backorder";
    return "out_of_stock";
  }
  return getStockStatus(
    product.trackInventory ?? true,
    product.stockQuantity ?? 0,
    product.lowStockThreshold,
    product.allowBackorder ?? false
  );
}
