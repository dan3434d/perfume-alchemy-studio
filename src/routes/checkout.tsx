import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe-client";
import { useCart } from "@/hooks/useCart";
import { useDiscount } from "@/hooks/useDiscount";
import { useCartPricing } from "@/hooks/useCartPricing";
import { getVisitorKey } from "@/hooks/usePricingOffer";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { createEmbeddedStripeCheckout } from "@/lib/checkout.functions";

import { AddressAutocomplete } from "@/components/site/AddressAutocomplete";
import { UpsellBuyTwo } from "@/components/site/UpsellBuyTwo";
import {
  computeBulkDiscountPercent,
  computeShipping,
  BULK_DISCOUNT_PERCENT,
  BULK_DISCOUNT_MIN_QTY,
  FREE_SHIPPING_THRESHOLD,
  RURAL_HANDLING_FEE,
  RURAL_HANDLING_WAIVED_OVER,
  EXPRESS_SHIPPING_SURCHARGE,
  WORLDWIDE_SHIPPING_FEE,
  COUNTRIES,
  isAustralia,
  type ShippingMethod,
} from "@/lib/pricing";
import { toast } from "sonner";
import { Lock, Truck, ShieldCheck, BadgePercent, X, ArrowLeft, CreditCard, Loader2, Globe2, RotateCcw, Pencil } from "lucide-react";


export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [
    { title: "Secure Checkout — Abdulrahman Perfumes" },
    { name: "description", content: "Complete your Abdulrahman Perfumes order with secure on-site payment, tracked delivery and 30-day returns." },
    { property: "og:title", content: "Secure Checkout — Abdulrahman Perfumes" },
    { property: "og:description", content: "Secure payment, clear delivery choices and 30-day returns." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Checkout,
});

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

