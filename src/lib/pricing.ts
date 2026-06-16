// Central pricing & shipping rules for Abdulrahman Perfumes.
// Single source of truth — used by cart, checkout UI, and server checkout fn.

export const UNIT_PRICE = 41.5;
export const FREE_SHIPPING_THRESHOLD = 50;
export const METRO_SHIPPING_FEE = 9.99;
export const EXPRESS_SHIPPING_SURCHARGE = 4.99;
export const WORLDWIDE_SHIPPING_FEE = 19.5;
export const RURAL_HANDLING_FEE = 5.5;
export const RURAL_HANDLING_WAIVED_OVER = 100;
export const BULK_DISCOUNT_MIN_QTY = 2;
export const BULK_DISCOUNT_PERCENT = 15;

export type ShippingMethod = "standard" | "express" | "worldwide";

// Australian states considered "rural / remote" for the handling fee.
// Also: QLD postcodes >= 4700 (Rockhampton & north — Far North QLD).
const RURAL_STATES = new Set(["WA", "NT", "TAS"]);

export function normaliseState(state?: string | null): string {
  return (state ?? "").trim().toUpperCase();
}

export function isAustralia(country?: string | null): boolean {
  const c = (country ?? "").trim().toUpperCase();
  return c === "" || c === "AUSTRALIA" || c === "AU" || c === "AUS";
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
  method: ShippingMethod;
};

export function computeShipping(
  subtotalAfterDiscount: number,
  address: { state?: string | null; postcode?: string | null; country?: string | null },
  method: ShippingMethod = "standard",
): ShippingBreakdown {
  // International auto-switches to worldwide pricing
  const intl = !isAustralia(address.country);
  const effectiveMethod: ShippingMethod = intl ? "worldwide" : method;

  if (subtotalAfterDiscount <= 0) {
    return { base: 0, handling: 0, total: 0, rural: false, freeShipping: true, method: effectiveMethod };
  }

  if (effectiveMethod === "worldwide") {
    return {
      base: WORLDWIDE_SHIPPING_FEE,
      handling: 0,
      total: WORLDWIDE_SHIPPING_FEE,
      rural: false,
      freeShipping: false,
      method: "worldwide",
    };
  }

  const rural = isRuralAddress(address);
  const standardBase = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : METRO_SHIPPING_FEE;
  const expressSurcharge = effectiveMethod === "express" ? EXPRESS_SHIPPING_SURCHARGE : 0;
  const base = +(standardBase + expressSurcharge).toFixed(2);
  const handling = rural && subtotalAfterDiscount < RURAL_HANDLING_WAIVED_OVER ? RURAL_HANDLING_FEE : 0;
  const total = +(base + handling).toFixed(2);
  return {
    base,
    handling,
    total,
    rural,
    freeShipping: standardBase === 0 && expressSurcharge === 0,
    method: effectiveMethod,
  };
}

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "JO", name: "Jordan" },
  { code: "LB", name: "Lebanon" },
  { code: "EG", name: "Egypt" },
  { code: "TR", name: "Turkey" },
  { code: "ZA", name: "South Africa" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "HK", name: "Hong Kong" },
  { code: "CN", name: "China" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
];

export function countryNameToCode(name?: string | null): string {
  const v = (name ?? "").trim();
  if (!v) return "AU";
  const upper = v.toUpperCase();
  if (upper.length === 2) {
    const found = COUNTRIES.find((c) => c.code === upper);
    if (found) return found.code;
  }
  const byName = COUNTRIES.find((c) => c.name.toUpperCase() === upper);
  return byName?.code ?? "AU";
}
