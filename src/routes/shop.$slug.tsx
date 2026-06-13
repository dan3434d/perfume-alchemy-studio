import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { useCart, useWishlist } from "@/hooks/useCart";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { Heart, ShoppingBag, Truck, RotateCcw, Lock, Minus, Plus, Star, Check, Sparkles, Leaf, Droplets, Package, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { trackView } from "@/hooks/useBrowsingHistory";
import ingredientsImg from "@/assets/craft-ingredients.jpg";
import blendingImg from "@/assets/craft-blending.jpg";
import packingImg from "@/assets/craft-packing.jpg";

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

  const doAdd = () => {
    add({ product_id: p.id, slug: p.slug, name: p.name, price: Number(p.price), image_url: p.image_url, stock: p.stock }, qty);
    toast.success(`Added ${qty} × ${p.name} to cart`);
  };
  const doBuy = () => { doAdd(); navigate({ to: "/checkout" }); };

  return (
    <div className="container-px max-w-7xl mx-auto py-10 sm:py-14">
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
          <div className="max-w-sm mx-auto lg:mx-0 aspect-square rounded-2xl overflow-hidden bg-[var(--cream)] border border-border relative">
            <img src={productImage(p.image_url)} alt={p.name} className="w-full h-full object-cover" width={800} height={800} />
            {discount > 0 && (
              <span className="absolute top-3 left-3 rounded-full bg-foreground text-background text-xs font-semibold px-3 py-1.5 tracking-wider">
                −{discount}% OFF
              </span>
            )}
          </div>
          {p.inspired_by_brand && (
            <div className="max-w-sm mx-auto lg:mx-0 rounded-2xl border border-border bg-[var(--cream)]/40 p-4 text-sm flex items-center gap-3">
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
        <div className="space-y-6">
          <div>
            {p.categories?.name && <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">{p.categories.name}</span>}
            <h1 className="font-display text-3xl sm:text-4xl mt-2">{p.name}</h1>
            {p.inspired_by_brand && (
              <p className="text-sm text-muted-foreground italic mt-1">
                Our take on{" "}
                <span className="not-italic font-medium text-foreground">{p.inspired_by_brand} {p.inspired_by_product}</span>
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm">
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-[var(--gold)] text-[var(--gold)]" />)}</div>
              <span className="text-muted-foreground">({(p.rating ?? 4.8).toFixed(1)}) · {p.review_count ?? 0} reviews</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-3xl">{formatAUD(p.price)}</span>
            {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
              <span className="text-lg text-muted-foreground line-through">{formatAUD(p.compare_at_price)}</span>
            )}
            <span className="text-xs text-muted-foreground">AUD · incl. taxes</span>
          </div>
          {savings && savings > 0 && (
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[var(--amber-deep)]/10 text-[var(--amber-deep)] font-semibold">
              You save {formatAUD(savings)} vs the designer original
            </div>
          )}

          <p className="text-muted-foreground leading-relaxed">{p.long_description || p.description}</p>

          {/* Fragrance notes */}
          <div className="rounded-2xl border border-border p-5 bg-[var(--cream)]/30">
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
            <div className="inline-flex rounded-full border border-foreground bg-foreground px-4 py-2 text-sm text-background">
              50ml
            </div>
          </div>

          {/* Qty + Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border overflow-hidden" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="p-3 hover:bg-secondary"><Minus className="w-4 h-4" /></button>
              <span className="w-10 text-center text-sm font-medium" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="p-3 hover:bg-secondary"><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={doAdd} className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-full border-2 border-foreground bg-background text-foreground font-semibold py-3 hover:bg-foreground hover:text-background transition">
              <ShoppingBag className="w-4 h-4" /> Add to cart
            </button>
            <button onClick={doBuy} className="flex-1 min-w-[160px] btn-gold rounded-full font-semibold py-3">
              Buy now
            </button>
            <button onClick={() => toggle(p.id)} aria-label="Wishlist" className="p-3 rounded-full border border-border hover:bg-secondary">
              <Heart className={`w-5 h-5 ${wished ? "fill-[var(--amber-deep)] text-[var(--amber-deep)]" : ""}`} />
            </button>
          </div>

          {lowStock && <p className="text-xs text-[var(--amber-deep)]">Only {p.stock} left in stock</p>}

          {/* Delivery / Returns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
            <Info i={Truck} t="Fast AU shipping" d="Ships within 24h from Sydney" />
            <Info i={RotateCcw} t="30-day returns" d="Hassle-free" />
            <Info i={Lock} t="Secure checkout" d="Encrypted" />
          </div>

          <ul className="text-sm text-muted-foreground space-y-1.5 pt-2">
            <li className="flex gap-2"><Check className="w-4 h-4 text-[var(--amber-deep)]" /> Premium 50ml bottle · alcohol-based eau de parfum</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-[var(--amber-deep)]" /> UAE-blended oils · packed in Sydney, Australia</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-[var(--amber-deep)]" /> Long-lasting, suitable day & night</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-[var(--amber-deep)]" /> Cruelty-free</li>
          </ul>
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
        <aside className="rounded-2xl border border-border bg-[var(--cream)]/40 p-6 space-y-4">
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
      <section className="mt-20 rounded-3xl bg-[var(--cream)]/40 border border-border p-6 sm:p-10">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Our craft</span>
          <h2 className="font-display text-2xl sm:text-3xl mt-2">How we make every bottle</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm">
            Three deliberate stages, from raw ingredient to the bottle on your dresser.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <CraftCard n="01" img={ingredientsImg} alt="Oud wood, dried roses and amber resin" title="Sourcing" body="Highest-grade oud, Bulgarian rose, Madagascar vanilla, ambergris and Gulf aromatic oils — chosen for purity and character." />
          <CraftCard n="02" img={blendingImg} alt="Perfumer blending fragrance oils" title="Blending" body="Perfumers compose each fragrance by hand. Top, heart and base notes are layered, then aged so the oils marry into one balanced scent." />
          <CraftCard n="03" img={packingImg} alt="Black perfume bottle being placed into a gift box" title="Bottled in Sydney" body="Every 50ml bottle is filled, QC-checked and gift-boxed in our Sydney atelier. Orders ship across Australia within 24 hours." />
        </div>
        <div className="text-center mt-8">
          <Link to="/about" className="text-sm font-semibold underline-offset-4 hover:underline text-[var(--amber-deep)]">
            Read more about our atelier →
          </Link>
        </div>
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
    </div>
  );
}

function Feature({ i: Icon, t, d }: { i: any; t: string; d: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3 bg-background">
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

function CraftCard({ n, img, alt, title, body }: { n: string; img: string; alt: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-background border border-border">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={img} alt={alt} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="p-5">
        <div className="text-xs font-mono text-[var(--amber-deep)]">{n}</div>
        <h3 className="font-display text-lg mt-1">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-background p-4">
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
