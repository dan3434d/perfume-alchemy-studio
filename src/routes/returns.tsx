import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns Policy — Abdulrahman Perfumes" },
      { name: "description", content: "30-day returns on unopened Abdulrahman Perfumes. Email support@abdulrahman.store with your order number to start a return." },
      { property: "og:title", content: "Returns Policy — Abdulrahman Perfumes" },
      { property: "og:description", content: "Unopened fragrances can be returned within 30 days for a full refund." },
      { property: "og:url", content: "https://www.abdulrahmanperfumes.com.au/returns" },
    ],
    links: [{ rel: "canonical", href: "https://www.abdulrahmanperfumes.com.au/returns" }],
  }),
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
