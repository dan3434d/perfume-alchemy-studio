import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { useCart, useWishlist } from "@/hooks/useCart";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  category_name?: string | null;
  rating?: number | null;
  stock?: number;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const wished = has(p.id);

  return (
    <div className="group card-elevated overflow-hidden flex flex-col">
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
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-background/90 backdrop-blur shadow-sm hover:bg-background"
        >
          <Heart className={`w-4 h-4 ${wished ? "fill-[var(--amber-deep)] text-[var(--amber-deep)]" : "text-foreground/70"}`} />
        </button>
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        {p.category_name && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.category_name}</span>
        )}
        <Link to="/shop/$slug" params={{ slug: p.slug }} className="font-display text-lg leading-tight hover:text-[var(--amber-deep)]">
          {p.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3.5 h-3.5 fill-[var(--gold)] text-[var(--gold)]" />
          <span>{(p.rating ?? 4.8).toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-semibold">{formatAUD(p.price)}</span>
          <button
            onClick={() => {
              add({ product_id: p.id, slug: p.slug, name: p.name, price: p.price, image_url: p.image_url, stock: p.stock });
              toast.success(`${p.name} added to cart`);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 btn-gold"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
