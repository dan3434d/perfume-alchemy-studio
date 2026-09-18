# Premium checkout and authentic product imagery

## Goal
Make checkout feel faster, calmer, and more trustworthy while adding credible Abdulrahman product photography across the store.

## What I’ll change
- Simplify checkout into a clear two-stage flow: delivery first, then secure payment, with a compact progress indicator and fewer repeated trust messages.
- Keep the order summary visible, make delivery pricing easier to scan, and preserve the current on-site Stripe payment, dynamic offer, promo code, and buy-two logic.
- Turn the one-bottle upsell into a quieter, product-led recommendation that shows the final two-bottle benefit clearly without interrupting payment.
- Improve form completion with browser autofill fields, clearer required/optional labels, sensible mobile keyboards, and better error focus.
- Replace broad or unverifiable claims with specific facts already supported by the store: 50ml eau de parfum, dispatched from Sydney, tracked delivery, encrypted Stripe payment, and 30-day returns on unopened bottles.
- Rebrand the strongest uploaded bottle photographs from “ZEDS PERFUMES” to “Abdulrahman Perfumes” and remove generator watermarks before using them.
- Add a compact product gallery on product pages and use selected bottle photography on the home page where it supports the brand story. Avoid assigning a generic photograph as a false image of a specific fragrance unless it is clearly presented as house imagery.

## Visual direction
- Preserve the current premium editorial system: warm ivory, ink, brass accents, Cormorant Garamond, and Work Sans.
- Use fewer boxes and rounded promotional panels; favour hairline dividers, clean spacing, large product photography, and restrained labels.
- Keep sales messages specific and calm rather than using urgency, inflated proof, or generic “luxury” language.

## Technical details
- Reuse existing pricing, quote validation, shipping, promo, cart, and embedded-payment logic unchanged.
- Store edited imagery as CDN-backed project assets and import the generated pointer files.
- Add image gallery state only to product presentation; no product database or checkout business-rule changes.
- Verify desktop and mobile checkout, product-page galleries, payment-panel loading, and the current build status.
