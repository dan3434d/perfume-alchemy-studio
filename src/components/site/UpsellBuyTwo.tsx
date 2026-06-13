import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { BadgePercent, Plus, Sparkles } from "lucide-react";
import { BULK_DISCOUNT_PERCENT } from "@/lib/pricing";
import { topBrands, viewedIds } from "@/hooks/useBrowsingHistory";

export function UpsellBuyTwo() {
  const { lines, count, add } = useCart();
  const inCart = new Set(lines.map((l) => l.product_id));
  const brands = topBrands(3);
  const viewed = viewedIds();

  const suggestions = useQuery({
    queryKey: ["upsell-products", brands.join(","), viewed.slice(0, 5).join(",")],
    queryFn: async () => {
      // Prefer products from brands the shopper has actually browsed.
      if (brands.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("id,name,slug,price,image_url,stock,inspired_by_brand")
          .eq("is_active", true)
          .in("inspired_by_brand", brands)
          .order("rating", { ascending: false })
          .limit(12);
        if (data && data.length > 0) return data;
      }
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,image_url,stock,inspired_by_brand")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  if (count !== 1) return null;
  const picks = (suggestions.data || []).filter((p: any) => !inCart.has(p.id)).slice(0, 3);
  if (picks.length === 0) return null;

  return (
    <div className="card-elevated p-5 sm:p-6 border-2 border-[var(--gold)]/60 bg-[var(--gold)]/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full grid place-items-center text-white shrink-0" style={{ background: "var(--gradient-gold)" }}>
          <BadgePercent className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg leading-tight">
            Add 1 more to unlock <span className="text-[var(--amber-deep)]">{BULK_DISCOUNT_PERCENT}% off</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Buy 2 bottles and save automatically — your favourites picked for you below.
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {picks.map((p: any) => (
          <div key={p.id} className="rounded-xl border border-border bg-background p-3 flex flex-col">
            <img
              src={productImage(p.image_url)}
              alt={p.name}
              className="w-full aspect-square object-cover rounded-lg bg-[var(--cream)]"
              loading="lazy"
            />
            <div className="mt-2.5 flex-1">
              <div className="text-sm font-medium leading-tight line-clamp-1">{p.name}</div>
              {p.inspired_by_brand && (
                <div className="text-[11px] text-muted-foreground mt-0.5">Inspired by {p.inspired_by_brand}</div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-sm font-semibold">{formatAUD(Number(p.price))}</span>
              <button
                type="button"
                onClick={() =>
                  add(
                    {
                      product_id: p.id,
                      slug: p.slug,
                      name: p.name,
                      price: Number(p.price),
                      image_url: p.image_url,
                      stock: p.stock,
                    },
                    1,
                  )
                }
                className="btn-gold inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
