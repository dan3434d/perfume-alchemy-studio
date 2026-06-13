import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ComplaintSchema = z.object({
  order_id: z.string().uuid(),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(4000),
});

export const createComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ComplaintSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,email,full_name,user_id")
      .eq("id", data.order_id)
      .single();
    if (oErr) throw oErr;
    if (order.user_id && order.user_id !== context.userId) {
      throw new Error("Forbidden");
    }

    const email = context.claims?.email ?? order.email;
    const { data: complaint, error: cErr } = await supabaseAdmin
      .from("complaints")
      .insert({
        order_id: order.id,
        user_id: context.userId,
        email,
        subject: data.subject,
        message: data.message,
      })
      .select("id")
      .single();
    if (cErr) throw cErr;

    const { sendTransactionalEmail } = await import("@/lib/email/send.server");
    await sendTransactionalEmail({
      templateName: "complaint-received",
      recipientEmail: email,
      idempotencyKey: `complaint-${complaint.id}`,
      templateData: {
        orderNumber: order.order_number,
        customerName: order.full_name,
        subject: data.subject,
      },
    });

    return { id: complaint.id };
  });
