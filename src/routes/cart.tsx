import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import {
  FREE_SHIPPING_THRESHOLD,
  METRO_SHIPPING_FEE,
  BULK_DISCOUNT_PERCENT,
  BULK_DISCOUNT_MIN_QTY,
  computeBulkDiscountPercent,
} from "@/lib/pricing";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, BadgePercent } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Abdulrahman Perfumes" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines, updateQty, remove, subtotal, count } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bulkPercent = computeBulkDiscountPercent(count);
  const discountAmount = +(subtotal * bulkPercent / 100).toFixed(2);
  const subtotalAfterDiscount = +(subtotal - discountAmount).toFixed(2);
  const shipping = subtotalAfterDiscount === 0 ? 0 : subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : METRO_SHIPPING_FEE;
  const total = +(subtotalAfterDiscount + shipping).toFixed(2);

  if (!mounted) {
    return <div className="container-px max-w-6xl mx-auto py-20 text-center text-muted-foreground">Loading cart…</div>;
  }


  return (
    <div className="container-px max-w-6xl mx-auto py-10 sm:py-14">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Your cart</h1>

      {lines.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Your cart is empty.</p>
          <Link to="/shop" className="btn-gold inline-block mt-6 rounded-full px-6 py-3 text-sm font-semibold">Continue shopping</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 divide-y divide-border border-y border-border">
            {lines.map((l) => (
              <div key={l.product_id} className="py-5 flex gap-4">
                <Link to="/shop/$slug" params={{ slug: l.slug }} className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[var(--cream)] flex-shrink-0">
                  <img src={productImage(l.image_url)} alt={l.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <Link to="/shop/$slug" params={{ slug: l.slug }} className="font-display text-lg hover:text-[var(--amber-deep)]">{l.name}</Link>
                    {l.inspired_by_brand && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] rounded-md bg-[var(--cream)] border border-[var(--gold)]/40 px-2 py-0.5 text-foreground/85">
                        <span className="text-muted-foreground">Inspired by</span>
                        <span className="font-semibold">{l.inspired_by_brand}{l.inspired_by_product ? ` ${l.inspired_by_product}` : ""}</span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">{formatAUD(l.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-border" role="group" aria-label={`Quantity for ${l.name}`}>
                      <button type="button" onClick={() => updateQty(l.product_id, l.quantity - 1)} aria-label={`Decrease quantity of ${l.name}`} className="p-2 hover:bg-secondary"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-8 text-center text-sm" aria-live="polite">{l.quantity}</span>
                      <button type="button" onClick={() => updateQty(l.product_id, l.quantity + 1)} aria-label={`Increase quantity of ${l.name}`} className="p-2 hover:bg-secondary"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="w-20 text-right font-semibold">{formatAUD(l.price * l.quantity)}</div>
                    <button onClick={() => remove(l.product_id)} aria-label="Remove" className="p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {count < BULK_DISCOUNT_MIN_QTY && (
              <div className="py-4 flex items-center gap-2 text-xs text-[var(--amber-deep)]">
                <BadgePercent className="w-4 h-4" />
                Add 1 more bottle to unlock {BULK_DISCOUNT_PERCENT}% off — Buy 2, save {BULK_DISCOUNT_PERCENT}%.
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="card-elevated p-6 space-y-4">
              <h2 className="font-display text-xl">Order summary</h2>
              <Row k="Subtotal" v={formatAUD(subtotal)} />
              {bulkPercent > 0 && (
                <Row k={`Buy ${BULK_DISCOUNT_MIN_QTY}+ discount (−${bulkPercent}%)`} v={`− ${formatAUD(discountAmount)}`} accent />
              )}
              <Row k="Shipping (metro AU)" v={shipping === 0 ? "Free" : formatAUD(shipping)} />
              <div className="border-t border-border pt-4 flex items-baseline justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl">{formatAUD(total)}</span>
              </div>
              <Link to="/checkout" className="btn-gold w-full rounded-full py-3 inline-flex items-center justify-center gap-2 font-semibold">
                Checkout <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/shop" className="block text-center text-sm text-muted-foreground hover:text-foreground">Continue shopping</Link>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                Free metro shipping over {formatAUD(FREE_SHIPPING_THRESHOLD)}. Remote areas (WA, NT, TAS, Far North QLD) add a {formatAUD(5.5)} handling fee — waived on orders over {formatAUD(100)}.
              </p>
            </div>
            {subtotalAfterDiscount > 0 && subtotalAfterDiscount < FREE_SHIPPING_THRESHOLD && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Add {formatAUD(FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount)} more for free metro shipping.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={accent ? "text-[var(--amber-deep)] font-semibold" : ""}>{v}</span>
    </div>
  );
}

