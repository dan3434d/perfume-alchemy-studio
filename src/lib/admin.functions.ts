import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Forbidden: admin only");
}

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;
    const ids = usersData.users.map((u) => u.id);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids);
    const rolesByUser = new Map<string, string[]>();
    (roles || []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) || [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    return usersData.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      roles: rolesByUser.get(u.id) || [],
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["admin", "customer"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId && data.role !== "admin") {
      throw new Error("You cannot remove your own admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: targetError } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (targetError) throw targetError;
    if (!target.user) throw new Error("User not found");

    const oppositeRole = data.role === "admin" ? "customer" : "admin";
    const { error: addError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    if (addError) throw addError;

    const { error: removeError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", oppositeRole);
    if (removeError) throw removeError;

    return { ok: true, role: data.role };
  });

const ManualOrderSchema = z.object({
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
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]).default("paid"),
  payment_status: z.enum(["unpaid", "paid", "refunded"]).default("paid"),
  shipping: z.number().min(0).default(0),
  lines: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  ).min(1),
});

export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ManualOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = [...new Set(data.lines.map((l) => l.product_id))];
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,name,slug,price,image_url")
      .in("id", ids);
    if (pErr) throw pErr;
    const pmap = new Map((products || []).map((p) => [p.id, p]));

    const orderLines = data.lines.map((l) => {
      const p = pmap.get(l.product_id);
      if (!p) throw new Error("Unknown product");
      return {
        product_id: p.id,
        product_name: p.name,
        product_slug: p.slug,
        unit_price: Number(p.price),
        quantity: l.quantity,
        line_total: +(Number(p.price) * l.quantity).toFixed(2),
        image_url: p.image_url,
      };
    });

    const subtotal = +orderLines.reduce((s, l) => s + l.line_total, 0).toFixed(2);
    const total = +(subtotal + data.shipping).toFixed(2);

    const { data: order, error: oErr } = await supabaseAdmin
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
        shipping: data.shipping,
        total,
        notes: data.notes || null,
        status: data.status,
        payment_status: data.payment_status,
      })
      .select("id,order_number")
      .single();
    if (oErr) throw oErr;

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderLines.map((l) => ({ ...l, order_id: order.id })));
    if (iErr) throw iErr;

    // Notify customer + admin
    const { sendTransactionalEmail } = await import("@/lib/email/send.server");
    const fmt = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
    const itemSummary = orderLines.map((l) => ({
      name: l.product_name,
      quantity: l.quantity,
      price: fmt.format(Number(l.line_total)),
    }));
    await sendTransactionalEmail({
      templateName: "order-confirmation",
      recipientEmail: data.email,
      idempotencyKey: `order-confirm-${order.id}`,
      templateData: {
        orderNumber: order.order_number,
        customerName: data.full_name,
        total: fmt.format(total),
        items: itemSummary,
      },
    });
    await sendTransactionalEmail({
      templateName: "admin-new-order",
      recipientEmail: "dbueducation@gmail.com",
      idempotencyKey: `admin-new-order-${order.id}`,
      templateData: {
        orderNumber: order.order_number,
        customerName: data.full_name,
        customerEmail: data.email,
        total: fmt.format(total),
        items: itemSummary,
      },
    });


    return { id: order.id, order_number: order.order_number };
  });

const UpdateOrderSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  tracking_number: z.string().nullable().optional(),
  tracking_carrier: z.string().nullable().optional(),
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: getErr } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,email,full_name,status,payment_status,tracking_number,tracking_carrier,shipped_at,refunded_at,stripe_payment_intent,total")
      .eq("id", data.order_id)
      .single<any>();
    if (getErr) throw getErr;

    const patch: Record<string, any> = { status: data.status };
    if (data.tracking_number !== undefined) patch.tracking_number = data.tracking_number || null;
    if (data.tracking_carrier !== undefined) patch.tracking_carrier = data.tracking_carrier || null;
    if (data.status === "shipped" && !order.shipped_at) patch.shipped_at = new Date().toISOString();

    // Keep payment_status in sync with order status.
    if (["paid", "processing", "shipped", "delivered"].includes(data.status)) {
      patch.payment_status = "paid";
    } else if (data.status === "pending") {
      patch.payment_status = "unpaid";
    }

    // Refund flow — issue a Stripe refund the first time an order is marked refunded.
    let refundResult: { refunded: boolean; amount?: number; error?: string } = { refunded: false };
    if (data.status === "refunded" && order.status !== "refunded") {
      patch.payment_status = "refunded";
      patch.refunded_at = new Date().toISOString();
      if (order.stripe_payment_intent) {
        try {
          const Stripe = (await import("stripe")).default;
          const key = process.env.STRIPE;
          if (!key) throw new Error("Stripe is not configured");
          const stripe = new Stripe(key, {
            apiVersion: "2024-06-20" as any,
            httpClient: (Stripe as any).createFetchHttpClient(),
          });
          const refund = await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent,
            reason: "requested_by_customer",
            metadata: { order_id: order.id, order_number: order.order_number },
          });
          refundResult = { refunded: true, amount: refund.amount };
        } catch (e: any) {
          throw new Error(`Stripe refund failed: ${e?.message || "unknown error"}`);
        }
      }

    }

    const { error: updErr } = await (supabaseAdmin.from("orders") as any).update(patch).eq("id", data.order_id);
    if (updErr) throw updErr;

    const { sendTransactionalEmail } = await import("@/lib/email/send.server");
    const carrier = data.tracking_carrier ?? order.tracking_carrier ?? "";
    const tracking = data.tracking_number ?? order.tracking_number ?? "";
    const fmt = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

    if (data.status === "shipped" && tracking) {
      await sendTransactionalEmail({
        templateName: "order-shipped",
        recipientEmail: order.email,
        idempotencyKey: `order-shipped-${order.id}-${tracking}`,
        templateData: {
          orderNumber: order.order_number,
          customerName: order.full_name,
          carrier: carrier || "your carrier",
          trackingNumber: tracking,
        },
      });
    } else if (data.status === "refunded" && order.status !== "refunded") {
      await sendTransactionalEmail({
        templateName: "order-status",
        recipientEmail: order.email,
        idempotencyKey: `order-refunded-${order.id}`,
        templateData: {
          orderNumber: order.order_number,
          customerName: order.full_name,
          status: `refunded — ${fmt.format(Number(order.total))} has been returned to your card`,
        },
      });
    } else if (data.status !== order.status) {
      await sendTransactionalEmail({
        templateName: "order-status",
        recipientEmail: order.email,
        idempotencyKey: `order-status-${order.id}-${data.status}`,
        templateData: {
          orderNumber: order.order_number,
          customerName: order.full_name,
          status: data.status,
        },
      });
    }

    return { ok: true, refund: refundResult };
  });


