import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createPricingQuote, type PricingQuote } from "@/lib/pricing.functions";
import { getPricingSignals, getVisitorKey, PRICING_EVENT } from "./usePricingOffer";
import type { CartLine } from "./useCart";

export function useCartPricing(lines: CartLine[], location?: { postcode?: string; country?: string }) {
  const requestQuote = useServerFn(createPricingQuote);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [refresh, setRefresh] = useState(0);
  const signature = useMemo(() => lines.map((line) => `${line.product_id}:${line.quantity}`).sort().join("|"), [lines]);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1);
    window.addEventListener(PRICING_EVENT, update);
    return () => window.removeEventListener(PRICING_EVENT, update);
  }, []);

  useEffect(() => {
    if (!lines.length) { setQuote(null); return; }
    const timer = window.setTimeout(async () => {
      try {
        const next = await requestQuote({ data: {
          visitor_key: getVisitorKey(),
          lines: lines.map((line) => ({ product_id: line.product_id, quantity: line.quantity })),
          signals: getPricingSignals(count, location),
        } });
        setQuote((current) => current && current.subtotal < next.subtotal ? current : next);
      } catch {
        setQuote(null);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [signature, count, location?.postcode, location?.country, refresh, requestQuote]);

  const pricedLines = lines.map((line) => ({
    ...line,
    price: quote?.lines[line.product_id]?.price ?? line.price,
    referencePrice: quote?.lines[line.product_id]?.referencePrice ?? 55,
  }));
  const subtotal = +pricedLines.reduce((sum, line) => sum + line.price * line.quantity, 0).toFixed(2);
  return { quote, pricedLines, subtotal, loading: lines.length > 0 && !quote };
}