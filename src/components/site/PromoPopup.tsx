import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgePercent, X, Sparkles } from "lucide-react";

const KEY = "abdul.buy2.popup.shown";

export function PromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) === "1") return;
    const t = window.setTimeout(() => setOpen(true), 6000);
    return () => window.clearTimeout(t);
  }, []);

  const close = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur hover:bg-secondary"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          className="px-8 pt-10 pb-6 text-white text-center"
          style={{ background: "var(--gradient-gold)" }}
        >
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] opacity-90">
            <Sparkles className="w-3 h-3" /> Limited bundle offer
          </div>
          <div className="font-display text-4xl mt-3 leading-tight">Buy 2, save 15%</div>
          <p className="mt-3 text-sm opacity-95">
            Mix &amp; match any two 50ml bottles — discount applied automatically at checkout.
          </p>
        </div>
        <div className="p-6 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <BadgePercent className="w-4 h-4 text-[var(--amber-deep)]" />
            Free metro AU shipping on orders over $50
          </div>
          <Link
            to="/shop"
            onClick={close}
            className="btn-gold block w-full rounded-full py-3 text-sm font-semibold"
          >
            Shop the collection
          </Link>
          <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground">
            No thanks, I'll browse first
          </button>
        </div>
      </div>
    </div>
  );
}
