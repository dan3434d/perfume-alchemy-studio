import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { Search } from "lucide-react";

type ShopSearch = { category?: string; sort?: string; q?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Shop — Abdulrahman Perfumes" }, { name: "description", content: "Browse our complete perfume collection." }] }),
  component: Shop,
});

function Shop() {
  const { category, sort, q } = Route.useSearch();
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
        .select("id,name,slug,price,image_url,rating,stock,category_id,categories(name,slug)")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p, category_name: p.categories?.name, category_slug: p.categories?.slug,
      })) as (ProductCardData & { category_slug?: string })[];
    },
  });

  const filtered = useMemo(() => {
    let list = products.data ?? [];
    if (category) list = list.filter((p) => p.category_slug === category);
    if (q) {
      const term = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term));
    }
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "name": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return list;
  }, [products.data, category, q, sort]);

  return (
    <div className="container-px max-w-7xl mx-auto py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Shop all perfumes</h1>
        <p className="text-muted-foreground mt-2">{filtered.length} fragrance{filtered.length === 1 ? "" : "s"} available</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <form
          className="relative flex-1"
          onSubmit={(e) => { e.preventDefault(); navigate({ search: (p) => ({ ...p, q: search || undefined }) }); }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fragrances…"
            className="w-full rounded-full pl-11 pr-4 py-2.5 bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <select
            value={category ?? ""}
            onChange={(e) => navigate({ search: (p) => ({ ...p, category: e.target.value || undefined }) })}
            className="rounded-full px-4 py-2.5 bg-secondary border border-border text-sm"
          >
            <option value="">All categories</option>
            {categories.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select
            value={sort ?? ""}
            onChange={(e) => navigate({ search: (p) => ({ ...p, sort: e.target.value || undefined }) })}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
