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
        const { syncPaidStripeOrder } = await import("@/lib/checkout.functions");

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

        return Response.json({ ok: true, checked: results.length, results });
      },
    },
  },
});