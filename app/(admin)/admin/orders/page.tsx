"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getOrders, type Order } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PlusIcon, Loader2Icon } from "lucide-react";
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_VARIANTS: Record<
  Order["status"],
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const loadOrders = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter && paymentFilter !== "all") params.paymentStatus = paymentFilter;
      const data = await getOrders(Object.keys(params).length ? params : undefined);
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentFilter]);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-2 px-4 lg:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Orders</h2>
            <p className="text-muted-foreground text-sm">
              Manage customer orders
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentFilter}
              onValueChange={setPaymentFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild>
              <Link href="/admin/orders/new">
                <PlusIcon className="size-4" />
                Create order
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-4 lg:px-6">
          {loading ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">No orders yet.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/orders/new">Create your first order</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {order.customerName || order.customerEmail}
                          </span>
                          {order.customerName && (
                            <span className="text-muted-foreground ml-1 text-sm">
                              ({order.customerEmail})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(order.total, order.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.paymentStatus ? (
                          <span className="capitalize text-sm">{order.paymentStatus}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <a
                            href={`https://track.shiprocket.in/tracking/${order.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm underline"
                          >
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
