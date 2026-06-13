// Server-only helper to send transactional emails by POSTing the local
// /lovable/email/transactional/send route from inside server functions.
// Uses service role to mint an internal call.

interface SendArgs {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, any>
}

export async function sendTransactionalEmail(args: SendArgs, origin: string) {
  const url = new URL(args.idempotencyKey ? '/lovable/email/transactional/send' : '/lovable/email/transactional/send', origin).toString()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.warn('Email send skipped: Supabase env not configured')
    return
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use service role JWT as bearer; the send route validates Supabase JWT.
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(args),
    })
    if (!res.ok) {
      console.warn('Email send failed', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.warn('Email send error', err)
  }
}
