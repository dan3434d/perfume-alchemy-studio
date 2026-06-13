import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — Abdulrahman Perfumes" },
      { name: "description", content: "Get help with orders, products, returns, wholesale and more. Our team is online and ready to help." },
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
