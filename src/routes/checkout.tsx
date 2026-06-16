import { createFileRoute, useNavigate, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe-client";
import { useCart } from "@/hooks/useCart";
import { useDiscount } from "@/hooks/useDiscount";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { createEmbeddedStripeCheckout } from "@/lib/checkout.functions";
import { createPurchaseOrder } from "@/lib/purchase-order.functions";
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
import { Lock, Truck, ShieldCheck, BadgePercent, X, ArrowLeft, CreditCard, FileText, Loader2, Zap, Globe2 } from "lucide-react";


export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Abdulrahman Perfumes" }] }),
  component: Checkout,
});

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

function Checkout() {
  const childMatches = useChildMatches();
  const { lines, subtotal, count } = useCart();
  const { discount, clear: clearDiscount } = useDiscount();
  const navigate = useNavigate();
  const startStripe = useServerFn(createEmbeddedStripeCheckout);
  const startPO = useServerFn(createPurchaseOrder);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [freeShip, setFreeShip] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "po">("card");
  const [poCode, setPoCode] = useState("");
  const [poReference, setPoReference] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [form, setForm] = useState({
    email: "", full_name: "", phone: "",
    line1: "", line2: "", city: "", state: "", postcode: "", country: "Australia",
    notes: "",
  });
  const intl = !isAustralia(form.country);


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
    () => computeBulkDiscountPercent(count, discount?.percent ?? 0),
    [count, discount?.percent],
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

    if (paymentMethod === "po") {
      const code = poCode.trim().toUpperCase();
      if (!code) { toast.error("Enter your purchase order code"); return; }
      setSubmitting(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const result = await startPO({
          data: {
            code,
            po_reference: poReference.trim() || null,
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
            lines: lines.map((l) => ({
              product_id: l.product_id, name: l.name, slug: l.slug,
              price: l.price, quantity: l.quantity, image_url: l.image_url ?? null,
            })),
            discount_code: freeShip ? "FREESHIPPING" : (discount?.code ?? null),
            discount_percent: freeShip ? 0 : (discount?.percent ?? 0),
            user_id: userData.user?.id ?? null,
            origin: window.location.origin,
          },
        });
        toast.success("Purchase order created — invoice emailed");
        const url = `/checkout/success/${result.order_id}?po=1&invoice=${encodeURIComponent(result.invoice_url)}`;
        navigate({ to: url });
      } catch (err: any) {
        const msg = err?.message || "Could not create purchase order";
        toast.error(msg.includes("Invalid purchase order code") ? "Invalid purchase order code" : msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }

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
          lines: lines.map((l) => ({
            product_id: l.product_id, name: l.name, slug: l.slug,
            price: l.price, quantity: l.quantity, image_url: l.image_url ?? null,
          })),
          discount_code: freeShip && !intl ? "FREESHIPPING" : (discount?.code ?? null),
          discount_percent: freeShip && !intl ? 0 : (discount?.percent ?? 0),
          shipping_method: intl ? "worldwide" : shippingMethod,
          user_id: userData.user?.id ?? null,
          origin: window.location.origin,

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

  if (childMatches.length > 0) {
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
      {/* Steps */}
      <div className="flex items-center justify-center gap-2 sm:gap-6 mb-8 text-[11px] sm:text-sm overflow-x-auto">
        {["Cart", "Details", "Payment", "Done"].map((s, i) => {
          const stepIdx = clientSecret ? 2 : 1;
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <span className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold transition-colors ${active ? "bg-foreground text-background" : done ? "bg-[var(--amber-deep)] text-white" : "bg-secondary text-muted-foreground"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={active ? "font-semibold" : "text-muted-foreground"}>{s}</span>
              {i < 3 && <span className="w-6 sm:w-10 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      <h1 className="font-display text-3xl sm:text-4xl mb-2">Checkout</h1>
      <p className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5" /> Secure on-site payment by Stripe · AUD
      </p>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="lg:col-span-2 space-y-6">
          {!clientSecret && (
            <form onSubmit={onSubmit} className="space-y-6" id="checkout-details">
              <UpsellBuyTwo />
              <Section title="Contact" subtitle="We'll email your order confirmation here.">
                <Field label="Email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              </Section>
              <Section title="Shipping address" subtitle="Start typing — we'll auto-complete your Australian address.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                  <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
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
                <Field label="Apt/Suite (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City / Suburb" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                  {intl ? (
                    <Field label="State / Region" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
                  ) : (
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">State *</span>
                      <select
                        required
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      >
                        <option value="">Select…</option>
                        {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                  )}
                  <Field label={intl ? "Postal code" : "Postcode"} required value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} />
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Country *</span>
                  <select
                    required
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
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
                    <button
                      type="button"
                      onClick={() => setShippingMethod("standard")}
                      className={`text-left rounded-xl border p-4 transition-all ${shippingMethod === "standard" ? "border-[var(--amber-deep)] bg-[var(--amber-deep)]/5 ring-2 ring-[var(--amber-deep)]/30" : "border-border hover:border-foreground/30"}`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Truck className="w-4 h-4 text-[var(--amber-deep)]" /> Standard
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">3–5 business days · Free over {formatAUD(FREE_SHIPPING_THRESHOLD)}.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMethod("express")}
                      className={`text-left rounded-xl border p-4 transition-all ${shippingMethod === "express" ? "border-[var(--amber-deep)] bg-[var(--amber-deep)]/5 ring-2 ring-[var(--amber-deep)]/30" : "border-border hover:border-foreground/30"}`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Zap className="w-4 h-4 text-[var(--amber-deep)]" /> Express
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">1–2 business days · +{formatAUD(EXPRESS_SHIPPING_SURCHARGE)} on top.</div>
                    </button>
                  </div>
                )}
              </Section>

              <Section title="Order notes" subtitle="Optional">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="Anything we should know?"
                />
              </Section>

              <Section title="Payment method" subtitle="Pay securely by card, or submit a purchase order.">
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`text-left rounded-xl border p-4 transition-all ${paymentMethod === "card" ? "border-[var(--amber-deep)] bg-[var(--amber-deep)]/5 ring-2 ring-[var(--amber-deep)]/30" : "border-border hover:border-foreground/30"}`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <CreditCard className="w-4 h-4 text-[var(--amber-deep)]" /> Pay by card
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Secure Stripe checkout · instant.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("po")}
                    className={`text-left rounded-xl border p-4 transition-all ${paymentMethod === "po" ? "border-[var(--amber-deep)] bg-[var(--amber-deep)]/5 ring-2 ring-[var(--amber-deep)]/30" : "border-border hover:border-foreground/30"}`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <FileText className="w-4 h-4 text-[var(--amber-deep)]" /> Purchase order
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Net 14 days · invoice emailed (requires code).</div>
                  </button>
                </div>
                {paymentMethod === "po" && (
                  <div className="space-y-3 pt-2">
                    <Field
                      label="Purchase order code"
                      required
                      value={poCode}
                      onChange={(v) => setPoCode(v.toUpperCase())}
                    />
                    <Field
                      label="Your PO reference (optional)"
                      value={poReference}
                      onChange={setPoReference}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      A PDF invoice will be emailed to you and copied to our accounts team.
                    </p>
                  </div>
                )}
              </Section>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { i: Lock, t: "256-bit SSL", d: "Encrypted checkout" },
                  { i: ShieldCheck, t: "Buyer protection", d: "Stripe-powered" },
                  { i: Truck, t: "Ships in 24h", d: "From Sydney" },
                ].map(({ i: Icon, t, d }) => (
                  <div key={t} className="rounded-xl border border-border bg-card p-3 flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 text-[var(--amber-deep)] shrink-0" />
                    <div className="text-xs"><div className="font-semibold">{t}</div><div className="text-muted-foreground">{d}</div></div>
                  </div>
                ))}
              </div>

              {/* Desktop submit (in-form). Mobile uses sticky bar below. */}
              <button
                type="submit"
                disabled={submitting}
                className="hidden lg:inline-flex btn-gold w-full rounded-full py-3.5 font-semibold disabled:opacity-60 items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {paymentMethod === "po" ? "Generating invoice…" : "Preparing secure payment…"}</>
                ) : paymentMethod === "po" ? (
                  <><FileText className="w-4 h-4" /> Submit purchase order · {formatAUD(total)}</>
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
          <div className="card-elevated p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-xl">Your order</h2>
            <div className="space-y-3 max-h-64 overflow-auto pr-1 -mr-1">
              {lines.map((l) => (
                <div key={l.product_id} className="flex gap-3 items-center">
                  <img src={productImage(l.image_url)} alt={l.name} className="w-12 h-12 rounded-lg object-cover ring-1 ring-border" />
                  <div className="flex-1 text-sm min-w-0">
                    <div className="font-medium truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {l.quantity}</div>
                  </div>
                  <div className="text-sm whitespace-nowrap font-medium">{formatAUD(l.price * l.quantity)}</div>
                </div>
              ))}
            </div>

            {count >= BULK_DISCOUNT_MIN_QTY && (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--amber-deep)]/10 px-3 py-2 text-xs text-[var(--amber-deep)] font-semibold">
                <BadgePercent className="w-4 h-4" /> Buy {BULK_DISCOUNT_MIN_QTY}+ unlocked — {BULK_DISCOUNT_PERCENT}% off applied
              </div>
            )}

            {discount && (
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
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  Apply
                </button>
              </div>
            )}

            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatAUD(subtotal)} />
              {discountAmount > 0 && <Row label={`Discount (−${discountPercent}%)`} value={`− ${formatAUD(discountAmount)}`} accent />}
              <Row label={ship.freeShipping ? "Shipping" : "Shipping (metro)"} value={ship.base === 0 ? "Free" : formatAUD(ship.base)} />
              {ship.handling > 0 && (
                <Row label="Remote area handling" value={formatAUD(ship.handling)} />
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Total</span><span className="font-display text-lg">{formatAUD(total)}</span>
              </div>
            </div>
            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              Free metro shipping over {formatAUD(FREE_SHIPPING_THRESHOLD)}. Remote (WA, NT, TAS, Far North QLD) adds {formatAUD(RURAL_HANDLING_FEE)} handling — waived over {formatAUD(RURAL_HANDLING_WAIVED_OVER)}.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky pay bar */}
      {!clientSecret && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <button
            type="submit"
            form="checkout-details"
            disabled={submitting}
            className="btn-gold w-full rounded-full py-3.5 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Working…</>
            ) : paymentMethod === "po" ? (
              <><FileText className="w-4 h-4" /> Submit PO · {formatAUD(total)}</>
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
    <div className="card-elevated p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
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

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}{required && " *"}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
      />
    </label>
  );
}
