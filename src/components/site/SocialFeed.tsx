import { Heart, MessageCircle, Send, Bookmark, ThumbsUp, Share2 } from "lucide-react";

const IG_POSTS = [
  {
    u: "aaliyah.scents",
    a: "AS",
    img: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    c: "Obsessed with Midnight Oud 🖤 lasts all day at uni #abdulrahmanperfumes",
    l: 1240,
    m: 38,
  },
  {
    u: "danielr_au",
    a: "DR",
    img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    c: "My new signature. Eros Elixir hits different 🔥",
    l: 892,
    m: 24,
  },
  {
    u: "sara.fragrance",
    a: "SH",
    img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    c: "Velvet Rose unboxing — packaging is luxury level ✨",
    l: 2100,
    m: 67,
  },
  {
    u: "perthperfumes",
    a: "JP",
    img: "https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?auto=format&fit=crop&w=800&q=80",
    c: "Buy 2 deal = no brainer. Amber Wood + Tobacco Noir 👌",
    l: 654,
    m: 19,
  },
];


const FB_POSTS = [
  { u: "Layla Mahmoud", a: "LM", t: "3h", c: "Just got my Oud Royal in the mail from Abdulrahman Perfumes — Sydney to Adelaide in 2 days. The scent is INSANE, way better than I expected. Already planning my next order. 10/10 recommend.", l: 312, m: 28, s: 14 },
  { u: "Mark Thompson", a: "MT", t: "1d", c: "If you're hesitating to try these — don't. I've spent thousands on designer perfumes and Tobacco Noir holds up against any of them. And it's $41.50. Madness.", l: 487, m: 52, s: 31 },
];

export function SocialFeed() {
  return (
    <section className="section container-px max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">As seen on social</span>
        <h2 className="font-display text-3xl sm:text-4xl mt-2">#AbdulrahmanPerfumes</h2>
        <p className="text-muted-foreground mt-3">Real customers, real reactions.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Instagram column */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md grid place-items-center text-white text-xs font-bold" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>IG</div>
            <span className="text-sm font-semibold">Instagram</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {IG_POSTS.map((p) => (
              <div key={p.u} className="rounded-2xl overflow-hidden border border-border bg-background hover:shadow-[var(--shadow-elegant)] transition">
                <div className="aspect-square relative" style={{ background: p.img }}>
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-white/90 grid place-items-center text-[10px] font-bold">{p.a}</div>
                    <span className="text-[11px] font-semibold text-white drop-shadow">{p.u}</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-3 text-foreground">
                    <Heart className="w-4 h-4" />
                    <MessageCircle className="w-4 h-4" />
                    <Send className="w-4 h-4" />
                    <Bookmark className="w-4 h-4 ml-auto" />
                  </div>
                  <div className="text-[11px] font-semibold mt-2">{p.l.toLocaleString()} likes</div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2"><span className="font-semibold text-foreground">{p.u}</span> {p.c}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facebook column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-[#1877f2] grid place-items-center text-white text-xs font-bold">f</div>
            <span className="text-sm font-semibold">Facebook</span>
          </div>
          <div className="space-y-4">
            {FB_POSTS.map((p) => (
              <div key={p.u} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--amber-deep)]/15 text-[var(--amber-deep)] grid place-items-center text-sm font-bold">{p.a}</div>
                  <div>
                    <div className="text-sm font-semibold">{p.u}</div>
                    <div className="text-[11px] text-muted-foreground">{p.t} · Public</div>
                  </div>
                </div>
                <p className="text-sm mt-3 leading-relaxed">{p.c}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 fill-[#1877f2] text-[#1877f2]" /> {p.l}</div>
                  <div>{p.m} comments · {p.s} shares</div>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-xs font-medium text-muted-foreground">
                  <button className="py-2 rounded-md hover:bg-secondary inline-flex items-center justify-center gap-1.5"><ThumbsUp className="w-4 h-4" /> Like</button>
                  <button className="py-2 rounded-md hover:bg-secondary inline-flex items-center justify-center gap-1.5"><MessageCircle className="w-4 h-4" /> Comment</button>
                  <button className="py-2 rounded-md hover:bg-secondary inline-flex items-center justify-center gap-1.5"><Share2 className="w-4 h-4" /> Share</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
