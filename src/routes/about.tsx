import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Abdulrahman Perfumes" }, { name: "description", content: "The story behind Abdulrahman Perfumes." }] }),
  component: () => (
    <div className="container-px max-w-3xl mx-auto py-16 prose prose-neutral">
      <h1 className="font-display text-4xl">Our story</h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        Abdulrahman Perfumes was founded with one idea: that the warmth of oud and the glow of amber shouldn't be reserved for special occasions.
      </p>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        Inspired by the deep traditions of Dubai-style perfumery, our fragrances pair classic oriental ingredients with modern, wearable compositions. Each bottle is built to last on skin and to feel personal — a quiet signature you wear every day.
      </p>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        We blend, bottle, and ship from Australia, and back every order with real human support at <a href="mailto:support@abdulrahman.store" className="text-[var(--amber-deep)] underline">support@abdulrahman.store</a>.
      </p>
    </div>
  ),
});
