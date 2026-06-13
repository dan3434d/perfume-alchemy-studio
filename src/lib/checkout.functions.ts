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
  email: z.string().email(),
  full_name: z.string().min(1),
  phone: z.string().nullable().optional(),
  shipping_line1: z.string().min(1),
  shipping_line2: z.string().nullable().optional(),
  shipping_city: z.string().min(1),
  shipping_state: z.string().min(1),
  shipping_postcode: z.string().min(1),
  shipping_country: z.string().min(1).default("Australia"),
  notes: z.string().nullable().optional(),
  lines: z.array(LineSchema).min(1),
  discount_code: z.string().nullable().optional(),
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const productIds = [...new Set(data.lines.map((line) => line.product_id))];
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id,name,slug,price,image_url,stock,is_active")
      .in("id", productIds)
      .eq("is_active", true);
    if (productsError) throw productsError;

    const productMap = new Map((products ?? []).map((product) => [product.id, product]));
    const orderLines = data.lines.map((line) => {
      const product = productMap.get(line.product_id);
      if (!product) throw new Error("One or more products are unavailable");
      if (typeof product.stock === "number" && product.stock < line.quantity) throw new Error(`${product.name} is out of stock`);
      return {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        quantity: line.quantity,
        image_url: product.image_url,
      };
    });

    const subtotal = +orderLines.reduce((sum, line) => sum + line.price * line.quantity, 0).toFixed(2);
    const shipping = subtotal >= 80 ? 0 : 9.95;
    const discountPercent = data.discount_code === "WELCOME5" ? 5 : 0;
    const discountAmount = +(subtotal * discountPercent / 100).toFixed(2);
    const total = +(subtotal - discountAmount + shipping).toFixed(2);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: null,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || null,
        shipping_line1: data.shipping_line1,
        shipping_line2: data.shipping_line2 || null,
        shipping_city: data.shipping_city,
        shipping_state: data.shipping_state,
        shipping_postcode: data.shipping_postcode,
        shipping_country: data.shipping_country,
        subtotal,
        shipping,
        total,
        discount_code: discountPercent ? "WELCOME5" : null,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        notes: data.notes || null,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderLines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      product_name: line.name,
      product_slug: line.slug,
      unit_price: line.price,
      quantity: line.quantity,
      line_total: +(line.price * line.quantity).toFixed(2),
      image_url: line.image_url,
    })));
    if (itemsError) throw itemsError;

    const discountFactor = (100 - discountPercent) / 100;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = orderLines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "aud",
        unit_amount: Math.round(l.price * discountFactor * 100),
        product_data: {
          name: discountPercent > 0 ? `${l.name} (-${discountPercent}%)` : l.name,
          images: l.image_url ? [l.image_url] : undefined,
          metadata: { product_id: l.product_id, slug: l.slug },
        },
      },
    }));

    if (shipping > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: Math.round(shipping * 100),
          product_data: { name: "Shipping" },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.email,
      line_items,
      metadata: { order_id: order.id, discount_percent: String(discountPercent) },
      success_url: `${data.origin}/checkout/success/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
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
      })
      .eq("id", data.order_id);

    return { paid };
  });
