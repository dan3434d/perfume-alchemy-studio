
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');

-- =========================================================
-- UTIL: updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =========================================================
-- New user trigger: profile + role (admin if support email)
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));

  IF NEW.email = 'support@abdulrahman.store' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'AUD',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  stock INT NOT NULL DEFAULT 100,
  size TEXT DEFAULT '50ml',
  notes_top TEXT[],
  notes_heart TEXT[],
  notes_base TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 4.8,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ADDRESSES
-- =========================================================
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Australia',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- CART + CART ITEMS
-- =========================================================
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON public.carts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_carts_updated BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart items" ON public.cart_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));
CREATE TRIGGER trg_cart_items_updated BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ORDERS + ORDER ITEMS
-- =========================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('AP-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postcode TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'Australia',
  subtotal NUMERIC(10,2) NOT NULL,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Guests create orders" ON public.orders FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Insert own order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL)));
CREATE POLICY "Guests insert order items" ON public.order_items FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id IS NULL));

-- =========================================================
-- WISHLIST
-- =========================================================
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlist_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- SEED CATEGORIES + PRODUCTS
-- =========================================================
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Perfumes', 'perfumes', 'Our signature perfume collection', 1),
  ('Oud Perfumes', 'oud-perfumes', 'Deep, traditional oud-based fragrances', 2),
  ('Smoky Scents', 'smoky-scents', 'Warm, mysterious smoky compositions', 3),
  ('Fresh / Inspired Scents', 'fresh-inspired-scents', 'Bright, modern, inspired fragrances', 4),
  ('Fresh Scents', 'fresh-scents', 'Clean, airy everyday fragrances', 5),
  ('Night Scents', 'night-scents', 'Sensual after-dark scents', 6),
  ('Intense Scents', 'intense-scents', 'Bold, long-lasting compositions', 7),
  ('Signature Scents', 'signature-scents', 'Our most distinctive blends', 8);

