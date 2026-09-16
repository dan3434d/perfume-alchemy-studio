import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — Abdulrahman Perfumes" },
      { name: "description", content: "Abdulrahman Perfumes is a Sydney fragrance house built on Gulf hospitality: perfume composed in the UAE, bottled here, sold at one honest price." },
      { property: "og:title", content: "Our story — Abdulrahman Perfumes" },
      { property: "og:description", content: "The name means servant of the Most Merciful. Here's what that has to do with perfume." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
        <div className="container-px max-w-4xl mx-auto py-20 sm:py-28">
          <span className="eyebrow eyebrow-brass">Our story</span>
          <h1 className="mt-6">A name, and what it asks of us.</h1>
          <p className="text-lg text-muted-foreground mt-8 leading-relaxed">
            Abdulrahman means <span className="text-foreground">servant of the Most Merciful</span>. It is a
            family name before it is a label on a bottle, and it carries an instruction: be generous first,
            and be generous without being asked.
          </p>
        </div>
      </section>

      <section className="section container-px max-w-4xl mx-auto">
        <div className="space-y-7 text-lg leading-relaxed">
          <p>
            Every house we grew up in had a scent waiting at the door. Bakhoor smouldering in the hallway
            before guests arrived. A small bottle of oud pressed into a visitor's hand on the way out, so
            the evening travelled home with them. Nobody called it luxury. It was simply how you told
            someone they were welcome.
          </p>
          <p className="text-muted-foreground">
            When we started selling perfume in Australia, the thing that felt wrong wasn't the fragrance —
            it was the price of being welcomed. Two hundred dollars for a gesture that, where we're from,
            costs a host nothing to give. So we built the house we wanted: Gulf perfumers composing serious
            blends, one price for every bottle, and no marketing theatre folded into the cost.
          </p>
          <p className="text-muted-foreground">
            We don't stage photographs of people we've never met. We don't invent a heritage we don't have.
            What we have is a family name, a set of formulas we're proud of, and a bench in Sydney where
            every order is packed by someone who knows what's in it.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-[var(--sand)]">
        <div className="container-px max-w-7xl mx-auto py-16 sm:py-24">
          <span className="eyebrow eyebrow-brass">How it's made</span>
          <h2 className="font-display mt-3 mb-12">Three stages, no shortcuts</h2>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-background p-8 sm:p-10">
                <div className="eyebrow text-[var(--amber-deep)]">Stage {s.n}</div>
                <h3 className="font-display text-2xl mt-4">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container-px max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-10">
          {[
            { t: "One price", d: "$41.50 for every 50ml, whether it took us a week or a year to get right." },
            { t: "Composed in the UAE", d: "By perfumers trained in the souks, working to our brief and our corrections." },
            { t: "Sent from Sydney", d: "Packed by hand, out the door within 24 hours, tracked across Australia." },
          ].map((v) => (
            <div key={v.t} className="border-t border-foreground pt-5">
              <h3 className="font-display text-2xl">{v.t}</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{v.d}</p>
            </div>
          ))}
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
