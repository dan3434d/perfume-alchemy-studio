import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { Truck, Lock, Sparkles, MessageCircle, ArrowRight, Star, MapPin, Droplets, Award } from "lucide-react";
import heroImg from "@/assets/hero-perfume.jpg";
import blendingImg from "@/assets/craft-blending.jpg";
import ingredientsImg from "@/assets/craft-ingredients.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Abdulrahman Perfumes — Designer-inspired scents from $41.50" },
      { name: "description", content: "Premium designer-inspired perfumes blended in the UAE, packed in Sydney. Every 50ml bottle just $41.50 — buy 2, save 15%." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = useQuery({
    queryKey: ["products", "featured-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,image_url,rating,stock,inspired_by_brand,inspired_by_product,categories(name)")
        .eq("is_active", true)
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

  const brands = useMemo(() => {
    const set = new Map<string, string>();
    (featured.data ?? []).forEach((p) => p.inspired_by_brand && set.set(p.inspired_by_brand, p.inspired_by_brand));
    const all = ["Tom Ford", "Dior", "Louis Vuitton", "Creed", "Versace", "YSL", "Gucci", "Hermès", "MFK", "Paco Rabanne", "Arabian Oud", "Montana", "Emarat"];
    all.forEach((b) => set.set(b, b));
    return Array.from(set.keys());
  }, [featured.data]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-warm)" }} />
        <div className="container-px max-w-7xl mx-auto py-16 sm:py-24 lg:py-32 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">
              <Sparkles className="w-3.5 h-3.5" /> Designer-inspired · Made to last
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
              From Souk Madinat Jumeirah,<br />
              <span className="italic text-[var(--amber-deep)]">to your home.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Premium Arabian perfumery, reimagined for the modern wardrobe. Blended with UAE oils, packed in Sydney — every 50ml bottle just <span className="font-semibold text-foreground">$41.50</span>. <span className="text-[var(--amber-deep)] font-semibold">Buy 2, save 15%</span> — applied automatically.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/shop" search={{ category: "oud-perfumes" }} className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3 text-sm font-semibold hover:bg-background/60">
                Explore Oud Collection
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-[var(--gold)] text-[var(--gold)]" /> 4.9 average rating</div>
              <div>Free metro AU shipping over $50</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full blur-3xl opacity-50" style={{ background: "var(--gradient-gold)" }} />
            <img
              src={heroImg}
              alt="Abdulrahman signature perfume bottle on dark marble with oud wood and rose petals"
              className="mx-auto w-full max-w-md rounded-2xl shadow-[var(--shadow-elegant)] aspect-square object-cover"
              width={1024}
              height={1024}
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* SHOP BY DESIGNER BRAND */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Find your match</span>
          <h2 className="font-display text-3xl sm:text-4xl mt-2">Shop by designer inspiration</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Love a designer scent? Discover its Abdulrahman counterpart — same character, a fraction of the price.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {brands.map((b) => (
            <Link
              key={b}
              to="/shop"
              search={{ brand: b }}
              className="text-sm px-4 py-2 rounded-full border border-border bg-background hover:bg-foreground hover:text-background transition"
            >
              {b} inspired
            </Link>
          ))}
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

      {/* ABOUT — Why Abdulrahman, now with imagery */}
      <section className="section bg-[var(--cream)]/40 border-y border-border">
        <div className="container-px max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4">
              <img src={ingredientsImg} alt="Oud wood, dried roses and vanilla" loading="lazy" width={1024} height={1024} className="rounded-2xl shadow-[var(--shadow-elegant)] aspect-square object-cover" />
              <img src={blendingImg} alt="Perfumer hand-blending fragrance oils" loading="lazy" width={1024} height={1024} className="rounded-2xl shadow-[var(--shadow-elegant)] aspect-square object-cover mt-8" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Why Abdulrahman Perfumes</span>
              <h2 className="font-display text-3xl sm:text-4xl mt-2">The essence of Arabian perfumery, made for you.</h2>
              <p className="text-muted-foreground mt-5 leading-relaxed">
                We blend traditional Arabian scents with modern elegance — long-lasting oud, warm amber, and modern compositions inspired by the world's most-loved designers.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { i: Award, t: "Made to last", d: "Designer-level longevity and projection in every 50ml bottle." },
                  { i: Droplets, t: "UAE-blended oils", d: "Composed by perfumers from across the Gulf, including Dubai." },
                  { i: MapPin, t: "Packed in Sydney", d: "Dispatched within 24 hours, free metro AU shipping over $50." },
                ].map(({ i: Icon, t, d }) => (
                  <div key={t} className="flex gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full grid place-items-center bg-[var(--amber-deep)]/10 text-[var(--amber-deep)]"><Icon className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold">{t}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/about" className="inline-flex items-center gap-2 mt-7 text-sm font-semibold text-[var(--amber-deep)] hover:underline">
                Read our full story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Browse</span>
          <h2 className="font-display text-3xl sm:text-4xl mt-2">Scent families</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.data?.slice(0, 8).map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} className="card-elevated p-6 text-center rounded-2xl border border-border hover:border-[var(--amber-deep)]/40 hover:shadow-[var(--shadow-elegant)] transition">
              <div className="font-display text-lg">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-1">Shop now →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="section bg-[var(--cream)]/40 border-y border-border">
        <div className="container-px max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { i: Truck, t: "Fast AU shipping", d: "Dispatched within 24 hours from Sydney." },
              { i: Lock, t: "Secure checkout", d: "Encrypted payments, your data stays private." },
              { i: Sparkles, t: "Premium blends", d: "Long-lasting oud, amber and modern compositions." },
              { i: MessageCircle, t: "Real human support", d: "Email support@abdulrahman.store any time." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="p-6 rounded-2xl border border-border bg-background">
                <Icon className="w-6 h-6 text-[var(--amber-deep)]" />
                <h3 className="font-semibold mt-3">{t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SLIDING TESTIMONIALS */}
      <ReviewsCarousel />

      {/* SOCIAL FEED */}
      <SocialFeed />

      {/* SCENT DISCOVERY CTA */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "var(--gradient-warm)" }}>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">New</span>
          <h2 className="font-display text-3xl sm:text-4xl mt-2">Not sure where to start?</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Take our 4-question scent quiz and we'll match you with your perfect fragrance from over 40 UAE-blended scents.
          </p>
          <Link to="/scent-discovery" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold mt-6">
            Take the scent quiz <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* DETAILS / UAE-MADE */}
      <section className="section bg-[var(--cream)]/40 border-y border-border">
        <div className="container-px max-w-5xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">The Abdulrahman difference</span>
          <h2 className="font-display text-3xl sm:text-4xl mt-2">It's the details that count at Abdulrahman Perfumes.</h2>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed max-w-2xl mx-auto">
            We're here for you — always. Our UAE-made fragrances are what set us apart.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section container-px max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">FAQ</span>
          <h2 className="font-display text-3xl sm:text-4xl mt-2">People also asked</h2>
          <p className="text-muted-foreground mt-3">Here are some common questions about us.</p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {[
            {
              q: "Are these perfumes long-lasting?",
              a: "Yes — every bottle is composed with premium UAE-blended oils designed for designer-level longevity and projection, typically 8–12 hours on skin.",
            },
            {
              q: "How do you make your perfumes?",
              a: "Our fragrances are hand-blended by perfumers across the Gulf, including Dubai, using high-grade oud, amber and modern aromatic compounds. Bottles are filled and packed in Sydney before dispatch.",
            },
            {
              q: "Are these knockoffs?",
              a: "Our perfumes are not knockoffs. We craft inspired fragrances based on original brands, adding our unique touch. These fragrances are not associated or affiliated with the existing brands.",
            },
            {
              q: "Can I get a refund if I don't like it?",
              a: "Unopened bottles can be returned within 30 days for a full refund. See our Returns Policy for full details.",
            },
          ].map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <span className="font-semibold text-left">{item.q}</span>
                <span className="text-[var(--amber-deep)] text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="text-muted-foreground mt-3 leading-relaxed text-sm">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/contact" className="text-sm font-semibold text-[var(--amber-deep)] hover:underline">
            Still have a question? Contact us →
          </Link>
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
