import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "ap_cart_v1";

export type CartLine = {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock?: number;
  inspired_by_brand?: string | null;
  inspired_by_product?: string | null;
};

type Listener = (lines: CartLine[]) => void;
const listeners = new Set<Listener>();
let cache: CartLine[] = [];

function readLocal(): CartLine[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function writeLocal(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lines));
}
function emit() { listeners.forEach((l) => l(cache)); }

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(cache.length ? cache : []);

  useEffect(() => {
    if (cache.length === 0) {
      cache = readLocal();
    }
    setLines(cache);
    const l: Listener = (x) => setLines([...x]);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const persist = (next: CartLine[]) => {
    cache = next;
    writeLocal(next);
    emit();
  };

  const add = useCallback((line: Omit<CartLine, "quantity">, qty = 1) => {
    const next = [...cache];
    const idx = next.findIndex((l) => l.product_id === line.product_id);
    if (idx >= 0) next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
    else next.push({ ...line, quantity: qty });
    persist(next);
  }, []);

  const updateQty = useCallback((product_id: string, qty: number) => {
    const next = cache
      .map((l) => (l.product_id === product_id ? { ...l, quantity: Math.max(1, qty) } : l))
      .filter((l) => l.quantity > 0);
    persist(next);
  }, []);

  const remove = useCallback((product_id: string) => {
    persist(cache.filter((l) => l.product_id !== product_id));
  }, []);

  const clear = useCallback(() => persist([]), []);

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return { lines, add, updateQty, remove, clear, subtotal, count };
}

// Wishlist (DB-backed when signed in, local fallback)
const WISH_KEY = "ap_wishlist_v1";
export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from("wishlist_items").select("product_id").eq("user_id", session.user.id);
        setIds((data || []).map((r) => r.product_id));
      } else {
        try { setIds(JSON.parse(localStorage.getItem(WISH_KEY) || "[]")); } catch { setIds([]); }
      }
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggle = async (product_id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const has = ids.includes(product_id);
    if (session?.user) {
      if (has) {
        await supabase.from("wishlist_items").delete().eq("user_id", session.user.id).eq("product_id", product_id);
        setIds(ids.filter((i) => i !== product_id));
      } else {
        await supabase.from("wishlist_items").insert({ user_id: session.user.id, product_id });
        setIds([...ids, product_id]);
      }
    } else {
      const next = has ? ids.filter((i) => i !== product_id) : [...ids, product_id];
      setIds(next);
      localStorage.setItem(WISH_KEY, JSON.stringify(next));
    }
  };

  return { ids, has: (id: string) => ids.includes(id), toggle };
}
