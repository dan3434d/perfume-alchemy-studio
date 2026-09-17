# Dynamic Pricing and Visible Offers

## Goal
Introduce flexible AUD pricing between **$35 and $55** that reacts to shopping intent and broad delivery region, while keeping every displayed total and charged amount consistent.

The system will not infer or use sensitive demographics. Suburb/postcode may place a shopper into a broad delivery or campaign region only. Customers will see the offer, updated price, and savings, but not the internal trigger that selected it.

## Customer experience
- Show a clear reference price, current price, percentage saving, and dollar saving on product cards and product pages.
- When a stronger offer becomes available, animate the price change without interrupting shopping and label it **“Your current offer”**.
- Carry the same price into the bag, checkout, embedded payment form, confirmation page, emails, invoices, and account/admin order views.
- Keep an accepted offer stable for a limited quote window so the price does not change unexpectedly during checkout.
- Show a concise expiry message when relevant, then refresh visibly rather than silently changing a total.
- Preserve buy-two, promo-code, and exit offers, but choose the strongest eligible saving instead of stacking below the $35 floor.

## Pricing rules
- Treat **$55** as the maximum reference price and **$35** as the absolute final per-bottle floor after all discounts.
- Never raise a shopper’s price after they have viewed or added that bottle during the active quote window.
- Use deterministic offer bands informed by:
  - return visits;
  - repeated product/brand interest and scent-quiz completion;
  - cart quantity and checkout intent;
  - exit intent;
  - broad postcode/suburb campaign region after the shopper provides it.
- Do not use inferred income, ethnicity, age, gender, household composition, device value, or other sensitive/proxy demographics.
- Keep shipping pricing separate from bottle pricing.

## Implementation
- Extend the shared pricing module to calculate a bounded offer and select the strongest applicable discount.
- Add a server-issued pricing quote with an opaque ID, amount, reference price, discount, and expiry. Checkout will validate this quote server-side rather than trusting browser totals.
- Add locked backend storage for quote/audit records, accessible only by trusted server logic, with explicit grants and row-level security.
- Connect existing browsing-history, cart, checkout, and exit-intent signals to quote refreshes.
- Update the product list, product page, cart, and checkout to display price transitions and savings consistently.
- Update both Stripe checkout paths to charge the validated quote and freeze that amount into order items.
- Keep confirmation pages, emails, invoices, admin views, and account order views sourced from the frozen order amount.
- Keep public search markup on the standard public price; shopper-specific offers appear only after activation to avoid misleading search listings.
- Replace “one price for every bottle” claims with truthful language about a consistent reference price and visible offers.

## Validation
- Verify prices never fall below $35 or exceed $55, including buy-two and promo-code cases.
- Verify quote expiry, refresh, return visits, product interest, cart intent, exit intent, and broad region changes.
- Verify the product page, cart, checkout, embedded payment panel, order record, confirmation, and email all agree to the cent.
- Test desktop and mobile for clear, non-jumping price updates and accessible announcements.
- Run focused pricing tests, type checks, build checks, and an end-to-end checkout up to the live payment boundary without creating a real charge.
