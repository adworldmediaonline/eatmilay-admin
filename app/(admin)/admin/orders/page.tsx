"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns";
import { getOrders, exportOrders, type Order } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  DownloadIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

type DateRangePreset = "all" | "lastMonth" | "thisMonth" | "custom";

function getPresetRange(
  preset: DateRangePreset,
  customRange?: DateRange
): { startDate: string; endDate: string } | null {
  const now = new Date();
  if (preset === "all") return null;
  if (preset === "lastMonth") {
    const start = startOfMonth(subMonths(now, 1));
    const end = endOfMonth(subMonths(now, 1));
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }
  if (preset === "thisMonth") {
    const start = startOfMonth(now);
    const end = endOfDay(now);
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }
  if (preset === "custom" && customRange?.from) {
    const to = customRange.to ?? customRange.from;
    return {
      startDate: format(customRange.from, "yyyy-MM-dd"),
      endDate: format(to, "yyyy-MM-dd"),
    };
  }
  return null;
}

function getDateFilterLabel(
  preset: DateRangePreset,
  customRange?: DateRange
): string {
  if (preset === "all") return "All time";
  if (preset === "lastMonth") return "Last Month";
  if (preset === "thisMonth") return "This Month";
  if (preset === "custom" && customRange?.from) {
    const to = customRange.to ?? customRange.from;
    return `${format(customRange.from, "MMM d, y")} - ${format(to, "MMM d, y")}`;
  }
  return "Custom Date Range";
}

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

const PAGE_SIZES = [10, 20, 50] as const;
type OrderSortBy = "orderNumber" | "createdAt" | "total" | "status";
type SortOrder = "asc" | "desc";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<OrderSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const abortRef = useRef<AbortController | null>(null);

  const [dateRangePreset, setDateRangePreset] =
    useState<DateRangePreset>("all");
  const [dateRangeCustom, setDateRangeCustom] = useState<DateRange | undefined>();

  const [exportOpen, setExportOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [exporting, setExporting] = useState(false);

  const dateFilterRange = useMemo(
    () => getPresetRange(dateRangePreset, dateRangeCustom),
    [dateRangePreset, dateRangeCustom]
  );

  const loadOrders = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    try {
      const params: Parameters<typeof getOrders>[0] = {
        sortBy,
        sortOrder,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        signal,
      };
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter && paymentFilter !== "all")
        params.paymentStatus = paymentFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (dateFilterRange) {
        params.startDate = dateFilterRange.startDate;
        params.endDate = dateFilterRange.endDate;
      }

      const data = await getOrders(params);
      if (signal.aborted) return;
      setOrders(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Failed to load orders");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [
    statusFilter,
    paymentFilter,
    searchQuery,
    dateFilterRange,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    statusFilter,
    paymentFilter,
    dateRangePreset,
    dateRangeCustom,
    sortBy,
    sortOrder,
    pageSize,
  ]);

  const handleExport = async () => {
    if (!exportDateRange?.from) {
      toast.error("Please select a date range");
      return;
    }
    const to = exportDateRange.to ?? exportDateRange.from;
    setExporting(true);
    try {
      const blob = await exportOrders({
        startDate: format(exportDateRange.from, "yyyy-MM-dd"),
        endDate: format(to, "yyyy-MM-dd"),
        format: exportFormat,
        status: statusFilter !== "all" ? statusFilter : undefined,
        paymentStatus: paymentFilter !== "all" ? paymentFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${format(exportDateRange.from, "yyyy-MM-dd")}-${format(to, "yyyy-MM-dd")}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
      setExportOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field: OrderSortBy) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const SortHeader = ({
    field,
    label,
  }: {
    field: OrderSortBy;
    label: string;
  }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && (
          <span className="text-muted-foreground">
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </TableHead>
  );

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
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] sm:max-w-[280px]">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order #, email, name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-start font-normal"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {getDateFilterLabel(dateRangePreset, dateRangeCustom)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col p-1">
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      setDateRangePreset("all");
                      setDateRangeCustom(undefined);
                    }}
                  >
                    All time
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      setDateRangePreset("lastMonth");
                      setDateRangeCustom(undefined);
                    }}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      setDateRangePreset("thisMonth");
                      setDateRangeCustom(undefined);
                    }}
                  >
                    This Month
                  </Button>
                  <div className="my-1 border-t" />
                  <div className="p-2">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Custom Date Range
                    </p>
                    <DateRangePicker
                      value={dateRangePreset === "custom" ? dateRangeCustom : undefined}
                      onChange={(range) => {
                        setDateRangePreset("custom");
                        setDateRangeCustom(range);
                      }}
                      placeholder="Select dates"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <DownloadIcon className="size-4" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Export orders</DialogTitle>
                  <DialogDescription>
                    Download orders within a date range. Export respects your
                    current status, payment, and search filters.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Date range</label>
                    <DateRangePicker
                      value={exportDateRange}
                      onChange={setExportDateRange}
                      placeholder="Select start and end date"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Format</label>
                    <Select
                      value={exportFormat}
                      onValueChange={(v) =>
                        setExportFormat(v as "csv" | "xlsx")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx" disabled>
                          XLSX (coming soon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setExportOpen(false)}
                    disabled={exporting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={exporting || !exportDateRange?.from}
                  >
                    {exporting ? "Exporting…" : "Download"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-sm">
                {searchQuery ||
                statusFilter !== "all" ||
                paymentFilter !== "all" ||
                dateRangePreset !== "all"
                  ? "No orders match your filters."
                  : "No orders yet."}
              </p>
              {(searchQuery ||
                statusFilter !== "all" ||
                paymentFilter !== "all" ||
                dateRangePreset !== "all") ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                    setDateRangePreset("all");
                    setDateRangeCustom(undefined);
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/admin/orders/new">Create your first order</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHeader field="orderNumber" label="Order" />
                      <TableHead>Customer</TableHead>
                      <SortHeader field="total" label="Total" />
                      <SortHeader field="status" label="Status" />
                      <TableHead>Payment</TableHead>
                      <TableHead>Tracking</TableHead>
                      <SortHeader field="createdAt" label="Date" />
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
                            <span className="capitalize text-sm">
                              {order.paymentStatus}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.trackingNumber ? (
                            <a
                              href={`https://track.shiprocket.in/tracking/${order.trackingNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary inline-flex items-center gap-1 text-sm underline"
                            >
                              {order.trackingNumber}
                              <ExternalLinkIcon className="size-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
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

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {startItem}–{endItem} of {total} orders
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Rows per page
                    </span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => {
                        setPageSize(Number(v));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZES.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="text-muted-foreground min-w-[100px] text-center text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
