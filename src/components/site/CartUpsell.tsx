import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { BULK_DISCOUNT_PERCENT } from "@/lib/pricing";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function CartUpsell() {
  const { lines, add } = useCart();
  const inCart = new Set(lines.map((l) => l.product_id));

  const picks = useQuery({
    queryKey: ["products", "upsell"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,image_url,stock,inspired_by_brand,inspired_by_product")
        .eq("is_active", true)
        .limit(12);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = (picks.data ?? []).filter((p: any) => !inCart.has(p.id)).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[var(--amber-deep)]" />
        <h2 className="font-display text-xl">Pairs well with your cart</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Add a second bottle and {BULK_DISCOUNT_PERCENT}% comes off automatically.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mt-5">
        {items.map((p: any) => (
          <div key={p.id} className="card-elevated p-3 flex gap-3 items-center">
            <img
              src={productImage(p.image_url)}
              alt={p.name}
              loading="lazy"
              className="w-16 h-16 rounded-xl object-cover bg-[var(--cream)] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{p.name}</div>
              {p.inspired_by_brand && (
                <div className="text-[11px] text-muted-foreground truncate">
                  Inspired by {p.inspired_by_brand}
                  {p.inspired_by_product ? ` ${p.inspired_by_product}` : ""}
                </div>
              )}
              <div className="text-sm font-semibold mt-0.5">{formatAUD(Number(p.price))}</div>
            </div>
            <button
              type="button"
              aria-label={`Add ${p.name} to cart`}
              onClick={() => {
                add({
                  product_id: p.id,
                  slug: p.slug,
                  name: p.name,
                  price: Number(p.price),
                  image_url: p.image_url,
                  stock: p.stock,
                  inspired_by_brand: p.inspired_by_brand ?? null,
                  inspired_by_product: p.inspired_by_product ?? null,
                });
                toast.success(`${p.name} added — bundle discount applied at 2+`);
              }}
              className="btn-gold shrink-0 rounded-full w-9 h-9 grid place-items-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
