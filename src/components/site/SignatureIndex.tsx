import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { productImage } from "@/lib/product-image";
import type { ProductCardData } from "@/components/site/ProductCard";

/**
 * An editorial ledger of the house's signatures — numbered rows that reveal
 * the bottle on hover, the way a printed index sits opposite a plate.
 */
export function SignatureIndex({ items }: { items: ProductCardData[] }) {
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const shown = items.slice(0, 6);
  const current = shown[Math.min(active, shown.length - 1)];

  return (
    <section className="section container-px max-w-7xl mx-auto">
      <div className="border-b border-border pb-6 mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow eyebrow-brass">The index</span>
          <h2 className="font-display mt-3">Six signatures of the house</h2>
        </div>
        <Link to="/shop" className="text-sm link-underline">The full collection →</Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_0.75fr] gap-10 lg:gap-16 items-start">
        <ol className="divide-y divide-border border-y border-border">
          {shown.map((p, i) => (
            <li key={p.id}>
              <Link
                to="/shop/$slug"
                params={{ slug: p.slug }}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-4 sm:gap-8 py-6 hover:bg-[var(--sand)] transition-colors px-2 -mx-2"
              >
                <span className="num eyebrow text-[10px] w-6">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="font-display text-2xl sm:text-3xl block leading-tight">{p.name}</span>
                  <span className="text-xs text-muted-foreground block mt-1.5 truncate">
                    {p.inspired_by_brand
                      ? `In the spirit of ${p.inspired_by_brand}${p.inspired_by_product ? ` ${p.inspired_by_product}` : ""}`
                      : p.category_name || "Eau de parfum"}
                  </span>
                </span>
                <span className="num text-sm whitespace-nowrap">$41.50</span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="hidden lg:block sticky top-28">
          <div className="grain aspect-[4/5] border border-border bg-[var(--sand)] overflow-hidden">
            <img
              key={current.id}
              src={productImage(current.image_url)}
              alt={current.name}
              loading="lazy"
              className="w-full h-full object-cover animate-fade-up"
            />
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="font-display text-xl">{current.name}</span>
            <span className="eyebrow text-[10px]">50ml · Eau de parfum</span>
          </div>
        </div>
      </div>
    </section>
  );
}
