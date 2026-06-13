import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping — Abdulrahman Perfumes" }] }),
  component: () => (
    <div className="container-px max-w-2xl mx-auto py-16">
      <h1 className="font-display text-3xl">Shipping Policy</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>We ship Australia-wide via tracked courier. Orders placed before 2pm AEST are dispatched same business day.</p>
        <p>Standard delivery: 2–5 business days. Free shipping on orders over $80 AUD; otherwise a flat $9.95.</p>
        <p>You'll receive tracking by email as soon as your order ships.</p>
      </div>
    </div>
  ),
});
