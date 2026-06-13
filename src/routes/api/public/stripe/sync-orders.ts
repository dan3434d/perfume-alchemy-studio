import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe/sync-orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
        const providedKey = request.headers.get("apikey");
        if (!expectedKey || providedKey !== expectedKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getStripe, syncPaidStripeOrder } = await import("@/lib/checkout.functions");

        const { data: orders, error } = await supabaseAdmin
          .from("orders")
          .select("id,stripe_session_id")
          .eq("payment_status", "unpaid")
          .not("stripe_session_id", "is", null)
          .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString())
          .order("created_at", { ascending: false })
          .limit(25);

        if (error) return Response.json({ error: error.message }, { status: 500 });

        const results = [];
        for (const order of orders || []) {
          try {
            const result = await syncPaidStripeOrder(order.id, order.stripe_session_id as string);
            results.push({ order_id: order.id, paid: result.paid });
          } catch (e: any) {
            results.push({ order_id: order.id, error: e?.message || "Sync failed" });
          }
        }

        const stripe = getStripe();
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
          created: { gte: Math.floor(Date.now() / 1000) - 60 * 60 * 24 },
        });
        for (const session of sessions.data) {
          const orderId = session.metadata?.order_id;
          if (!orderId || session.payment_status !== "paid") continue;
          try {
            const result = await syncPaidStripeOrder(orderId, session.id);
            results.push({ order_id: orderId, paid: result.paid, recovered_from_stripe: true });
          } catch (e: any) {
            results.push({ order_id: orderId, error: e?.message || "Recovery failed" });
          }
        }

        return Response.json({ ok: true, checked: results.length, results });
      },
    },
  },
});