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
    <div className="group relative flex flex-col">
      <Link
        to="/shop/$slug"
        params={{ slug: p.slug }}
        className="relative block aspect-square bg-[var(--cream)] overflow-hidden rounded-sm"
      >
        <img
          src={productImage(p.image_url)}
          alt={p.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-sm bg-foreground text-background text-[10px] font-semibold px-2 py-1 tracking-wider uppercase">
            Save {discount}%
          </span>
        )}
        {p.gender && (
          <span className="absolute bottom-3 left-3 rounded-sm bg-background/95 text-foreground text-[10px] font-semibold px-2 py-1 tracking-wider uppercase border border-border">
            {GENDER_LABEL[p.gender] ?? "Unisex"}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-full bg-background/95 border border-border hover:bg-background"
        >
          <Heart className={`w-4 h-4 ${wished ? "fill-foreground text-foreground" : "text-foreground/60"}`} />
        </button>
      </Link>
      <div className="pt-3 flex flex-col gap-1.5 flex-1 min-w-0">
        {p.category_name && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">{p.category_name}</span>
        )}
        <Link to="/shop/$slug" params={{ slug: p.slug }} className="font-medium text-sm sm:text-base leading-snug hover:underline underline-offset-4 line-clamp-2">
          {p.name}
        </Link>
        {inspiredFull && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground w-fit">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">Inspired by <span className="text-foreground font-medium">{inspiredFull}</span></span>
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3.5 h-3.5 fill-foreground text-foreground shrink-0" />
          <span>{(p.rating ?? 4.8).toFixed(1)}</span>
        </div>

        <div className="flex items-baseline gap-2 min-w-0 flex-wrap mt-auto pt-1">
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
          className="mt-2 w-full inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] rounded-sm border border-foreground bg-transparent text-foreground py-2.5 hover:bg-foreground hover:text-background transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Add to cart
        </button>

      </div>
    </div>
  );
}
