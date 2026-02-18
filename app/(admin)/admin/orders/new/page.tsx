"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProducts,
  type Product,
} from "@/lib/api";
import {
  getShippingRates,
  createStoreOrder,
  verifyPayment,
  type OrderItem,
  type ShippingAddress,
  type ShippingCourier,
} from "@/lib/store-api";
import { AdminProductPicker } from "@/components/admin-product-picker";
import { AdminCouponInput } from "@/components/admin-coupon-input";
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
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

const PICKUP_POSTCODE =
  process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_POSTCODE ?? "302017";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

const emptyAddress: ShippingAddress = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

function formatPrice(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const paymentMethod = "razorpay" as const;

  const [items, setItems] = useState<OrderItem[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingCourier[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const total = subtotalAfterDiscount + shippingCost;

  const selectedCourier = shippingRates.find(
    (c) => c.courier_company_id === selectedCourierId
  );

  const calculateWeight = useCallback(() => {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    return Math.max(0.1, totalItems * 0.2).toFixed(2);
  }, [items]);

  useEffect(() => {
    getProducts({ status: "published", limit: 10000 })
      .then((data) => setProducts(data.items))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!address.postalCode || address.postalCode.length !== 6) {
      setShippingRates([]);
      setSelectedCourierId(null);
      setShippingCost(0);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingRates(true);
      try {
        const data = await getShippingRates({
          pickup_postcode: PICKUP_POSTCODE,
          delivery_postcode: address.postalCode,
          cod: false,
          weight: calculateWeight(),
        });
        const couriers = data.available_courier_companies ?? [];
        setShippingRates(couriers);

        const recommendedId =
          data.recommended_courier_company_id ?? couriers[0]?.courier_company_id;
        const chosen =
          couriers.find((c) => c.courier_company_id === recommendedId) ??
          couriers[0];
        if (chosen) {
          setSelectedCourierId(chosen.courier_company_id);
          setShippingCost(chosen.rate);
        } else {
          setSelectedCourierId(null);
          setShippingCost(0);
        }
      } catch {
        setShippingRates([]);
        setSelectedCourierId(null);
        setShippingCost(0);
        toast.error("Failed to fetch shipping rates");
      } finally {
        setIsLoadingRates(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [address.postalCode, calculateWeight]);

  const addItem = (item: OrderItem) => {
    const existing = items.find(
      (i) =>
        i.productId === item.productId &&
        (i.variantIndex ?? -1) === (item.variantIndex ?? -1)
    );
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === item.productId &&
          (i.variantIndex ?? -1) === (item.variantIndex ?? -1)
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                lineTotal: (i.quantity + item.quantity) * i.unitPrice,
              }
            : i
        )
      );
    } else {
      setItems((prev) => [...prev, item]);
    }
  };

  const updateItemQty = (productId: string, variantIndex: number | undefined, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId &&
        (i.variantIndex ?? -1) === (variantIndex ?? -1)
          ? { ...i, quantity, lineTotal: i.unitPrice * quantity }
          : i
      )
    );
  };

  const removeItem = (productId: string, variantIndex?: number) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(i.productId === productId && (i.variantIndex ?? -1) === (variantIndex ?? -1))
      )
    );
  };

  const handleApplyCoupon = (amount: number, code: string) => {
    setDiscountAmount(amount);
    setCouponCode(code);
  };

  const handleRemoveCoupon = () => {
    setDiscountAmount(0);
    setCouponCode(null);
  };

  const openRazorpayCheckout = useCallback(
    (order: { id: string; razorpayOrderId: string; orderNumber: string }) => {
      if (!RAZORPAY_KEY_ID) {
        toast.error(
          "Payment gateway not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to your admin environment variables."
        );
        setSaving(false);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const Razorpay = (
          window as unknown as {
            Razorpay: new (opts: unknown) => { open: () => void };
          }
        ).Razorpay;
        const rzp = new Razorpay({
          key: RAZORPAY_KEY_ID,
          amount: Math.round(total * 100),
          currency: "INR",
          name: "Admin Order",
          description: `Order #${order.orderNumber}`,
          order_id: order.razorpayOrderId,
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyPayment({
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success(`Order ${order.orderNumber} placed successfully`);
              router.push(`/admin/orders/${order.id}`);
              router.refresh();
            } catch {
              toast.error("Payment verification failed");
            } finally {
              setSaving(false);
            }
          },
          prefill: {
            name: address.fullName,
            email: address.email,
            contact: address.phone,
          },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled");
              setSaving(false);
            },
          },
        });
        rzp.open();
      };

      script.onerror = () => {
        toast.error("Failed to load payment gateway");
        setSaving(false);
      };
    },
    [total, address.fullName, address.email, address.phone, router]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (!address.email?.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!address.fullName?.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!address.phone?.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (!address.addressLine1?.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!address.city?.trim()) {
      toast.error("City is required");
      return;
    }
    if (!address.state?.trim()) {
      toast.error("State is required");
      return;
    }
    if (address.postalCode?.length !== 6) {
      toast.error("Enter a valid 6-digit PIN code");
      return;
    }

    if (shippingCost === 0 && address.postalCode) {
      if (isLoadingRates) {
        toast.error("Please wait for shipping rates to load");
        return;
      }
      if (shippingRates.length === 0) {
        toast.error("No shipping options available for this PIN code");
        return;
      }
    }

    setSaving(true);
    try {
      const order = await createStoreOrder({
        customerEmail: address.email.trim(),
        customerName: address.fullName.trim() || null,
        items,
        subtotal,
        discountAmount,
        total,
        couponCode,
        notes: notes.trim() || null,
        shippingAddress: address,
        paymentMethod,
        shippingAmount: shippingCost,
        courierId: selectedCourierId ?? undefined,
        courierName: selectedCourier?.courier_name,
        estimatedDelivery: selectedCourier?.etd,
      });

      if (order.razorpayOrderId) {
        openRazorpayCheckout({
          id: order.id,
          razorpayOrderId: order.razorpayOrderId,
          orderNumber: order.orderNumber,
        });
        return;
      } else {
        toast.success(`Order ${order.orderNumber} created successfully`);
        router.push(`/admin/orders/${order.id}`);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Create order</h2>
            <p className="text-muted-foreground text-sm">
              Full checkout flow – shipping, payment, coupon
            </p>
          </div>
        </div>

        {!RAZORPAY_KEY_ID && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Payment gateway not configured.</strong> Add{" "}
            <code className="rounded bg-amber-500/20 px-1">NEXT_PUBLIC_RAZORPAY_KEY_ID</code>{" "}
            to your admin environment variables and restart the server. Order creation will fail until this is set.
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 px-4 pb-8 lg:px-6"
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-lg font-semibold">Shipping address</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    value={address.fullName}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, fullName: e.target.value }))
                    }
                    placeholder="Customer full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={address.email}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, email: e.target.value }))
                    }
                    placeholder="customer@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={address.phone}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, phone: e.target.value }))
                    }
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine1">Address line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={address.addressLine1}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, addressLine1: e.target.value }))
                    }
                    placeholder="Street, building"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine2">Address line 2</Label>
                  <Input
                    id="addressLine2"
                    value={address.addressLine2 ?? ""}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, addressLine2: e.target.value }))
                    }
                    placeholder="Apartment, suite (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={address.city}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, city: e.target.value }))
                    }
                    placeholder="City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={address.state}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, state: e.target.value }))
                    }
                    placeholder="State"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">PIN code *</Label>
                  <Input
                    id="postalCode"
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress((a) => ({
                        ...a,
                        postalCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    placeholder="6 digits"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={address.country}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, country: e.target.value }))
                    }
                    placeholder="India"
                  />
                </div>
              </div>
            </div>

            {address.postalCode.length === 6 && (
              <div className="space-y-2 rounded-lg border p-4">
                <Label>Shipping options</Label>
                {isLoadingRates ? (
                  <p className="text-sm text-muted-foreground">
                    Loading shipping rates...
                  </p>
                ) : shippingRates.length > 0 ? (
                  <div className="space-y-2">
                    {shippingRates.map((c) => (
                      <label
                        key={c.courier_company_id}
                        className={`flex cursor-pointer items-center justify-between rounded-md border p-2 ${
                          selectedCourierId === c.courier_company_id
                            ? "border-primary"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="courier"
                          checked={selectedCourierId === c.courier_company_id}
                          onChange={() => {
                            setSelectedCourierId(c.courier_company_id);
                            setShippingCost(c.rate);
                          }}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">
                          {c.courier_name}
                        </span>
                        <span className="text-sm">
                          {formatPrice(c.rate)} · {c.etd}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No shipping options for this PIN code
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 rounded-lg border p-4">
              <Label>Payment method</Label>
              <p className="text-sm text-muted-foreground">
                Online Payment (Razorpay) only
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-lg font-semibold">Order summary</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Items</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  <PlusIcon className="size-4" />
                  Add product
                </Button>
              </div>

              {items.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-24">Price</TableHead>
                        <TableHead className="w-24">Total</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((i) => (
                        <TableRow
                          key={`${i.productId}-${i.variantIndex ?? "s"}`}
                        >
                          <TableCell className="font-medium">
                            {i.productName}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={i.quantity}
                              onChange={(e) =>
                                updateItemQty(
                                  i.productId,
                                  i.variantIndex,
                                  Math.max(
                                    1,
                                    parseInt(e.target.value, 10) || 1
                                  )
                                )
                              }
                              className="h-8 w-16"
                            />
                          </TableCell>
                          <TableCell>{formatPrice(i.unitPrice)}</TableCell>
                          <TableCell>{formatPrice(i.lineTotal)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(i.productId, i.variantIndex)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No items yet. Click &quot;Add product&quot; to add items.
                </p>
              )}

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <Label>Coupon code</Label>
              <AdminCouponInput
                subtotal={subtotal}
                items={items.map((i) => ({
                  productId: i.productId,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                }))}
                onApplied={handleApplyCoupon}
                appliedCode={couponCode}
                appliedAmount={discountAmount}
                onRemove={handleRemoveCoupon}
              />
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Order notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Total: {formatPrice(total)}</p>
          </div>
          <Button
            type="submit"
            disabled={saving || items.length === 0}
          >
            {saving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create order"
            )}
          </Button>
        </div>
      </form>

      <AdminProductPicker
        products={products}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdd={addItem}
      />
    </div>
  );
}
