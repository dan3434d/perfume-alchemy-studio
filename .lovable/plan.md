# Professional emails and automatic order fulfilment

## Outcome
- Every customer and admin email will use one consistent Abdulrahman Perfumes design, with genuine house photography, clear hierarchy, order details, and reliable inbox-safe formatting.
- New orders will begin as **Pending** and move to **Paid** automatically only after Stripe confirms payment.
- Admins will no longer manually choose payment/order states. Their fulfilment action will be **Mark as shipped**, which requires a carrier and tracking number and automatically emails the customer.

## Email design
- Create reusable email-brand components so order, shipping, status, complaint, purchase-order legacy, and account emails share the same wordmark, typography, colours, spacing, support details, and footer.
- Add a hosted house photograph to email headers where it is truthful and useful; product rows may use their actual product image when available.
- Use linked still imagery rather than embedded video. Major email clients block or inconsistently render video, while a still image is dependable and can link customers back to the store.
- Improve subjects, preview text, payment/shipping language, totals, delivery information, and mobile layout.
- Preserve the mandatory unsubscribe handling already appended by the email system.

## Automatic order flow
- Centralise the “payment confirmed” transition so it is idempotent: one paid update, one customer confirmation, and one admin notification per order.
- Add a verified Stripe payment callback as the primary automatic path, while keeping checkout-return confirmation and reconciliation as fallbacks.
- Keep unpaid orders as Pending; the admin cannot manually mark them Paid.
- Replace the broad admin status selector with a fulfilment control. It becomes available only after payment and requires both carrier and tracking number before marking Shipped.
- Marking Shipped records the shipment time and automatically queues the tracking email. Repeated saves will not duplicate it.
- Preserve the existing refund capability in server logic, but remove arbitrary manual status transitions from the normal fulfilment control.

## Reliability and validation
- Confirm the live email domain and queue health, inspect prior failed sends, and keep unique delivery keys to prevent duplicate emails.
- Verify the email templates render, order status rules reject invalid transitions, and the admin controls work on desktop and mobile.
- Check the app’s build and runtime diagnostics after implementation.

## Technical details
- Use the existing React Email system and verified Abdulrahman sender domain.
- Use only absolute HTTPS image URLs in emails; never attach local files or embed unsupported video.
- Validate Stripe signatures before processing payment events and validate all request data.
- Keep Paid controlled by Stripe, and Shipped controlled by an authenticated admin with required tracking details.
