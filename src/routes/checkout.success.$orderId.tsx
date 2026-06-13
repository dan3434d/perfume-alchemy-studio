import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { Check } from "lucide-react";

export const Route = createFileRoute("/checkout/success/$orderId")({
  head: () => ({ meta: [{ title: "Order confirmed — Abdulrahman Perfumes" }] }),
  component: Success,
});

function Success() {
  const { orderId } = Route.useParams();
  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
      return data;
    },
  });

  return (
    <div className="container-px max-w-2xl mx-auto py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-[var(--gold)]/20 grid place-items-center">
        <Check className="w-8 h-8 text-[var(--amber-deep)]" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl mt-6">Thank you for your order</h1>
      <p className="text-muted-foreground mt-3">A confirmation has been sent to your email.</p>
      {order.data && (
        <div className="card-elevated mt-8 p-6 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order #</span>
            <span className="font-mono">{order.data.order_number}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatAUD(order.data.total)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize">{order.data.status}</span>
          </div>
        </div>
      )}
      <div className="mt-8 flex gap-3 justify-center">
        <Link to="/shop" className="rounded-full border border-border px-6 py-3 text-sm font-semibold">Continue shopping</Link>
        <Link to="/account" className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">View my orders</Link>
      </div>
    </div>
  );
}
