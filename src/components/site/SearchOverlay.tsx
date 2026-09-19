import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/product-image";
import { formatAUD } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  inspired_by_brand: string | null;
  inspired_by_product: string | null;
};

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTerm("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const all = useQuery({
    queryKey: ["products", "search-index"],
    enabled: open,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,price,image_url,inspired_by_brand,inspired_by_product")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  const results = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return (all.data ?? [])
      .filter((p) =>
        `${p.name} ${p.inspired_by_brand ?? ""} ${p.inspired_by_product ?? ""}`.toLowerCase().includes(t),
      )
      .slice(0, 6);
  }, [all.data, term]);

  const popular = ["Oud", "Tom Ford", "Dior", "Fresh", "Amber"];

  if (!open) return null;

  const go = (to: string, search?: Record<string, string>) => {
    onClose();
    navigate({ to, search: search as never });
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <button aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" />
      <div className="relative bg-background border-b border-border">
        <div className="container-px max-w-3xl mx-auto py-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (term.trim()) go("/shop", { q: term.trim() });
            }}
            className="flex items-center gap-3 border-b border-foreground pb-3"
          >
            <Search className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />
            <input
              ref={inputRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search fragrances, brands or notes…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <button type="button" onClick={onClose} aria-label="Close" className="p-1 hover:opacity-60">
              <X className="w-5 h-5" />
            </button>
          </form>

          {!term.trim() ? (
            <div className="pt-5">
              <div className="eyebrow mb-3">Popular searches</div>
              <div className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTerm(p)}
                    className="text-[11px] uppercase tracking-[0.14em] px-4 py-2 border border-border hover:border-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="pt-6 text-sm text-muted-foreground">No matches. Try a brand name like “Dior” or a note like “oud”.</p>
          ) : (
            <ul className="pt-4 divide-y divide-border">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => go(`/shop/${p.slug}`)}
                    className="w-full flex items-center gap-4 py-3 text-left hover:bg-secondary/60 px-1"
                  >
                    <img src={productImage(p.image_url)} alt="" className="w-12 h-14 object-cover border border-border" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{p.name}</span>
                      {p.inspired_by_brand && (
                        <span className="block text-[11.5px] text-muted-foreground truncate">
                          In the spirit of {p.inspired_by_brand} {p.inspired_by_product ?? ""}
                        </span>
                      )}
                    </span>
                    <span className="text-sm">{formatAUD(Number(p.price))}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => go("/shop", { q: term.trim() })}
                  className="w-full py-3 text-[12px] uppercase tracking-[0.14em] hover:opacity-70"
                >
                  See all results
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
