"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProducts,
  createOrder,
  type Product,
  type OrderItem,
} from "@/lib/api";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

function getProductPrice(product: Product): number {
  if (product.productType === "variable" && product.variants?.length) {
    return Math.min(...product.variants.map((v) => v.price));
  }
  return product.price;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>
  >([]);
  const [newProductId, setNewProductId] = useState("");
  const [newQty, setNewQty] = useState(1);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const addItem = () => {
    if (!newProductId) return;
    const product = products.find((p) => p.id === newProductId);
    if (!product) return;
    const unitPrice = getProductPrice(product);
    const existing = items.find((i) => i.productId === newProductId);
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === newProductId
            ? { ...i, quantity: i.quantity + newQty }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: newQty,
          unitPrice,
        },
      ]);
    }
    setNewProductId("");
    setNewQty(1);
  };

  const updateItemQty = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
  };

  const updateItemPrice = (productId: string, unitPrice: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, unitPrice } : i
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const orderItems: OrderItem[] = items.map((i) => ({
    productId: i.productId,
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    lineTotal: i.quantity * i.unitPrice,
  }));

  const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim()) {
      toast.error("Customer email is required");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      const order = await createOrder({
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim() || null,
        items: orderItems,
        subtotal,
        discountAmount,
        total,
        currency,
        couponCode: couponCode.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success("Order created");
      router.push(`/admin/orders/${order.id}`);
      router.refresh();
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
              Add a new order manually
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 px-4 pb-8 lg:px-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Customer</h3>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email (required)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Name (optional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Discount</h3>
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon code (optional)</Label>
              <Input
                id="couponCode"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. SUMMER20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount amount</Label>
              <Input
                id="discountAmount"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) =>
                  setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Line items</h3>
          <div className="flex flex-wrap gap-2">
            <Select
              value={newProductId || "__none__"}
              onValueChange={(v) => setNewProductId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select product</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({getProductPrice(p).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="1"
              value={newQty}
              onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20"
            />
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <PlusIcon className="size-4" />
              Add
            </Button>
          </div>
          {items.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Unit price</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => (
                    <TableRow key={i.productId}>
                      <TableCell>{i.productName}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={i.quantity}
                          onChange={(e) =>
                            updateItemQty(
                              i.productId,
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={i.unitPrice}
                          onChange={(e) =>
                            updateItemPrice(
                              i.productId,
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        {(i.quantity * i.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(i.productId)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 text-sm">
            <p>
              Subtotal: {currency} {subtotal.toFixed(2)}
            </p>
            {discountAmount > 0 && (
              <p className="text-muted-foreground">
                Discount: -{currency} {discountAmount.toFixed(2)}
              </p>
            )}
            <p className="font-semibold">
              Total: {currency} {total.toFixed(2)}
            </p>
          </div>
          <Button type="submit" disabled={saving || items.length === 0}>
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
    </div>
  );
}
