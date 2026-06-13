import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatAUD } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { useCart } from "@/hooks/useCart";
import { useDiscount } from "@/hooks/useDiscount";
import { confirmStripeCheckout } from "@/lib/checkout.functions";
import { Check, Mail, Truck, MapPin, Package, ArrowRight, Sparkles, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      return data as any;
    },
    enabled: !confirming,
    refetchInterval: (q) => (q.state.data?.payment_status === "paid" ? false : 2000),
  });

  const eta = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 2);
    const end = new Date();
    end.setDate(end.getDate() + 5);
    const fmt = (d: Date) => d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  const o = order.data;

  return (
    <div className="relative">
      {/* Soft gold gradient backdrop */}
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{ background: "radial-gradient(ellipse at top, var(--gold) 0%, transparent 55%)" }}
      />

      <div className="container-px max-w-3xl mx-auto pt-12 sm:pt-16 pb-20">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-20 h-20 rounded-full grid place-items-center shadow-[var(--shadow-elegant)]"
               style={{ background: "var(--gradient-gold)" }}>
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <span className="inline-flex items-center gap-1.5 mt-6 text-[11px] uppercase tracking-[0.22em] text-[var(--amber-deep)]">
            <Sparkles className="w-3 h-3" /> Order confirmed
          </span>
          <h1 className="font-display text-3xl sm:text-5xl mt-3 leading-tight">Thank you{o?.full_name ? `, ${o.full_name.split(" ")[0]}` : ""}.</h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            {confirming
              ? "Confirming your payment with Stripe…"
              : "Your fragrance is being prepared with care. A confirmation has been sent to your email."}
          </p>
          {confirming && <Loader2 className="w-5 h-5 animate-spin text-[var(--amber-deep)] mx-auto mt-4" />}
        </div>

        {o && (
          <>
            {/* Order card */}
            <div className="card-elevated mt-10 overflow-hidden">
              <div className="p-6 sm:p-7 border-b border-border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Order number</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-lg font-semibold">{o.order_number}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(o.order_number); toast.success("Order number copied"); }}
                      className="p-1.5 rounded-md hover:bg-secondary"
                      aria-label="Copy order number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Total paid</div>
                  <div className="font-display text-2xl mt-1">{formatAUD(Number(o.total))}</div>
                </div>
              </div>

              {/* Items */}
              <div className="p-6 sm:p-7 space-y-4">
                {(o.order_items as any[])?.map((it) => (
                  <div key={it.id} className="flex gap-4 items-center">
                    <img src={productImage(it.image_url)} alt={it.product_name} className="w-14 h-14 rounded-xl object-cover bg-[var(--cream)]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.product_name}</div>
                      <div className="text-xs text-muted-foreground">50ml · Qty {it.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold whitespace-nowrap">{formatAUD(Number(it.line_total))}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="px-6 sm:px-7 pb-6 sm:pb-7 space-y-1.5 text-sm">
                <Row k="Subtotal" v={formatAUD(Number(o.subtotal))} />
                {Number(o.discount_amount) > 0 && (
                  <Row k={`Discount${o.discount_code ? ` (${o.discount_code})` : ""}`} v={`− ${formatAUD(Number(o.discount_amount))}`} accent />
                )}
                <Row k="Shipping" v={Number(o.shipping) === 0 ? "Free" : formatAUD(Number(o.shipping))} />
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-border mt-2">
                  <span>Total</span><span>{formatAUD(Number(o.total))}</span>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="card-elevated mt-6 p-6 sm:p-7">
              <h2 className="font-display text-xl mb-5">What happens next</h2>
              <Timeline status={o.status} />
            </div>

            {/* Info grid */}
            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              <Info icon={Mail} title="Email receipt" body={`Sent to ${o.email}`} />
              <Info icon={Truck} title="Estimated delivery" body={eta} />
              <Info
                icon={MapPin}
                title="Shipping to"
                body={`${o.shipping_city}, ${o.shipping_state} ${o.shipping_postcode}`}
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="mt-10 flex gap-3 justify-center flex-wrap">
          <Link to="/account" className="btn-gold rounded-full px-6 py-3 text-sm font-semibold inline-flex items-center gap-2">
            Track my order <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/shop" className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary">
            Continue shopping
          </Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help? Email <a className="underline" href="mailto:support@abdulrahman.store">support@abdulrahman.store</a>
        </p>
      </div>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={accent ? "text-[var(--amber-deep)] font-semibold" : ""}>{v}</span>
    </div>
  );
}

function Info({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border p-4 flex items-start gap-3 bg-background">
      <div className="w-9 h-9 rounded-full grid place-items-center bg-[var(--amber-deep)]/10 text-[var(--amber-deep)] shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="text-muted-foreground mt-0.5 break-words">{body}</div>
      </div>
    </div>
  );
}

const STEPS = [
  { key: "paid", label: "Payment confirmed", icon: Check },
  { key: "processing", label: "Preparing your order", icon: Package },
  { key: "shipped", label: "On the way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

function Timeline({ status }: { status: string }) {
  const order = ["pending", "paid", "processing", "shipped", "delivered"];
  const currentIdx = Math.max(0, order.indexOf(status));
  return (
    <ol className="space-y-4">
      {STEPS.map((s, i) => {
        const stepIdx = order.indexOf(s.key);
        const done = currentIdx >= stepIdx;
        const active = currentIdx === stepIdx;
        const Icon = s.icon;
        return (
          <li key={s.key} className="flex items-center gap-4">
            <div
              className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${
                done
                  ? "bg-[var(--amber-deep)] text-white"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</div>
              {active && <div className="text-xs text-[var(--amber-deep)] mt-0.5">In progress</div>}
            </div>
            {i < STEPS.length - 1 && (
              <div className="hidden sm:block w-12 h-px bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
