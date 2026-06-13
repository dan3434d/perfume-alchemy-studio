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

    return { id: order.id, order_number: order.order_number };
  });
