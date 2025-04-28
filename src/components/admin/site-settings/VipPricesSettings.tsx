
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SiteSettingsJson = {
  vip_prices?: {
    plan_1m?: number;
    plan_6m?: number;
    plan_1y?: number;
  };
  [key: string]: any;
};

const DEFAULT_PRICES = { plan_1m: 4.99, plan_6m: 24.95, plan_1y: 35.99 };

export const VipPricesSettings = () => {
  const [prices, setPrices] = useState<{
    plan_1m: number | "";
    plan_6m: number | "";
    plan_1y: number | "";
  }>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      // Mock fetching prices
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setPrices(DEFAULT_PRICES);
    } catch {
      toast.error("Failed to load VIP prices");
    } finally {
      setLoading(false);
    }
  };

  const onPriceChange = (key: keyof typeof DEFAULT_PRICES, val: string) => {
    // Only valid positive numbers
    const num = val === "" ? "" : Number(val);
    if (val !== "" && (isNaN(Number(num)) || Number(num) < 0)) return;
    setPrices(prev => ({ ...prev, [key]: num === "" ? "" : num }));
  };

  const savePrices = async () => {
    // Ensure all prices are filled, fallback to default if blank
    const toSave = {
      plan_1m: typeof prices.plan_1m === "number" && prices.plan_1m >= 0 ? prices.plan_1m : DEFAULT_PRICES.plan_1m,
      plan_6m: typeof prices.plan_6m === "number" && prices.plan_6m >= 0 ? prices.plan_6m : DEFAULT_PRICES.plan_6m,
      plan_1y: typeof prices.plan_1y === "number" && prices.plan_1y >= 0 ? prices.plan_1y : DEFAULT_PRICES.plan_1y,
    };
    try {
      // Mock saving prices
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("VIP prices saved");
      setPrices(toSave);
    } catch {
      toast.error("Failed to save VIP prices");
    }
  };

  return (
    <div className="max-w-md space-y-6 p-4">
      <h3 className="text-lg font-semibold mb-3">VIP Prices</h3>
      <div className="space-y-4">
        <label className="block space-y-1">
          <span>1 Month Price ($)</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={prices.plan_1m}
            onChange={e => onPriceChange("plan_1m", e.target.value)}
            disabled={loading}
          />
        </label>
        <label className="block space-y-1">
          <span>6 Months Price ($)</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={prices.plan_6m}
            onChange={e => onPriceChange("plan_6m", e.target.value)}
            disabled={loading}
          />
        </label>
        <label className="block space-y-1">
          <span>Yearly Price ($)</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={prices.plan_1y}
            onChange={e => onPriceChange("plan_1y", e.target.value)}
            disabled={loading}
          />
        </label>
      </div>
      <Button onClick={savePrices} disabled={loading}>Save VIP Prices</Button>
    </div>
  );
};
