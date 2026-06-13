import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const REVIEWS = [
  { n: "Aaliyah K.", c: "Sydney", b: "Midnight Oud is intoxicating. Lasts the whole day on my skin — I get compliments constantly.", p: "Midnight Oud" },
  { n: "Daniel R.", c: "Melbourne", b: "Eros Elixir gets me compliments every single time I wear it. Worth every dollar.", p: "Eros Elixir" },
  { n: "Sara H.", c: "Brisbane", b: "Beautifully packaged and the scent is honestly luxurious. Better than my $300 bottle.", p: "Rose Amber" },
  { n: "James P.", c: "Perth", b: "I bought two and got the discount automatically. Smells expensive, lasts forever.", p: "Imagination Storm" },
  { n: "Layla M.", c: "Adelaide", b: "I've been buying from them for a year now. Quality is consistently incredible.", p: "Oud Royal" },
  { n: "Mark T.", c: "Gold Coast", b: "Honestly the best Tom Ford alternative I've tried. Projection is insane.", p: "Tobacco Noir" },
  { n: "Priya N.", c: "Canberra", b: "Shipped from Sydney in 2 days. Bottle is gorgeous, scent is even better.", p: "Velvet Rose" },
  { n: "Hassan A.", c: "Newcastle", b: "Finally — an Arabian perfume house that ships to Australia fast. Will buy again.", p: "Amber Wood" },
];

export function ReviewsCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % REVIEWS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="section container-px max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Loved by</span>
        <h2 className="font-display text-3xl sm:text-4xl mt-2">What customers say</h2>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-[var(--gold)] text-[var(--gold)]" />)}</div>
          <span>4.9 / 5 · 2,400+ reviews</span>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {REVIEWS.map((r) => (
            <div key={r.n} className="min-w-full grid md:grid-cols-3 gap-5 px-1">
              {[0, 1, 2].map((off) => {
                const it = REVIEWS[(REVIEWS.indexOf(r) + off) % REVIEWS.length];
                return (
                  <div key={off} className="card-elevated p-6 rounded-2xl border border-border bg-background">
                    <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-[var(--gold)] text-[var(--gold)]" />)}</div>
                    <p className="text-sm leading-relaxed">"{it.b}"</p>
                    <div className="mt-4 text-xs text-muted-foreground flex items-center justify-between">
                      <span>{it.n} · {it.c}</span>
                      <span className="text-[var(--amber-deep)] font-medium">{it.p}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 mt-6">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Review ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-[var(--amber-deep)]" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
