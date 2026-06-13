import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useDiscount } from "@/hooks/useDiscount";
import { confirmStripeCheckout } from "@/lib/checkout.functions";
import { Check, Mail, Truck } from "lucide-react";

export const Route = createFileRoute("/checkout/success/$orderId")({
  head: () => ({ meta: [{ title: "Order confirmed — Abdulrahman Perfumes" }] }),
  component: Success,
});

function Success() {
  const { orderId } = Route.useParams();
  const { clear: clearCart } = useCart();
  const { clear: clearDiscount } = useDiscount();
  const confirm = useServerFn(confirmStripeCheckout);
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    if (!sid) { setConfirming(false); return; }
    confirm({ data: { order_id: orderId, session_id: sid } })
      .then(({ paid }) => {
        if (paid) {
          clearCart();
          clearDiscount();
        }
      })
      .catch(() => {})
      .finally(() => setConfirming(false));
  }, [orderId]);

  const order = useQuery({
    queryKey: ["order", orderId, confirming],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
      return data;
    },
    enabled: !confirming,
  });

  return (
    <div className="container-px max-w-2xl mx-auto py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-[var(--gold)]/20 grid place-items-center">
        <Check className="w-8 h-8 text-[var(--amber-deep)]" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl mt-6">Thank you for your order</h1>
      <p className="text-muted-foreground mt-3">
        {confirming ? "Confirming your payment…" : "A confirmation has been sent to your email."}
      </p>

      {order.data && (
        <>
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

          <div className="grid sm:grid-cols-2 gap-3 mt-6 text-left">
            <div className="rounded-xl border border-border p-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-[var(--amber-deep)] mt-0.5" />
              <div className="text-xs"><div className="font-semibold">Confirmation email</div><div className="text-muted-foreground mt-0.5">Sent to {order.data.email}</div></div>
            </div>
            <div className="rounded-xl border border-border p-4 flex items-start gap-3">
              <Truck className="w-5 h-5 text-[var(--amber-deep)] mt-0.5" />
              <div className="text-xs"><div className="font-semibold">Ships in 24h</div><div className="text-muted-foreground mt-0.5">Tracking link sent on dispatch</div></div>
            </div>
          </div>
        </>
      )}

      <div className="mt-8 flex gap-3 justify-center flex-wrap">
        <Link to="/shop" className="rounded-full border border-border px-6 py-3 text-sm font-semibold">Continue shopping</Link>
        <Link to="/account" className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">View my orders</Link>
      </div>
    </div>
  );
}
