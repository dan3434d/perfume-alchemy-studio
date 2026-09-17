import { BadgePercent } from "lucide-react";
import { formatAUD } from "@/lib/format";
import { usePricingOffer } from "@/hooks/usePricingOffer";

export function OfferPrice({ basePrice, cartQuantity = 0, large = false }: { basePrice: number; cartQuantity?: number; large?: boolean }) {
  const offer = usePricingOffer(basePrice, cartQuantity);
  return (
    <div className="min-w-0" aria-live="polite">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={large ? "font-display text-3xl transition-colors" : "text-sm font-medium transition-colors"}>{formatAUD(offer.price)}</span>
        {offer.savings > 0 && <span className={large ? "text-lg text-muted-foreground line-through" : "text-[11px] text-muted-foreground line-through"}>{formatAUD(offer.referencePrice)}</span>}
        <span className="text-[11px] text-muted-foreground">· 50ml</span>
      </div>
      {offer.savings > 0 && (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-[var(--amber-deep)]">
          <BadgePercent className="h-3 w-3" aria-hidden="true" /> Your current offer · Save {formatAUD(offer.savings)}
        </div>
      )}
    </div>
  );
}