import portraitCloseup from "@/assets/brand/woman-closeup.jpeg.asset.json";
import portraitCurls from "@/assets/brand/woman-curls.jpeg.asset.json";
import portraitLinen from "@/assets/brand/man-linen.jpeg.asset.json";
import portraitWaves from "@/assets/brand/woman-waves.jpeg.asset.json";

const MOMENTS = [
  {
    image: portraitCurls,
        alt: "A woman smiling while holding a perfume bottle",
    label: "The first spray",
    note: "Chosen in the morning. Still present when the day is done.",
  },
  {
    image: portraitLinen,
        alt: "A man in linen holding a perfume bottle",
    label: "Shared freely",
    note: "Made for whoever reaches for the bottle first.",
  },
  {
    image: portraitWaves,
        alt: "A woman holding a perfume bottle in soft daylight",
    label: "Worn every day",
    note: "A good bottle should not have to wait for an occasion.",
  },
];

export function ClientMoments({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <section className="border-y border-border">
        <div className="grid grid-cols-3 gap-px bg-border">
          {MOMENTS.map((moment) => (
            <figure key={moment.label} className="relative min-h-52 sm:min-h-80 overflow-hidden bg-sand">
              <img
                src={moment.image.url}
                alt={moment.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-16 text-background sm:p-6 sm:pt-24">
                <figcaption className="font-display text-lg sm:text-2xl">{moment.label}</figcaption>
              </div>
            </figure>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="section border-y border-border">
      <div className="container-px max-w-7xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16 items-end mb-10">
          <div>
            <span className="eyebrow eyebrow-brass">House portraits</span>
            <h2 className="font-display mt-3">Perfume, where it belongs</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl lg:ml-auto">
            Not on a plinth. Not saved for later. These are bottles held, shared and worn by the people
             who bring fragrance into their own daily rituals.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-px bg-border border border-border">
          {MOMENTS.map((moment) => (
            <figure key={moment.label} className="bg-background">
              <div className="aspect-[4/5] overflow-hidden grain">
                <img src={moment.image.url} alt={moment.alt} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <figcaption className="p-5 sm:p-6">
                <div className="font-display text-xl">{moment.label}</div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{moment.note}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandStoryPortrait() {
  return (
    <figure className="relative min-h-[58vh] overflow-hidden grain bg-sand">
      <img
        src={portraitCloseup.url}
        alt="A woman holding a perfume bottle close to her face"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <figcaption className="absolute bottom-0 left-0 max-w-sm bg-background p-5 sm:p-7">
        <span className="eyebrow eyebrow-brass">Scent as a welcome</span>
        <p className="font-display text-2xl mt-2">A gesture carried from the Gulf to Sydney.</p>
      </figcaption>
    </figure>
  );
}