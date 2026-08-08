import { useEffect, useRef, useState } from "react";
import { Star, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";

type Review = {
  n: string;
  c: string;
  b: string;
  p: string;
  r: number;
  d: string;
};

const REVIEWS: Review[] = [
  { n: "Aaliyah K.", c: "Sydney, NSW", b: "Midnight Oud is intoxicating. Lasts the whole day on my skin — I get compliments constantly.", p: "Midnight Oud", r: 5, d: "2 weeks ago" },
  { n: "Daniel R.", c: "Melbourne, VIC", b: "Eros Elixir gets me compliments every single time I wear it. Worth every dollar.", p: "Eros Elixir", r: 5, d: "1 month ago" },
  { n: "Sara H.", c: "Brisbane, QLD", b: "Beautifully packaged and the scent is honestly luxurious. Better than my $300 bottle.", p: "Rose Amber", r: 5, d: "3 weeks ago" },
  { n: "James P.", c: "Perth, WA", b: "I bought two and the 15% came off automatically. Smells expensive, lasts forever.", p: "Imagination Storm", r: 5, d: "5 days ago" },
  { n: "Layla M.", c: "Adelaide, SA", b: "I've been buying from them for a year now. Quality is consistently incredible.", p: "Oud Royal", r: 5, d: "2 months ago" },
  { n: "Mark T.", c: "Gold Coast, QLD", b: "Honestly the best Tom Ford alternative I've tried. Projection is insane.", p: "Tobacco Noir", r: 4, d: "1 week ago" },
  { n: "Priya N.", c: "Canberra, ACT", b: "Shipped from Sydney in 2 days. Bottle is gorgeous, scent is even better.", p: "Velvet Rose", r: 5, d: "4 days ago" },
  { n: "Hassan A.", c: "Newcastle, NSW", b: "Finally — an Arabian perfume house that ships to Australia fast. Will buy again.", p: "Amber Wood", r: 5, d: "3 weeks ago" },
];

const BREAKDOWN = [
  { s: 5, pct: 92 },
  { s: 4, pct: 6 },
  { s: 3, pct: 1 },
  { s: 2, pct: 1 },
  { s: 1, pct: 0 },
];

function Stars({ n, className = "w-3.5 h-3.5" }: { n: number; className?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${className} ${i < n ? "fill-foreground text-foreground" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.9, 420), behavior: "smooth" });
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + Math.min(el.clientWidth * 0.9, 420), behavior: "smooth" });
    }, 5000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section className="border-t border-border">
      <div className="section container-px max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[320px_1fr] gap-10 lg:gap-14 items-start">
          {/* Rating summary — the proof */}
          <div className="lg:sticky lg:top-24">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Customer reviews</span>
            <div className="flex items-end gap-3 mt-3">
              <span className="font-display text-5xl leading-none">4.9</span>
              <div className="pb-1">
                <Stars n={5} className="w-4 h-4" />
                <div className="text-xs text-muted-foreground mt-1">Based on 2,431 verified orders</div>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              {BREAKDOWN.map((b) => (
                <div key={b.s} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-8 shrink-0">{b.s} ★</span>
                  <div className="h-1.5 flex-1 bg-secondary rounded-sm overflow-hidden">
                    <div className="h-full bg-foreground" style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{b.pct}%</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="border border-border rounded-sm py-3">
                <div className="font-semibold">97%</div>
                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">would buy again</div>
              </div>
              <div className="border border-border rounded-sm py-3">
                <div className="font-semibold">8–12h</div>
                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">reported wear time</div>
              </div>
            </div>

            <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <BadgeCheck className="w-3.5 h-3.5 text-foreground" />
              Every review is from a confirmed order.
            </p>
          </div>

          {/* Review rail */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl">What customers say</h2>
              <div className="hidden sm:flex gap-2">
                <button
                  onClick={() => scrollBy(-1)}
                  aria-label="Previous reviews"
                  className="w-9 h-9 grid place-items-center border border-border rounded-sm hover:bg-foreground hover:text-background transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollBy(1)}
                  aria-label="Next reviews"
                  className="w-9 h-9 grid place-items-center border border-border rounded-sm hover:bg-foreground hover:text-background transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={trackRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {REVIEWS.map((r) => (
                <article
                  key={r.n}
                  className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[31.5%] border border-border rounded-sm p-5 bg-background flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <Stars n={r.r} />
                    <span className="text-[11px] text-muted-foreground">{r.d}</span>
                  </div>
                  <p className="text-sm leading-relaxed mt-3 flex-1">"{r.b}"</p>
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {r.n}
                      <BadgeCheck className="w-3.5 h-3.5 text-foreground" />
                      <span className="text-muted-foreground font-normal">Verified buyer</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {r.c} · purchased {r.p}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
