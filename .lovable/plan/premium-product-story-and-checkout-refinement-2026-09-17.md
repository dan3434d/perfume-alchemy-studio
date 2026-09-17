# Premium product, story, and checkout refinement

## Goal
Turn the current editorial storefront into a more convincing fragrance house: product pages that answer buying doubts, a visual Brand Story page with genuine customer photography, and a calmer checkout that keeps the sale moving.

## What will change

### Product pages
- Recompose the opening product view into a sharper editorial purchase layout with clearer fragrance identity, price, size, reviews, stock, delivery, returns, and payment reassurance.
- Add a consistent client-photo story strip using the four supplied photographs, framed as real moments of wear rather than advertisements.
- Add a concise “why people choose it” proof section, verified-review highlights, wear guidance, fragrance profile, and production details without inventing product-specific claims.
- Make the buy-two saving easier to understand and keep related scents useful without overwhelming the primary purchase action.
- Keep every existing product, price, inspired-by label, cart action, and direct-to-checkout behaviour intact.

### Brand Story page
- Expand `/about` into a full Brand Story page built around the meaning of Abdulrahman, Gulf hospitality, UAE composition, Sydney packing, honest pricing, and the ritual of welcoming through scent.
- Use the supplied client photographs as full-width and editorially cropped visual chapters; no generated or stock imagery.
- Introduce reusable house marks and visual devices—monogram, numbered chapters, fine rules, captions, and a restrained woven motif—within the existing ivory, ink, stone, and brass system.
- End with clear paths to the collection and scent finder.

### Checkout
- Preserve the existing on-site Stripe payment, promo codes, shipping choices, automatic discounts, totals, and order logic.
- Reduce visual fragmentation by grouping contact and delivery details into a single calm sequence, keeping optional notes secondary, and making shipping choices immediately comparable.
- Improve the order summary with clearer product identity, discount savings, delivery cost, returns reassurance, and a discreet second-bottle offer only when relevant.
- Make the primary payment action and progress state clearer on desktop and mobile, with trust reassurance next to the decision rather than in decorative cards.

## Technical details
- Reuse `woman-closeup`, `woman-curls`, `woman-waves`, and `man-linen` asset pointers throughout the new storytelling sections.
- Extract small reusable brand/proof components where the same treatment appears across product and story pages.
- Extend semantic design tokens and shared utilities only where needed; avoid hardcoded visual colors and preserve reduced-motion behaviour.
- Add complete route metadata to any content route touched.

## Validation
- Confirm a representative product page loads, adds the selected quantity, and reaches checkout.
- Confirm checkout retains totals, discounts, shipping selection, address entry, and embedded payment handoff.
- Check desktop and mobile screenshots for overflow, overlap, readable controls, and a visible next section.
- Confirm the latest preview build has no errors.
