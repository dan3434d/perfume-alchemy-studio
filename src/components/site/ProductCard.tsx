import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star, Sparkles } from "lucide-react";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { useCart, useWishlist } from "@/hooks/useCart";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  image_url: string | null;
  category_name?: string | null;
  rating?: number | null;
  stock?: number;
  inspired_by_brand?: string | null;
  inspired_by_product?: string | null;
  gender?: "mens" | "womens" | "unisex" | null;
};

const GENDER_LABEL: Record<string, string> = {
  mens: "Men",
  womens: "Women",
  unisex: "Unisex",
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const wished = has(p.id);
  const discount =
    p.compare_at_price && p.compare_at_price > p.price
      ? Math.round(100 - (Number(p.price) / Number(p.compare_at_price)) * 100)
      : 0;
  const inspiredFull = p.inspired_by_brand
    ? `${p.inspired_by_brand}${p.inspired_by_product ? ` ${p.inspired_by_product}` : ""}`
    : null;

  return (
    <div className="group card-elevated relative overflow-hidden flex flex-col rounded-2xl border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      {/* Highlight ribbon */}
      {inspiredFull && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-[var(--amber-deep)] to-[var(--gold)] text-background px-3 py-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="truncate">Inspired by {inspiredFull}</span>
        </div>
      )}
      <Link
        to="/shop/$slug"
        params={{ slug: p.slug }}
        className="relative block aspect-square bg-[var(--cream)] overflow-hidden"
      >
        <img
          src={productImage(p.image_url)}
          alt={p.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute top-9 left-3 rounded-full bg-foreground text-background text-[10px] font-semibold px-2.5 py-1 tracking-wider">
            −{discount}%
          </span>
        )}
        {p.gender && (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/90 backdrop-blur text-foreground text-[10px] font-semibold px-2.5 py-1 tracking-wider border border-border">
            {GENDER_LABEL[p.gender] ?? "Unisex"}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          aria-label="Toggle wishlist"
          className="absolute top-9 right-3 grid place-items-center w-9 h-9 rounded-full bg-background/90 backdrop-blur shadow-sm hover:bg-background"
        >
          <Heart className={`w-4 h-4 ${wished ? "fill-[var(--amber-deep)] text-[var(--amber-deep)]" : "text-foreground/70"}`} />
        </button>
      </Link>
      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1 min-w-0">
        {p.category_name && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{p.category_name}</span>
        )}
        <Link to="/shop/$slug" params={{ slug: p.slug }} className="font-display text-base sm:text-lg leading-tight hover:text-[var(--amber-deep)] line-clamp-2">
          {p.name}
        </Link>
        {inspiredFull && (
          <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs rounded-md bg-[var(--cream)] border border-[var(--gold)]/40 px-2 py-1 text-foreground/85 w-fit">
            <Sparkles className="w-3 h-3 text-[var(--amber-deep)] shrink-0" />
            <span className="truncate"><span className="text-muted-foreground">Inspired by</span> <span className="font-semibold">{inspiredFull}</span></span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3.5 h-3.5 fill-[var(--gold)] text-[var(--gold)] shrink-0" />
          <span>{(p.rating ?? 4.8).toFixed(1)}</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
            <span className="font-semibold text-sm sm:text-base">{formatAUD(p.price)}</span>
            {p.compare_at_price && p.compare_at_price > p.price && (
              <span className="text-[11px] sm:text-xs text-muted-foreground line-through">{formatAUD(p.compare_at_price)}</span>
            )}
          </div>
          <button
            onClick={() => {
              add({
                product_id: p.id,
                slug: p.slug,
                name: p.name,
                price: p.price,
                image_url: p.image_url,
                stock: p.stock,
                inspired_by_brand: p.inspired_by_brand ?? null,
                inspired_by_product: p.inspired_by_product ?? null,
              });
              toast.success(`${p.name} added to cart`);
            }}
            aria-label={`Add ${p.name} to cart`}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-full btn-gold h-9 w-9 sm:w-auto sm:px-3.5 sm:py-2"
          >
            <ShoppingBag className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
