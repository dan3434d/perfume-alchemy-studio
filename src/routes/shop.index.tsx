import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { Search } from "lucide-react";

type ShopSearch = { category?: string; sort?: string; q?: string; brand?: string };

export const Route = createFileRoute("/shop/")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    brand: typeof s.brand === "string" ? s.brand : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop all perfumes — Abdulrahman Perfumes" },
      { name: "description", content: "Browse the complete Abdulrahman collection — designer-inspired oud, amber, fresh and floral fragrances. Every 50ml eau de parfum is $41.50. Buy 2, save 15%." },
      { property: "og:title", content: "Shop all perfumes — Abdulrahman Perfumes" },
      { property: "og:description", content: "Designer-inspired UAE-blended fragrances. Filter by brand, category and price. Free metro shipping over $50." },
      { property: "og:url", content: "https://www.abdulrahmanperfumes.com.au/shop" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.abdulrahmanperfumes.com.au/shop" }],
  }),
  component: Shop,
});

function Shop() {
  const { category, sort, q, brand } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q ?? "");

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("display_order");
      return data || [];
    },
  });

  const products = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,image_url,rating,stock,category_id,inspired_by_brand,inspired_by_product,categories(name,slug)")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p, category_name: p.categories?.name, category_slug: p.categories?.slug,
      })) as (ProductCardData & { category_slug?: string })[];
    },
  });

  const brands = useMemo(() => {
    const set = new Set<string>();
    (products.data ?? []).forEach((p) => p.inspired_by_brand && set.add(p.inspired_by_brand));
    return Array.from(set).sort();
  }, [products.data]);

  const filtered = useMemo(() => {
    let list = products.data ?? [];
    if (category) list = list.filter((p) => p.category_slug === category);
    if (brand) list = list.filter((p) => p.inspired_by_brand === brand);
    if (q) {
      const term = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.inspired_by_brand ?? "").toLowerCase().includes(term) ||
          (p.inspired_by_product ?? "").toLowerCase().includes(term),
      );
    }
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "name": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return list;
  }, [products.data, category, brand, q, sort]);

  return (
    <div className="container-px max-w-7xl mx-auto py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Shop all perfumes</h1>
        <p className="text-muted-foreground mt-2">
          {filtered.length} fragrance{filtered.length === 1 ? "" : "s"} — every 50ml just $41.50 · Buy 2, save 15%.
        </p>
      </div>

      {/* Brand chips */}
      {brands.length > 0 && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)] mb-2">Inspired by</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate({ search: (p: ShopSearch) => ({ ...p, brand: undefined }) })}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${!brand ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              All brands
            </button>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => navigate({ search: (p: ShopSearch) => ({ ...p, brand: brand === b ? undefined : b }) })}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${brand === b ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <form
          className="relative flex-1"
          onSubmit={(e) => { e.preventDefault(); navigate({ search: (p: ShopSearch) => ({ ...p, q: search || undefined }) }); }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or designer brand (e.g. Tom Ford, Dior)…"
            className="w-full rounded-full pl-11 pr-4 py-2.5 bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <select
            value={category ?? ""}
            onChange={(e) => navigate({ search: (p: ShopSearch) => ({ ...p, category: e.target.value || undefined }) })}
            className="rounded-full px-4 py-2.5 bg-secondary border border-border text-sm"
          >
            <option value="">All categories</option>
            {categories.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select
            value={sort ?? ""}
            onChange={(e) => navigate({ search: (p: ShopSearch) => ({ ...p, sort: e.target.value || undefined }) })}
            className="rounded-full px-4 py-2.5 bg-secondary border border-border text-sm"
          >
            <option value="">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {products.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products found.</p>
          <Link to="/shop" className="inline-block mt-4 text-[var(--amber-deep)] hover:underline">Clear filters</Link>
        </div>
      ) : (
        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="sr-only">Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
