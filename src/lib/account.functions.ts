import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AccountRole = "admin" | "customer";

export const ensureUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (userError) throw userError;

    const email = userData.user.email ?? context.claims?.email ?? null;
    const fullName =
      (userData.user.user_metadata?.full_name as string | undefined) ??
      (userData.user.user_metadata?.name as string | undefined) ??
      "";

    await supabaseAdmin.from("profiles").upsert(
      { id: context.userId, email, full_name: fullName },
      { onConflict: "id" },
    );

    const { data: roles, error: roleReadError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleReadError) throw roleReadError;

    let role: AccountRole = roles?.some((r) => r.role === "admin") ? "admin" : "customer";
    if (!roles?.length) {
      role = email === "support@abdulrahman.store" ? "admin" : "customer";
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role });
      if (insertError) throw insertError;
    }

    return { role: role === "admin" ? "admin" : "user" };
  });