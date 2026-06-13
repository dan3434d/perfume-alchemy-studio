import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { computeBulkDiscountPercent, computeShipping } from "./pricing";


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
  user_id: z.string().uuid().nullable().optional(),
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
    const totalQty = orderLines.reduce((sum, line) => sum + line.quantity, 0);
    const submittedCode = (data.discount_code || "").toUpperCase();
    const isFreeShipping = submittedCode === "FREESHIPPING";
    const codePercent = submittedCode === "WELCOME5" ? 5 : (isFreeShipping ? 0 : (data.discount_percent || 0));
    const discountPercent = computeBulkDiscountPercent(totalQty, codePercent);
    const discountAmount = +(subtotal * discountPercent / 100).toFixed(2);
    const subtotalAfterDiscount = +(subtotal - discountAmount).toFixed(2);
    const rawShip = computeShipping(subtotalAfterDiscount, {
      state: data.shipping_state,
      postcode: data.shipping_postcode,
      country: data.shipping_country,
    });
    const ship = isFreeShipping
      ? { ...rawShip, base: 0, handling: 0, total: 0, freeShipping: true }
      : rawShip;
    const shipping = ship.total;
    const total = +(subtotalAfterDiscount + shipping).toFixed(2);

    const discountCode = isFreeShipping
      ? "FREESHIPPING"
      : discountPercent > 0
        ? (submittedCode === "WELCOME5" && discountPercent === codePercent
            ? "WELCOME5"
            : totalQty >= 2 ? "BUY2-15" : null)
        : null;

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
        discount_code: discountCode,
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

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = orderLines.map((l) => {
      const imageUrl = l.image_url ? new URL(l.image_url, data.origin).toString() : undefined;
      return {
        quantity: l.quantity,
        price_data: {
          currency: "aud",
          unit_amount: Math.round(l.price * discountFactor * 100),
          product_data: {
            name: discountPercent > 0 ? `${l.name} (-${discountPercent}%)` : l.name,
            images: imageUrl ? [imageUrl] : undefined,
            metadata: { product_id: l.product_id, slug: l.slug },
          },
        },
      };
    });

    if (shipping > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: Math.round(shipping * 100),
          product_data: { name: ship.handling > 0 ? "Shipping & remote handling" : "Shipping" },
        },
      });
    }


    const countryCode = ((): string => {
      const c = (data.shipping_country || "").trim().toUpperCase();
      if (c === "AUSTRALIA" || c === "AU" || c === "AUS") return "AU";
      if (c === "NEW ZEALAND" || c === "NZ") return "NZ";
      if (c.length === 2) return c;
      return "AU";
    })();

    const address = {
      line1: data.shipping_line1,
      line2: data.shipping_line2 || undefined,
      city: data.shipping_city,
      state: data.shipping_state,
      postal_code: data.shipping_postcode,
      country: countryCode,
    };

    // Pre-create a Stripe Customer with name + shipping pre-filled so the
    // checkout page shows their details instead of empty fields.
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.full_name,
      phone: data.phone || undefined,
      address,
      shipping: { name: data.full_name, phone: data.phone || undefined, address },
      metadata: { order_id: order.id },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: customer.id,
      customer_update: { name: "auto", address: "auto", shipping: "auto" },
      line_items,
      metadata: { order_id: order.id, discount_percent: String(discountPercent) },
      payment_intent_data: {
        shipping: { name: data.full_name, phone: data.phone || undefined, address },
      },
      success_url: `${data.origin}/checkout/success/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/checkout?cancelled=1`,
      billing_address_collection: "auto",
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
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("status,payment_status,order_number,email,full_name,total")
      .eq("id", data.order_id)
      .single();

    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: paid ? "paid" : "unpaid",
        status: paid ? "paid" : "pending",
      })
      .eq("id", data.order_id);

    // Send confirmation only on first transition to paid
    if (paid && existing && existing.payment_status !== "paid") {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_name,quantity,line_total")
        .eq("order_id", data.order_id);

      const fmt = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
      const { sendTransactionalEmail } = await import("@/lib/email/send.server");
      await sendTransactionalEmail({
        templateName: "order-confirmation",
        recipientEmail: existing.email,
        idempotencyKey: `order-confirm-${data.order_id}`,
        templateData: {
          orderNumber: existing.order_number,
          customerName: existing.full_name,
          total: fmt.format(Number(existing.total)),
          items: (items || []).map((i: any) => ({
            name: i.product_name,
            quantity: i.quantity,
            price: fmt.format(Number(i.line_total)),
          })),
        },
      });
    }

    return { paid };
  });

