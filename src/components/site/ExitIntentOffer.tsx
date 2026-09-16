import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Gift } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useDiscount, spinShown, markSpinShown } from "@/hooks/useDiscount";
import { formatAUD } from "@/lib/format";

const SHOWN_KEY = "ap_exit_offer_v1";

/**
 * Automatic "don't go yet" offer. Fires on desktop exit-intent (cursor leaving
 * through the top of the window) or on mobile when the tab is backgrounded /
 * the shopper sits idle. Applies the 5% code automatically — once per browser.
 */
export function ExitIntentOffer() {
  const { count, subtotal } = useCart();
  const { discount, apply } = useDiscount();
  const [open, setOpen] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (count === 0 || discount) return;
    if (localStorage.getItem(SHOWN_KEY) === "1") return;

    const trigger = () => {
      if (fired.current) return;
      fired.current = true;
      localStorage.setItem(SHOWN_KEY, "1");
      markSpinShown(); // never stack the wheel on top of this
      apply({ code: "WELCOME5", percent: 5 });
      setOpen(true);
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") trigger();
    };

    let idle = window.setTimeout(trigger, 45000);
    const resetIdle = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(trigger, 45000);
    };

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", resetIdle, { passive: true });
    window.addEventListener("pointerdown", resetIdle);

    return () => {
      window.clearTimeout(idle);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", resetIdle);
      window.removeEventListener("pointerdown", resetIdle);
    };
  }, [count, discount, apply]);

  // Don't surface the modal while the shopper is away.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const saving = +(subtotal * 0.05).toFixed(2);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4 bg-foreground/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Before you go — 5% off">
      <div className="relative w-full max-w-md bg-background border border-border p-7 sm:p-9 text-center animate-fade-up">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close offer"
          className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="mx-auto grid place-items-center w-11 h-11 rounded-full text-background" style={{ background: "var(--gradient-gold)" }}>
          <Gift className="w-5 h-5" />
        </span>
        <p className="eyebrow mt-4">Before you go</p>
        <h2 className="font-display text-2xl sm:text-3xl mt-2 leading-tight">Here's 5% off your bag</h2>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          Code <span className="text-foreground font-semibold">WELCOME5</span> is already applied
          {saving > 0 && <> — that's {formatAUD(saving)} off</>}. Take two bottles and it becomes 15% off instead.
        </p>
        <Link
          to="/checkout"
          onClick={() => setOpen(false)}
          className="btn-gold mt-6 inline-block w-full py-3 text-sm font-semibold"
        >
          Finish my order
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 text-xs text-muted-foreground link-underline"
        >
          Keep browsing
        </button>
      </div>
    </div>
  );
}
