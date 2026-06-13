import { createFileRoute } from "@tanstack/react-router";

const FAQS = [
  { q: "How long does delivery take?", a: "Standard delivery is 2–5 business days Australia-wide. Orders placed before 2pm AEST ship the same business day from our Sydney warehouse." },
  { q: "Do you offer free shipping?", a: "Yes — free metro shipping on orders over $50 AUD. Remote areas (WA, NT, TAS, Far North QLD) add a $5.50 handling fee, waived on orders over $100." },
  { q: "Can I return a perfume?", a: "We accept returns of unopened bottles within 30 days for a full refund. Email support@abdulrahman.store with your order number to start a return." },
  { q: "Are your fragrances long-lasting?", a: "Yes. Every Abdulrahman perfume is a UAE-blended eau de parfum designed for 6–10 hours of projection on skin." },
];

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — Abdulrahman Perfumes" },
      { name: "description", content: "Get help with orders, products, returns and wholesale. Email support@abdulrahman.store or use our help centre — we reply within one business day." },
      { property: "og:title", content: "Contact Abdulrahman Perfumes" },
      { property: "og:description", content: "Talk to our Sydney team about orders, returns, products and wholesale enquiries." },
      { property: "og:url", content: "https://www.abdulrahmanperfumes.com.au/contact" },
    ],
    links: [{ rel: "canonical", href: "https://www.abdulrahmanperfumes.com.au/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <iframe
      src="/contact-form.html"
      title="Contact us"
      className="w-full"
      style={{ height: "calc(100vh - 4rem)", border: 0, display: "block" }}
    />
  );
}
