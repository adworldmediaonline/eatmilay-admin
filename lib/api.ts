const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005";

export type Role = {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: {
    user: string[];
    session: string[];
  };
  createdAt: string;
};

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function getRoles(): Promise<Role[]> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/roles`);
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function createRole(data: {
  name: string;
  slug?: string;
  description?: string;
  permissions: { user: string[]; session: string[] };
}): Promise<Role> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/roles`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create role");
  }
  return res.json();
}

export async function updateRole(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    permissions: { user: string[]; session: string[] };
  }>
): Promise<Role> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update role");
  }
  return res.json();
}

export async function deleteRole(id: string): Promise<void> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/roles/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete role");
}

export async function assignRoleToUser(
  userId: string,
  role: string
): Promise<void> {
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/users/${userId}/assign-role`,
    {
      method: "POST",
      body: JSON.stringify({ role }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to assign role");
  }
}

export const PERMISSION_OPTIONS = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
} as const;

// Product categories
export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: ProductImage | null;
  createdAt: string;
  updatedAt: string;
};

export async function getProductCategories(): Promise<ProductCategory[]> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/product-categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createProductCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: ProductImage | null;
}): Promise<ProductCategory> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/product-categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create category");
  }
  return res.json();
}

export async function updateProductCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    image: ProductImage | null;
  }>
): Promise<ProductCategory> {
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/product-categories/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update category");
  }
  return res.json();
}

export async function deleteProductCategory(id: string): Promise<void> {
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/product-categories/${id}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete category");
}

// Product collections
export type ProductCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: ProductImage | null;
  productIds: string[];
  productCount?: number;
  createdAt: string;
  updatedAt: string;
};

export async function getProductCollections(): Promise<ProductCollection[]> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/product-collections`);
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
}

export async function createProductCollection(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: ProductImage | null;
  productIds?: string[];
}): Promise<ProductCollection> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/product-collections`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create collection");
  }
  return res.json();
}

export async function getProductCollection(id: string): Promise<ProductCollection> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/product-collections/${id}`);
  if (!res.ok) throw new Error("Failed to fetch collection");
  return res.json();
}

export async function updateProductCollection(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    image: ProductImage | null;
    productIds: string[];
  }>
): Promise<ProductCollection> {
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/product-collections/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update collection");
  }
  return res.json();
}

export async function deleteProductCollection(id: string): Promise<void> {
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/product-collections/${id}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete collection");
}

// Orders
export type OrderItem = {
  productId: string;
  productName: string;
  variantIndex?: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string | null;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  currency: string;
  status: "pending" | "paid" | "shipped" | "cancelled" | "confirmed" | "processing" | "delivered";
  couponCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: ShippingAddress | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  shippingAmount?: number;
  courierName?: string | null;
  estimatedDelivery?: string | null;
  trackingNumber?: string | null;
  shiprocketShipmentId?: number | null;
};

export type TrackingData = {
  tracking_data: {
    shipment_status: number;
    shipment_track: Array<{
      current_status: string;
      awb_code: string;
      courier_name: string;
      etd: string;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
    }>;
  };
};

export async function getOrders(params?: {
  status?: string;
  paymentStatus?: string;
}): Promise<Order[]> {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${apiUrl}/api/admin/orders${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function getOrder(id: string): Promise<Order> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/orders/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
}

export async function createOrder(data: {
  customerId?: string | null;
  customerEmail: string;
  customerName?: string | null;
  items: OrderItem[];
  subtotal: number;
  discountAmount?: number;
  total: number;
  currency?: string;
  couponCode?: string | null;
  notes?: string | null;
}): Promise<Order> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/orders`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create order");
  }
  return res.json();
}

export async function createShiprocketOrder(orderId: string): Promise<{
  success: boolean;
  data?: { shipmentId: number; awbCode: string | null; trackingNumber: string };
  error?: string;
}> {
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/orders/${orderId}/shiprocket/create`,
    { method: "POST" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create Shiprocket order");
  return data;
}

export async function trackOrder(orderId: string): Promise<TrackingData> {
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/orders/${orderId}/shiprocket/track`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch tracking");
  }
  return res.json();
}

export async function updateOrder(
  id: string,
  data: { status?: Order["status"]; notes?: string | null }
): Promise<Order> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update order");
  }
  return res.json();
}

// Discounts
export type Discount = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  productIds: string[];
  minOrderAmount: number | null;
  maxUsage: number | null;
  usedCount: number;
  expiresAt: string | null;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export async function getDiscounts(): Promise<Discount[]> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/discounts`);
  if (!res.ok) throw new Error("Failed to fetch discounts");
  return res.json();
}

