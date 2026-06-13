// Central pricing & shipping rules for Abdulrahman Perfumes.
// Single source of truth — used by cart, checkout UI, and server checkout fn.

export const UNIT_PRICE = 41.5;
export const FREE_SHIPPING_THRESHOLD = 50;
export const METRO_SHIPPING_FEE = 9.99;
export const RURAL_HANDLING_FEE = 5.5;
export const RURAL_HANDLING_WAIVED_OVER = 100;
export const BULK_DISCOUNT_MIN_QTY = 2;
export const BULK_DISCOUNT_PERCENT = 15;

// Australian states considered "rural / remote" for the handling fee.
// Also: QLD postcodes >= 4700 (Rockhampton & north — Far North QLD).
const RURAL_STATES = new Set(["WA", "NT", "TAS"]);

export function normaliseState(state?: string | null): string {
  return (state ?? "").trim().toUpperCase();
}

export function isRuralAddress(opts: { state?: string | null; postcode?: string | null }): boolean {
  const s = normaliseState(opts.state);
  if (RURAL_STATES.has(s)) return true;
  if (s === "QLD" && opts.postcode) {
    const pc = parseInt(opts.postcode, 10);
    if (!isNaN(pc) && pc >= 4700) return true;
  }
  return false;
}

export function computeBulkDiscountPercent(totalQty: number, codePercent = 0): number {
  const bulk = totalQty >= BULK_DISCOUNT_MIN_QTY ? BULK_DISCOUNT_PERCENT : 0;
  return Math.max(bulk, codePercent);
}

export type ShippingBreakdown = {
  base: number;
  handling: number;
  total: number;
  rural: boolean;
  freeShipping: boolean;
};

export function computeShipping(
  subtotalAfterDiscount: number,
  address: { state?: string | null; postcode?: string | null; country?: string | null },
): ShippingBreakdown {
  if (subtotalAfterDiscount <= 0) {
    return { base: 0, handling: 0, total: 0, rural: false, freeShipping: true };
  }
  const rural = isRuralAddress(address);
  const base = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : METRO_SHIPPING_FEE;
  const handling = rural && subtotalAfterDiscount < RURAL_HANDLING_WAIVED_OVER ? RURAL_HANDLING_FEE : 0;
  const total = +(base + handling).toFixed(2);
  return { base, handling, total, rural, freeShipping: base === 0 };
}
