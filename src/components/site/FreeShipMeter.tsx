import { Truck, BadgePercent, Check } from "lucide-react";
import { formatAUD } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, BULK_DISCOUNT_PERCENT, BULK_DISCOUNT_MIN_QTY } from "@/lib/pricing";

export function FreeShipMeter({ amount, count }: { amount: number; count: number }) {
  const pct = Math.max(0, Math.min(100, (amount / FREE_SHIPPING_THRESHOLD) * 100));
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - amount);
  const bulkUnlocked = count >= BULK_DISCOUNT_MIN_QTY;

  return (
    <div className="rounded-2xl border border-border bg-[var(--cream)]/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Truck className="w-4 h-4 text-[var(--amber-deep)] shrink-0" />
        {remaining > 0 ? (
          <span>
            You&apos;re <span className="font-semibold">{formatAUD(remaining)}</span> away from{" "}
            <span className="font-semibold">free metro shipping</span>.
          </span>
        ) : (
          <span className="font-semibold text-[var(--amber-deep)]">Free metro shipping unlocked.</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-background overflow-hidden border border-border">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--gradient-gold)" }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs">
        {bulkUnlocked ? (
          <>
            <Check className="w-3.5 h-3.5 text-[var(--amber-deep)]" />
            <span className="font-semibold text-[var(--amber-deep)]">
              Buy {BULK_DISCOUNT_MIN_QTY}+ discount applied — {BULK_DISCOUNT_PERCENT}% off your bottles.
            </span>
          </>
        ) : (
          <>
            <BadgePercent className="w-3.5 h-3.5 text-[var(--amber-deep)]" />
            <span>
              Add {BULK_DISCOUNT_MIN_QTY - count} more bottle{BULK_DISCOUNT_MIN_QTY - count === 1 ? "" : "s"} to save{" "}
              {BULK_DISCOUNT_PERCENT}% instantly.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
