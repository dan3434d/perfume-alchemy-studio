import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Abdulrahman Perfumes" }] }),
  component: Checkout,
});

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "", full_name: "", phone: "",
    line1: "", line2: "", city: "", state: "", postcode: "", country: "Australia",
    notes: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setForm((f) => ({ ...f, email: data.user!.email ?? "" }));
    });
  }, []);

  const shipping = subtotal === 0 ? 0 : subtotal >= 80 ? 0 : 9.95;
  const total = subtotal + shipping;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) { toast.error("Your cart is empty"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user?.id ?? null,
        email: form.email,
        full_name: form.full_name,
        phone: form.phone || null,
        shipping_line1: form.line1,
        shipping_line2: form.line2 || null,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_postcode: form.postcode,
        shipping_country: form.country,
        subtotal, shipping, total,
        notes: form.notes || null,
        status: "pending",
        payment_status: "unpaid",
      }).select().single();
      if (error) throw error;

      const items = lines.map((l) => ({
        order_id: order.id,
        product_id: l.product_id,
        product_name: l.name,
        product_slug: l.slug,
        unit_price: l.price,
        quantity: l.quantity,
        line_total: l.price * l.quantity,
        image_url: l.image_url,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;

      clear();
      navigate({ to: "/checkout/success/$orderId", params: { orderId: order.id } });
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
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
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Checkout</h1>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Contact">
            <Field label="Email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          </Section>
          <Section title="Shipping address">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            <Field label="Address line 1" required value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
            <Field label="Apt/Suite (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} />
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="City" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="State" required value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <Field label="Postcode" required value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} />
            </div>
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          </Section>
          <Section title="Payment">
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Payment integration placeholder. Orders are recorded as <strong>unpaid · pending</strong> and managed in the admin dashboard.
            </div>
          </Section>
          <Section title="Order notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              placeholder="Anything we should know?"
            />
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="card-elevated p-6 space-y-4">
            <h2 className="font-display text-xl">Your order</h2>
            <div className="space-y-3 max-h-64 overflow-auto">
              {lines.map((l) => (
                <div key={l.product_id} className="flex gap-3 items-center">
                  <img src={productImage(l.image_url)} alt={l.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {l.quantity}</div>
                  </div>
                  <div className="text-sm">{formatAUD(l.price * l.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatAUD(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : formatAUD(shipping)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2"><span>Total</span><span>{formatAUD(total)}</span></div>
            </div>
            <button type="submit" disabled={submitting} className="btn-gold w-full rounded-full py-3 font-semibold disabled:opacity-60">
              {submitting ? "Placing order…" : `Place order — ${formatAUD(total)}`}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-6 space-y-4">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
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
