
# Abdulrahman Perfumes — Build Plan

## Approach
Build on Lovable Cloud (Postgres + Auth + Storage) with TanStack Start. Light, premium design with warm amber/gold accents. Mobile-first, sticky nav.

## Phase 1 — This build (production-ready foundation)

### Design system
- Update `src/styles.css`: light neutrals, warm amber/gold primary (`oklch` tokens), elegant serif display (Playfair) + clean sans (Inter), generous spacing, soft shadows, rounded cards.
- Sticky nav with mobile drawer, cart icon with count, search.
- Reusable: ProductCard, ProductGrid, Section, Hero, Newsletter, Footer, Badge, Price.

### Database (migration)
Tables: `profiles`, `user_roles` (enum: admin, customer) + `has_role()` security-definer fn, `categories`, `products`, `product_images`, `addresses`, `carts`, `cart_items`, `orders`, `order_items`, `wishlist_items`, `reviews`.
- RLS + GRANT on every table. Public read on products/categories/reviews. Per-user scope on cart/orders/wishlist/addresses. Admin-only writes on products/categories/orders via `has_role(auth.uid(), 'admin')`.
- Trigger to auto-create `profiles` row on signup.
- Seed: 8 categories + 18 products (AUD $31.50, stock 100, slugs/descriptions/notes per spec).

### Auth
- Email/password + Google sign-in (managed OAuth).
- `/auth` page (signup + login tabs), `/reset-password`.
- Account dashboard at `/_authenticated/account` (orders, addresses, wishlist).
- Admin promotion: insert `user_roles` row for `support@abdulrahman.store` after they sign up (handled by trigger that checks email).

### Pages
- `/` Home — hero, featured products, categories, benefits, testimonials, newsletter.
- `/shop` — grid, search, category filter, sort.
- `/shop/$slug` — product detail with gallery, notes, size/qty, add to cart, buy now, wishlist, related.
- `/cart` — items, qty, subtotal, shipping estimate.
- `/checkout` — shipping/billing, order summary, place order (payment placeholder), writes to `orders`/`order_items`.
- `/checkout/success/$orderId` — confirmation.
- `/account` (+ subpages: orders, addresses, wishlist).
- `/admin` (+ products, orders, customers, stats) — gated by `_authenticated/_admin/` layout using `has_role`.
- `/about`, `/contact`, `/shipping`, `/returns`, `/privacy`, `/terms`.

### Product imagery
- Generate one premium amber-glass perfume bottle hero image; reuse as default product image across all 18 products. Stored URL in `products.image_url`.

## Phase 2 — Follow-ups (after you approve v1)
- Real payment integration (Stripe via Lovable Payments).
- Per-product real photos + multiple gallery images via storage upload in admin.
- Real reviews flow, email notifications, order status emails.
- Advanced filters (price range, scent family), pagination, SEO sitemap entries per product.

## Notes
- Admin password: I'll create the admin role binding by email; you sign up at `support@abdulrahman.store` with any password you choose (no hardcoded "1234" — that's insecure even for dev).
- Currency: AUD throughout. Country: Australia.
- Everything DB-backed; no hardcoded product arrays.
