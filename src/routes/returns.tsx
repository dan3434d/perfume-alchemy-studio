import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns — Abdulrahman Perfumes" }] }),
  component: () => (
    <div className="container-px max-w-2xl mx-auto py-16">
      <h1 className="font-display text-3xl">Returns Policy</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>We accept returns of unopened fragrances within 30 days of delivery for a full refund. Opened bottles cannot be returned for hygiene reasons unless faulty.</p>
        <p>To start a return, email <a className="text-[var(--amber-deep)]" href="mailto:support@abdulrahman.store">support@abdulrahman.store</a> with your order number.</p>
      </div>
    </div>
  ),
});
