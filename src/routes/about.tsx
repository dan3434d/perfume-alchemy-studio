import { createFileRoute, Link } from "@tanstack/react-router";
import blending from "@/assets/craft-blending.jpg";
import ingredients from "@/assets/craft-ingredients.jpg";
import packing from "@/assets/craft-packing.jpg";
import { Droplets, Sparkles, Package, Leaf, Award, MapPin } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Abdulrahman Perfumes" },
      { name: "description", content: "How Abdulrahman Perfumes blends UAE-sourced oud and amber into long-lasting designer-inspired fragrances, packed and shipped from Sydney." },
      { property: "og:title", content: "About Abdulrahman Perfumes" },
      { property: "og:description", content: "From Souk Madinat Jumeirah to Sydney — how our perfumes are made." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-warm)" }} />
        <div className="container-px max-w-5xl mx-auto py-20 text-center">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">
            <Sparkles className="w-3.5 h-3.5" /> Our story
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight mt-4">
            Arabian perfumery,<br />
            <span className="italic text-[var(--amber-deep)]">crafted for everyday luxury.</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Abdulrahman Perfumes was born from a belief that the warmth of oud and the glow of amber shouldn't
            be reserved for special occasions. We bring premium Gulf perfumery to Australia — for a fraction of designer prices.
          </p>
        </div>
      </section>

      {/* WHY */}
      <section className="section container-px max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { i: Award, t: "Designer-quality blends", d: "Built to perform like fragrances costing $150+ — long-lasting projection, refined sillage." },
            { i: Droplets, t: "UAE-sourced oils", d: "Base oils from across the Gulf, composed by perfumers steeped in Arabian tradition." },
            { i: MapPin, t: "Packed in Sydney", d: "Final QC, bottling and gift packaging in Australia. Dispatched within 24 hours." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="p-7 rounded-2xl border border-border bg-background">
              <div className="w-11 h-11 rounded-full grid place-items-center bg-[var(--amber-deep)]/10 text-[var(--amber-deep)]">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl mt-4">{t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="section bg-[var(--cream)]/40 border-y border-border">
        <div className="container-px max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">Our craft</span>
            <h2 className="font-display text-3xl sm:text-4xl mt-2">How we make our perfumes</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Three deliberate stages — from raw ingredient to the bottle on your dresser.
            </p>
          </div>

          <div className="space-y-16">
            <ProcessStep
              n="01"
              title="Sourcing the raw materials"
              body="We begin with the highest-grade oud wood, Bulgarian rose, Madagascar vanilla, ambergris, and Gulf-sourced aromatic oils. Every ingredient is selected for purity and character — the foundation of a long-lasting fragrance."
              icon={Leaf}
              img={ingredients}
              alt="Oud wood, dried roses, vanilla pods and amber resin"
            />
            <ProcessStep
              n="02"
              title="Blending in the perfumery"
              body="Our perfumers — trained in the traditions of Souk Madinat Jumeirah — compose each fragrance by hand. Top, heart and base notes are layered, then aged so the oils marry into a single, balanced scent."
              icon={Droplets}
              img={blending}
              alt="Perfumer blending fragrance oils with a glass dropper"
              reverse
            />
            <ProcessStep
              n="03"
              title="Bottled and packed in Sydney"
              body="Finished concentrates arrive in Sydney, where every 50ml bottle is filled, QC-checked, and packaged in a gift-ready box. Orders ship within 24 hours across Australia."
              icon={Package}
              img={packing}
              alt="Black perfume bottle being placed into a gift box"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section container-px max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl">Find your signature scent</h2>
        <p className="text-muted-foreground mt-3">
          Not sure where to start? Ask Amber, our AI fragrance assistant, or browse the full collection.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link to="/shop" className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">
            Shop the collection
          </Link>
          <a href="mailto:support@abdulrahman.store" className="rounded-full border border-foreground/20 px-6 py-3 text-sm font-semibold hover:bg-secondary">
            Email support
          </a>
        </div>
      </section>
    </>
  );
}

function ProcessStep({
  n, title, body, icon: Icon, img, alt, reverse,
}: {
  n: string; title: string; body: string; icon: any; img: string; alt: string; reverse?: boolean;
}) {
  return (
    <div className={`grid md:grid-cols-2 gap-10 items-center ${reverse ? "md:[&>div:first-child]:order-2" : ""}`}>
      <div>
        <div className="text-xs font-mono tracking-widest text-[var(--amber-deep)]">STEP {n}</div>
        <h2 className="font-display text-2xl sm:text-3xl mt-2 flex items-center gap-3">
          <Icon className="w-6 h-6 text-[var(--amber-deep)]" />
          {title}
        </h2>
        <p className="text-muted-foreground mt-4 leading-relaxed">{body}</p>
      </div>
      <div className="relative">
        <div className="absolute -inset-6 -z-10 rounded-3xl blur-3xl opacity-40" style={{ background: "var(--gradient-gold)" }} />
        <img src={img} alt={alt} loading="lazy" width={1024} height={1024} className="rounded-2xl shadow-[var(--shadow-elegant)] w-full aspect-square object-cover" />
      </div>
    </div>
  );
}
