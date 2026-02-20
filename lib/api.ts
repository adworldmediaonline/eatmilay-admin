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

export type GetProductCategoriesParams = {
  search?: string;
  sortBy?: "name" | "slug" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export type GetProductCategoriesResponse = {
  items: ProductCategory[];
  total: number;
};

export async function getProductCategories(
  params?: GetProductCategoriesParams
): Promise<GetProductCategoriesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search?.trim()) searchParams.set("search", params.search.trim());
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.offset != null) searchParams.set("offset", String(params.offset));
  const search = searchParams.toString();
  const url = `${apiUrl}/api/admin/product-categories${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url, { signal: params?.signal });
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

export type GetProductCollectionsParams = {
  search?: string;
  sortBy?: "name" | "slug" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export type GetProductCollectionsResponse = {
  items: ProductCollection[];
  total: number;
};

export async function getProductCollections(
  params?: GetProductCollectionsParams
): Promise<GetProductCollectionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search?.trim()) searchParams.set("search", params.search.trim());
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.offset != null) searchParams.set("offset", String(params.offset));
  const search = searchParams.toString();
  const url = `${apiUrl}/api/admin/product-collections${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url, { signal: params?.signal });
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
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  shippingAmount?: number;
  courierName?: string | null;
  estimatedDelivery?: string | null;
  trackingNumber?: string | null;
  shiprocketShipmentId?: number | null;
  shiprocketError?: string | null;
  shiprocketErrorAt?: string | null;
};

export type TrackingData = {
  tracking_data: {
    track_status?: number;
    shipment_status: number;
    track_url?: string;
    etd?: string;
    shipment_track: Array<{
      current_status: string;
      awb_code: string;
      courier_name?: string;
      etd?: string;
      origin?: string;
      destination?: string;
      delivered_to?: string;
      delivered_date?: string;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
      "sr-status"?: string;
      "sr-status-label"?: string;
    }>;
  };
};

export type GetOrdersParams = {
  status?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "orderNumber" | "createdAt" | "total" | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export type GetOrdersResponse = {
  items: Order[];
  total: number;
};

export async function getOrders(
  params?: GetOrdersParams
): Promise<GetOrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.paymentStatus) searchParams.set("paymentStatus", params.paymentStatus);
  if (params?.search?.trim()) searchParams.set("search", params.search.trim());
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.offset != null) searchParams.set("offset", String(params.offset));
  const search = searchParams.toString();
  const url = `${apiUrl}/api/admin/orders${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url, { signal: params?.signal });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export type ExportOrdersParams = {
  startDate: string;
  endDate: string;
  format?: "csv" | "xlsx";
  status?: string;
  paymentStatus?: string;
  search?: string;
};

export async function exportOrders(params: ExportOrdersParams): Promise<Blob> {
  const searchParams = new URLSearchParams();
  searchParams.set("startDate", params.startDate);
  searchParams.set("endDate", params.endDate);
  searchParams.set("format", params.format ?? "csv");
  if (params.status) searchParams.set("status", params.status);
  if (params.paymentStatus) searchParams.set("paymentStatus", params.paymentStatus);
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  const url = `${apiUrl}/api/admin/orders/export?${searchParams.toString()}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to export orders");
  }
  return res.blob();
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
  description: string | null;
  allowAutoApply: boolean;
  productIds: string[];
  categoryIds: string[];
  minOrderAmount: number | null;
  maxUsage: number | null;
  usedCount: number;
  firstOrderOnly: boolean;
  referralCode: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  status: "active" | "disabled" | "scheduled";
  effectiveStatus?: "active" | "disabled" | "scheduled" | "expired";
  createdAt: string;
  updatedAt: string;
};

