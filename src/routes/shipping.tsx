import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping — Abdulrahman Perfumes" }] }),
  component: () => (
    <div className="container-px max-w-2xl mx-auto py-16">
      <h1 className="font-display text-3xl">Shipping Policy</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>We ship Australia-wide via tracked courier. Orders placed before 2pm AEST are dispatched same business day.</p>
        <p>Standard delivery: 2–5 business days. <strong>Free metro shipping on orders over $50 AUD</strong>; otherwise a flat $9.99. Remote areas (WA, NT, TAS, Far North QLD postcodes 4700+) include an additional $5.50 handling fee — waived on orders over $100.</p>
        <p>You'll receive tracking by email as soon as your order ships.</p>
      </div>
    </div>
  ),
});
