import { useCallback, useEffect, useState } from "react";

const KEY = "ap_discount_v1";
const SPIN_KEY = "ap_spin_shown_v1";

export type Discount = { code: string; percent: number } | null;

type Listener = (d: Discount) => void;
const listeners = new Set<Listener>();
let cache: Discount = null;

function read(): Discount {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function write(d: Discount) {
  if (typeof window === "undefined") return;
  if (d) localStorage.setItem(KEY, JSON.stringify(d));
  else localStorage.removeItem(KEY);
}
function emit() { listeners.forEach((l) => l(cache)); }

export function useDiscount() {
  const [discount, setDiscount] = useState<Discount>(cache);

  useEffect(() => {
    if (cache === null) cache = read();
    setDiscount(cache);
    const l: Listener = (d) => setDiscount(d);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const apply = useCallback((d: Discount) => {
    cache = d;
    write(d);
    emit();
  }, []);

  const clear = useCallback(() => apply(null), [apply]);

  return { discount, apply, clear };
}

export function spinShown() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SPIN_KEY) === "1";
}
export function markSpinShown() {
  if (typeof window !== "undefined") localStorage.setItem(SPIN_KEY, "1");
}
