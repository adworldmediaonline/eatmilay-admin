"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getOrder,
  updateOrder,
  createShiprocketOrder,
  trackOrder,
  type Order,
  type TrackingData,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeftIcon, ChevronDownIcon, Loader2Icon, PackageIcon, TruckIcon } from "lucide-react";
import { toast } from "sonner";

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  paid: "default",
  confirmed: "default",
  processing: "secondary",
  shipped: "secondary",
  delivered: "default",
  cancelled: "destructive",
};

const SHIPMENT_STATUS_LABELS: Record<number, string> = {
  6: "Shipped",
  7: "Delivered",
  8: "Canceled",
  9: "RTO Initiated",
  10: "RTO Delivered",
  12: "Lost",
  13: "Pickup Error",
  14: "RTO Acknowledged",
  15: "Pickup Rescheduled",
  16: "Cancellation Requested",
  17: "Out For Delivery",
  18: "In Transit",
  19: "Out For Pickup",
  20: "Pickup Exception",
  21: "Undelivered",
  22: "Delayed",
  23: "Partial Delivered",
  24: "Destroyed",
  25: "Damaged",
  26: "Fulfilled",
  27: "Pickup Booked",
  38: "Reached at Destination Hub",
  39: "Misrouted",
  40: "RTO NDR",
  41: "RTO OFD",
  42: "Picked Up",
  43: "Self Fulfilled",
  44: "Disposed Off",
  45: "Cancelled Before Dispatched",
  46: "RTO In Transit",
  47: "QC Failed",
  48: "Reached Warehouse",
  49: "Custom Cleared",
  50: "In Flight",
  51: "Handover to Courier",
  52: "Shipment Booked",
  54: "In Transit Overseas",
  55: "Connection Aligned",
  56: "Reached Overseas Warehouse",
  57: "Custom Cleared Overseas",
  59: "Box Packing",
  60: "FC Allocated",
  61: "Picklist Generated",
  62: "Ready To Pack",
  63: "Packed",
  67: "FC Manifest Generated",
  68: "Processed at Warehouse",
  71: "Handover Exception",
  72: "Packed Exception",
  75: "RTO Lock",
  76: "Untraceable",
  77: "Issue Related to Recipient",
  78: "Reached Back at Seller City",
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Order["status"]>("pending");
  const [notes, setNotes] = useState("");
  const [creatingShiprocket, setCreatingShiprocket] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    getOrder(id)
      .then((o) => {
        setOrder(o);
        setStatus(o.status);
        setNotes(o.notes ?? "");
      })
      .catch(() => {
        toast.error("Order not found");
        router.push("/admin/orders");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await updateOrder(order.id, { status, notes: notes || null });
      setOrder(updated);
      toast.success("Order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateShiprocket = async () => {
    if (!order) return;
    setCreatingShiprocket(true);
    try {
      await createShiprocketOrder(order.id);
      const refreshed = await getOrder(order.id);
      setOrder(refreshed);
      toast.success("Shiprocket order created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create Shiprocket order");
    } finally {
      setCreatingShiprocket(false);
    }
  };

  const handleTrack = async () => {
    if (!order) return;
    try {
      const data = await trackOrder(order.id);
      setTrackingData(data);
      setTrackingOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch tracking");
    }
  };

  if (loading || !order) {
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
            <h2 className="text-lg font-semibold">{order.orderNumber}</h2>
            <p className="text-muted-foreground text-sm">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {order.paymentStatus && (
              <Badge variant="outline" className="capitalize">
                {order.paymentStatus}
              </Badge>
            )}
            <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>
              {order.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 pb-8 lg:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Customer</h3>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{order.customerEmail}</dd>
              </div>
              {order.customerName && (
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{order.customerName}</dd>
                </div>
              )}
            </dl>
          </div>

          {order.shippingAddress && typeof order.shippingAddress === "object" && (() => {
            const addr = order.shippingAddress as { fullName?: string; phone?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string; country?: string };
            return (
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Shipping address</h3>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd>{addr.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{addr.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd>
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                    </dd>
                    <dd>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </dd>
                    <dd>{addr.country}</dd>
                  </div>
                </dl>
              </div>
            );
          })()}

          {(order.shippingAddress || order.paymentMethod || order.trackingNumber) && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-medium">Payment & shipping</h3>
              <dl className="space-y-1 text-sm">
                {order.paymentMethod && (
                  <div>
                    <dt className="text-muted-foreground">Payment method</dt>
                    <dd className="capitalize">{order.paymentMethod}</dd>
                  </div>
                )}
                {order.shippingAmount != null && order.shippingAmount > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd>
                      {formatPrice(order.shippingAmount, order.currency)}
                      {order.courierName && ` (${order.courierName})`}
                      {order.estimatedDelivery && ` · ${order.estimatedDelivery}`}
                    </dd>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <dt className="text-muted-foreground">Tracking</dt>
                    <dd>
                      <a
                        href={`https://track.shiprocket.in/tracking/${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        {order.trackingNumber}
                      </a>
                    </dd>
                  </div>
                )}
                {order.shiprocketError && !order.trackingNumber && (
                  <div>
                    <dt className="text-muted-foreground">Shiprocket error</dt>
                    <dd className="text-destructive text-sm">{order.shiprocketError}</dd>
                  </div>
                )}
              </dl>
              <div className="flex gap-2 pt-2">
                {!order.trackingNumber &&
                  (order.shiprocketError || !order.razorpayOrderId) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateShiprocket}
                      disabled={creatingShiprocket}
                    >
                      {creatingShiprocket ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <>
                          <PackageIcon className="size-4" />
                          {order.shiprocketError
                            ? "Retry Shiprocket order"
                            : "Create Shiprocket order"}
                        </>
                      )}
                    </Button>
                  )}
                {order.trackingNumber && (
                  <Button size="sm" variant="outline" onClick={handleTrack}>
                    <TruckIcon className="size-4" />
                    Track
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Update order</h3>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Order["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border">
          <h3 className="border-b p-4 font-medium">Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-32">Unit price</TableHead>
                <TableHead className="w-32">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, idx) => (
                <TableRow key={`${item.productId}-${idx}`}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {formatPrice(item.unitPrice, order.currency)}
                  </TableCell>
                  <TableCell>
                    {formatPrice(item.lineTotal, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="space-y-1 border-t p-4 text-right text-sm">
            <p>Subtotal: {formatPrice(order.subtotal, order.currency)}</p>
            {order.discountAmount != null && order.discountAmount > 0 && (
              <p className="text-muted-foreground">
                Discount: -{formatPrice(order.discountAmount, order.currency)}
              </p>
            )}
            {order.couponCode && (
              <p className="text-muted-foreground">
                Coupon: {order.couponCode}
              </p>
            )}
            {order.shippingAmount != null && order.shippingAmount > 0 && (
              <p>Shipping: {formatPrice(order.shippingAmount, order.currency)}</p>
            )}
            <p className="font-semibold">
              Total: {formatPrice(order.total, order.currency)}
            </p>
          </div>
        </div>
      </div>

      <Sheet open={trackingOpen} onOpenChange={setTrackingOpen}>
        <SheetContent className="flex max-h-dvh flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Tracking</SheetTitle>
          </SheetHeader>
          {trackingData != null ? (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pt-4">
              {(() => {
                const td = trackingData.tracking_data;
                const shipment = td.shipment_track?.[0];
                const statusLabel =
                  SHIPMENT_STATUS_LABELS[td.shipment_status] ??
                  shipment?.current_status ??
                  `Status ${td.shipment_status}`;

                return (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {statusLabel}
                      </Badge>
                      {td.track_url && (
                        <a
                          href={td.track_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm underline"
                        >
                          Track on Shiprocket
                        </a>
                      )}
                    </div>

                    {shipment && (
                      <dl className="space-y-1 rounded-lg border p-3 text-sm">
                        {shipment.courier_name && (
                          <div>
                            <dt className="text-muted-foreground">Courier</dt>
                            <dd>{shipment.courier_name}</dd>
                          </div>
                        )}
                        {shipment.awb_code && (
                          <div>
                            <dt className="text-muted-foreground">AWB</dt>
                            <dd className="font-mono">{shipment.awb_code}</dd>
                          </div>
                        )}
                        {shipment.origin && (
                          <div>
                            <dt className="text-muted-foreground">Origin</dt>
                            <dd>{shipment.origin}</dd>
                          </div>
                        )}
                        {shipment.destination && (
                          <div>
                            <dt className="text-muted-foreground">Destination</dt>
                            <dd>{shipment.destination}</dd>
                          </div>
                        )}
                        {(td.etd || shipment.etd || shipment.delivered_date) && (
                          <div>
                            <dt className="text-muted-foreground">
                              {shipment.delivered_date ? "Delivered" : "Est. delivery"}
                            </dt>
                            <dd>
                              {shipment.delivered_date ??
                                td.etd ??
                                shipment.etd}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}

                    {td.shipment_track_activities &&
                      td.shipment_track_activities.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Timeline</h4>
                          <div className="relative space-y-0">
                            {(td.shipment_track_activities as Array<{
                              date: string;
                              activity: string;
                              location: string;
                            }>)
                              .slice()
                              .sort(
                                (a, b) =>
                                  new Date(a.date).getTime() -
                                  new Date(b.date).getTime()
                              )
                              .map((act, i) => (
                                <div
                                  key={i}
                                  className="relative flex gap-3 pb-4 last:pb-0"
                                >
                                  {i <
                                    td.shipment_track_activities!.length - 1 && (
                                    <div className="absolute left-[5px] top-5 h-full w-px bg-border" />
                                  )}
                                  <div className="relative z-10 mt-0.5 size-2.5 shrink-0 rounded-full bg-primary" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-muted-foreground text-xs">
                                      {formatDate(act.date)}
                                    </p>
                                    <p className="text-sm font-medium">
                                      {act.activity}
                                    </p>
                                    {act.location && act.location !== "NA" && (
                                      <p className="text-muted-foreground text-xs">
                                        {act.location}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    <Collapsible
                      open={debugOpen}
                      onOpenChange={setDebugOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between"
                        >
                          Debug (raw JSON)
                          <ChevronDownIcon
                            className={`size-4 transition-transform ${debugOpen ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
                          {JSON.stringify(trackingData, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                );
              })()}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
