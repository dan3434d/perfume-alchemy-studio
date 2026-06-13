import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatAUD } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Abdulrahman Perfumes" }] }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dashboard" | "products" | "orders">("dashboard");

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth" });
      else if (!isAdmin) navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="container-px max-w-6xl mx-auto py-20 text-center text-muted-foreground">Verifying admin access…</div>;
  }

  return (
    <div className="container-px max-w-7xl mx-auto py-10">
      <h1 className="font-display text-3xl sm:text-4xl">Admin dashboard</h1>
      <div className="flex gap-1 border-b border-border my-6">
        {(["dashboard", "products", "orders"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm capitalize border-b-2 -mb-px ${tab === t ? "border-[var(--amber-deep)] text-foreground" : "border-transparent text-muted-foreground"}`}>{t}</button>
        ))}
      </div>
      {tab === "dashboard" && <Stats />}
      {tab === "products" && <Products />}
      {tab === "orders" && <Orders />}
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
      const totalSales = (orders.data || []).reduce((s, o: any) => s + Number(o.total), 0);
      const lowStock = (products.data || []).filter((p: any) => p.stock < 10).length;
      return { totalSales, orderCount: orders.count ?? 0, productCount: products.count ?? 0, lowStock };
    },
  });
  if (!q.data) return null;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat label="Total sales" value={formatAUD(q.data.totalSales)} />
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
  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const setStatus = async (id: string, status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded") => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status updated"); q.refetch(); }
  };

  return (
    <div className="card-elevated overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left">
          <tr><th className="p-3">Order #</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Date</th></tr>
        </thead>
        <tbody>
          {q.data?.map((o: any) => (
            <tr key={o.id} className="border-t border-border">
              <td className="p-3 font-mono text-xs">{o.order_number}</td>
              <td className="p-3">{o.full_name}<div className="text-xs text-muted-foreground">{o.email}</div></td>
              <td className="p-3">{formatAUD(o.total)}</td>
              <td className="p-3">
                <select defaultValue={o.status} onChange={(e) => setStatus(o.id, e.target.value as any)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                  {["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-AU")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