export type GetDiscountsParams = {
  status?: string;
  search?: string;
  sortBy?: "code" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export type GetDiscountsResponse = {
  items: Discount[];
  total: number;
};

export async function getDiscounts(
  params?: GetDiscountsParams
): Promise<GetDiscountsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search?.trim()) searchParams.set("search", params.search.trim());
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.offset != null) searchParams.set("offset", String(params.offset));
  const search = searchParams.toString();
  const url = `${apiUrl}/api/admin/discounts${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url, { signal: params?.signal });
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
  description?: string | null;
  allowAutoApply?: boolean;
  productIds?: string[];
  categoryIds?: string[];
  minOrderAmount?: number | null;
  maxUsage?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  status?: "active" | "disabled" | "scheduled";
  firstOrderOnly?: boolean;
  referralCode?: string | null;
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
    description: string | null;
    allowAutoApply: boolean;
    productIds: string[];
    categoryIds: string[];
    minOrderAmount: number | null;
    maxUsage: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    status: "active" | "disabled" | "scheduled";
    firstOrderOnly: boolean;
    referralCode: string | null;
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

export type CouponBehaviorSettings = {
  autoApply: boolean;
  autoApplyStrategy: "best_savings" | "first_created" | "highest_percentage" | "customer_choice";
  showToastOnApply: boolean;
};

export async function getCouponSettings(): Promise<CouponBehaviorSettings> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/settings/coupon`);
  if (!res.ok) throw new Error("Failed to fetch coupon settings");
  return res.json();
}

export async function updateCouponSettings(
  data: CouponBehaviorSettings
): Promise<CouponBehaviorSettings> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/settings/coupon`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update coupon settings");
  }
  return res.json();
}

export type ShippingSettings = {
  freeShippingThreshold: number | null;
};

export async function getShippingSettings(): Promise<ShippingSettings> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/settings/shipping`);
  if (!res.ok) throw new Error("Failed to fetch shipping settings");
  return res.json();
}

export async function updateShippingSettings(
  data: ShippingSettings
): Promise<ShippingSettings> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/settings/shipping`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update shipping settings");
  }
  return res.json();
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
  nutrients?: string;
  benefits?: string;
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

export type GetProductsParams = {
  status?: string;
  categoryId?: string;
  search?: string;
  sortBy?: "name" | "price" | "updatedAt" | "stockQuantity";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export type GetProductsResponse = {
  items: Product[];
  total: number;
};

export async function getProducts(
  params?: GetProductsParams
): Promise<GetProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params?.search?.trim()) searchParams.set("search", params.search.trim());
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.offset != null) searchParams.set("offset", String(params.offset));
  const search = searchParams.toString();
  const url = `${apiUrl}/api/admin/products${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url, { signal: params?.signal });
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
  nutrients?: string;
  benefits?: string;
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

export type ImportProductsResult = {
  created: number;
  failed: number;
  total: number;
  errors: Array<{ row: number; message: string }>;
};

export async function importProducts(
  content: string
): Promise<ImportProductsResult> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/products/import`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to import products");
  }
  return data;
}

export type ProductUpdateInput = Partial<{
  name: string;
  slug: string;
  description: string;
  nutrients?: string;
  benefits?: string;
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

// Reviews
export type AdminReview = {
  id: string;
  type: "product" | "order";
  productId: string | null;
  orderId: string | null;
  orderNumber: string | null;
  customerId: string | null;
  customerName: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: "published" | "hidden";
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetReviewsParams = {
  type?: "product" | "order";
  status?: "published" | "hidden";
  productId?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export type GetReviewsResponse = {
  items: AdminReview[];
  total: number;
};

export async function getReviews(
  params?: GetReviewsParams
): Promise<GetReviewsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.productId) searchParams.set("productId", params.productId);
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.offset != null) searchParams.set("offset", String(params.offset));
  const search = searchParams.toString();
  const url = `${apiUrl}/api/admin/reviews${search ? `?${search}` : ""}`;
  const res = await fetchWithAuth(url, { signal: params?.signal });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function updateReview(
  id: string,
  data: { status: "published" | "hidden" }
): Promise<void> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update review");
  }
}

export async function deleteReview(id: string): Promise<void> {
  const res = await fetchWithAuth(`${apiUrl}/api/admin/reviews/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete review");
}
