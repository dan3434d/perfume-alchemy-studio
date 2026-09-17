import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { z } from "zod";
import { computeUnitOffer, OFFER_QUOTE_MINUTES } from "./pricing";

const QuoteSchema = z.object({
  visitor_key: z.string().min(8).max(100),
  lines: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
  signals: z.object({
    returnVisits: z.number().int().min(0).max(100).optional(),
    productInterest: z.number().int().min(0).max(100).optional(),
    cartQuantity: z.number().int().min(0).max(100).optional(),
    exitIntent: z.boolean().optional(),
    quizCompleted: z.boolean().optional(),
    postcode: z.string().max(16).nullable().optional(),
    country: z.string().max(80).nullable().optional(),
  }),
});

export type PricingQuote = {
  id: string;
  expiresAt: string;
  lines: Record<string, { price: number; referencePrice: number; savings: number; savingsPercent: number; quantity: number }>;
  subtotal: number;
  referenceSubtotal: number;
  savings: number;
  savingsPercent: number;
};

export const createPricingQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuoteSchema.parse(input))
  .handler(async ({ data }): Promise<PricingQuote> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = [...new Set(data.lines.map((line) => line.product_id))];
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id,price,is_active")
      .in("id", ids)
      .eq("is_active", true);
    if (error) throw error;
    if ((products ?? []).length !== ids.length) throw new Error("One or more products are unavailable");

    const quantities = new Map(data.lines.map((line) => [line.product_id, line.quantity]));
    const quotedLines: PricingQuote["lines"] = {};
    let subtotal = 0;
    let referenceSubtotal = 0;
    let highestTier = 0;
    let regionBand: string | null = null;
    for (const product of products ?? []) {
      const quantity = quantities.get(product.id) ?? 1;
      const offer = computeUnitOffer(Number(product.price), { ...data.signals, cartQuantity: data.lines.reduce((sum, line) => sum + line.quantity, 0) });
      quotedLines[product.id] = {
        price: offer.price,
        referencePrice: offer.referencePrice,
        savings: offer.savings,
        savingsPercent: offer.savingsPercent,
        quantity,
      };
      subtotal += offer.price * quantity;
      referenceSubtotal += offer.referencePrice * quantity;
      highestTier = Math.max(highestTier, offer.signalTier);
      regionBand = offer.regionBand;
    }
    subtotal = +subtotal.toFixed(2);
    referenceSubtotal = +referenceSubtotal.toFixed(2);
    const savings = +(referenceSubtotal - subtotal).toFixed(2);
    const savingsPercent = referenceSubtotal > 0 ? Math.round((savings / referenceSubtotal) * 100) : 0;
    const expiresAt = new Date(Date.now() + OFFER_QUOTE_MINUTES * 60_000).toISOString();
    const visitorKeyHash = createHash("sha256").update(data.visitor_key).digest("hex");

    const { data: quote, error: insertError } = await supabaseAdmin
      .from("pricing_quotes")
      .insert({
        visitor_key_hash: visitorKeyHash,
        product_prices: quotedLines,
        reference_prices: Object.fromEntries(Object.entries(quotedLines).map(([id, line]) => [id, line.referencePrice])),
        savings_percent: savingsPercent,
        signal_tier: highestTier,
        region_band: regionBand,
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;
    return { id: quote.id, expiresAt, lines: quotedLines, subtotal, referenceSubtotal, savings, savingsPercent };
  });