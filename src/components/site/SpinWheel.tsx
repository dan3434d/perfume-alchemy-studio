import { useEffect, useRef, useState } from "react";
import { useDiscount, spinShown, markSpinShown } from "@/hooks/useDiscount";
import { X, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";

// Wheel segments — most slots are "Try again" with a guaranteed 5% prize.
const SEGMENTS = [
  { label: "5% OFF", color: "#C77B3E", prize: true },
  { label: "Try again", color: "#F5E9DA" },
  { label: "5% OFF", color: "#8B5A2B", prize: true },
  { label: "Try again", color: "#F5E9DA" },
  { label: "5% OFF", color: "#C77B3E", prize: true },
  { label: "Try again", color: "#F5E9DA" },
  { label: "5% OFF", color: "#8B5A2B", prize: true },
  { label: "Try again", color: "#F5E9DA" },
];

export function SpinWheel() {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState(false);
  const { discount, apply } = useDiscount();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    if (!spinShown() && !discount) {
      const t = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(t);
    }
  }, [discount]);

  if (!open) return null;

  const close = () => {
    markSpinShown();
    setOpen(false);
  };

  const spin = () => {
    if (spinning || won) return;
    setSpinning(true);
    // Always land on a prize segment (index 0). Add 6 full turns.
    const seg = 360 / SEGMENTS.length;
    const target = 360 * 6 + (360 - seg * 0 - seg / 2);
    setRotation(target);
    setTimeout(() => {
      setSpinning(false);
      setWon(true);
      apply({ code: "WELCOME5", percent: 5 });
      markSpinShown();
      toast.success("5% off applied to your next order");
    }, 4200);
  };

  const seg = 360 / SEGMENTS.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md bg-background rounded-3xl overflow-hidden shadow-2xl">
        <button onClick={close} aria-label="Close" className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-secondary">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-7 text-center" style={{ background: "var(--gradient-warm)" }}>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[var(--amber-deep)]">
            <Sparkles className="w-3.5 h-3.5" /> New customer offer
          </div>
          <h2 className="font-display text-2xl sm:text-3xl mt-2">Spin to win 5% off</h2>
          <p className="text-sm text-muted-foreground mt-1">One spin per visitor — auto-applied at checkout.</p>
        </div>

        <div className="relative mx-auto my-6 w-64 h-64">
          {/* Pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-[14px] border-transparent border-b-foreground" />
          </div>
          {/* Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-foreground shadow-xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.18, 0.89, 0.32, 1.07)" : undefined,
              background: `conic-gradient(${SEGMENTS.map((s, i) => `${s.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(",")})`,
            }}
          >
            {SEGMENTS.map((s, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left text-[10px] font-bold tracking-wider"
                style={{
                  transform: `rotate(${i * seg + seg / 2}deg) translateX(40px)`,
                  color: s.prize ? "#fff" : "#3b2412",
                }}
              >
                {s.label}
              </div>
            ))}
          </div>
          {/* Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground border-4 border-background grid place-items-center">
            <Gift className="w-4 h-4 text-background" />
          </div>
        </div>

        <div className="px-6 pb-6 text-center">
          {!won ? (
            <button
              onClick={spin}
              disabled={spinning}
              className="btn-gold w-full rounded-full py-3 font-semibold disabled:opacity-60"
            >
              {spinning ? "Spinning…" : "Spin the wheel"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-dashed border-[var(--amber-deep)] p-4">
                <div className="text-xs text-muted-foreground">Your code</div>
                <div className="font-display text-2xl tracking-widest mt-1">WELCOME5</div>
                <div className="text-xs text-[var(--amber-deep)] mt-1">5% off — auto-applied at checkout</div>
              </div>
              <button onClick={close} className="btn-gold w-full rounded-full py-3 font-semibold">
                Start shopping
              </button>
            </div>
          )}
          <button onClick={close} className="block mx-auto mt-3 text-xs text-muted-foreground hover:underline">
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
