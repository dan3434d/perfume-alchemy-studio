import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ensureUserAccount } from "@/lib/account.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Abdulrahman Perfumes" }] }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const ensureAccount = useServerFn(ensureUserAccount);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const account = await ensureAccount({ data: undefined as any });
        toast.success("Welcome back");
        navigate({ to: account.role === "admin" ? "/admin" : "/account" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created — you can now sign in");
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-px max-w-md mx-auto py-16">
      <h1 className="font-display text-3xl text-center">
        {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
      </h1>
      <p className="text-center text-muted-foreground mt-2 text-sm">
        {mode === "login" ? "Sign in to track orders and save favourites." : mode === "signup" ? "Join Abdulrahman Perfumes." : "We'll email you a reset link."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <Input label="Full name" value={fullName} onChange={setFullName} required />
        )}
        <Input label="Email" type="email" value={email} onChange={setEmail} required />
        {mode !== "forgot" && (
          <Input label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
        )}
        <button disabled={loading} className="btn-gold w-full rounded-full py-3 font-semibold disabled:opacity-60">
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm space-y-2">
        {mode === "login" && (
          <>
            <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground block w-full">Forgot password?</button>
            <button onClick={() => setMode("signup")} className="text-[var(--amber-deep)] hover:underline">Don't have an account? Sign up</button>
          </>
        )}
        {mode === "signup" && (
          <button onClick={() => setMode("login")} className="text-[var(--amber-deep)] hover:underline">Already have an account? Sign in</button>
        )}
        {mode === "forgot" && (
          <button onClick={() => setMode("login")} className="text-[var(--amber-deep)] hover:underline">Back to sign in</button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-8">
        <Link to="/">← Back to store</Link>
      </p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, minLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type} value={value} required={required} minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
