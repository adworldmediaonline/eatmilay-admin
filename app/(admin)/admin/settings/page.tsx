"use client";

import { useState, useEffect } from "react";
import {
  getCouponSettings,
  updateCouponSettings,
  getShippingSettings,
  updateShippingSettings,
  type CouponBehaviorSettings,
  type ShippingSettings,
} from "@/lib/api";
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
import { Switch } from "@/components/ui/switch";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CouponBehaviorSettings>({
    autoApply: false,
    autoApplyStrategy: "best_savings",
    showToastOnApply: true,
  });
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: null,
  });
  const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    Promise.all([getCouponSettings(), getShippingSettings()])
      .then(([coupon, shipping]) => {
        setSettings(coupon);
        setShippingSettings(shipping);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateCouponSettings(settings);
      setSettings(updated);
      toast.success("Coupon settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">Admin Settings</h2>
            <p className="text-muted-foreground text-sm">
              System and application settings
            </p>
          </div>
          <div className="flex items-center justify-center px-4 py-12 lg:px-6">
            <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-lg font-semibold">Admin Settings</h2>
          <p className="text-muted-foreground text-sm">
            System and application settings
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold">Coupon behavior</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Control how coupons are applied on the storefront.
            </p>

            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="autoApply">Auto-apply best coupon</Label>
                  <p className="text-muted-foreground text-xs">
                    When enabled, automatically applies the best qualifying coupon
                    when items are added to cart or at checkout.
                  </p>
                </div>
                <Switch
                  id="autoApply"
                  checked={settings.autoApply}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, autoApply: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoApplyStrategy">
                  When multiple coupons apply
                </Label>
                <Select
                  value={settings.autoApplyStrategy}
                  onValueChange={(v) =>
                    setSettings((s) => ({
                      ...s,
                      autoApplyStrategy: v as CouponBehaviorSettings["autoApplyStrategy"],
                    }))
                  }
                >
                  <SelectTrigger id="autoApplyStrategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_savings">Best savings</SelectItem>
                    <SelectItem value="first_created">First created</SelectItem>
                    <SelectItem value="highest_percentage">
                      Highest percentage
                    </SelectItem>
                    <SelectItem value="customer_choice">
                      Customer choice (no auto-apply)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Best savings = highest discount amount. Customer choice disables
                  auto-apply.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="showToastOnApply">Show toast when applied</Label>
                  <p className="text-muted-foreground text-xs">
                    Display a notification when a coupon is auto-applied.
                  </p>
                </div>
                <Switch
                  id="showToastOnApply"
                  checked={settings.showToastOnApply}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, showToastOnApply: checked }))
                  }
                />
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold">Shipping</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Free shipping threshold. When order subtotal meets this amount,
              shipping is free.
            </p>

            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">
                Free shipping threshold (₹)
              </Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                min="0"
                step="1"
                className="max-w-xs"
                placeholder="Leave empty to disable"
                value={
                  shippingSettings.freeShippingThreshold ?? ""
                }
                onChange={(e) =>
                  setShippingSettings((s) => ({
                    ...s,
                    freeShippingThreshold: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
              />
              <p className="text-muted-foreground text-xs">
                Leave empty to disable. Subtotal must meet this amount for free
                shipping.
              </p>
            </div>

            <div className="mt-6">
              <Button
                onClick={async () => {
                  setSavingShipping(true);
                  try {
                    const updated = await updateShippingSettings(shippingSettings);
                    setShippingSettings(updated);
                    toast.success("Shipping settings saved");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Failed to save"
                    );
                  } finally {
                    setSavingShipping(false);
                  }
                }}
                disabled={savingShipping}
              >
                {savingShipping ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
