import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type ViewRole = "admin" | "user";

export interface AuthState {
  session: Session | null;
  user: User | null;
  role: ViewRole | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<ViewRole | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!session?.user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    let cancelled = false;
    setRole(null);
    setRoleLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error("Unable to load user role", error);
        setRole("user");
      } else {
        setRole(data?.some((r) => r.role === "admin") ? "admin" : "user");
      }
      setRoleLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, session?.user?.id]);

  const loading = !authReady || roleLoading;
  return { session, user: session?.user ?? null, role, isAdmin: role === "admin", loading };
}
