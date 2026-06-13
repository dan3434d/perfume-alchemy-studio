import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — Abdulrahman Perfumes" }] }),
  component: () => (
    <div className="container-px max-w-2xl mx-auto py-16">
      <h1 className="font-display text-3xl">Terms & Conditions</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>By placing an order with Abdulrahman Perfumes you agree to our terms. All prices are in Australian Dollars (AUD) and include applicable taxes.</p>
        <p>For questions, contact <a className="text-[var(--amber-deep)]" href="mailto:support@abdulrahman.store">support@abdulrahman.store</a>.</p>
      </div>
    </div>
  ),
});
