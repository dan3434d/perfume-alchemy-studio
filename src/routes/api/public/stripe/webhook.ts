import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'

export const Route = createFileRoute('/api/public/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripeKey = process.env.STRIPE
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        const signature = request.headers.get('stripe-signature')
        if (!stripeKey || !webhookSecret) {
          return Response.json({ error: 'Webhook is not configured' }, { status: 503 })
        }
        if (!signature) return Response.json({ error: 'Missing signature' }, { status: 401 })

        const rawBody = await request.text()
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2024-06-20' as any,
          httpClient: Stripe.createFetchHttpClient(),
        })

        let event: Stripe.Event
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
        } catch {
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
          const session = event.data.object as Stripe.Checkout.Session
          const orderId = session.metadata?.order_id
          if (orderId && session.payment_status === 'paid') {
            const { syncPaidStripeOrder } = await import('@/lib/checkout.functions')
            await syncPaidStripeOrder(orderId, session.id)
          }
        }

        return Response.json({ received: true })
      },
    },
  },
})