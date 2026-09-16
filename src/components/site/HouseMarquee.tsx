import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** A slow running index of the designer houses our formulas are composed in the spirit of. */
export function HouseMarquee() {
  const { data } = useQuery({
    queryKey: ["inspired-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("inspired_by_brand")
        .eq("is_active", true)
        .not("inspired_by_brand", "is", null);
      if (error) throw error;
      return Array.from(new Set((data || []).map((r: any) => r.inspired_by_brand).filter(Boolean))) as string[];
    },
  });

  const houses = (data && data.length ? data : ["Oud", "Amber", "Rose", "Musk", "Vetiver", "Saffron"]).slice(0, 14);
  const run = [...houses, ...houses];

  return (
    <section aria-label="Houses our blends are composed in the spirit of" className="ink-section border-y border-border overflow-hidden">
      <div className="py-4 whitespace-nowrap">
        <div className="marquee-track">
          {run.map((h, i) => (
            <span key={`${h}-${i}`} className="flex items-center gap-8 px-8 shrink-0">
              <span className="eyebrow text-[10px] text-background/70">In the spirit of</span>
              <span className="font-display text-xl sm:text-2xl">{h}</span>
              <span aria-hidden className="text-[var(--gold)]">◦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
