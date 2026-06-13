import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/hooks/useCart";
import { useDiscount } from "@/hooks/useDiscount";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { createStripeCheckout } from "@/lib/checkout.functions";
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
} from "@/lib/pricing";
import { toast } from "sonner";
import { Lock, Truck, ShieldCheck, BadgePercent, X } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Abdulrahman Perfumes" }] }),
  component: Checkout,
});

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

function Checkout() {
  const { lines, subtotal, count } = useCart();
  const { discount, clear: clearDiscount } = useDiscount();
  const navigate = useNavigate();
  const startStripe = useServerFn(createStripeCheckout);
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [freeShip, setFreeShip] = useState(false);
  const [form, setForm] = useState({
    email: "", full_name: "", phone: "",
    line1: "", line2: "", city: "", state: "", postcode: "", country: "Australia",
    notes: "",
  });

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
    () => computeShipping(subtotalAfterDiscount, { state: form.state, postcode: form.postcode, country: form.country }),
    [subtotalAfterDiscount, form.state, form.postcode, form.country],
  );
  const ship = freeShip
    ? { ...rawShip, base: 0, handling: 0, total: 0, freeShipping: true }
    : rawShip;
  const total = +(subtotalAfterDiscount + ship.total).toFixed(2);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) { toast.error("Your cart is empty"); return; }
    setSubmitting(true);
    try {
      const { url } = await startStripe({
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
          discount_code: discount?.code ?? null,
          discount_percent: discount?.percent ?? 0,
          origin: window.location.origin,
        },
      });
      if (!url) throw new Error("Could not start payment");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="container-px max-w-3xl mx-auto py-20 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link to="/shop" className="btn-gold inline-block mt-6 rounded-full px-6 py-3 text-sm font-semibold">Browse shop</Link>
      </div>
    );
  }

  return (
    <div className="container-px max-w-6xl mx-auto py-10 sm:py-14">
      {/* Steps */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8 text-xs sm:text-sm">
        {["Cart", "Details", "Payment", "Done"].map((s, i) => {
          const active = i === 1;
          const done = i === 0;
          return (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold ${active ? "bg-foreground text-background" : done ? "bg-[var(--amber-deep)] text-white" : "bg-secondary text-muted-foreground"}`}>
                {i + 1}
              </span>
              <span className={active ? "font-semibold" : "text-muted-foreground"}>{s}</span>
              {i < 3 && <span className="w-6 sm:w-10 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      <h1 className="font-display text-3xl sm:text-4xl mb-2">Checkout</h1>
      <p className="text-sm text-muted-foreground mb-8 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Secure payment by Stripe · AUD</p>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
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
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">State *</span>
                <select
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select…</option>
                  {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <Field label="Postcode" required value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} />
            </div>
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          </Section>
          <Section title="Order notes" subtitle="Optional">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Anything we should know?"
            />
          </Section>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { i: Lock, t: "256-bit SSL", d: "Encrypted checkout" },
              { i: ShieldCheck, t: "Buyer protection", d: "Stripe-powered" },
              { i: Truck, t: "Ships in 24h", d: "From Sydney" },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-border p-3 flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 text-[var(--amber-deep)] shrink-0" />
                <div className="text-xs"><div className="font-semibold">{t}</div><div className="text-muted-foreground">{d}</div></div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="card-elevated p-6 space-y-4">
            <h2 className="font-display text-xl">Your order</h2>
            <div className="space-y-3 max-h-64 overflow-auto">
              {lines.map((l) => (
                <div key={l.product_id} className="flex gap-3 items-center">
                  <img src={productImage(l.image_url)} alt={l.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 text-sm min-w-0">
                    <div className="font-medium truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {l.quantity}</div>
                  </div>
                  <div className="text-sm whitespace-nowrap">{formatAUD(l.price * l.quantity)}</div>
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

            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatAUD(subtotal)} />
              {discountAmount > 0 && <Row label={`Discount (−${discountPercent}%)`} value={`− ${formatAUD(discountAmount)}`} accent />}
              <Row label={ship.freeShipping ? "Shipping" : "Shipping (metro)"} value={ship.base === 0 ? "Free" : formatAUD(ship.base)} />
              {ship.handling > 0 && (
                <Row label="Remote area handling" value={formatAUD(ship.handling)} />
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Total</span><span>{formatAUD(total)}</span>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-gold w-full rounded-full py-3 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              {submitting ? "Redirecting…" : `Pay ${formatAUD(total)} securely`}
            </button>
            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              Free metro shipping over {formatAUD(FREE_SHIPPING_THRESHOLD)}. Remote (WA, NT, TAS, Far North QLD) adds {formatAUD(RURAL_HANDLING_FEE)} handling — waived over {formatAUD(RURAL_HANDLING_WAIVED_OVER)}.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-6 space-y-4">
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
        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}


