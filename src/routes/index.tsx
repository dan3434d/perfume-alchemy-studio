import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";
import { SocialFeed } from "@/components/site/SocialFeed";
import { TrustBar } from "@/components/site/TrustBar";
import { HouseMarquee } from "@/components/site/HouseMarquee";
import { SignatureIndex } from "@/components/site/SignatureIndex";
import heroPortrait from "@/assets/brand/woman-closeup.jpeg.asset.json";
import portraitManLinen from "@/assets/brand/man-linen.jpeg.asset.json";
import portraitWomanCurls from "@/assets/brand/woman-curls.jpeg.asset.json";
import portraitWomanWaves from "@/assets/brand/woman-waves.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Abdulrahman Perfumes — Scent as a welcome" },
      { name: "description", content: "A Sydney fragrance house built on Gulf hospitality. Oud, amber and modern blends composed in the UAE, bottled here. Every 50ml is $41.50." },
      { property: "og:title", content: "Abdulrahman Perfumes — Scent as a welcome" },
      { property: "og:description", content: "A Sydney fragrance house built on Gulf hospitality. Every 50ml eau de parfum is $41.50 — take two and save 15%." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const PILLARS = [
  {
    n: "I",
    t: "The welcome",
    d: "In our home, no one walked in without being met by scent. Bakhoor at the door, oud offered on the wrist. Perfume was never vanity — it was how you told someone they mattered.",
  },
  {
    n: "II",
    t: "The blend",
    d: "Our compositions are built in the Gulf by perfumers who learned by nose, not by spreadsheet. Oud, amber, rose and resin, aged until the notes stop arguing with each other.",
  },
  {
    n: "III",
    t: "The everyday",
    d: "One price for every bottle, because a good scent should not be saved for a rare occasion. Wear it to work. Wear it to nothing at all.",
  },
];

function Home() {
  const featured = useQuery({
    queryKey: ["products", "featured-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,image_url,rating,stock,gender,inspired_by_brand,inspired_by_product,categories(name)")
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

  const hero = featured.data?.[0];

  return (
    <>
      {/* HERO — a full-bleed plate with the house name set over it */}
      <section className="relative border-b border-border">
        <div className="relative grain min-h-[86vh] lg:min-h-[92vh] overflow-hidden bg-[var(--sand)]">
          <img
            src={heroPortrait.url}
            alt="A woman holding a 50ml Abdulrahman eau de parfum in morning light"
            className="absolute inset-0 w-full h-full object-cover object-center"
            fetchPriority="high"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, color-mix(in oklab, var(--ink) 82%, transparent) 0%, color-mix(in oklab, var(--ink) 55%, transparent) 42%, transparent 78%)",
            }}
          />
          <div className="relative container-px max-w-7xl mx-auto min-h-[86vh] lg:min-h-[92vh] flex items-end pb-14 sm:pb-20">
            <div className="animate-fade-up max-w-2xl text-[var(--background)]">
              <span className="eyebrow text-[var(--gold)]">Est. Sydney · Composed in the UAE</span>
              <h1 className="mt-6">
                Scent is how<br />we say <em className="italic">welcome</em>.
              </h1>
              <p className="text-base sm:text-lg mt-7 max-w-xl leading-relaxed text-[var(--background)]/80">
                The name means servant of the Most Merciful. In the houses we grew up in, hospitality
                always arrived as scent — before the tea, long before the conversation. We bottle that
                gesture: Gulf-composed perfume, one honest price, sent from Sydney.
              </p>
              <div className="flex flex-wrap gap-3 mt-9">
                <Link
                  to="/shop"
                  className="px-8 py-3.5 text-[11px] uppercase tracking-[0.14em] font-medium bg-[var(--background)] text-[var(--ink)] border border-[var(--background)] hover:bg-transparent hover:text-[var(--background)] transition-colors"
                >
                  Browse the collection
                </Link>
                <Link
                  to="/scent-discovery"
                  className="px-8 py-3.5 text-[11px] uppercase tracking-[0.14em] font-medium border border-[var(--background)]/45 text-[var(--background)] hover:border-[var(--background)] transition-colors"
                >
                  Find your scent
                </Link>
              </div>
              <dl className="grid grid-cols-3 gap-6 mt-12 pt-7 border-t border-[var(--background)]/25 max-w-lg">
                {[
                  { t: "Every bottle", v: "$41.50" },
                  { t: "Volume", v: "50ml" },
                  { t: "Take two", v: "−15%" },
                ].map((s) => (
                  <div key={s.t}>
                    <dt className="eyebrow text-[10px] text-[var(--background)]/65">{s.t}</dt>
                    <dd className="font-display num text-2xl mt-1.5">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
        {hero && (
          <Link
            to="/shop/$slug"
            params={{ slug: hero.slug }}
            className="group block border-t border-border bg-background"
          >
            <div className="container-px max-w-7xl mx-auto py-5 flex items-baseline justify-between gap-6">
              <span className="eyebrow text-[10px]">This week on the table</span>
              <span className="font-display text-xl sm:text-2xl link-underline">{hero.name}</span>
              <span className="num text-sm whitespace-nowrap hidden sm:block">$41.50 · 50ml</span>
            </div>
          </Link>
        )}
      </section>

      <HouseMarquee />
      <TrustBar />

      {/* MANIFESTO */}
      <section className="section container-px max-w-5xl mx-auto text-center">
        <span className="eyebrow eyebrow-brass">What we believe</span>
        <p className="font-display text-[1.75rem] sm:text-4xl lg:text-[2.9rem] leading-[1.22] mt-7">
          A fragrance house should not sell you a fantasy of someone else's life.
          It should hand you something warm at the door and let you get on with your own.
        </p>
        <div className="mt-8 inline-block eyebrow">— The house of Abdulrahman</div>
      </section>

      {/* THREE PILLARS */}
      <section className="border-y border-border bg-[var(--sand)]">
        <div className="container-px max-w-7xl mx-auto grid md:grid-cols-3 gap-px bg-border border-x border-border">
          {PILLARS.map((p) => (
            <div key={p.n} className="bg-[var(--sand)] p-8 sm:p-10">
              <div className="font-display text-3xl text-[var(--amber-deep)]">{p.n}</div>
              <h3 className="font-display text-2xl mt-4">{p.t}</h3>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WORN — people, not campaigns */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <span className="eyebrow eyebrow-brass">Worn, not staged</span>
          <h2 className="font-display mt-3">Morning light, one bottle on the dresser</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            No campaign set, no marble plinth. Our bottles live where people get ready — beside the
            jewellery dish, next to the kettle, picked up on the way out the door.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-px bg-border border border-border mt-10">
          {[
            { img: portraitWomanCurls, alt: "A woman smiling as she holds a bottle of Abdulrahman eau de parfum", cap: "The first wear", body: "Warm, close to the skin, and still there at dinner." },
            { img: portraitManLinen, alt: "A man in linen holding a bottle of Abdulrahman eau de parfum", cap: "For him, for her", body: "Most of our blends are worn by whoever reaches for them first." },
            { img: portraitWomanWaves, alt: "A woman holding a bottle of Abdulrahman eau de parfum in morning light", cap: "Every day", body: "One price, so the good bottle isn't saved for later." },
          ].map((p) => (
            <figure key={p.cap} className="bg-background">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={p.img.url} alt={p.alt} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <figcaption className="p-6">
                <div className="eyebrow text-[10px]">{p.cap}</div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <SignatureIndex items={featured.data ?? []} />

      {/* COLLECTION */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 mb-10">
          <div>
            <span className="eyebrow eyebrow-brass">The collection</span>
            <h2 className="font-display mt-3">Bottles people keep coming back for</h2>
          </div>
          <Link to="/shop" className="text-sm link-underline">View everything →</Link>
        </div>
        {featured.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featured.data?.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* HONEST PRICING */}
      <section className="border-y border-border">
        <div className="container-px max-w-7xl mx-auto grid lg:grid-cols-2">
          <div className="py-16 lg:py-24 lg:pr-16">
            <span className="eyebrow eyebrow-brass">Why one price</span>
            <h2 className="font-display mt-4">No campaign to pay for. No boutique rent. No theatre.</h2>
            <p className="text-muted-foreground mt-6 leading-relaxed">
              A designer bottle carries a model, a magazine spread and a shopfront on its shoulders before
              it reaches you. Ours carries the oil, the glass and the postage. That is the whole difference —
              not a secret, just arithmetic.
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              We compose our own formulas in the spirit of fragrances people already love. They are not
              copies and we are not affiliated with any designer house. They are ours, and they are honest
              about what they cost.
            </p>
            <Link to="/about" className="inline-block mt-8 text-sm link-underline">Read how we make them →</Link>
          </div>
          <div className="lg:border-l border-border py-16 lg:py-24 lg:pl-16 flex flex-col justify-center gap-8">
            <div className="flex items-baseline justify-between border-b border-border pb-5">
              <span className="text-sm text-muted-foreground">A designer counter</span>
              <span className="font-display text-3xl text-muted-foreground line-through">$99 – $380</span>
            </div>
            <div className="flex items-baseline justify-between border-b border-border pb-5">
              <span className="text-sm">Abdulrahman, 50ml</span>
              <span className="font-display text-4xl">$41.50</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm">Two bottles, together</span>
              <span className="font-display text-3xl">$70.55</span>
            </div>
            <Link to="/shop" className="btn-ink px-8 py-3.5 text-center">Shop the collection</Link>
          </div>
        </div>
      </section>

      {/* SCENT FAMILIES */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="border-b border-border pb-6 mb-10">
          <span className="eyebrow eyebrow-brass">Where to begin</span>
          <h2 className="font-display mt-3">By family, or by who it's for</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {(categories.data ?? []).slice(0, 6).map((c: any) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className="bg-background p-8 hover:bg-[var(--sand)] transition-colors"
            >
              <div className="font-display text-2xl">{c.name}</div>
              <div className="eyebrow mt-3">Explore →</div>
            </Link>
          ))}
          {[
            { v: "mens", l: "For him", d: "Woody, smoky, deliberate" },
            { v: "womens", l: "For her", d: "Floral, warm, luminous" },
            { v: "unisex", l: "For everyone", d: "Clean, modern, shareable" },
          ].map((g) => (
            <Link
              key={g.v}
              to="/shop"
              search={{ gender: g.v }}
              className="bg-background p-8 hover:bg-[var(--sand)] transition-colors"
            >
              <div className="font-display text-2xl">{g.l}</div>
              <div className="text-xs text-muted-foreground mt-2">{g.d}</div>
              <div className="eyebrow mt-3">Explore →</div>
            </Link>
          ))}
        </div>
      </section>

      <ReviewsCarousel />
      <SocialFeed />

      {/* QUIZ */}
      <section className="section container-px max-w-4xl mx-auto text-center">
        <span className="eyebrow eyebrow-brass">Not sure yet</span>
        <h2 className="font-display mt-4">Four questions, and we'll point you to a bottle</h2>
        <p className="text-muted-foreground mt-5 max-w-xl mx-auto leading-relaxed">
          Tell us what you're drawn to and when you'd wear it. We'll narrow forty scents down to the
          two or three that actually suit you.
        </p>
        <Link to="/scent-discovery" className="btn-ink inline-block px-9 py-3.5 mt-8">Start the quiz</Link>
      </section>

      {/* FAQ */}
      <section className="section border-t border-border bg-[var(--sand)]">
        <div className="container-px max-w-3xl mx-auto">
          <span className="eyebrow eyebrow-brass">Asked often</span>
          <h2 className="font-display mt-3 mb-10">The questions we get most</h2>
          <div className="divide-y divide-border border-y border-border">
            {[
              {
                q: "Are these perfumes long-lasting?",
                a: "Yes. Every bottle is eau de parfum strength, built on Gulf-blended oils. Most people get eight to twelve hours on skin, a little less in high heat.",
              },
              {
                q: "How do you make your perfumes?",
                a: "Formulas are composed by perfumers in the UAE, aged so the notes settle, then filled, checked and packed by hand in Sydney before they're sent out.",
              },
              {
                q: "Are these knockoffs?",
                a: "No. We write our own formulas in the spirit of fragrances people already love, and we add our own signature. We are not affiliated with, or endorsed by, any designer house.",
              },
              {
                q: "Can I get a refund if I don't like it?",
                a: "Unopened bottles can come back within 30 days for a full refund. If something arrives damaged, tell us and we'll fix it the same day.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-6">
                <summary className="flex justify-between items-start gap-6 cursor-pointer list-none">
                  <span className="font-display text-xl leading-snug">{item.q}</span>
                  <span className="text-[var(--amber-deep)] text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="text-muted-foreground mt-4 leading-relaxed text-sm max-w-2xl">{item.a}</p>
              </details>
            ))}
          </div>
          <Link to="/contact" className="inline-block mt-8 text-sm link-underline">Ask us something else →</Link>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section container-px max-w-2xl mx-auto text-center">
        <h2 className="font-display">Letters from the house</h2>
        <p className="text-muted-foreground mt-4">
          New blends, small-batch runs and the occasional story from the souk. No noise.
        </p>
        <form className="mt-8 flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            autoComplete="email"
            className="flex-1 px-5 py-3.5 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-ring text-sm"
          />
          <button type="submit" className="btn-ink px-8 py-3.5">Subscribe</button>
        </form>
      </section>
    </>
  );
}