function Checkout() {
  const location = useLocation();
  const { lines, count } = useCart();
  const { discount, clear: clearDiscount } = useDiscount();
  const navigate = useNavigate();
  const startStripe = useServerFn(createEmbeddedStripeCheckout);

  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [freeShip, setFreeShip] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [form, setForm] = useState({
    email: "", full_name: "", phone: "",
    line1: "", line2: "", city: "", state: "", postcode: "", country: "Australia",
    notes: "",
  });
  const intl = !isAustralia(form.country);
  const { quote, pricedLines, subtotal, loading: quoteLoading } = useCartPricing(lines, { postcode: form.postcode, country: form.country });


  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === "FREESHIPPING") {
      setFreeShip(true);
      toast.success("FREESHIPPING applied — shipping is on us");
    } else {
      toast.error("Invalid promo code");
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setForm((f) => ({ ...f, email: data.user!.email ?? "" }));
    });
    const params = new URLSearchParams(window.location.search);
    if (params.get("cancelled") === "1") {
      toast.error("Payment cancelled. You can try again.");
    }
  }, []);

  const discountPercent = useMemo(
    () => quote ? 0 : computeBulkDiscountPercent(count, discount?.percent ?? 0),
    [count, discount?.percent, quote],
  );
  const discountAmount = +(subtotal * discountPercent / 100).toFixed(2);
  const subtotalAfterDiscount = +(subtotal - discountAmount).toFixed(2);
  const rawShip = useMemo(
    () => computeShipping(subtotalAfterDiscount, { state: form.state, postcode: form.postcode, country: form.country }, shippingMethod),
    [subtotalAfterDiscount, form.state, form.postcode, form.country, shippingMethod],
  );
  const ship = freeShip && !intl
    ? { ...rawShip, base: 0, handling: 0, total: 0, freeShipping: true }
    : rawShip;

  const total = +(subtotalAfterDiscount + ship.total).toFixed(2);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) { toast.error("Your cart is empty"); return; }
    if (!quote) { toast.error("Your current offer is still updating"); return; }


    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { client_secret } = await startStripe({
        data: {
          email: form.email,
          full_name: form.full_name,
          phone: form.phone || null,
          shipping_line1: form.line1,
          shipping_line2: form.line2 || null,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_postcode: form.postcode,
          shipping_country: form.country,
          notes: form.notes || null,
          lines: pricedLines.map((l) => ({
            product_id: l.product_id, name: l.name, slug: l.slug,
            price: l.price, quantity: l.quantity, image_url: l.image_url ?? null,
          })),
          discount_code: freeShip && !intl ? "FREESHIPPING" : (discount?.code ?? null),
          discount_percent: freeShip && !intl ? 0 : (discount?.percent ?? 0),
          shipping_method: intl ? "worldwide" : shippingMethod,
          user_id: userData.user?.id ?? null,
          origin: window.location.origin,
          pricing_quote_id: quote.id,
          visitor_key: getVisitorKey(),

        },
      });
      if (!client_secret) throw new Error("Could not start payment");
      setClientSecret(client_secret);
      // smooth scroll to the embedded panel
      setTimeout(() => {
        document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchClientSecret = useCallback(() => Promise.resolve(clientSecret ?? ""), [clientSecret]);

  if (location.pathname !== "/checkout" && location.pathname.startsWith("/checkout/")) {
    return <Outlet />;
  }

  if (lines.length === 0) {
    return (
      <div className="container-px max-w-3xl mx-auto py-20 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link to="/shop" className="btn-gold inline-block mt-6 rounded-full px-6 py-3 text-sm font-semibold">Browse shop</Link>
      </div>
    );
  }

  const detailsSummary = [
    form.email,
    form.full_name,
    [form.line1, form.line2].filter(Boolean).join(", "),
    [form.city, form.state, form.postcode].filter(Boolean).join(" "),
    form.country,
  ].filter(Boolean).join(" · ");

  return (
    <div className="container-px max-w-6xl mx-auto py-10 sm:py-14 pb-32 lg:pb-16">
      <header className="mb-10 sm:mb-12">
        <h1 className="font-display text-4xl mb-2">Checkout</h1>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground" aria-label="What this page covers">
          <span>Information</span>
          <span className="h-px w-8 bg-foreground/20" />
          <span>Shipping</span>
          <span className="h-px w-8 bg-foreground/20" />
          <span>Payment</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
        {/* ============ Left: one continuous flow ============ */}
        <div className="space-y-12 min-w-0">
          <form onSubmit={onSubmit} id="checkout-details" className="space-y-12">
            {/* Contact information */}
            {!clientSecret ? (
              <>
                <Section title="Contact information">
                  <Field label="Email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" name="email" autoComplete="email" inputMode="email" placeholder="Email address" />
                </Section>

                {/* Shipping address */}
                <Section title="Shipping address">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full name" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} name="name" autoComplete="name" placeholder="Full name" />
                    <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" name="tel" autoComplete="tel" inputMode="tel" placeholder="Phone" />
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Address *</span>
                    <div className="mt-1">
                      <AddressAutocomplete
                        value={form.line1}
                        onChange={(v) => setForm((f) => ({ ...f, line1: v }))}
                        onSelect={(s) => setForm((f) => ({
                          ...f,
                          line1: s.line1,
                          city: s.city || f.city,
                          state: s.state || f.state,
                          postcode: s.postcode || f.postcode,
                          country: s.country,
                        }))}
                        required
                      />
                    </div>
                  </label>
                  <Field label="Apartment, suite, etc. (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} name="address-line2" autoComplete="address-line2" placeholder="Apartment, suite, etc. (optional)" />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="City / suburb" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} name="address-level2" autoComplete="address-level2" placeholder="City" />
                    {intl ? (
                      <Field label="State / Region" value={form.state} onChange={(v) => setForm({ ...form, state: v })} placeholder="State / Region" />
                    ) : (
                      <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">State *</span>
                        <select
                          name="address-level1"
                          autoComplete="address-level1"
                          required
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          className="mt-1 w-full rounded-sm border border-border bg-card px-4 py-3.5 text-sm focus:outline-none focus:border-amber-deep transition-colors appearance-none"
                        >
                          <option value="">Select…</option>
                          {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                    )}
                    <Field label={intl ? "Postal code" : "Postcode"} required value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} name="postal-code" autoComplete="postal-code" inputMode="numeric" placeholder="Postcode" />
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Country *</span>
                    <select
                      name="country-name"
                      autoComplete="country-name"
                      required
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="mt-1 w-full rounded-sm border border-border bg-card px-4 py-3.5 text-sm focus:outline-none focus:border-amber-deep transition-colors appearance-none"
                    >
                      {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                  </label>
                </Section>

                {/* Shipping method */}
                <Section title="Shipping method">
                  {intl ? (
                    <ShippingOption
                      selected
                      title="Worldwide tracked"
                      detail={`7–14 business days to ${form.country}`}
                      price={formatAUD(WORLDWIDE_SHIPPING_FEE)}
                    />
                  ) : (
                    <div className="space-y-3">
                      <ShippingOption
                        selected={shippingMethod === "standard"}
                        onSelect={() => setShippingMethod("standard")}
                        title="Standard shipping (3–5 business days)"
                        detail={`Free over ${formatAUD(FREE_SHIPPING_THRESHOLD)}`}
                        price={rawShip.method === "standard" ? (rawShip.base === 0 ? "Free" : formatAUD(rawShip.base)) : undefined}
                      />
                      <ShippingOption
                        selected={shippingMethod === "express"}
                        onSelect={() => setShippingMethod("express")}
                        title="Express shipping (1–2 business days)"
                        detail={`+${formatAUD(EXPRESS_SHIPPING_SURCHARGE)} on top`}
                        price={shippingMethod === "express" ? formatAUD(rawShip.base) : `+${formatAUD(EXPRESS_SHIPPING_SURCHARGE)}`}
                      />
                    </div>
                  )}
                </Section>

                <details className="border-b border-border pb-6">
                  <summary className="cursor-pointer text-sm font-medium">Add an order note <span className="text-muted-foreground font-normal">(optional)</span></summary>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="mt-4 w-full rounded-sm border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:border-amber-deep transition-colors"
                    placeholder="Anything we should know?"
                  />
                </details>
              </>
            ) : (
              <section className="border-b border-border pb-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl mb-1.5">Your details</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed break-words">{detailsSummary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClientSecret(null)}
                    className="shrink-0 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mt-1"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </section>
            )}
          </form>

          {/* Payment — same page, revealed in place */}
          <section id="payment-section" className="space-y-4 scroll-mt-24">
            <h2 className="font-display text-xl">Payment</h2>
            <p className="text-sm text-muted-foreground">All transactions are secure and encrypted. Card, Apple Pay and Google Pay are accepted.</p>
            {!clientSecret ? (
              <button
                type="submit"
                form="checkout-details"
                disabled={submitting || quoteLoading}
                className="w-full bg-amber-deep text-white py-5 rounded-sm font-medium tracking-widest uppercase text-sm hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting || quoteLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Preparing secure payment…</>
                ) : (
                  <><Lock className="w-4 h-4" /> Complete purchase · {formatAUD(total)}</>
                )}
              </button>
            ) : (
              <div className="bg-card border border-border rounded-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-sand/60 flex justify-between items-center">
                  <span className="font-medium text-sm flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-amber-deep" /> Secure payment</span>
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Stripe</span>
                </div>
                <div className="p-3 sm:p-4">
                  <EmbeddedCheckoutProvider
                    stripe={getStripePromise()}
                    options={{ fetchClientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </div>
            )}
            {clientSecret && (
              <p className="text-[11px] text-center text-muted-foreground">
                Powered by Stripe · Your card details never touch our servers.
              </p>
            )}
          </section>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-between items-center gap-3 py-6 border-t border-border text-[10px] tracking-widest uppercase text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-deep" /> Secure checkout</span>
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-amber-deep" /> Tracked from Sydney</span>
            <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-amber-deep" /> 30-day returns</span>
          </div>
        </div>

        {/* ============ Right: order summary card ============ */}
        <aside className="min-w-0">
          <div className="bg-card border border-border rounded-sm p-6 sm:p-8 space-y-6 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
              <h2 className="font-display text-2xl">Order summary</h2>
              <span className="eyebrow text-[9px]">{count} {count === 1 ? "bottle" : "bottles"}</span>
            </div>

            <div className="space-y-4 max-h-72 overflow-auto pr-1 -mr-1">
              {pricedLines.map((l) => (
                <div key={l.product_id} className="flex gap-4 items-start">
                  <div className="relative w-16 h-20 bg-sand rounded-sm flex-shrink-0 overflow-hidden ring-1 ring-border">
                    <img src={productImage(l.image_url)} alt={l.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-0 -right-0 bg-amber-deep text-white min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-semibold translate-x-1 -translate-y-1">
                      {l.quantity}
                    </span>
                  </div>
                  <div className="flex-1 text-sm min-w-0">
                    <div className="font-medium truncate">{l.name}</div>
                    {l.inspired_by_brand && (
                      <div className="text-[11px] text-amber-deep font-semibold truncate">
                        Inspired by {l.inspired_by_brand}{l.inspired_by_product ? ` ${l.inspired_by_product}` : ""}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">50ml · Eau de parfum</div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-sm font-medium">{formatAUD(l.price * l.quantity)}</div>
                    {l.referencePrice > l.price && <div className="text-[10px] text-muted-foreground line-through">{formatAUD(l.referencePrice * l.quantity)}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <Link to="/cart" className="link-underline">Edit bag</Link>
              <Link to="/shop" className="link-underline">Keep shopping</Link>
            </div>

            {count === 1 && (
              <div className="rounded-sm border border-amber-deep/30 bg-amber-deep/5 px-3 py-2.5 text-xs">
                <span className="font-semibold text-amber-deep">One more bottle unlocks {BULK_DISCOUNT_PERCENT}% off</span>
                <span className="text-muted-foreground"> — your best available two-bottle price appears automatically.</span>
              </div>
            )}

            {count >= BULK_DISCOUNT_MIN_QTY && !quote && (
              <div className="flex items-center gap-2 rounded-sm bg-amber-deep/10 px-3 py-2 text-xs text-amber-deep font-semibold">
                <BadgePercent className="w-4 h-4" /> Buy {BULK_DISCOUNT_MIN_QTY}+ unlocked — {BULK_DISCOUNT_PERCENT}% off applied
              </div>
            )}

            {discount && !quote && (
              <div className="flex items-center justify-between gap-2 rounded-sm bg-amber-deep/10 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 text-amber-deep font-semibold">
                  <BadgePercent className="w-4 h-4" /> {discount.code} · −{discount.percent}%
                </span>
                <button type="button" onClick={clearDiscount} aria-label="Remove discount" className="p-1 hover:opacity-70">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {freeShip ? (
              <div className="flex items-center justify-between gap-2 rounded-sm bg-amber-deep/10 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 text-amber-deep font-semibold">
                  <BadgePercent className="w-4 h-4" /> FREESHIPPING · Free shipping
                </span>
                <button
                  type="button"
                  onClick={() => { setFreeShip(false); setPromoInput(""); }}
                  aria-label="Remove promo"
                  className="p-1 hover:opacity-70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Discount code"
                  className="flex-1 min-w-0 rounded-sm border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-amber-deep transition-colors"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="bg-foreground text-background px-4 py-2.5 text-xs uppercase tracking-wider font-medium rounded-sm hover:opacity-90 transition-opacity"
                >
                  Apply
                </button>
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-2.5 text-sm">
              {quote && quote.savings > 0 && (
                <div className="mb-3 rounded-sm bg-sand px-3 py-2.5" aria-live="polite">
                  <div className="flex items-center justify-between gap-3">
                    <span className="eyebrow text-[9px] text-amber-deep">Your current offer</span>
                    <span className="font-semibold text-amber-deep">Save {formatAUD(quote.savings)}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Held for 30 minutes while you complete checkout.</div>
                </div>
              )}
              <Row label="Subtotal" value={formatAUD(subtotal)} />
              {discountAmount > 0 && <Row label={`Discount (−${discountPercent}%)`} value={`− ${formatAUD(discountAmount)}`} accent />}
              <Row
                label={
                  ship.method === "worldwide"
                    ? "Shipping (worldwide)"
                    : ship.method === "express"
                      ? "Shipping (express)"
                      : ship.freeShipping ? "Shipping" : "Shipping (standard)"
                }
                value={ship.base === 0 ? "Free" : formatAUD(ship.base)}
              />
              {ship.handling > 0 && (
                <Row label="Remote area handling" value={formatAUD(ship.handling)} />
              )}
              <div className="flex justify-between items-baseline font-semibold text-base pt-4 border-t border-border">
                <span>Total <span className="text-xs text-muted-foreground font-normal align-middle ml-1">AUD</span></span>
                <span className="font-display text-2xl">{formatAUD(total)}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Free standard shipping in AU over {formatAUD(FREE_SHIPPING_THRESHOLD)}. Express +{formatAUD(EXPRESS_SHIPPING_SURCHARGE)}. Worldwide flat {formatAUD(WORLDWIDE_SHIPPING_FEE)}. Remote AU (WA, NT, TAS, Far North QLD) adds {formatAUD(RURAL_HANDLING_FEE)} — waived over {formatAUD(RURAL_HANDLING_WAIVED_OVER)}.
            </p>

            {!clientSecret && (
              <div className="bg-sand/60 border border-border rounded-sm p-4">
                <UpsellBuyTwo />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile sticky pay bar */}
      {!clientSecret && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <button
            type="submit"
            form="checkout-details"
            disabled={submitting || quoteLoading}
            className="w-full bg-amber-deep text-white rounded-sm py-4 font-medium tracking-widest uppercase text-xs disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Working…</>
            ) : (
              <><Lock className="w-4 h-4" /> Complete purchase · {formatAUD(total)}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 border-b border-border pb-10 last:border-b-0 last:pb-0">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ShippingOption({ selected, onSelect, title, detail, price }: { selected: boolean; onSelect?: () => void; title: string; detail: string; price?: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      aria-pressed={selected}
      className={`w-full flex items-center justify-between gap-4 p-4 rounded-sm border text-left transition-colors ${
        selected ? "border-amber-deep bg-card" : "border-border bg-card hover:border-amber-deep/40"
      }`}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className={`w-4 h-4 rounded-full shrink-0 ${selected ? "border-4 border-amber-deep" : "border border-foreground/25"}`} />
        <span className="min-w-0">
          <span className="block text-sm truncate">{title}</span>
          <span className="block text-[11px] text-muted-foreground mt-0.5">{detail}</span>
        </span>
      </span>
      {price && <span className="text-sm font-medium shrink-0">{price}</span>}
    </button>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-amber-deep font-semibold" : ""}>{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", name, autoComplete, inputMode, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; name?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}{required && " *"}</span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-card px-4 py-3.5 text-sm focus:outline-none focus:border-amber-deep transition-colors placeholder:text-muted-foreground/50"
      />
    </label>
  );
}
