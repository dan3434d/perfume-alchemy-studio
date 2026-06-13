import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "Wholesale Enquiries — Abdulrahman Perfumes" },
      { name: "description", content: "Stock Abdulrahman Perfumes in your store. Submit a wholesale enquiry and our team will reply within one business day." },
    ],
  }),
  component: Wholesale,
});

function Wholesale() {
  const [form, setForm] = useState({
    business: "",
    contact: "",
    email: "",
    phone: "",
    country: "",
    storeType: "",
    moq: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const subject = `Wholesale enquiry — ${form.business}`;
    const body =
      `Business: ${form.business}\n` +
      `Contact: ${form.contact}\n` +
      `Email: ${form.email}\n` +
      `Phone: ${form.phone}\n` +
      `Country: ${form.country}\n` +
      `Store type: ${form.storeType}\n` +
      `Estimated quantity / MOQ: ${form.moq}\n\n` +
      `${form.message}`;
    window.location.href = `mailto:support@abdulrahman.store?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Opening your email client…");
    setTimeout(() => setSubmitting(false), 600);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container-px max-w-5xl mx-auto py-16 grid md:grid-cols-5 gap-12">
      <div className="md:col-span-2">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Trade</span>
        <h1 className="font-display text-3xl sm:text-4xl mt-2">Wholesale enquiries</h1>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          Stock Abdulrahman Perfumes — premium UAE-blended, designer-inspired fragrances — in your boutique, salon or department store. Tell us a little about your business and we'll reply within one business day with pricing, lead times and minimum order quantities.
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          <li>• Competitive tiered pricing</li>
          <li>• Dispatched from Sydney within 24h</li>
          <li>• Co-branded marketing assets available</li>
          <li>• Australia-wide and international</li>
        </ul>
      </div>

      <form onSubmit={submit} className="md:col-span-3 card-elevated p-6 space-y-4 h-fit rounded-2xl border border-border">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business name *</label>
            <input required maxLength={120} value={form.business} onChange={set("business")} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact name *</label>
            <input required maxLength={120} value={form.contact} onChange={set("contact")} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email *</label>
            <input required type="email" maxLength={255} value={form.email} onChange={set("email")} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</label>
            <input maxLength={40} value={form.phone} onChange={set("phone")} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country *</label>
            <input required maxLength={80} value={form.country} onChange={set("country")} placeholder="e.g. Australia" className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store type *</label>
            <select required value={form.storeType} onChange={set("storeType")} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm">
              <option value="">Select…</option>
              <option>Boutique / Concept store</option>
              <option>Salon / Spa</option>
              <option>Department store</option>
              <option>Online retailer</option>
              <option>Distributor</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated quantity / MOQ *</label>
          <input required maxLength={80} value={form.moq} onChange={set("moq")} placeholder="e.g. 50–100 bottles per order" className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tell us about your business</label>
          <textarea rows={5} maxLength={1500} value={form.message} onChange={set("message")} placeholder="Locations, target customer, fragrances you're interested in…" className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
        </div>
        <button disabled={submitting} className="btn-gold w-full rounded-full py-3 text-sm font-semibold disabled:opacity-60">
          {submitting ? "Sending…" : "Submit enquiry"}
        </button>
        <p className="text-xs text-muted-foreground text-center">We reply within one business day.</p>
      </form>
    </div>
  );
}
