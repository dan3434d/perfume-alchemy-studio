import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { productImage } from "@/lib/product-image";
import { Truck, Lock, Sparkles, MessageCircle, ArrowRight, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Abdulrahman Perfumes — Signature scents, made to be remembered" },
      { name: "description", content: "Premium oud, amber and modern fragrances. Fast Australian shipping." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,price,image_url,rating,stock,categories(name)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return (data || []).map((p: any) => ({ ...p, category_name: p.categories?.name })) as ProductCardData[];
    },
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-warm)" }} />
        <div className="container-px max-w-7xl mx-auto py-16 sm:py-24 lg:py-32 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">
              <Sparkles className="w-3.5 h-3.5" /> New season · Oud collection
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
              Signature scents,<br />
              <span className="italic text-[var(--amber-deep)]">made to be remembered.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Modern fragrance built around oud, amber and warm woods. Designed in the spirit of Dubai-style perfumery — made for every day.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/shop" search={{ category: "oud-perfumes" }} className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3 text-sm font-semibold hover:bg-background/60">
                Explore Oud Collection
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-[var(--gold)] text-[var(--gold)]" /> 4.9 average rating</div>
              <div>Free AU shipping over $80</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full blur-3xl opacity-50" style={{ background: "var(--gradient-gold)" }} />
            <img
              src={productImage(null)}
              alt="Signature perfume bottle"
              className="mx-auto w-full max-w-md rounded-2xl shadow-[var(--shadow-elegant)]"
              width={1024}
              height={1024}
            />
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Bestsellers</span>
            <h2 className="font-display text-3xl sm:text-4xl mt-2">Featured fragrances</h2>
          </div>
          <Link to="/shop" className="hidden sm:inline-flex text-sm font-medium hover:text-[var(--amber-deep)]">
            View all →
          </Link>
        </div>
        {featured.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.data?.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* CATEGORIES */}
      <section className="section bg-[var(--cream)]/40 border-y border-border">
        <div className="container-px max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Browse</span>
            <h2 className="font-display text-3xl sm:text-4xl mt-2">Scent families</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.data?.slice(0, 8).map((c) => (
              <Link key={c.id} to="/shop" search={{ category: c.slug }} className="card-elevated p-6 text-center">
                <div className="font-display text-lg">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Shop now →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { i: Truck, t: "Fast AU shipping", d: "Dispatched within 24 hours from Australia." },
            { i: Lock, t: "Secure checkout", d: "Encrypted payments, your data stays private." },
            { i: Sparkles, t: "Premium blends", d: "Long-lasting oud, amber and modern compositions." },
            { i: MessageCircle, t: "Support available", d: "Real humans at support@abdulrahman.store." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="p-6 rounded-2xl border border-border">
              <Icon className="w-6 h-6 text-[var(--amber-deep)]" />
              <h3 className="font-semibold mt-3">{t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section bg-[var(--cream)]/40 border-y border-border">
        <div className="container-px max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Loved by</span>
            <h2 className="font-display text-3xl sm:text-4xl mt-2">What customers say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "Aaliyah K.", c: "Sydney", b: "Midnight Oud is intoxicating. Lasts the whole day on my skin." },
              { n: "Daniel R.", c: "Melbourne", b: "Eros Elixir gets me compliments every single time I wear it." },
              { n: "Sara H.", c: "Brisbane", b: "Beautifully packaged and the scent is honestly luxurious." },
            ].map((r) => (
              <div key={r.n} className="card-elevated p-6">
                <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-[var(--gold)] text-[var(--gold)]" />)}</div>
                <p className="text-sm leading-relaxed">"{r.b}"</p>
                <div className="mt-4 text-xs text-muted-foreground">{r.n} · {r.c}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section container-px max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl">Join the inner circle</h2>
        <p className="text-muted-foreground mt-3">Early access to new fragrances and members-only offers.</p>
        <form className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto" onSubmit={(e) => { e.preventDefault(); }}>
          <input type="email" required placeholder="your@email.com" className="flex-1 rounded-full px-5 py-3 bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
          <button className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">Subscribe</button>
        </form>
      </section>
    </>
  );
}
