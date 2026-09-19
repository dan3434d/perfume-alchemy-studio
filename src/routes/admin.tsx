import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatAUD } from "@/lib/format";
import { toast } from "sonner";
import { listAdminUsers, setUserRole, createManualOrder, updateOrderStatus, refundOrder } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Abdulrahman Perfumes" }] }),
  component: Admin,
});

type Tab = "dashboard" | "orders" | "new-order" | "users" | "products";

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth" });
      else if (!isAdmin) navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="container-px max-w-6xl mx-auto py-20 text-center text-muted-foreground">Verifying admin access…</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "orders", label: "Orders" },
    { key: "new-order", label: "New order" },
    { key: "users", label: "Users" },
    { key: "products", label: "Products" },
  ];

  return (
    <div className="container-px max-w-7xl mx-auto py-10">
      <h1 className="font-display text-3xl sm:text-4xl">Admin dashboard</h1>
      <div className="flex gap-1 border-b border-border my-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px ${tab === t.key ? "border-[var(--amber-deep)] text-foreground" : "border-transparent text-muted-foreground"}`}>{t.label}</button>
        ))}
      </div>
      {tab === "dashboard" && <Stats />}
      {tab === "products" && <Products />}
      {tab === "orders" && <Orders />}
      {tab === "new-order" && <NewOrder />}
      {tab === "users" && <Users currentUserId={user.id} />}
    </div>
  );
}

function Stats() {
  const q = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, products] = await Promise.all([
        supabase.from("orders").select("total,status", { count: "exact" }),
        supabase.from("products").select("id,stock", { count: "exact" }),
      ]);
      const allOrders = orders.data || [];
      const paidSales = allOrders.filter((o: any) => ["paid", "processing", "shipped", "delivered"].includes(o.status)).reduce((s, o: any) => s + Number(o.total), 0);
      const lowStock = (products.data || []).filter((p: any) => p.stock < 10).length;
      return { paidSales, orderCount: orders.count ?? 0, productCount: products.count ?? 0, lowStock };
    },
  });
  if (!q.data) return null;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat label="Paid sales" value={formatAUD(q.data.paidSales)} />
      <Stat label="Orders" value={q.data.orderCount} />
      <Stat label="Products" value={q.data.productCount} />
      <Stat label="Low stock" value={q.data.lowStock} />
    </div>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="card-elevated p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
    </div>
  );
}

