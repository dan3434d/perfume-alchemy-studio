import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";

const LineSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image_url: z.string().nullable().optional(),
});

const CheckoutSchema = z.object({
  order_id: z.string().uuid(),
  email: z.string().email(),
  lines: z.array(LineSchema).min(1),
  shipping: z.number().min(0),
  discount_percent: z.number().min(0).max(100).default(0),
  origin: z.string().url(),
});

function getStripe() {
  const key = process.env.STRIPE;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key, {
    apiVersion: "2024-06-20" as any,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const createStripeCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    const stripe = getStripe();

    const discountFactor = (100 - data.discount_percent) / 100;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = data.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "aud",
        unit_amount: Math.round(l.price * discountFactor * 100),
        product_data: {
          name: data.discount_percent > 0 ? `${l.name} (-${data.discount_percent}%)` : l.name,
          images: l.image_url ? [l.image_url] : undefined,
          metadata: { product_id: l.product_id, slug: l.slug },
        },
      },
    }));

    if (data.shipping > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: Math.round(data.shipping * 100),
          product_data: { name: "Shipping" },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.email,
      line_items,
      metadata: { order_id: data.order_id, discount_percent: String(data.discount_percent) },
      success_url: `${data.origin}/checkout/success/${data.order_id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/checkout?cancelled=1`,
      shipping_address_collection: { allowed_countries: ["AU"] },
    });

    return { url: session.url };
  });

const ConfirmSchema = z.object({
  order_id: z.string().uuid(),
  session_id: z.string().min(1),
});

export const confirmStripeCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConfirmSchema.parse(input))
  .handler(async ({ data }) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(data.session_id);
    if (session.metadata?.order_id !== data.order_id) {
      throw new Error("Order mismatch");
    }
    const paid = session.payment_status === "paid";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: paid ? "paid" : "unpaid",
        status: paid ? "paid" : "pending",
        stripe_session_id: data.session_id,
      })
      .eq("id", data.order_id);

    return { paid };
  });
