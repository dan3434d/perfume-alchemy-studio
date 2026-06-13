import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatAUD } from "@/lib/format";
import { useWishlist } from "@/hooks/useCart";
import { productImage } from "@/lib/product-image";
import { toast } from "sonner";
import { createComplaint } from "@/lib/complaints.functions";


export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My account — Abdulrahman Perfumes" }] }),
  component: Account,
});

function Account() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "wishlist" | "addresses">("orders");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user) return <div className="container-px max-w-5xl mx-auto py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container-px max-w-5xl mx-auto py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">My account</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin" className="text-sm rounded-full bg-[var(--amber-deep)] text-white px-4 py-2 hover:opacity-90">
              Admin dashboard
            </Link>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
            className="text-sm rounded-full border border-border px-4 py-2 hover:bg-secondary"
          >Sign out</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {(["orders", "wishlist", "addresses"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm capitalize border-b-2 -mb-px ${tab === t ? "border-[var(--amber-deep)] text-foreground" : "border-transparent text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "orders" && <Orders userId={user.id} />}
      {tab === "wishlist" && <Wishlist />}
      {tab === "addresses" && <Addresses userId={user.id} />}
    </div>
  );
}

function Orders({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false });
      return data || [];
    },
  });
  if (q.isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;
  if (!q.data?.length) return <div className="text-muted-foreground text-sm py-10 text-center border border-dashed border-border rounded-2xl">No orders yet. <Link to="/shop" className="text-[var(--amber-deep)] hover:underline">Start shopping →</Link></div>;
  return (
    <div className="space-y-4">
      {q.data.map((o: any) => <OrderCard key={o.id} order={o} onRefresh={q.refetch} />)}
    </div>
  );
}

const STATUS_STEPS = ["pending", "paid", "processing", "shipped", "delivered"] as const;

function StatusTimeline({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status as any);
  const isCancelled = status === "cancelled" || status === "refunded";
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((s, i) => {
        const active = !isCancelled && i <= idx;
        return (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${active ? "bg-[var(--amber-deep)]" : "bg-border"}`} />
            <div className={`text-[10px] mt-1 capitalize ${i === idx ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</div>
          </div>
        );
      })}
      {isCancelled && (
        <div className="ml-3 text-xs text-destructive capitalize">{status}</div>
      )}
    </div>
  );
}

function OrderCard({ order, onRefresh }: { order: any; onRefresh: () => void }) {
  const [showComplaint, setShowComplaint] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const createFn = useServerFn(createComplaint);

  const submit = async () => {
    if (subject.trim().length < 2 || message.trim().length < 5) {
      toast.error("Please add a subject and message");
      return;
    }
    setSubmitting(true);
    try {
      await createFn({ data: { order_id: order.id, subject, message } });
      toast.success("Complaint submitted — we'll be in touch");
      setShowComplaint(false);
      setSubject("");
      setMessage("");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-elevated p-5">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="font-mono text-xs text-muted-foreground">#{order.order_number}</div>
          <div className="text-sm mt-1">{new Date(order.created_at).toLocaleDateString("en-AU", { dateStyle: "medium" })}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{formatAUD(order.total)}</div>
          <span className="inline-block mt-1 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary capitalize">{order.status}</span>
        </div>
      </div>

      <StatusTimeline status={order.status} />

      <div className="mt-4 text-sm text-muted-foreground">
        {order.order_items.length} item{order.order_items.length === 1 ? "" : "s"}: {order.order_items.map((i: any) => i.product_name).join(", ")}
      </div>

      {order.tracking_number && (
        <div className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Tracking ({order.tracking_carrier || "carrier"}): </span>
          <span className="font-mono">{order.tracking_number}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowComplaint((v) => !v)}
          className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-secondary"
        >
          {showComplaint ? "Cancel" : "Raise a complaint"}
        </button>
      </div>

      {showComplaint && (
        <div className="mt-3 space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g. Damaged bottle)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue…"
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            disabled={submitting}
            onClick={submit}
            className="rounded-full bg-[var(--amber-deep)] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Send complaint"}
          </button>
        </div>
      )}
    </div>
  );
}


function Wishlist() {
  const { ids, toggle } = useWishlist();
  const q = useQuery({
    queryKey: ["wishlist-products", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,slug,price,image_url").in("id", ids);
      return data || [];
    },
  });
  if (ids.length === 0) return <div className="text-muted-foreground text-sm py-10 text-center border border-dashed border-border rounded-2xl">No saved products yet.</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {q.data?.map((p: any) => (
        <div key={p.id} className="card-elevated overflow-hidden">
          <Link to="/shop/$slug" params={{ slug: p.slug }} className="block aspect-square bg-[var(--cream)]">
            <img src={productImage(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
          </Link>
          <div className="p-3">
            <div className="font-medium text-sm">{p.name}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm">{formatAUD(p.price)}</span>
              <button onClick={() => toggle(p.id)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Addresses({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      const { data } = await supabase.from("addresses").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      return data || [];
    },
  });
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ full_name: "", line1: "", city: "", state: "", postcode: "", country: "Australia", phone: "" });

  const save = async () => {
    const { error } = await supabase.from("addresses").insert({ ...form, user_id: userId });
    if (error) toast.error(error.message); else { toast.success("Address saved"); setShow(false); q.refetch(); }
  };

  return (
    <div className="space-y-4">
      {q.data?.map((a: any) => (
        <div key={a.id} className="card-elevated p-5 text-sm">
          <div className="font-semibold">{a.full_name}</div>
          <div className="text-muted-foreground mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.state} {a.postcode}, {a.country}</div>
        </div>
      ))}
      {!show ? (
        <button onClick={() => setShow(true)} className="btn-gold rounded-full px-5 py-2 text-sm font-semibold">+ Add address</button>
      ) : (
        <div className="card-elevated p-5 space-y-3">
          {(["full_name", "phone", "line1", "city", "state", "postcode", "country"] as const).map((k) => (
            <input key={k} placeholder={k.replace("_", " ")} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          ))}
          <div className="flex gap-2">
            <button onClick={save} className="btn-gold rounded-full px-5 py-2 text-sm font-semibold">Save</button>
            <button onClick={() => setShow(false)} className="rounded-full border border-border px-5 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