function Products() {
  const q = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,slug,price,stock,is_active").order("name");
      return data || [];
    },
  });

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); q.refetch(); }
  };

  return (
    <div className="card-elevated overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left">
          <tr>
            <th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Active</th>
          </tr>
        </thead>
        <tbody>
          {q.data?.map((p: any) => (
            <tr key={p.id} className="border-t border-border">
              <td className="p-3"><Link to="/shop/$slug" params={{ slug: p.slug }} className="hover:text-[var(--amber-deep)]">{p.name}</Link></td>
              <td className="p-3"><input type="number" step="0.01" defaultValue={p.price} onBlur={(e) => update(p.id, { price: parseFloat(e.target.value) })} className="w-24 rounded-md border border-border bg-background px-2 py-1" /></td>
              <td className="p-3"><input type="number" defaultValue={p.stock} onBlur={(e) => update(p.id, { stock: parseInt(e.target.value) })} className="w-20 rounded-md border border-border bg-background px-2 py-1" /></td>
              <td className="p-3"><input type="checkbox" defaultChecked={p.is_active} onChange={(e) => update(p.id, { is_active: e.target.checked })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Orders() {
  const updateFn = useServerFn(updateOrderStatus);
  const refundFn = useServerFn(refundOrder);
  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const save = async (
    id: string,
    patch: { status: "shipped"; tracking_number: string; tracking_carrier: string },
  ) => {
    try {
      await updateFn({ data: { order_id: id, ...patch } });
      toast.success("Order updated");
      q.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };
  const refund = async (id: string) => {
    if (!window.confirm("Refund this payment in Stripe? This cannot be undone.")) return;
    try {
      await refundFn({ data: { order_id: id } });
      toast.success("Payment refunded");
      q.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Refund failed");
    }
  };

  return (
    <div className="space-y-3">
      {q.data?.map((o: any) => <AdminOrderRow key={o.id} order={o} onSave={save} onRefund={refund} />)}
    </div>
  );
}

function AdminOrderRow({ order, onSave, onRefund }: { order: any; onSave: (id: string, p: any) => void; onRefund: (id: string) => void }) {
  const [tracking, setTracking] = useState<string>(order.tracking_number || "");
  const [carrier, setCarrier] = useState<string>(order.tracking_carrier || "Australia Post");
  const isPaid = order.payment_status === "paid";
  const isShipped = order.status === "shipped";
  const canShip = isPaid && !isShipped && tracking.trim().length > 0 && carrier.trim().length > 0;

  return (
    <div className="card-elevated p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{order.order_number}</div>
          <div className="font-medium text-sm mt-1">{order.full_name}</div>
          <div className="text-xs text-muted-foreground">{order.email}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg">{formatAUD(order.total)}</div>
          <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-AU")}</div>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="border border-border bg-secondary px-2.5 py-1 font-semibold uppercase text-foreground">{order.status}</span>
          <span className="text-muted-foreground">Payment updates automatically after Stripe confirms it.</span>
          {isPaid ? <button type="button" className="ml-auto text-muted-foreground underline hover:text-destructive" onClick={() => onRefund(order.id)}>Refund in Stripe</button> : null}
        </div>
        {isPaid && !isShipped ? (
          <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <label className="text-xs text-muted-foreground">Tracking number
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. AP12345678AU" className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-muted-foreground">Carrier
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
              <Button disabled={!canShip} onClick={() => onSave(order.id, { status: "shipped", tracking_number: tracking.trim(), tracking_carrier: carrier.trim() })}>
                Mark shipped
              </Button>
          </div>
        ) : isShipped ? (
          <div className="text-sm text-muted-foreground">Shipped with {order.tracking_carrier} · <span className="font-mono">{order.tracking_number}</span></div>
        ) : (
          <div className="text-sm text-muted-foreground">Waiting for Stripe to confirm payment before fulfilment can begin.</div>
        )}
      </div>
    </div>
  );
}


function Users({ currentUserId }: { currentUserId: string }) {
  const listFn = useServerFn(listAdminUsers);
  const setRoleFn = useServerFn(setUserRole);
  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn({ data: undefined as any }),
  });

  const changeRole = async (user_id: string, role: "admin" | "customer") => {
    try {
      await setRoleFn({ data: { user_id, role } });
      toast.success(`Role set to ${role}`);
      q.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update role");
    }
  };

  if (q.isLoading) return <div className="text-muted-foreground">Loading users…</div>;
  if (q.error) return <div className="text-destructive">{(q.error as any).message}</div>;

  return (
    <div className="card-elevated overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left">
          <tr><th className="p-3">Email</th><th className="p-3">Joined</th><th className="p-3">Role</th></tr>
        </thead>
        <tbody>
          {(q.data || []).map((u: any) => {
            const role: "admin" | "customer" = u.roles.includes("admin") ? "admin" : "customer";
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">{u.email}{isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-AU")}</td>
                <td className="p-3">
                  <select
                    value={role}
                    disabled={isSelf}
                    onChange={(e) => changeRole(u.id, e.target.value as any)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="customer">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NewOrder() {
  const createFn = useServerFn(createManualOrder);
  const products = useQuery({
    queryKey: ["admin-product-options"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,price").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    shipping_line1: "",
    shipping_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postcode: "",
    shipping_country: "Australia",
    notes: "",
    status: "pending" as const,
    payment_status: "unpaid" as const,
    shipping: 0,
  });
  const [lines, setLines] = useState<{ product_id: string; quantity: number }[]>([{ product_id: "", quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const subtotal = lines.reduce((s, l) => {
    const p = products.data?.find((x: any) => x.id === l.product_id);
    return s + (p ? Number(p.price) * l.quantity : 0);
  }, 0);
  const total = subtotal + Number(form.shipping || 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = lines.filter((l) => l.product_id && l.quantity > 0);
    if (!valid.length) { toast.error("Add at least one line item"); return; }
    setSubmitting(true);
    try {
      const res = await createFn({ data: { ...form, lines: valid } });
      toast.success(`Order ${res.order_number} created`);
      setLines([{ product_id: "", quantity: 1 }]);
      setForm((f) => ({ ...f, email: "", full_name: "", phone: "", shipping_line1: "", shipping_line2: "", shipping_city: "", shipping_state: "", shipping_postcode: "", notes: "" }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-2 gap-6">
      <div className="card-elevated p-6 space-y-3">
        <h2 className="font-display text-xl mb-2">Customer & shipping</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={input} required placeholder="Full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
          <input className={input} required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <input className={input} placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <input className={input} required placeholder="Address line 1" value={form.shipping_line1} onChange={(e) => update("shipping_line1", e.target.value)} />
          <input className={input} placeholder="Address line 2" value={form.shipping_line2} onChange={(e) => update("shipping_line2", e.target.value)} />
          <input className={input} required placeholder="City" value={form.shipping_city} onChange={(e) => update("shipping_city", e.target.value)} />
          <input className={input} required placeholder="State" value={form.shipping_state} onChange={(e) => update("shipping_state", e.target.value)} />
          <input className={input} required placeholder="Postcode" value={form.shipping_postcode} onChange={(e) => update("shipping_postcode", e.target.value)} />
          <input className={input} required placeholder="Country" value={form.shipping_country} onChange={(e) => update("shipping_country", e.target.value)} />
        </div>
        <textarea className={input} placeholder="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
      </div>

      <div className="card-elevated p-6 space-y-3">
        <h2 className="font-display text-xl mb-2">Items</h2>
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_auto] gap-2">
            <select className={input} value={line.product_id} onChange={(e) => setLines((arr) => arr.map((l, idx) => idx === i ? { ...l, product_id: e.target.value } : l))}>
              <option value="">— Select product —</option>
              {products.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {formatAUD(Number(p.price))}</option>)}
            </select>
            <input className={input} type="number" min={1} value={line.quantity} onChange={(e) => setLines((arr) => arr.map((l, idx) => idx === i ? { ...l, quantity: parseInt(e.target.value) || 1 } : l))} />
            <button type="button" onClick={() => setLines((arr) => arr.filter((_, idx) => idx !== i))} className="px-2 text-muted-foreground hover:text-destructive" disabled={lines.length === 1}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => setLines((arr) => [...arr, { product_id: "", quantity: 1 }])} className="text-sm text-[var(--amber-deep)] hover:underline">+ Add item</button>

        <div className="pt-3 border-t border-border">
          <label className="text-sm">Shipping ($)
            <input className={input} type="number" step="0.01" min={0} value={form.shipping} onChange={(e) => update("shipping", parseFloat(e.target.value) || 0)} />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">Created as pending. Payment status cannot be set manually.</p>
        </div>

        <div className="pt-3 border-t border-border text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatAUD(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatAUD(Number(form.shipping || 0))}</span></div>
          <div className="flex justify-between font-display text-lg"><span>Total</span><span>{formatAUD(total)}</span></div>
        </div>

        <button type="submit" disabled={submitting} className="w-full mt-3 rounded-md bg-[var(--amber-deep)] text-white py-2.5 text-sm font-medium disabled:opacity-50">
          {submitting ? "Creating…" : "Create order"}
        </button>
      </div>
    </form>
  );
}
