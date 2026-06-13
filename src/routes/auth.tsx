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
  const [appleLoading, setAppleLoading] = useState(false);

  const onApple = async () => {
    setAppleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error instanceof Error ? result.error : new Error(String(result.error));
      if (result.redirected) return;
      const account = await ensureAccount({ data: undefined as any });
      toast.success("Signed in with Apple");
      navigate({ to: account.role === "admin" ? "/admin" : "/account" });
    } catch (err: any) {
      toast.error(err?.message || "Apple sign-in failed");
    } finally {
      setAppleLoading(false);
    }
  };

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

      {mode !== "forgot" && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            onClick={onApple}
            disabled={appleLoading}
            className="w-full rounded-full py-3 font-semibold inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-black/90 disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3-.79.83-2.07 1.46-3.13 1.38-.14-1.12.42-2.28 1.16-3.05.83-.86 2.23-1.5 3.18-1.55v.22zM20.5 17.27c-.55 1.28-.81 1.86-1.52 2.99-1 1.58-2.41 3.55-4.16 3.57-1.56.02-1.96-1.02-4.07-1.01-2.11.01-2.55 1.03-4.11 1.01-1.75-.02-3.09-1.79-4.09-3.37C-.06 17.22-.39 11.86 1.6 9.04c1.13-1.6 2.92-2.62 4.71-2.62 1.83 0 2.98 1.01 4.49 1.01 1.46 0 2.35-1.01 4.47-1.01 1.6 0 3.29.87 4.49 2.38-3.95 2.17-3.31 7.81 1.74 8.47z" />
            </svg>
            {appleLoading ? "Connecting…" : "Continue with Apple"}
          </button>
        </>
      )}


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
