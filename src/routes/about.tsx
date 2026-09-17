import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandStoryPortrait, ClientMoments } from "@/components/site/ClientMoments";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — How Our Luxury Inspired Perfumes Are Made" },
      { name: "description", content: "How Abdulrahman Perfumes makes luxury designer-inspired fragrance: oud, rose and amber composed by Gulf perfumers in the UAE, aged, then bottled by hand in Sydney." },
      { property: "og:title", content: "Our Story — How Our Luxury Inspired Perfumes Are Made" },
      { property: "og:description", content: "The name means servant of the Most Merciful. Here's what that has to do with perfume." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.abdulrahmanperfumes.com.au/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.abdulrahmanperfumes.com.au/about" }],
  }),
  component: AboutPage,
});

const STEPS = [
  {
    n: "01",
    t: "The raw material",
    b: "Oud from aged agarwood, Bulgarian rose absolute, Madagascan vanilla, labdanum and ambergris accords. We buy less, and we buy better — a thin oil can be smelled from the first spray, and never forgiven.",
  },
  {
    n: "02",
    t: "The composition",
    b: "Our perfumers work by nose, in the tradition of the Gulf souks. Top, heart and base are layered, argued over, corrected. Then the blend is left alone for weeks so the oils marry instead of shouting.",
  },
  {
    n: "03",
    t: "The bottle",
    b: "Concentrates land in Sydney, where every 50ml is filled, checked against the reference batch, boxed and sent. If it isn't something we'd hand to a guest, it doesn't leave the room.",
  },
];

function AboutPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="container-px max-w-7xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-center py-10 sm:py-16">
          <div className="py-8 sm:py-12">
            <span className="eyebrow eyebrow-brass">The house of Abdulrahman</span>
            <h1 className="mt-6">A name, and what it asks of us.</h1>
            <p className="text-lg text-muted-foreground mt-8 leading-relaxed max-w-xl">
              Abdulrahman means <span className="text-foreground">servant of the Most Merciful</span>. It is a
              family name before it is a label, and it carries an instruction: be generous first, without being asked.
            </p>
            <div className="grid grid-cols-3 gap-5 mt-10 pt-6 border-t border-border max-w-lg">
              <Fact value="UAE" label="Composed" />
              <Fact value="Sydney" label="Bottled" />
              <Fact value="$35–$55" label="Visible offers" />
            </div>
          </div>
          <BrandStoryPortrait />
        </div>
      </section>

      <section className="section container-px max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[0.65fr_1.35fr] gap-8 lg:gap-20">
          <div>
            <span className="eyebrow eyebrow-brass">Chapter I · The welcome</span>
            <p className="font-display text-3xl sm:text-4xl mt-4 leading-tight">“Perfume was never decoration. It was how you told someone they mattered.”</p>
          </div>
          <div className="space-y-7 text-lg leading-relaxed">
            <p>Every house we grew up in had a scent waiting at the door. Bakhoor smouldered in the hallway before guests arrived. Oud was offered on the wrist. A small bottle might be pressed into a visitor's hand so the evening travelled home with them.</p>
            <p className="text-muted-foreground">Nobody called it luxury. It was simply hospitality: warm, instinctive and generous. Abdulrahman Perfumes began with the belief that this gesture still belongs in everyday life.</p>
          </div>
        </div>
      </section>

      <ClientMoments />

      <section className="section container-px max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          <div>
            <span className="eyebrow eyebrow-brass">Chapter II · Two places</span>
            <h2 className="font-display mt-4">Composed in the Gulf. Finished close to home.</h2>
          </div>
          <div className="space-y-6 text-base leading-relaxed">
            <p>Our formulas are developed with perfumers in the UAE, where oud, rose, resin and amber are part of a living fragrance culture rather than a passing trend.</p>
            <p className="text-muted-foreground">The concentrates arrive in Sydney to be checked, bottled and packed. This keeps the craft connected to its source and the service close to the people ordering from us.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border lattice">
        <div className="container-px max-w-7xl mx-auto py-16 sm:py-24">
          <span className="eyebrow eyebrow-brass">How it's made</span>
          <h2 className="font-display mt-3 mb-12">Three stages, no shortcuts</h2>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-background p-8 sm:p-10 min-h-72 flex flex-col">
                <div className="eyebrow text-[var(--amber-deep)]">Stage {s.n}</div>
                <h3 className="font-display text-2xl mt-4">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-auto pt-8 leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ink-section border-b border-border">
        <div className="container-px max-w-7xl mx-auto grid lg:grid-cols-2">
          <div className="py-16 sm:py-24 lg:pr-20">
            <span className="eyebrow text-[var(--gold)]">Chapter IV · The honest price</span>
            <h2 className="font-display mt-4">The oil, the glass, the care. Not the theatre.</h2>
            <p className="mt-6 text-[var(--background)]/70 leading-relaxed">We do not ask a fragrance to carry the cost of a billboard. Every current offer is shown before checkout, because choosing by instinct should not come with a hidden surprise.</p>
          </div>
          <div className="py-16 sm:py-24 lg:pl-20 lg:border-l border-[var(--background)]/20 flex flex-col justify-center">
            <div className="flex items-end justify-between border-b border-[var(--background)]/20 pb-6">
              <span className="eyebrow text-[var(--background)]/60">Every fragrance</span>
              <span className="font-display num text-5xl text-[var(--gold)]">$35–$55</span>
            </div>
            <p className="text-sm text-[var(--background)]/65 mt-5">50ml eau de parfum · your strongest available offer is applied automatically</p>
          </div>
        </div>
      </section>

      <section className="section border-t border-border">
        <div className="container-px max-w-3xl mx-auto text-center">
          <h2 className="font-display">Come and be welcomed</h2>
          <p className="text-muted-foreground mt-4">
            Start with the collection, or let the quiz narrow it down for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/shop" className="btn-ink px-8 py-3.5">Shop the collection</Link>
            <Link to="/scent-discovery" className="btn-outline px-8 py-3.5">Find your scent</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return <div><div className="font-display text-xl sm:text-2xl">{value}</div><div className="eyebrow text-[9px] mt-1">{label}</div></div>;
}
