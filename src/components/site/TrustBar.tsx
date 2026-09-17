import { Sparkles } from "lucide-react";

const ITEMS = [
  { t: "Free AU shipping over $50", d: "Sent within 24 hours from Sydney" },
  { t: "4.9 / 5 from 2,400+ people", d: "Most of them come back" },
  { t: "30 days to change your mind", d: "Unopened bottles, no questions" },
  { t: "Every bottle 50ml", d: "Current offers shown before checkout" },
];

export function TrustBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-y border-border bg-background">
      <div className="container-px max-w-7xl mx-auto py-6 grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-8">
        {ITEMS.map((item, i) => (
          <div key={item.t} className={`min-w-0 ${i > 0 ? "lg:border-l lg:border-border lg:pl-8" : ""}`}>
            <div className="text-[12px] sm:text-[13px] font-medium leading-snug">{item.t}</div>
            {!compact && <div className="text-[11px] text-muted-foreground mt-1">{item.d}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ValueStrip() {
  return (
    <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 font-medium text-[var(--amber-deep)]">
        <Sparkles className="w-3.5 h-3.5" /> Current offers shown clearly
      </span>
      <span>50ml eau de parfum</span>
      <span>8–12h wear</span>
    </div>
  );
}
