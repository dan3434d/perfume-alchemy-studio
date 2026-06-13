// Lightweight browsing history tracker for personalised recs.
const KEY = "ap_browse_history_v1";
const MAX = 20;

export type BrowseEntry = {
  product_id: string;
  slug: string;
  brand?: string | null;
  category_slug?: string | null;
  at: number;
};

export function readHistory(): BrowseEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function trackView(entry: Omit<BrowseEntry, "at">) {
  if (typeof window === "undefined" || !entry?.product_id) return;
  const list = readHistory().filter((e) => e.product_id !== entry.product_id);
  list.unshift({ ...entry, at: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function topBrands(limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const e of readHistory()) {
    if (e.brand) counts.set(e.brand, (counts.get(e.brand) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([b]) => b);
}

export function viewedIds(): string[] {
  return readHistory().map((e) => e.product_id);
}
