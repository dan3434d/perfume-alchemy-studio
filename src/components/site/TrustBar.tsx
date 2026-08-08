import { Truck, ShieldCheck, RotateCcw, Star, Sparkles } from "lucide-react";

const ITEMS = [
  { i: Truck, t: "Free AU shipping over $50", d: "Dispatched in 24h from Sydney" },
  { i: Star, t: "4.9 / 5 from 2,400+ buyers", d: "Real reviews, repeat customers" },
  { i: RotateCcw, t: "30-day returns", d: "Unopened bottles, no questions" },
  { i: ShieldCheck, t: "Secure encrypted checkout", d: "Card, Apple Pay & Google Pay" },
];

export function TrustBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-y border-border bg-[var(--cream)]/50">
      <div className="container-px max-w-7xl mx-auto py-4 sm:py-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {ITEMS.map(({ i: Icon, t, d }) => (
          <div key={t} className="flex items-start gap-2.5 min-w-0">
            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[var(--amber-deep)]" />
            <div className="min-w-0">
              <div className="text-[12px] sm:text-sm font-semibold leading-tight">{t}</div>
              {!compact && <div className="text-[11px] text-muted-foreground truncate">{d}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ValueStrip() {
  return (
    <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--amber-deep)]">
        <Sparkles className="w-3.5 h-3.5" /> Designer character, $41.50 not $99+
      </span>
      <span>50ml eau de parfum</span>
      <span>8–12h wear</span>
    </div>
  );
}
