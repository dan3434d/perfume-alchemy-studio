const NOTES = [
  {
    quote: "I wore Midnight Oud to my sister's wedding and three aunties stopped me at the door. That never happens.",
    name: "Aaliyah H.",
    place: "Lakemba, NSW",
  },
  {
    quote: "I've spent thousands on designer bottles. This sits on my desk and it's the one I reach for.",
    name: "Mark T.",
    place: "Brunswick, VIC",
  },
  {
    quote: "Ordered on Tuesday, wearing it Thursday. Sydney to Adelaide. The box alone felt like a gift.",
    name: "Layla M.",
    place: "Adelaide, SA",
  },
  {
    quote: "My partner kept asking what I was wearing. I told him it cost forty-one dollars and he didn't believe me.",
    name: "Jess P.",
    place: "Perth, WA",
  },
  {
    quote: "Bought two so my dad could have one. He calls it his Friday scent now.",
    name: "Daniel R.",
    place: "Auburn, NSW",
  },
  {
    quote: "It lasts through a full nursing shift. That is the only review that matters to me.",
    name: "Sara H.",
    place: "Brisbane, QLD",
  },
];

export function SocialFeed() {
  return (
    <section className="section border-t border-border bg-[var(--sand)]">
      <div className="container-px max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <span className="eyebrow eyebrow-brass">In their words</span>
          <h2 className="font-display mt-4">People don't describe a perfume. They describe the moment.</h2>
          <p className="text-muted-foreground mt-5 leading-relaxed">
            We don't photograph strangers holding our bottles. We just keep the notes people send us.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {NOTES.map((n) => (
            <figure key={n.name} className="bg-background p-7 sm:p-9 flex flex-col">
              <blockquote className="font-display text-xl sm:text-[1.45rem] leading-[1.35]">
                “{n.quote}”
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-border text-xs">
                <span className="font-medium">{n.name}</span>
                <span className="text-muted-foreground"> · {n.place}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
