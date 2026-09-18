import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const all = (suggestions.data || []).filter((p: any) => !inCart.has(p.id));
  const viewedSet = new Set(viewed);
  const picks = [
    ...all.filter((p: any) => viewedSet.has(p.id)),
    ...all.filter((p: any) => !viewedSet.has(p.id)),
  ].slice(0, 2);
  if (picks.length === 0) return null;
  const personalised = brands.length > 0;

  return (
    <section className="border-y border-border py-5" aria-labelledby="complete-pair-title">
      <div className="mb-4">
          <span className="eyebrow text-[9px] text-[var(--amber-deep)]">Complete the pair</span>
          <h3 id="complete-pair-title" className="font-display text-xl mt-2">
            Add one more, save {BULK_DISCOUNT_PERCENT}%
          </h3>
          <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
            {personalised && <Sparkles className="w-3 h-3 text-[var(--amber-deep)]" />}
            {personalised
              ? `Chosen from ${brands.slice(0, 2).join(" and ")} fragrances you viewed.`
              : "Your best eligible two-bottle price updates automatically."}
          </p>
      </div>
      <div className="divide-y divide-border border-y border-border">
        {picks.map((p: any) => (
          <div key={p.id} className="py-3 flex items-center gap-3">
            <img
              src={productImage(p.image_url)}
              alt={p.name}
              className="h-16 w-14 object-cover bg-[var(--cream)]"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium leading-tight line-clamp-1">{p.name}</div>
              {p.inspired_by_brand && (
                <div className="text-[11px] text-muted-foreground mt-0.5">Inspired by {p.inspired_by_brand}</div>
              )}
              <div className="text-sm mt-1">{formatAUD(Number(p.price))}</div>
            </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  add(
                    {
                      product_id: p.id,
                      slug: p.slug,
                      name: p.name,
                      price: Number(p.price),
                      image_url: p.image_url,
                      stock: p.stock,
                      inspired_by_brand: p.inspired_by_brand ?? null,
                    },
                    1,
                  )
                }
                className="shrink-0 rounded-none"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Optional — continue with one bottle whenever you’re ready.</p>
    </section>
  );
}
