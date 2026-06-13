import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Abdulrahman Perfumes" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in the URL hash on load
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); navigate({ to: "/account" }); }
  };

  return (
    <div className="container-px max-w-md mx-auto py-16">
      <h1 className="font-display text-3xl text-center">Set a new password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
        <button disabled={loading} className="btn-gold w-full rounded-full py-3 font-semibold disabled:opacity-60">{loading ? "Updating…" : "Update password"}</button>
      </form>
    </div>
  );
}
