import { useEffect, useMemo, useState } from "react";
import { readHistory } from "./useBrowsingHistory";
import { computeUnitOffer, type PricingSignals } from "@/lib/pricing";

const VISITS_KEY = "ap_visit_count_v1";
const SESSION_KEY = "ap_visit_session_v1";
const EXIT_KEY = "ap_exit_offer_v1";
export const PRICING_EVENT = "ap-pricing-update";

export function getPricingSignals(cartQuantity = 0, location?: { postcode?: string; country?: string }): PricingSignals {
  if (typeof window === "undefined") return { cartQuantity, ...location };
  const history = readHistory();
  return {
    returnVisits: Number(localStorage.getItem(VISITS_KEY) || "1"),
    productInterest: history.length,
    cartQuantity,
    exitIntent: localStorage.getItem(EXIT_KEY) === "1",
    quizCompleted: localStorage.getItem("ap_scent_quiz_complete_v1") === "1",
    postcode: location?.postcode,
    country: location?.country,
  };
}

export function getVisitorKey(): string {
  if (typeof window === "undefined") return "server";
  const key = "ap_visitor_key_v1";
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

export function announcePricingUpdate() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PRICING_EVENT));
}

export function usePricingOffer(basePrice: number, cartQuantity = 0, location?: { postcode?: string; country?: string }) {
  const [revision, setRevision] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const visits = Number(localStorage.getItem(VISITS_KEY) || "0") + 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    setHydrated(true);
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener(PRICING_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PRICING_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return useMemo(
    () => computeUnitOffer(basePrice, hydrated ? getPricingSignals(cartQuantity, location) : { cartQuantity }),
    [basePrice, cartQuantity, location?.postcode, location?.country, revision, hydrated],
  );
}