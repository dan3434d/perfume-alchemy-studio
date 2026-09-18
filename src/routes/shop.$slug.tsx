import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { useCart, useWishlist } from "@/hooks/useCart";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { ClientMoments } from "@/components/site/ClientMoments";
import { Heart, ShoppingBag, Truck, RotateCcw, Minus, Plus, Sparkles, Leaf, Droplets, Package, FlaskConical, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trackView } from "@/hooks/useBrowsingHistory";
import { OfferPrice } from "@/components/site/OfferPrice";
import { usePricingOffer } from "@/hooks/usePricingOffer";
import houseBottlePlinth from "@/assets/brand/house-bottle-plinth.jpg";
import houseBottleHand from "@/assets/brand/house-bottle-in-hand.jpg";
import houseBottleTriptych from "@/assets/brand/house-bottle-triptych.jpg";

const SITE = "https://www.abdulrahmanperfumes.com.au";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name,slug)")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data as any;
  },
  head: ({ params, loaderData }) => {
    const p: any = loaderData;
    const url = `${SITE}/shop/${params.slug}`;
    if (!p) {
      return {
        meta: [{ title: "Product — Abdulrahman Perfumes" }],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const brand = p.inspired_by_brand ? `${p.inspired_by_brand} ${p.inspired_by_product ?? ""}`.trim() : null;
    const title = `${p.name}${brand ? ` — inspired by ${brand}` : ""} | Abdulrahman Perfumes`;
    const desc = (p.description || p.long_description || `${p.name} — a UAE-blended 50ml eau de parfum${brand ? ` inspired by ${brand}` : ""}. Shipped from Sydney across Australia.`).slice(0, 300);
    const img = p.image_url?.startsWith("http") ? p.image_url : (p.image_url ? `${SITE}${p.image_url.startsWith("/") ? "" : "/"}${p.image_url}` : null);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: desc,
            image: img ? [img] : undefined,
            brand: { "@type": "Brand", name: "Abdulrahman Perfumes" },
            ...(brand ? { isRelatedTo: { "@type": "Product", name: brand } } : {}),
            sku: p.id,
            category: p.categories?.name,
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "AUD",
              price: String(p.price),
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },
            aggregateRating: p.review_count
              ? { "@type": "AggregateRating", ratingValue: String(p.rating ?? 4.8), reviewCount: String(p.review_count) }
              : undefined,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
              { "@type": "ListItem", position: 3, name: p.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  const navigate = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const product = useQuery({
    queryKey: ["product", slug],
    initialData: initial,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name,slug)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const related = useQuery({
    queryKey: ["related", product.data?.category_id],
    enabled: !!product.data?.category_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,image_url,rating,inspired_by_brand,inspired_by_product,categories(name)")
        .eq("category_id", product.data.category_id)
        .neq("id", product.data.id)
        .eq("is_active", true)
        .limit(4);
      return (data || []).map((p: any) => ({ ...p, category_name: p.categories?.name })) as ProductCardData[];
    },
  });

  if (product.isLoading && !product.data) {
    return (
      <div className="container-px max-w-7xl mx-auto py-20">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (!product.data) {
    return (
      <div className="container-px max-w-7xl mx-auto py-20 text-center">
        <h1 className="font-display text-3xl">Product not found</h1>
        <p className="text-muted-foreground mt-2">It may be out of stock or no longer available.</p>
        <Link to="/shop" className="inline-block mt-6 btn-gold rounded-full px-6 py-3 text-sm font-semibold">Back to shop</Link>
      </div>
    );
  }


  const p = product.data;
  const offer = usePricingOffer(Number(p.price), qty);
  useEffect(() => {
    if (p?.id) trackView({ product_id: p.id, slug: p.slug, brand: p.inspired_by_brand ?? null, category_slug: p.categories?.slug ?? null });
  }, [p?.id, p?.slug, p?.inspired_by_brand, p?.categories?.slug]);
  const wished = has(p.id);
  const lowStock = p.stock > 0 && p.stock < 10;
  const discount =
    p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
      ? Math.round(100 - (Number(p.price) / Number(p.compare_at_price)) * 100)
      : 0;
  const savings = p.retail_price ? Number(p.retail_price) - Number(p.price) : null;
  const gallery = [
    { src: productImage(p.image_url), alt: `${p.name} 50ml eau de parfum`, label: p.name },
    { src: houseBottlePlinth, alt: "An Abdulrahman Perfumes house bottle on a stone plinth", label: "The house bottle" },
    { src: houseBottleHand, alt: "An Abdulrahman Perfumes bottle held in two hands", label: "In hand" },
    { src: houseBottleTriptych, alt: "Three editorial views of the Abdulrahman Perfumes house bottle", label: "House details" },
  ];
  const selectedImage = gallery[activeImage] ?? gallery[0];

  const doAdd = () => {
    add({ product_id: p.id, slug: p.slug, name: p.name, price: offer.price, image_url: p.image_url, stock: p.stock, inspired_by_brand: p.inspired_by_brand ?? null, inspired_by_product: p.inspired_by_product ?? null }, qty);
    toast.success(`Added ${qty} × ${p.name} to cart`);
    navigate({ to: "/checkout" });
  };
  const doBuy = () => { doAdd(); };

  return (
    <div className="container-px max-w-7xl mx-auto py-10 sm:py-14 pb-28 lg:pb-14">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-6 flex gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-foreground">Home</Link><span>/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link><span>/</span>
        {p.inspired_by_brand && (
          <>
            <Link to="/shop" search={{ brand: p.inspired_by_brand }} className="hover:text-foreground">{p.inspired_by_brand}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="max-w-lg mx-auto lg:mx-0 aspect-[4/5] overflow-hidden bg-[var(--cream)] border border-border relative">
            <img src={selectedImage.src} alt={selectedImage.alt} className="w-full h-full object-cover" width={800} height={1000} />
            {discount > 0 && (
              <span className="absolute top-3 left-3 rounded-full bg-foreground text-background text-xs font-semibold px-3 py-1.5 tracking-wider">
                −{discount}% OFF
              </span>
            )}
          </div>
          <div className="max-w-lg mx-auto lg:mx-0 grid grid-cols-4 gap-2" aria-label="Product image gallery">
            {gallery.map((image, index) => (
              <button
                key={image.label}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View ${image.label}`}
                aria-pressed={activeImage === index}
                className={`aspect-square overflow-hidden border bg-[var(--cream)] transition-opacity ${activeImage === index ? "border-foreground" : "border-border opacity-70 hover:opacity-100"}`}
              >
                <img src={image.src} alt="" className="h-full w-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
              </button>
            ))}
          </div>
          {activeImage > 0 && (
            <p className="max-w-lg mx-auto lg:mx-0 text-[11px] text-muted-foreground">House photography shows our 50ml bottle and presentation; scent labels vary by fragrance.</p>
          )}
          {p.inspired_by_brand && (
            <div className="max-w-lg mx-auto lg:mx-0 border border-border bg-[var(--cream)]/40 p-4 text-sm flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[var(--amber-deep)] shrink-0" />
              <div>
                <span className="text-muted-foreground">Inspired by </span>
                <Link to="/shop" search={{ brand: p.inspired_by_brand }} className="font-semibold hover:text-[var(--amber-deep)] underline-offset-2 hover:underline">
                  {p.inspired_by_brand} {p.inspired_by_product}
                </Link>
                {p.retail_price && (
                  <span className="text-muted-foreground"> · Designer retail {formatAUD(p.retail_price)}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
          <div className="space-y-6 lg:pt-3">
          <div>
            {p.categories?.name && <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">{p.categories.name}</span>}
            <h1 className="font-display text-3xl sm:text-4xl mt-2">{p.name}</h1>
            {p.inspired_by_brand && (
              <p className="text-sm text-muted-foreground italic mt-1">
                Our take on{" "}
                <span className="not-italic font-medium text-foreground">{p.inspired_by_brand} {p.inspired_by_product}</span>
              </p>
            )}
            <div className="mt-4 border-y border-border py-3 text-xs text-muted-foreground">
              50ml eau de parfum · Composed in the UAE · Packed in Sydney
            </div>
          </div>

          <div><OfferPrice basePrice={Number(p.price)} cartQuantity={qty} large /><span className="text-xs text-muted-foreground">AUD · incl. taxes</span></div>
          {savings && savings > 0 && (
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[var(--amber-deep)]/10 text-[var(--amber-deep)] font-semibold">
              You save {formatAUD(savings)} vs the designer original
            </div>
          )}

          <p className="text-muted-foreground leading-relaxed">{p.long_description || p.description}</p>

          {/* Fragrance notes */}
          <div className="border-y border-border py-5">
            <h2 className="font-semibold text-sm uppercase tracking-wider mb-3">Fragrance notes</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <NoteCol label="Top" notes={p.notes_top} />
              <NoteCol label="Heart" notes={p.notes_heart} />
              <NoteCol label="Base" notes={p.notes_base} />
            </div>
          </div>

          {/* Size */}
          <div>
            <h2 className="text-sm font-semibold mb-2">Size</h2>
            <div className="inline-flex border border-foreground bg-foreground px-4 py-2 text-sm text-background">
              50ml
            </div>
          </div>

          {/* Qty + Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center border border-border overflow-hidden" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="p-3 hover:bg-secondary"><Minus className="w-4 h-4" /></button>
              <span className="w-10 text-center text-sm font-medium" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="p-3 hover:bg-secondary"><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={doBuy} className="flex-1 min-w-[220px] btn-ink inline-flex items-center justify-center gap-2 py-4">
              <ShoppingBag className="w-4 h-4" /> Add to bag & checkout
            </button>
            <button onClick={() => toggle(p.id)} aria-label="Wishlist" className="p-3 border border-border hover:bg-secondary">
              <Heart className={`w-5 h-5 ${wished ? "fill-[var(--amber-deep)] text-[var(--amber-deep)]" : ""}`} />
            </button>
          </div>

          {lowStock && <p className="text-xs text-[var(--amber-deep)]">Only {p.stock} left in stock</p>}

          {/* Bundle nudge */}
          <button
            type="button"
            onClick={() => { setQty(2); toast.success("2 bottles selected — 15% off applies at checkout"); }}
            className="w-full text-left border border-[var(--gold)]/50 bg-sand p-4 flex items-center gap-3 hover:border-foreground transition-colors"
          >
            <Sparkles className="w-5 h-5 text-[var(--amber-deep)] shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">Take 2 bottles and save 15%</div>
              <div className="text-xs text-muted-foreground">
                2 × 50ml for {formatAUD(Math.max(35, Number(p.price) * 0.85) * 2)} instead of {formatAUD(110)} — free metro shipping included.
              </div>
            </div>
          </button>


          <section className="border-y border-border py-5" aria-labelledby="promise-title">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative grid h-11 w-9 shrink-0 place-items-center text-[var(--amber-deep)]" aria-hidden="true">
                <ShieldCheck className="absolute inset-0 h-full w-full" strokeWidth={1.25} />
                <span className="font-display text-[11px] font-semibold">AP</span>
              </div>
              <div>
                <div id="promise-title" className="font-display text-lg">The Abdulrahman Promise</div>
                <p className="text-xs text-muted-foreground">Clear facts, careful packing, no inflated claims.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              <Info i={FlaskConical} t="50ml eau de parfum" d="Alcohol-based fragrance concentration" />
              <Info i={Package} t="Packed in Sydney" d="Checked before dispatch" />
              <Info i={Truck} t="Tracked delivery" d="Tracking sent by email" />
              <Info i={RotateCcw} t="30-day returns" d="On unopened bottles" />
            </div>
          </section>
        </div>
      </div>

      <div className="mt-20">
        <ClientMoments compact />
        <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-8 lg:gap-16 border-b border-border py-12 sm:py-16">
          <div>
            <span className="eyebrow eyebrow-brass">Worn in real life</span>
            <h2 className="font-display mt-3">A bottle becomes personal when it leaves our hands.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 text-sm leading-relaxed">
            <p>Every fragrance is packed in Sydney and sent to become part of someone else's routine—on a dresser, in a work bag, or shared at the door before an evening out.</p>
            <p className="text-muted-foreground">These house portraits show the fragrance as it is meant to be experienced: held, worn and passed between people.</p>
          </div>
        </div>
      </div>

      {/* Long description / story */}
      <section className="mt-16 grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-5">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">The story</span>
          <h2 className="font-display text-2xl sm:text-3xl">About {p.name}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {p.long_description || p.description || `${p.name} is a 50ml eau de parfum blended in the UAE and packed by hand in Sydney. We layer top, heart and base notes, then let the composition age so the oils marry into a single, balanced scent that lasts from morning meetings to late-night dinners.`}
          </p>
          {p.inspired_by_brand && (
            <p className="text-muted-foreground leading-relaxed">
              Inspired by <span className="font-medium text-foreground">{p.inspired_by_brand} {p.inspired_by_product}</span>, our take captures the same character at a fraction of the designer price — without copying it. Every bottle is an original Abdulrahman composition, not a knockoff.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <Feature i={FlaskConical} t="50ml eau de parfum" d="Premium alcohol-based concentration for projection and longevity." />
            <Feature i={Leaf} t="UAE-sourced oils" d="Oud, amber, rose and vanilla from across the Gulf." />
            <Feature i={Droplets} t="Hand-blended" d="Composed by perfumers trained in Souk Madinat traditions." />
            <Feature i={Package} t="Packed in Sydney" d="QC-checked and gift-boxed. Ships within 24 hours." />
          </div>
        </div>
        <aside className="border border-border bg-[var(--cream)]/40 p-6 space-y-4">
          <h3 className="font-display text-xl">Fragrance profile</h3>
          <ProfileRow label="Family" value={p.categories?.name ?? "Signature"} />
          <ProfileRow label="Size" value="50ml" />
          <ProfileRow label="Concentration" value="Eau de Parfum" />
          <ProfileRow label="Longevity" value="6–10 hours" />
          <ProfileRow label="Sillage" value="Moderate to strong" />
          <ProfileRow label="Best for" value="Day & night" />
        </aside>
      </section>

      {/* How we make it */}
      <section className="mt-20 border-y border-border py-14">
        <div className="max-w-2xl">
          <span className="eyebrow eyebrow-brass">Our craft</span>
          <h2 className="font-display mt-3">How this bottle came to be</h2>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            Three stages, no shortcuts — from raw oil in the Gulf to the box on your table in Sydney.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border mt-10">
          <CraftCard n="01" title="Sourcing" body="Aged oud, Bulgarian rose absolute, Madagascan vanilla and ambergris accords — bought in smaller quantities, chosen for character over cost." />
          <CraftCard n="02" title="Composition" body="Perfumers work by nose, layering top, heart and base. The blend is then left to rest for weeks so the oils settle into one another." />
          <CraftCard n="03" title="Bottled in Sydney" body="Every 50ml is filled, checked against the reference batch and boxed by hand here, then sent across Australia within 24 hours." />
        </div>
        <Link to="/about" className="inline-block mt-8 text-sm link-underline">
          Read the full story of the house →
        </Link>
      </section>

      {/* FAQ on product */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl text-center mb-6">Common questions</h2>
        <div className="space-y-3">
          <FaqRow q="How long does this perfume last?" a="Our 50ml eau de parfum typically projects for 6–10 hours, depending on skin chemistry, climate and how much you apply. Spray on pulse points — wrists, neck, behind the ears — for best longevity." />
          <FaqRow q="Is this a knockoff or replica?" a={`Absolutely not. ${p.inspired_by_brand ? `${p.name} is inspired by ${p.inspired_by_brand} ${p.inspired_by_product ?? ""} but it's an original Abdulrahman composition` : `${p.name} is an original Abdulrahman composition`} — blended in the UAE with our own formula. We are not affiliated with any designer brand.`} />
          <FaqRow q="How do you make your perfumes?" a="We source raw oils from across the Gulf, hand-blend top/heart/base notes in our perfumery, age the composition, then bottle and gift-box every order in our Sydney atelier." />
          <FaqRow q="Can I return it if I don't like it?" a="Yes. We offer a 30-day hassle-free returns policy on all orders shipped within Australia." />
        </div>
      </section>

      {/* Related */}
      {related.data && related.data.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl sm:text-3xl mb-6">You may also love</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.data.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}

      {/* Sticky mobile buy bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur pl-4 pr-20 py-3 flex items-center gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{p.name}</div>
          <div className="font-semibold text-sm">{formatAUD(offer.price)}</div>
        </div>
        <button onClick={doBuy} className="btn-ink ml-auto px-5 py-3 text-xs">
          Checkout
        </button>
      </div>
    </div>
  );
}


function Feature({ i: Icon, t, d }: { i: any; t: string; d: string }) {
  return (
    <div className="flex items-start gap-3 border border-border p-3 bg-background">
      <Icon className="w-5 h-5 text-[var(--amber-deep)] mt-0.5 shrink-0" />
      <div>
        <div className="text-sm font-semibold">{t}</div>
        <div className="text-xs text-muted-foreground">{d}</div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CraftCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-background p-8">
      <div className="eyebrow text-[var(--amber-deep)]">Stage {n}</div>
      <h3 className="font-display text-2xl mt-3">{title}</h3>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{body}</p>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-y border-border bg-background py-5">
      <summary className="cursor-pointer list-none font-medium flex justify-between items-center">
        {q}
        <Plus className="w-4 h-4 text-[var(--amber-deep)] group-open:rotate-45 transition" />
      </summary>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{a}</p>
    </details>
  );
}

function NoteCol({ label, notes }: { label: string; notes?: string[] | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 space-y-0.5">
        {(notes ?? []).length > 0
          ? (notes ?? []).map((n) => <div key={n}>{n}</div>)
          : <div className="text-muted-foreground/60">—</div>}
      </div>
    </div>
  );
}

function Info({ i: Icon, t, d }: { i: any; t: string; d: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-5 h-5 text-[var(--amber-deep)] mt-0.5" />
      <div>
        <div className="text-sm font-medium">{t}</div>
        <div className="text-xs text-muted-foreground">{d}</div>
      </div>
    </div>
  );
}
