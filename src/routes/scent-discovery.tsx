import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/scent-discovery")({
  head: () => ({
    meta: [
      { title: "Scent Discovery — Find your signature fragrance | Abdulrahman Perfumes" },
      { name: "description", content: "Take our 4-question scent quiz to find the perfect Abdulrahman fragrance for you. Designer-inspired oud, amber, fresh and floral scents." },
      { property: "og:title", content: "Find your signature scent" },
      { property: "og:description", content: "A quick 4-step quiz to match you with the perfect perfume from our UAE-blended collection." },
      { property: "og:url", content: "/scent-discovery" },
    ],
    links: [{ rel: "canonical", href: "/scent-discovery" }],
  }),
  component: ScentDiscovery,
});

type Q = { key: string; label: string; options: { v: string; l: string; d?: string }[] };

const QUESTIONS: Q[] = [
  {
    key: "mood",
    label: "Which mood feels most like you?",
    options: [
      { v: "warm", l: "Warm & sensual", d: "Oud, amber, vanilla" },
      { v: "fresh", l: "Fresh & clean", d: "Citrus, aquatic, green" },
      { v: "bold", l: "Bold & smoky", d: "Tobacco, leather, spice" },
      { v: "floral", l: "Floral & romantic", d: "Rose, jasmine, peony" },
    ],
  },
  {
    key: "occasion",
    label: "When will you wear it most?",
    options: [
      { v: "evening", l: "Date night & evenings" },
      { v: "office", l: "Office & everyday" },
      { v: "special", l: "Special occasions" },
      { v: "all", l: "All the time — signature scent" },
    ],
  },
  {
    key: "gender",
    label: "Which collection are you browsing?",
    options: [
      { v: "men", l: "For him" },
      { v: "women", l: "For her" },
      { v: "unisex", l: "Unisex" },
      { v: "any", l: "Show me everything" },
    ],
  },
  {
    key: "intensity",
    label: "Projection preference?",
    options: [
      { v: "subtle", l: "Close to skin" },
      { v: "balanced", l: "Balanced" },
      { v: "strong", l: "Bold sillage" },
    ],
  },
];

function categoryFor(mood: string, gender: string): { slug: string | null; brand: string | null } {
  if (mood === "warm") return { slug: "oud-perfumes", brand: null };
  if (mood === "bold") return { slug: "smoky-scents", brand: null };
  if (mood === "fresh") return { slug: "fresh-scents", brand: null };
  if (mood === "floral") return { slug: gender === "men" ? null : "womens", brand: null };
  return { slug: null, brand: null };
}

function ScentDiscovery() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const recs = useQuery({
    queryKey: ["scent-discovery-recs", answers],
    enabled: done,
    queryFn: async () => {
      const { slug } = categoryFor(answers.mood, answers.gender);
      let q = supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,image_url,rating,stock,inspired_by_brand,inspired_by_product,categories(name,slug)")
        .eq("is_active", true)
        .limit(4);
      if (slug) {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
        if (cat?.id) q = q.eq("category_id", cat.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((p: any) => ({ ...p, category_name: p.categories?.name })) as ProductCardData[];
    },
  });

  const cur = QUESTIONS[step];
  const progress = ((step + (done ? 1 : 0)) / QUESTIONS.length) * 100;

  const pick = (v: string) => {
    const next = { ...answers, [cur.key]: v };
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else setDone(true);
  };

  const reset = () => { setAnswers({}); setStep(0); setDone(false); };

  return (
    <div className="container-px max-w-4xl mx-auto py-12 md:py-16">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">
          <Sparkles className="w-3.5 h-3.5" /> Scent Discovery
        </span>
        <h1 className="font-display text-3xl sm:text-5xl mt-2">Find your signature scent</h1>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Four quick questions. We'll match you with fragrances from our UAE-blended collection.
        </p>
      </div>

      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-8">
        <div className="h-full bg-[var(--amber-deep)] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {!done ? (
        <div className="card-elevated p-6 md:p-10 rounded-2xl border border-border bg-background">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Step {step + 1} of {QUESTIONS.length}
          </div>
          <h2 className="font-display text-2xl md:text-3xl mt-2">{cur.label}</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {cur.options.map((o) => (
              <button
                key={o.v}
                onClick={() => pick(o.v)}
                className="text-left p-5 rounded-xl border border-border hover:border-[var(--amber-deep)] hover:bg-[var(--cream)]/30 transition group"
              >
                <div className="font-semibold flex items-center justify-between">
                  {o.l}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                </div>
                {o.d && <div className="text-xs text-muted-foreground mt-1">{o.d}</div>}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl">Your perfect matches</h2>
            <p className="text-muted-foreground text-sm mt-2">Hand-picked based on your answers.</p>
          </div>
          {recs.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : recs.data && recs.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {recs.data.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No matches yet — browse the full collection.</p>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <button onClick={reset} className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary">
              Retake quiz
            </button>
            <button onClick={() => navigate({ to: "/shop" })} className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">
              Shop all fragrances
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-12">
        <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground">
          Skip the quiz — browse all scents →
        </Link>
      </div>
    </div>
  );
}
