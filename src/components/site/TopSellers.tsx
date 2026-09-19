import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";

export function TopSellers({
  title = "Best sellers",
  eyebrow = "Most loved this month",
  limit = 4,
  excludeId,
}: {
  title?: string;
  eyebrow?: string;
  limit?: number;
  excludeId?: string;
}) {
  const q = useQuery({
    queryKey: ["products", "top-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,slug,price,compare_at_price,image_url,rating,review_count,stock,gender,is_featured,inspired_by_brand,inspired_by_product,categories(name)",
        )
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("review_count", { ascending: false, nullsFirst: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(12);
      if (error) throw error;
      return (data || []).map((p: any) => ({ ...p, category_name: p.categories?.name })) as ProductCardData[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = (q.data ?? []).filter((p) => p.id !== excludeId).slice(0, limit);
  if (q.isLoading) {
    return (
      <section className="container-px max-w-7xl mx-auto py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border" aria-labelledby="top-sellers-heading">
      <div className="container-px max-w-7xl mx-auto py-14 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="eyebrow eyebrow-brass">{eyebrow}</span>
            <h2 id="top-sellers-heading" className="font-display mt-3 text-3xl">{title}</h2>
          </div>
          <Link to="/shop" className="link-underline text-[13px] uppercase tracking-[0.12em]">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((p, i) => (
            <div key={p.id} className="relative">
              <span className="absolute z-10 top-0 left-0 bg-[var(--amber-deep)] text-background text-[10px] uppercase tracking-[0.16em] px-2.5 py-1">
                #{i + 1}
              </span>
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
