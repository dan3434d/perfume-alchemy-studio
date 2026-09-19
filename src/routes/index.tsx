import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { TrustBar } from "@/components/site/TrustBar";
import { HouseMarquee } from "@/components/site/HouseMarquee";
import { SignatureIndex } from "@/components/site/SignatureIndex";
import { TopSellers } from "@/components/site/TopSellers";
import heroPortrait from "@/assets/brand/woman-closeup.jpeg.asset.json";
import portraitManLinen from "@/assets/brand/man-linen.jpeg.asset.json";
import portraitWomanCurls from "@/assets/brand/woman-curls.jpeg.asset.json";
import portraitWomanWaves from "@/assets/brand/woman-waves.jpeg.asset.json";
import brandFilmOne from "@/assets/brand/brand-film-1.mp4.asset.json";
import brandFilmTwo from "@/assets/brand/brand-film-2.mp4.asset.json";
import houseBottlePlinth from "@/assets/brand/house-bottle-plinth.jpg";
import houseCitrusWater from "@/assets/brand/house-citrus-water.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luxury Inspired Perfumes Australia | Abdulrahman Perfumes" },
      { name: "description", content: "Luxury designer-inspired perfumes from $35. Long-lasting 50ml oud, amber, fresh and floral eau de parfum composed in the UAE, bottled in Sydney, shipped Australia-wide." },
      { property: "og:title", content: "Luxury Inspired Perfumes Australia | Abdulrahman Perfumes" },
      { property: "og:description", content: "Designer-inspired 50ml eau de parfum, composed in the UAE and bottled in Sydney. Current offers shown clearly, tracked Australian delivery." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.abdulrahmanperfumes.com.au/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Luxury Inspired Perfumes Australia | Abdulrahman Perfumes" },
      { name: "twitter:description", content: "Designer-inspired 50ml eau de parfum, composed in the UAE and bottled in Sydney." },
    ],
    links: [{ rel: "canonical", href: "https://www.abdulrahmanperfumes.com.au/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Abdulrahman Perfumes",
          url: "https://www.abdulrahmanperfumes.com.au/",
          description:
            "Luxury designer-inspired eau de parfum composed in the UAE and bottled in Sydney, Australia.",
          priceRange: "$35–$55 AUD",
          areaServed: "Australia",
          address: { "@type": "PostalAddress", addressLocality: "Sydney", addressRegion: "NSW", addressCountry: "AU" },
        }),
      },
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
    d: "A fair price on every bottle, with every saving shown before checkout. Wear it to work. Wear it to nothing at all.",
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
                gesture: Gulf-composed perfume, honest value, sent from Sydney.
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
                  { t: "Current offers", v: "$35–$55" },
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
              <span className="num text-sm whitespace-nowrap hidden sm:block">Current offer · 50ml</span>
            </div>
          </Link>
        )}
      </section>

      <HouseMarquee />
      <TrustBar />

      <section className="border-b border-border">
        <div className="container-px max-w-7xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-px bg-border border-x border-border">
          <figure className="relative min-h-[58vh] overflow-hidden bg-[var(--cream)]">
            <img src={houseCitrusWater} alt="Abdulrahman Perfumes house bottle surrounded by fresh citrus and cucumber underwater" className="absolute inset-0 h-full w-full object-cover" />
          </figure>
          <div className="bg-background p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <span className="eyebrow eyebrow-brass">The bottle, honestly shown</span>
            <h2 className="font-display mt-4">Made to be picked up, used, and remembered.</h2>
            <p className="text-muted-foreground mt-5 leading-relaxed">
              A weighty 50ml glass bottle, eau de parfum concentration, and a composition built to stay with you. The label changes with the scent; the standard behind it does not.
            </p>
            <figure className="mt-8 grid grid-cols-[96px_1fr] gap-5 items-center border-t border-border pt-6">
              <img src={houseBottlePlinth} alt="Abdulrahman Perfumes house bottle on a stone plinth" className="aspect-square w-24 object-cover" loading="lazy" />
              <figcaption className="text-sm text-muted-foreground leading-relaxed">House photography of our bottle and presentation. Individual fragrance pages show the scent you are choosing.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* BRAND FILM — full-bleed moving portrait */}
      <section className="relative border-b border-border">
        <div className="relative w-full overflow-hidden bg-[var(--ink)]">
          <video
            src={brandFilmOne.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-[52vh] sm:h-[64vh] object-cover opacity-90"
            aria-label="Abdulrahman Perfumes brand film"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 container-px pb-8 sm:pb-12">
            <span className="eyebrow text-white/80">The house film</span>
            <p className="font-display text-white text-2xl sm:text-4xl mt-3 max-w-2xl leading-snug">
              Fragrance, worn in real light — not lit for a campaign.
            </p>
          </div>
        </div>
      </section>

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
            { img: portraitWomanWaves, alt: "A woman holding a bottle of Abdulrahman eau de parfum in morning light", cap: "Every day", body: "Visible value, so the good bottle isn't saved for later." },
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

      {/* CRAFT IN MOTION — second film with copy */}
      <section className="border-y border-border bg-[var(--sand)]">
        <div className="container-px max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center section">
          <div className="overflow-hidden border border-border bg-[var(--ink)]">
            <video
              src={brandFilmTwo.url}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full aspect-video object-cover"
              aria-label="An Abdulrahman perfume bottle being worn and carried through the day"
            />
          </div>
          <div>
            <span className="eyebrow eyebrow-brass">In motion</span>
            <h2 className="font-display mt-3">The bottle that goes where you go</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Composed in the UAE, bottled in Sydney, and made for the everyday — the commute, the
              dinner, the last-minute plan. A good fragrance should keep up with a life, not sit on
              a shelf waiting for a special occasion.
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              That's the standard every Abdulrahman blend is held to before it earns a label.
            </p>
          </div>
        </div>
      </section>

      <TopSellers title="Our best sellers" eyebrow="Most ordered" />

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

      {/* HONEST PRICING — inverted band */}
      <section className="ink-section border-y border-border">
        <div className="container-px max-w-7xl mx-auto grid lg:grid-cols-2">
          <div className="py-16 lg:py-24 lg:pr-16">
            <span className="eyebrow text-[var(--gold)]">Why fair pricing</span>
            <h2 className="font-display mt-4">No campaign to pay for. No boutique rent. No theatre.</h2>
            <p className="mt-6 leading-relaxed text-[var(--background)]/75">
              A designer bottle carries a model, a magazine spread and a shopfront on its shoulders before
              it reaches you. Ours carries the oil, the glass and the postage. That is the whole difference —
              not a secret, just arithmetic.
            </p>
            <p className="mt-4 leading-relaxed text-[var(--background)]/75">
              We compose our own formulas in the spirit of fragrances people already love. They are not
              copies and we are not affiliated with any designer house. They are ours, and they are honest
              about what they cost.
            </p>
            <Link to="/about" className="inline-block mt-8 text-sm link-underline">Read how we make them →</Link>
          </div>
          <div className="lg:border-l border-[var(--background)]/20 py-16 lg:py-24 lg:pl-16 flex flex-col justify-center gap-8">
            <div className="flex items-baseline justify-between border-b border-[var(--background)]/20 pb-5">
              <span className="text-sm text-[var(--background)]/65">A designer counter</span>
              <span className="font-display num text-3xl text-[var(--background)]/55 line-through">$99 – $380</span>
            </div>
            <div className="flex items-baseline justify-between border-b border-[var(--background)]/20 pb-5">
              <span className="text-sm">Abdulrahman, 50ml</span>
              <span className="font-display num text-4xl text-[var(--gold)]">$35–$55</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm">Two bottles, together</span>
              <span className="font-display num text-3xl">$70.55</span>
            </div>
            <Link
              to="/shop"
              className="px-8 py-3.5 text-center text-[11px] uppercase tracking-[0.14em] font-medium bg-[var(--background)] text-[var(--ink)] border border-[var(--background)] hover:bg-transparent hover:text-[var(--background)] transition-colors"
            >
              Shop the collection
            </Link>
          </div>
        </div>
      </section>

      {/* THE RITUAL — how to wear it */}
      <section className="section container-px max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
          <div>
            <span className="eyebrow eyebrow-brass">The ritual</span>
            <h2 className="font-display mt-3">How to wear it, the way we were taught</h2>
            <p className="text-muted-foreground mt-5 leading-relaxed">
              Concentrated oils behave differently to a supermarket spray. A little, in the right place,
              carries further and lasts longer.
            </p>
          </div>
          <ol className="grid sm:grid-cols-2 gap-px bg-border border border-border">
            {[
              { n: "01", t: "Warm skin first", d: "Straight out of the shower, still slightly damp. Oil holds onto moisture, not dry skin." },
              { n: "02", t: "Pulse points only", d: "Wrists, the base of the neck, behind the ears. Two presses is plenty for a full day." },
              { n: "03", t: "Never rub it in", d: "Rubbing crushes the top notes. Let it dry in its own time and the opening stays intact." },
              { n: "04", t: "Store it dark", d: "Away from the window and the bathroom steam. A drawer keeps a bottle good for years." },
            ].map((s) => (
              <li key={s.n} className="bg-background p-7 sm:p-8">
                <span className="num eyebrow text-[10px] text-[var(--amber-deep)]">{s.n}</span>
                <h3 className="font-display text-xl mt-3">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
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
