import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Abdulrahman Perfumes" }] }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `mailto:support@abdulrahman.store?subject=Enquiry from ${encodeURIComponent(form.name)}&body=${encodeURIComponent(form.message + "\n\nFrom: " + form.email)}`;
    toast.success("Opening your email client…");
  };
  return (
    <div className="container-px max-w-4xl mx-auto py-16 grid md:grid-cols-2 gap-12">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Get in touch</h1>
        <p className="text-muted-foreground mt-3">Email us anytime — we reply within one business day.</p>
        <p className="mt-6"><a className="text-[var(--amber-deep)] font-medium" href="mailto:support@abdulrahman.store">support@abdulrahman.store</a></p>
        <h2 className="font-display text-xl mt-10">FAQ</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div><dt className="font-semibold">How long does delivery take?</dt><dd className="text-muted-foreground">2–5 business days across Australia.</dd></div>
          <div><dt className="font-semibold">Can I return a fragrance?</dt><dd className="text-muted-foreground">Unopened bottles within 30 days — see our Returns Policy.</dd></div>
          <div><dt className="font-semibold">Are your perfumes alcohol-based?</dt><dd className="text-muted-foreground">Yes, premium long-lasting alcohol-based compositions.</dd></div>
        </dl>
      </div>
      <form onSubmit={submit} className="card-elevated p-6 space-y-4 h-fit">
        <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
        <textarea required rows={5} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
        <button className="btn-gold w-full rounded-full py-3 text-sm font-semibold">Send message</button>
      </form>
    </div>
  );
}
