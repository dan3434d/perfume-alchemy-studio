// Server-only helper that renders a registered React Email template and
// enqueues it directly into the transactional_emails pgmq queue using the
// service-role Supabase client. Mirrors the core logic of the scaffolded
// /lovable/email/transactional/send route so internal flows (Stripe webhook,
// admin status updates, complaint submissions) can send without needing a
// user JWT.
import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Abdulrahman Perfumes Online'
const SENDER_DOMAIN = 'support.abdulrahman.store'
const FROM_DOMAIN = 'abdulrahman.store'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface SendArgs {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, any>
}

export async function sendTransactionalEmail(args: SendArgs): Promise<void> {
  try {
    const tpl = TEMPLATES[args.templateName]
    if (!tpl) {
      console.warn('Unknown email template', args.templateName)
      return
    }
    const recipient = (tpl.to || args.recipientEmail).toLowerCase()
    if (!recipient) return

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const supabase = supabaseAdmin

    // Suppression check
    const { data: suppressed } = await supabase
      .from('suppressed_emails').select('id').eq('email', recipient).maybeSingle()
    if (suppressed) {
      await supabase.from('email_send_log').insert({
        message_id: args.idempotencyKey,
        template_name: args.templateName,
        recipient_email: recipient,
        status: 'suppressed',
      })
      return
    }

    // Get or create unsubscribe token
    let unsubscribeToken: string
    const { data: existing } = await supabase
      .from('email_unsubscribe_tokens').select('token, used_at').eq('email', recipient).maybeSingle()
    if (existing && !existing.used_at) {
      unsubscribeToken = existing.token
    } else {
      const newToken = generateToken()
      await supabase.from('email_unsubscribe_tokens')
        .upsert({ token: newToken, email: recipient }, { onConflict: 'email', ignoreDuplicates: true })
      const { data: stored } = await supabase
        .from('email_unsubscribe_tokens').select('token').eq('email', recipient).maybeSingle()
      unsubscribeToken = stored?.token ?? newToken
    }

    // Render template
    const data = args.templateData ?? {}
    const element = React.createElement(tpl.component, data)
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject = typeof tpl.subject === 'function' ? tpl.subject(data) : tpl.subject

    // Log pending then enqueue
    await supabase.from('email_send_log').insert({
      message_id: args.idempotencyKey,
      template_name: args.templateName,
      recipient_email: recipient,
      status: 'pending',
    })

    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: args.idempotencyKey,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: args.templateName,
        idempotency_key: args.idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })
    if (enqueueError) {
      console.error('Failed to enqueue email', enqueueError)
      await supabase.from('email_send_log').insert({
        message_id: args.idempotencyKey,
        template_name: args.templateName,
        recipient_email: recipient,
        status: 'failed',
        error_message: 'Failed to enqueue email',
      })
    }
  } catch (err) {
    console.error('sendTransactionalEmail error', err)
  }
}