INSERT INTO public.products (name, slug, description, long_description, price, category_id, stock, size, notes_top, notes_heart, notes_base, is_featured) VALUES
  ('Black Mist', 'black-mist-286', 'A nocturnal veil of dark florals and smoky musk.', 'Black Mist drapes the skin in cool florals lifted by a wisp of smoke. A modern, after-dark signature.', 31.50, (SELECT id FROM public.categories WHERE slug='perfumes'), 100, '50ml', ARRAY['Bergamot','Black Pepper'], ARRAY['Iris','Violet'], ARRAY['Smoky Musk','Patchouli'], true),
  ('White Oud', 'white-oud-287', 'A luminous, creamy oud softened with white florals.', 'A radiant take on oud — milky, soft, almost weightless, finished with sandalwood and a breath of jasmine.', 31.50, (SELECT id FROM public.categories WHERE slug='oud-perfumes'), 100, '50ml', ARRAY['Saffron','Cardamom'], ARRAY['White Oud','Jasmine'], ARRAY['Sandalwood','Cashmere Musk'], true),
  ('Eros Elixir', 'eros-elixir-288', 'A magnetic blend of mint, vanilla, and warm woods.', 'Cool fougère opening, ambery vanilla heart, and a confident woody trail. Made to be remembered.', 31.50, (SELECT id FROM public.categories WHERE slug='fresh-inspired-scents'), 100, '50ml', ARRAY['Mint','Green Apple'], ARRAY['Tonka','Geranium'], ARRAY['Vanilla','Cedarwood'], true),
  ('Midnight Oud', 'midnight-oud-289', 'Deep oud, dark amber, and a curl of incense.', 'A midnight composition: rich oud poured over warm amber, smoothed with resins and a soft balsamic finish.', 31.50, (SELECT id FROM public.categories WHERE slug='oud-perfumes'), 100, '50ml', ARRAY['Incense','Black Pepper'], ARRAY['Oud','Rose'], ARRAY['Amber','Labdanum'], false),
  ('Oud Royale', 'oud-royale-290', 'Regal oud with saffron, rose, and amber.', 'A ceremonial oud — saffron-tinged, rose-laced, and unmistakably noble from first spray to dry-down.', 31.50, (SELECT id FROM public.categories WHERE slug='oud-perfumes'), 100, '50ml', ARRAY['Saffron','Pink Pepper'], ARRAY['Bulgarian Rose','Oud'], ARRAY['Amber','Sandalwood'], true),
  ('Ember Oud', 'ember-oud-292', 'Glowing oud wrapped in vanilla and warm spice.', 'Warm as embers — oud meets vanilla, cinnamon, and a soft trail of woods.', 31.50, (SELECT id FROM public.categories WHERE slug='oud-perfumes'), 100, '50ml', ARRAY['Cinnamon','Bergamot'], ARRAY['Oud','Vanilla'], ARRAY['Tobacco','Cedar'], false),
  ('Smoke Ritual', 'smoke-ritual-293', 'Incense, dry woods, and a curl of birch smoke.', 'A ceremonial scent built around incense and birch tar, grounded in dry cedar.', 31.50, (SELECT id FROM public.categories WHERE slug='smoky-scents'), 100, '50ml', ARRAY['Birch','Pink Pepper'], ARRAY['Incense','Leather'], ARRAY['Cedar','Vetiver'], false),
  ('Crimson Smoke', 'crimson-smoke-294', 'Red berries kissed by smoke and resin.', 'Sweet crimson fruit lifted into a smoky haze of resins and aged woods.', 31.50, (SELECT id FROM public.categories WHERE slug='smoky-scents'), 100, '50ml', ARRAY['Raspberry','Saffron'], ARRAY['Smoke','Rose'], ARRAY['Benzoin','Oud'], false),
  ('Velvet Ash', 'velvet-ash-295', 'A soft, smoky cashmere of ash and amber.', 'Powdery, plush, and quiet — like cashmere brushed across warm ash.', 31.50, (SELECT id FROM public.categories WHERE slug='smoky-scents'), 100, '50ml', ARRAY['Iris','Pepper'], ARRAY['Smoke','Suede'], ARRAY['Amber','Cashmere Wood'], false),
  ('Burnt Velvet', 'burnt-velvet-296', 'Toasted woods, dark vanilla, and embered spice.', 'Velvety and warm with a charred edge — vanilla deepened by toasted woods.', 31.50, (SELECT id FROM public.categories WHERE slug='smoky-scents'), 100, '50ml', ARRAY['Nutmeg','Bergamot'], ARRAY['Tobacco','Vanilla'], ARRAY['Burnt Woods','Amber'], false),
  ('Guilty Intense', 'guilty-intense-297', 'Bold amber, leather, and dark florals.', 'An unapologetic statement — intense amber, polished leather, and rich florals.', 31.50, (SELECT id FROM public.categories WHERE slug='intense-scents'), 100, '50ml', ARRAY['Pink Pepper','Mandarin'], ARRAY['Orange Blossom','Leather'], ARRAY['Amber','Patchouli'], true),
  ('Imperial Smoke', 'imperial-smoke-298', 'Stately smoke, oud, and dark resins.', 'A commanding scent — oud and incense layered with regal balsamic depth.', 31.50, (SELECT id FROM public.categories WHERE slug='smoky-scents'), 100, '50ml', ARRAY['Black Pepper','Cardamom'], ARRAY['Oud','Incense'], ARRAY['Myrrh','Cedar'], false),
  ('Wild Rush', 'wild-rush-299', 'A surge of citrus, mint, and ambery woods.', 'Bracing top, energetic heart, sensual woody base — built for movement.', 31.50, (SELECT id FROM public.categories WHERE slug='fresh-inspired-scents'), 100, '50ml', ARRAY['Grapefruit','Mint'], ARRAY['Lavender','Geranium'], ARRAY['Ambroxan','Cedarwood'], false),
  ('Night Drift', 'night-drift-300', 'Cool air, dark florals, and a soft musky trail.', 'A nocturnal drift — cool florals settling into smooth musk.', 31.50, (SELECT id FROM public.categories WHERE slug='night-scents'), 100, '50ml', ARRAY['Sea Air','Pear'], ARRAY['Iris','Jasmine'], ARRAY['Musk','Vetiver'], false),
  ('Open Sky', 'open-sky-301', 'Clean citrus, neroli, and clear musks.', 'Bright as a clear morning — citrus and neroli polished with airy musks.', 31.50, (SELECT id FROM public.categories WHERE slug='fresh-scents'), 100, '50ml', ARRAY['Lemon','Bergamot'], ARRAY['Neroli','Petitgrain'], ARRAY['White Musk','Cedar'], true),
  ('Oud Storm', 'oud-storm-302', 'Tempestuous oud, smoke, and dark spice.', 'A swirling storm of oud and spice with a smoky, leathery wake.', 31.50, (SELECT id FROM public.categories WHERE slug='oud-perfumes'), 100, '50ml', ARRAY['Saffron','Pepper'], ARRAY['Oud','Rose'], ARRAY['Leather','Smoke'], false),
  ('Lost Rush', 'lost-rush-303', 'A daydream of fruits, florals, and warm amber.', 'Soft fruit and florals melting into a warm ambery haze.', 31.50, (SELECT id FROM public.categories WHERE slug='fresh-inspired-scents'), 100, '50ml', ARRAY['Pear','Bergamot'], ARRAY['Rose','Peony'], ARRAY['Amber','Musk'], false),
  ('Imagination Storm', 'imagination-storm-304', 'A signature swirl of oud, vanilla, and woods.', 'Our signature — bold oud, creamy vanilla, and aged woods in elegant tension.', 31.50, (SELECT id FROM public.categories WHERE slug='signature-scents'), 100, '50ml', ARRAY['Bergamot','Cardamom'], ARRAY['Oud','Jasmine'], ARRAY['Vanilla','Sandalwood'], true);
