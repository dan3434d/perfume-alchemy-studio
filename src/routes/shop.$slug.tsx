import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { useCart, useWishlist } from "@/hooks/useCart";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { Heart, ShoppingBag, Truck, RotateCcw, Lock, Minus, Plus, Star, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ").replace(/\d+$/, "").trim()} — Abdulrahman Perfumes` },
      { name: "description", content: "Premium perfume from Abdulrahman Perfumes." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string>("50ml");

  const product = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name,slug)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as any;
    },
  });

  const related = useQuery({
    queryKey: ["related", product.data?.category_id],
    enabled: !!product.data?.category_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,image_url,rating,categories(name)")
        .eq("category_id", product.data.category_id)
        .neq("id", product.data.id)
        .eq("is_active", true)
        .limit(4);
      return (data || []).map((p: any) => ({ ...p, category_name: p.categories?.name })) as ProductCardData[];
    },
  });

  if (product.isLoading) return <div className="container-px max-w-7xl mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  if (!product.data) return <div className="container-px max-w-7xl mx-auto py-20 text-center">Product not found.</div>;

  const p = product.data;
  const wished = has(p.id);
  const lowStock = p.stock > 0 && p.stock < 10;

  const doAdd = () => {
    add({ product_id: p.id, slug: p.slug, name: p.name, price: Number(p.price), image_url: p.image_url, stock: p.stock }, qty);
    toast.success(`Added ${qty} × ${p.name} to cart`);
  };
  const doBuy = () => { doAdd(); navigate({ to: "/checkout" }); };

  return (
    <div className="container-px max-w-7xl mx-auto py-10 sm:py-14">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-6 flex gap-1.5">
        <Link to="/" className="hover:text-foreground">Home</Link><span>/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link><span>/</span>
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--cream)] border border-border">
            <img src={productImage(p.image_url)} alt={p.name} className="w-full h-full object-cover" width={1024} height={1024} />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            {p.categories?.name && <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">{p.categories.name}</span>}
            <h1 className="font-display text-3xl sm:text-4xl mt-2">{p.name}</h1>
            <div className="flex items-center gap-3 mt-3 text-sm">
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-[var(--gold)] text-[var(--gold)]" />)}</div>
              <span className="text-muted-foreground">({p.rating ?? 4.8}) · {p.review_count ?? 0} reviews</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl">{formatAUD(p.price)}</span>
            <span className="text-xs text-muted-foreground">AUD · incl. taxes</span>
          </div>

          <p className="text-muted-foreground leading-relaxed">{p.long_description || p.description}</p>

          {/* Fragrance notes */}
          <div className="rounded-2xl border border-border p-5 bg-[var(--cream)]/30">
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-3">Fragrance notes</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <NoteCol label="Top" notes={p.notes_top} />
              <NoteCol label="Heart" notes={p.notes_heart} />
              <NoteCol label="Base" notes={p.notes_base} />
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Size</h3>
            <div className="flex gap-2">
              {["30ml", "50ml", "100ml"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-full px-4 py-2 text-sm border transition ${size === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border overflow-hidden">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-secondary"><Minus className="w-4 h-4" /></button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:bg-secondary"><Plus className="w-4 h-4" /></button>
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
            <Info i={Truck} t="Fast AU shipping" d="Ships within 24h" />
            <Info i={RotateCcw} t="30-day returns" d="Hassle-free" />
            <Info i={Lock} t="Secure checkout" d="Encrypted" />
          </div>

          <ul className="text-sm text-muted-foreground space-y-1.5 pt-2">
            <li className="flex gap-2"><Check className="w-4 h-4 text-[var(--amber-deep)]" /> Premium {size} bottle, alcohol-based perfume</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-[var(--amber-deep)]" /> Long-lasting, suitable day & night</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-[var(--amber-deep)]" /> Made for skin · cruelty-free</li>
          </ul>
        </div>
      </div>

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

function NoteCol({ label, notes }: { label: string; notes?: string[] | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 space-y-0.5">
        {(notes ?? []).map((n) => <div key={n}>{n}</div>)}
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
