import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
  head: () => ({ meta: [{ title: "Unsubscribe — Abdulrahman Perfumes" }] }),
  component: Unsubscribe,
});

function Unsubscribe() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [state, setState] = useState<"loading" | "valid" | "already" | "invalid" | "done" | "error">("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setState("valid");
        else if (d.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setState("loading");
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.success) setState("done");
      else if (d.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="container-px max-w-md mx-auto py-20 text-center">
      <h1 className="font-display text-3xl mb-2">Email preferences</h1>
      {state === "loading" && <p className="text-muted-foreground">One moment…</p>}
      {state === "invalid" && <p className="text-muted-foreground">This unsubscribe link is invalid or has expired.</p>}
      {state === "already" && <p className="text-muted-foreground">You've already been unsubscribed.</p>}
      {state === "valid" && (
        <>
          <p className="text-muted-foreground mb-6">Confirm you'd like to stop receiving emails from Abdulrahman Perfumes.</p>
          <button onClick={confirm} className="rounded-full bg-[var(--amber-deep)] text-white px-6 py-2.5 text-sm font-medium">
            Confirm unsubscribe
          </button>
        </>
      )}
      {state === "done" && <p className="text-foreground">You've been unsubscribed. Sorry to see you go.</p>}
      {state === "error" && <p className="text-destructive">Something went wrong. Please try again later.</p>}
    </div>
  );
}
