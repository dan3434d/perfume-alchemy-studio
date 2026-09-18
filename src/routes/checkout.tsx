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
import { Lock, Truck, ShieldCheck, BadgePercent, X, ArrowLeft, CreditCard, Loader2, Zap, Globe2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";


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
        document.getElementById("stripe-embed")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <div className="container-px max-w-6xl mx-auto py-8 sm:py-14 pb-32 lg:pb-14">
      <div className="flex items-center gap-3 mb-7 text-xs" aria-label="Checkout progress">
        {["Delivery", "Secure payment"].map((s, i) => {
          const stepIdx = clientSecret ? 1 : 0;
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <span className={`w-6 h-6 grid place-items-center text-[10px] font-bold transition-colors ${active ? "bg-foreground text-background" : done ? "bg-[var(--amber-deep)] text-background" : "border border-border text-muted-foreground"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={active ? "font-semibold" : "text-muted-foreground"}>{s}</span>
              {i === 0 && <span className="w-10 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      <h1 className="font-display text-3xl sm:text-4xl mb-2">Checkout</h1>
      <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5" /> Payment stays on this site · Prices in AUD
      </p>

      <div className="grid grid-cols-3 border-y border-border mb-8" aria-label="Order assurances">
        <CheckoutTrust i={ShieldCheck} t="Encrypted payment" d="Processed by Stripe" />
        <CheckoutTrust i={Truck} t="Tracked delivery" d="Dispatched from Sydney" />
        <CheckoutTrust i={RotateCcw} t="30-day returns" d="On unopened bottles" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="lg:col-span-2 space-y-6">
          {!clientSecret && (
            <form onSubmit={onSubmit} className="space-y-6" id="checkout-details">
              <Section title="Where should we send it?" subtitle="We’ll email your receipt and tracking details.">
                <Field label="Email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" name="email" autoComplete="email" inputMode="email" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} name="name" autoComplete="name" />
                  <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" name="tel" autoComplete="tel" inputMode="tel" />
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Address line 1 *</span>
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
                <Field label="Apt / suite (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} name="address-line2" autoComplete="address-line2" />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City / suburb" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} name="address-level2" autoComplete="address-level2" />
                  {intl ? (
                    <Field label="State / Region" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
                  ) : (
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">State *</span>
                      <select
                        name="address-level1"
                        autoComplete="address-level1"
                        required
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="mt-1 w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                      >
                        <option value="">Select…</option>
                        {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                  )}
                  <Field label={intl ? "Postal code" : "Postcode"} required value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} name="postal-code" autoComplete="postal-code" inputMode="numeric" />
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Country *</span>
                  <select
                    name="country-name"
                    autoComplete="country-name"
                    required
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="mt-1 w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                  >
                    {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </label>
              </Section>

              <Section title="Shipping method" subtitle={intl ? "International orders ship worldwide via tracked air." : "Choose how fast you'd like it."}>
                {intl ? (
                  <div className="rounded-xl border border-[var(--amber-deep)]/40 bg-[var(--amber-deep)]/5 p-4 flex items-start gap-3">
                    <Globe2 className="w-5 h-5 text-[var(--amber-deep)] mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold">Worldwide tracked</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Flat {formatAUD(WORLDWIDE_SHIPPING_FEE)} · 7–14 business days to {form.country}.</div>
                    </div>
                    <div className="ml-auto font-semibold text-sm">{formatAUD(WORLDWIDE_SHIPPING_FEE)}</div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShippingMethod("standard")}
                      className={`h-auto min-h-24 whitespace-normal rounded-none p-4 text-left justify-start items-start ${shippingMethod === "standard" ? "border-foreground bg-secondary" : "border-border"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <Truck className="w-4 h-4 text-[var(--amber-deep)]" /> Standard
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">3–5 business days · Free over {formatAUD(FREE_SHIPPING_THRESHOLD)}.</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShippingMethod("express")}
                      className={`h-auto min-h-24 whitespace-normal rounded-none p-4 text-left justify-start items-start ${shippingMethod === "express" ? "border-foreground bg-secondary" : "border-border"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <Zap className="w-4 h-4 text-[var(--amber-deep)]" /> Express
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">1–2 business days · +{formatAUD(EXPRESS_SHIPPING_SURCHARGE)} on top.</div>
                      </div>
                    </Button>
                  </div>
                )}
              </Section>

              <details className="border-y border-border py-4">
                <summary className="cursor-pointer text-sm font-medium">Add an order note <span className="text-muted-foreground font-normal">(optional)</span></summary>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="mt-4 w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="Anything we should know?"
                />
              </details>

              <Section title="Payment" subtitle="The secure payment form opens next, without sending you away.">
                <div className="border border-border p-4 flex flex-wrap items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-[var(--amber-deep)]" />
                  <span className="font-semibold">Card, Apple Pay or Google Pay</span>
                  <span className="text-xs text-muted-foreground sm:ml-auto">Encrypted by Stripe</span>
                </div>
              </Section>

              {/* Desktop submit (in-form). Mobile uses sticky bar below. */}
              <button
                type="submit"
                disabled={submitting || quoteLoading}
                className="hidden lg:inline-flex btn-gold w-full rounded-full py-3.5 font-semibold disabled:opacity-60 items-center justify-center gap-2"
              >
                {submitting || quoteLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Preparing secure payment…</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Continue to payment · {formatAUD(total)}</>
                )}
              </button>
            </form>
          )}

          {clientSecret && (
            <div id="stripe-embed" className="card-elevated p-3 sm:p-5">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-display text-xl flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--amber-deep)]" /> Secure payment
                </h2>
                <button
                  type="button"
                  onClick={() => setClientSecret(null)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit details
                </button>
              </div>
              <div className="rounded-xl overflow-hidden bg-background">
                <EmbeddedCheckoutProvider
                  stripe={getStripePromise()}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
              <p className="text-[11px] text-center text-muted-foreground mt-3">
                Powered by Stripe · Your card details never touch our servers.
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="border-y border-border py-5 sm:py-6 space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl">Your order</h2>
              <span className="eyebrow text-[9px]">{count} {count === 1 ? "bottle" : "bottles"}</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-auto pr-1 -mr-1">
              {pricedLines.map((l) => (
                <div key={l.product_id} className="flex gap-3 items-start">
                  <img src={productImage(l.image_url)} alt={l.name} className="w-12 h-12 rounded-lg object-cover ring-1 ring-border" />
                  <div className="flex-1 text-sm min-w-0">
                    <div className="font-medium truncate">{l.name}</div>
                    {l.inspired_by_brand && (
                      <div className="text-[11px] text-[var(--amber-deep)] font-semibold truncate">
                        Inspired by {l.inspired_by_brand}{l.inspired_by_product ? ` ${l.inspired_by_product}` : ""}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">Qty {l.quantity}</div>
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
              <div className="rounded-xl border border-[var(--amber-deep)]/40 bg-[var(--amber-deep)]/5 px-3 py-2.5 text-xs">
                <span className="font-semibold text-[var(--amber-deep)]">One more bottle unlocks {BULK_DISCOUNT_PERCENT}% off</span>
                <span className="text-muted-foreground"> — your best available two-bottle price appears automatically.</span>
              </div>
            )}

            {count >= BULK_DISCOUNT_MIN_QTY && !quote && (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--amber-deep)]/10 px-3 py-2 text-xs text-[var(--amber-deep)] font-semibold">
                <BadgePercent className="w-4 h-4" /> Buy {BULK_DISCOUNT_MIN_QTY}+ unlocked — {BULK_DISCOUNT_PERCENT}% off applied
              </div>
            )}

            {discount && !quote && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--amber-deep)]/10 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 text-[var(--amber-deep)] font-semibold">
                  <BadgePercent className="w-4 h-4" /> {discount.code} · −{discount.percent}%
                </span>
                <button type="button" onClick={clearDiscount} aria-label="Remove discount" className="p-1 hover:opacity-70">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {freeShip ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--amber-deep)]/10 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 text-[var(--amber-deep)] font-semibold">
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
                  placeholder="Promo code"
                  className="flex-1 border border-border bg-background px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  Apply
                </button>
              </div>
            )}

            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              {quote && quote.savings > 0 && (
                <div className="mb-3 border-y border-border py-3" aria-live="polite">
                  <div className="flex items-center justify-between gap-3">
                    <span className="eyebrow text-[9px] text-[var(--amber-deep)]">Your current offer</span>
                    <span className="font-semibold text-[var(--amber-deep)]">Save {formatAUD(quote.savings)}</span>
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
              <div className="flex justify-between font-semibold text-base pt-3 border-t border-foreground">
                <span>Total <span className="text-xs text-muted-foreground font-normal">AUD</span></span><span className="font-display text-2xl">{formatAUD(total)}</span>
              </div>
            </div>
            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              Free standard shipping in AU over {formatAUD(FREE_SHIPPING_THRESHOLD)}. Express +{formatAUD(EXPRESS_SHIPPING_SURCHARGE)}. Worldwide flat {formatAUD(WORLDWIDE_SHIPPING_FEE)}. Remote AU (WA, NT, TAS, Far North QLD) adds {formatAUD(RURAL_HANDLING_FEE)} — waived over {formatAUD(RURAL_HANDLING_WAIVED_OVER)}.
            </p>

          </div>
          {!clientSecret && <UpsellBuyTwo />}
        </aside>
      </div>

      {/* Mobile sticky pay bar */}
      {!clientSecret && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <button
            type="submit"
            form="checkout-details"
            disabled={submitting || quoteLoading}
            className="btn-gold w-full rounded-full py-3.5 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Working…</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Continue · {formatAUD(total)}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6 space-y-4">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-[var(--amber-deep)] font-semibold" : ""}>{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", name, autoComplete, inputMode }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; name?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
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
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
      />
    </label>
  );
}

function CheckoutTrust({ i: Icon, t, d }: { i: any; t: string; d: string }) {
  return (
    <div className="min-w-0 px-3 py-4 sm:px-5 flex items-start gap-2 border-r border-border last:border-r-0">
      <Icon className="w-4 h-4 mt-0.5 text-[var(--amber-deep)] shrink-0" />
      <div className="min-w-0"><div className="text-xs font-medium">{t}</div><div className="hidden sm:block text-[11px] text-muted-foreground mt-0.5">{d}</div></div>
    </div>
  );
}