export async function getDiscount(id: string): Promise<Discount> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/discounts/${id}`);
  if (!res.ok) throw new Error("Failed to fetch discount");
  return res.json();
}

export async function createDiscount(data: {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  productIds?: string[];
  minOrderAmount?: number | null;
  maxUsage?: number | null;
  expiresAt?: string | null;
  status?: "active" | "disabled";
}): Promise<Discount> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/discounts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create discount");
  }
  return res.json();
}

export async function updateDiscount(
  id: string,
  data: Partial<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    productIds: string[];
    minOrderAmount: number | null;
    maxUsage: number | null;
    expiresAt: string | null;
    status: "active" | "disabled";
  }>
): Promise<Discount> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/discounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update discount");
  }
  return res.json();
}

export async function deleteDiscount(id: string): Promise<void> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/discounts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete discount");
}

// Products
export type ProductImage = {
  url: string;
  publicId: string;
  filename?: string;
  title?: string;
  alt?: string;
};

export type ProductOption = { name: string; values: string[] };
export type VolumeTier = {
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  compareAtPrice?: number | null;
  label?: "most_popular" | "best_seller" | "super_saver" | null;
};

export type ProductVariant = {
  optionValues: string[];
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  label?: "most_popular" | null;
  volumeTiers?: VolumeTier[];
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  allowBackorder?: boolean;
};
export type BundleItem = {
  productId: string;
  quantity: number;
  priceOverride?: number | null;
  productName?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string | null;
  categoryName: string | null;
  price: number;
  compareAtPrice: number | null;
  status: "draft" | "published";
  images: ProductImage[];
  sku: string | null;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  currency: string;
  vendor: string | null;
  productType: "simple" | "variable" | "bundle";
  options: ProductOption[];
  variants: ProductVariant[];
  bundleItems: BundleItem[];
  bundlePricing: "fixed" | "sum" | "discounted" | null;
  bundlePrice: number | null;
  bundleDiscountPercent: number | null;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  allowBackorder?: boolean;
  relatedProductIds?: string[];
  relatedProducts?: Array<{ id: string; name: string; price: number; image: { url: string } | null }>;
  volumeTiers: VolumeTier[];
  createdAt: string;
  updatedAt: string;
};

export async function getProducts(params?: {
  status?: string;
  categoryId?: string;
}): Promise<Product[]> {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${apiUrl}/api/admin/products${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export type ProductCreateInput = {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  price: number;
  compareAtPrice?: number | null;
  status?: "draft" | "published";
  images?: ProductImage[];
  sku?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  currency?: string;
  vendor?: string;
  productType?: "simple" | "variable" | "bundle";
  options?: ProductOption[];
  variants?: ProductVariant[];
  bundleItems?: BundleItem[];
  bundlePricing?: "fixed" | "sum" | "discounted";
  bundlePrice?: number;
  bundleDiscountPercent?: number;
  volumeTiers?: VolumeTier[];
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  allowBackorder?: boolean;
  relatedProductIds?: string[];
};

export async function createProduct(data: ProductCreateInput): Promise<Product> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create product");
  }
  return res.json();
}

export type ProductUpdateInput = Partial<{
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string | null;
  price: number;
  compareAtPrice: number | null;
  status: "draft" | "published";
  images: ProductImage[];
  sku: string | null;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  currency: string;
  vendor: string | null;
  productType: "simple" | "variable" | "bundle";
  options: ProductOption[];
  variants: ProductVariant[];
  bundleItems: BundleItem[];
  bundlePricing: "fixed" | "sum" | "discounted" | null;
  bundlePrice: number | null;
  bundleDiscountPercent: number | null;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  allowBackorder?: boolean;
  relatedProductIds?: string[];
  volumeTiers: VolumeTier[];
}>;

export async function updateProduct(
  id: string,
  data: ProductUpdateInput
): Promise<Product> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update product");
  }
  return res.json();
}

export async function checkSlugAvailability(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  const params = new URLSearchParams({ slug });
  if (excludeId) params.set("excludeId", excludeId);
  const res = await fetchWithAuth(
    `${apiUrl}/api/admin/products/slug-available?${params}`
  );
  if (!res.ok) throw new Error("Failed to check slug");
  return res.json();
}

export async function duplicateProduct(id: string): Promise<Product> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/products/${id}/duplicate`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to duplicate product");
  }
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/products/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete product");
}

// Upload signature for Cloudinary
export type UploadSignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  eager?: string;
  use_filename?: string;
  unique_filename?: string;
};

export async function getUploadSignature(folder?: string): Promise<UploadSignature> {
  const url = `${apiUrl}/api/admin/upload/signature${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get upload signature");
  }
  return res.json();
}

export async function deleteImage(publicId: string): Promise<void> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/upload/delete`, {
    method: "POST",
    body: JSON.stringify({ publicId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete image");
  }
}
