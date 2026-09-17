import { Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { useCart, useWishlist } from "@/hooks/useCart";
import { toast } from "sonner";
import { OfferPrice } from "./OfferPrice";
import { usePricingOffer } from "@/hooks/usePricingOffer";

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
  mens: "For him",
  womens: "For her",
  unisex: "For everyone",
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const { has, toggle } = useWishlist();
  const wished = has(p.id);
  const offer = usePricingOffer(Number(p.price));
  const discount =
    p.compare_at_price && p.compare_at_price > p.price
      ? Math.round(100 - (Number(p.price) / Number(p.compare_at_price)) * 100)
      : 0;
  const inspiredFull = p.inspired_by_brand
    ? `${p.inspired_by_brand}${p.inspired_by_product ? ` ${p.inspired_by_product}` : ""}`
    : null;

  return (
    <article className="group relative flex flex-col">
      <Link
        to="/shop/$slug"
        params={{ slug: p.slug }}
        className="relative block aspect-[4/5] bg-[var(--sand)] overflow-hidden border border-border"
      >
        <img
          src={productImage(p.image_url)}
          alt={p.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
        />
        {discount > 0 && (
          <span className="absolute top-0 left-0 bg-foreground text-background text-[10px] tracking-[0.18em] uppercase px-3 py-1.5">
            −{discount}%
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          aria-label={`${wished ? "Remove" : "Save"} ${p.name} ${wished ? "from" : "to"} wishlist`}
          className="absolute top-2.5 right-2.5 grid place-items-center w-8 h-8 bg-background/90 border border-border hover:bg-background"
        >
          <Heart className={`w-3.5 h-3.5 ${wished ? "fill-foreground text-foreground" : "text-foreground/55"}`} />
        </button>
      </Link>

      <div className="pt-4 flex flex-col gap-1.5 flex-1 min-w-0">
        <span className="eyebrow text-[10px]">
          {p.category_name || GENDER_LABEL[p.gender ?? "unisex"]}
        </span>
        <Link
          to="/shop/$slug"
          params={{ slug: p.slug }}
          className="font-display text-lg sm:text-xl leading-tight link-underline w-fit"
        >
          {p.name}
        </Link>
        {inspiredFull && (
          <p className="text-[11.5px] text-muted-foreground leading-snug">
            In the spirit of <span className="text-foreground">{inspiredFull}</span>
          </p>
        )}
        <div className="mt-auto pt-3"><OfferPrice basePrice={Number(p.price)} /></div>
        <button
          onClick={() => {
            add({
              product_id: p.id,
              slug: p.slug,
              name: p.name,
              price: offer.price,
              image_url: p.image_url,
              stock: p.stock,
              inspired_by_brand: p.inspired_by_brand ?? null,
              inspired_by_product: p.inspired_by_product ?? null,
            });
            toast.success(`${p.name} added to your bag`);
            navigate({ to: "/checkout" });
          }}
          aria-label={`Add ${p.name} to bag`}
          className="btn-outline mt-3 w-full py-2.5"
        >
          Add to bag
        </button>
      </div>
    </article>
  );
}
