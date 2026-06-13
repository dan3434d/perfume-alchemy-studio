import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgePercent, X } from "lucide-react";

const KEY = "abdul.buy2.banner.dismissed";

export function PromoBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(KEY) === "1");
  }, []);

  if (hidden) return null;

  return (
    <div
      className="relative text-white text-center text-xs sm:text-sm"
      style={{ background: "var(--gradient-gold)" }}
    >
      <Link to="/shop" className="block container-px max-w-7xl mx-auto py-2.5 pr-10 inline-flex items-center justify-center gap-2 font-medium hover:opacity-95">
        <BadgePercent className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-semibold">Buy 2, save 15%</span>
          <span className="hidden sm:inline"> — applied automatically.</span>
          <span className="hidden md:inline"> Free metro AU shipping over $50.</span>
        </span>
        <span className="underline underline-offset-2 ml-1">Shop now →</span>
      </Link>
      <button
        onClick={() => {
          localStorage.setItem(KEY, "1");
          setHidden(true);
        }}
        aria-label="Dismiss promo"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-black/10"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
