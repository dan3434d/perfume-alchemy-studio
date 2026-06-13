import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Abdulrahman Perfumes" },
      { name: "description", content: "How Abdulrahman Perfumes collects, stores and protects the personal information you share when shopping with us." },
      { property: "og:title", content: "Privacy Policy — Abdulrahman Perfumes" },
      { property: "og:description", content: "How we handle your data when you order fragrances from us." },
      { property: "og:url", content: "https://www.abdulrahmanperfumes.com.au/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://www.abdulrahmanperfumes.com.au/privacy" }],
  }),
  component: () => (
    <div className="container-px max-w-2xl mx-auto py-16">
      <h1 className="font-display text-3xl">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>We only collect the information needed to fulfil your orders and improve your shopping experience. We never sell your data.</p>
        <p>For privacy enquiries email <a className="text-[var(--amber-deep)]" href="mailto:support@abdulrahman.store">support@abdulrahman.store</a>.</p>
      </div>
    </div>
  ),
});
