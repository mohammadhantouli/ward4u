-- ============================================================
-- Ward 4U Flower Store — Supabase Database Schema
-- SAFE TO RUN MULTIPLE TIMES (idempotent)
-- Paste this entire file into your Supabase SQL Editor and click Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP OLD TRIGGER SAFELY (prevents duplicate trigger error)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  name_ar    TEXT,
  slug       TEXT UNIQUE NOT NULL,
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  name_ar        TEXT,
  slug           TEXT UNIQUE NOT NULL,
  description    TEXT,
  description_ar TEXT,
  price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10,2) CHECK (original_price >= 0),
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url      TEXT,
  images         TEXT[] DEFAULT '{}',
  stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_featured    BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  tags           TEXT[] DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  phone      TEXT,
  avatar_url TEXT,
  role       TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label      TEXT DEFAULT 'المنزل',
  city       TEXT NOT NULL,
  district   TEXT,
  street     TEXT,
  building   TEXT,
  notes      TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  total            NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  address_id       UUID REFERENCES addresses(id) ON DELETE SET NULL,
  delivery_address JSONB,
  payment_method   TEXT DEFAULT 'cash_on_delivery',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  image_url    TEXT
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ============================================================
-- SECURITY DEFINER HELPER — avoids recursive RLS on profiles
-- This function bypasses RLS to check role, preventing infinite loops
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist    ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies cleanly before recreating
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- CATEGORIES policies
-- ============================================================
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_write" ON categories
  FOR ALL USING (is_admin());

-- ============================================================
-- PRODUCTS policies
-- ============================================================
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (is_admin());

-- ============================================================
-- PROFILES policies
-- Uses auth.uid() = id directly — NO recursive profile lookup
-- ============================================================
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin reads ALL profiles using the SECURITY DEFINER function (no recursion)
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- ADDRESSES policies
-- ============================================================
CREATE POLICY "addresses_own" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ORDERS policies
-- ============================================================
CREATE POLICY "orders_own_select" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_own_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_admin_all" ON orders
  FOR ALL USING (is_admin());

-- ============================================================
-- ORDER ITEMS policies
-- ============================================================
CREATE POLICY "order_items_own_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_own_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_admin_all" ON order_items
  FOR ALL USING (is_admin());

-- ============================================================
-- REVIEWS policies
-- ============================================================
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_own_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_own_update" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reviews_own_delete" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- WISHLIST policies
-- ============================================================
CREATE POLICY "wishlist_own" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile row when a user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA — Categories
-- ============================================================
INSERT INTO categories (name, name_ar, slug, image_url) VALUES
  ('ورود',           'Roses',       'roses',        'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400'),
  ('باقات',          'Bouquets',    'bouquets',     'https://images.unsplash.com/photo-1487530811015-780780f3e9c4?w=400'),
  ('تنسيقات',        'Arrangements','arrangements', 'https://images.unsplash.com/photo-1490750967868-88df5691cc65?w=400'),
  ('نباتات عصارية',  'Succulents',  'succulents',   'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400'),
  ('زفاف',           'Wedding',     'wedding',      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400'),
  ('صناديق هدايا',   'Gift Boxes',  'gift-boxes',   'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA — Products
-- ============================================================
INSERT INTO products (name, name_ar, slug, description, description_ar, price, original_price, category_id, image_url, stock, is_featured, tags) VALUES

  ('Red Rose Bouquet', 'باقة الورد الأحمر', 'red-rose-bouquet',
   'A stunning bouquet of 12 fresh red roses, perfect for expressing love.',
   'باقة رائعة من 12 وردة حمراء طازجة، مثالية للتعبير عن الحب.',
   89.00, 110.00,
   (SELECT id FROM categories WHERE slug='roses'),
   'https://images.unsplash.com/photo-1548586196-aa5803b77379?w=600',
   50, true, ARRAY['ورود','رومانسي','أحمر']),

  ('Mixed Spring Bouquet', 'باقة ربيع مختلطة', 'mixed-spring-bouquet',
   'A vibrant mix of seasonal flowers in soft pink and white tones.',
   'مزيج نابض بالحياة من الزهور الموسمية بألوان وردية وبيضاء ناعمة.',
   120.00, NULL,
   (SELECT id FROM categories WHERE slug='bouquets'),
   'https://images.unsplash.com/photo-1490750967868-88df5691cc65?w=600',
   30, true, ARRAY['باقة','ربيع','ملون']),

  ('Elegant White Arrangement', 'تنسيق أبيض أنيق', 'elegant-white-arrangement',
   'Sophisticated white flower arrangement ideal for weddings and events.',
   'تنسيق زهور أبيض راقٍ مثالي لحفلات الأعراس والمناسبات.',
   195.00, 230.00,
   (SELECT id FROM categories WHERE slug='arrangements'),
   'https://images.unsplash.com/photo-1487530811015-780780f3e9c4?w=600',
   20, true, ARRAY['أبيض','زفاف','أنيق']),

  ('Pink Rose Gift Box', 'صندوق ورد وردي', 'pink-rose-gift-box',
   'Luxury gift box with 24 premium pink roses, ribbon-wrapped.',
   'صندوق هدايا فاخر يحتوي على 24 وردة وردية فاخرة مزيّنة بالشريط.',
   250.00, NULL,
   (SELECT id FROM categories WHERE slug='gift-boxes'),
   'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600',
   15, true, ARRAY['هدية','وردي','فاخر']),

  ('Succulent Trio', 'ثلاثي العصاريات', 'succulent-trio',
   'Three hand-picked succulents in ceramic pots — a lasting green gift.',
   'ثلاثة نباتات عصارية منتقاة بعناية في أصص خزفية — هدية خضراء دائمة.',
   75.00, NULL,
   (SELECT id FROM categories WHERE slug='succulents'),
   'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=600',
   40, false, ARRAY['عصاريات','أخضر','دائم']),

  ('Wedding Centerpiece', 'تنسيق زفاف مركزي', 'wedding-centerpiece',
   'Grand floral centerpiece for wedding tables with roses and greenery.',
   'تنسيق زهري مركزي فاخر لطاولات حفلات الزفاف بالورود والخضرة.',
   350.00, 420.00,
   (SELECT id FROM categories WHERE slug='wedding'),
   'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600',
   10, true, ARRAY['زفاف','مركزي','فاخر']),

  ('Sunflower Delight', 'بهجة عباد الشمس', 'sunflower-delight',
   'Cheerful bouquet of 10 bright sunflowers to brighten any day.',
   'باقة مبهجة من 10 زهور عباد الشمس الساطعة لتُضفي البهجة على يومك.',
   65.00, NULL,
   (SELECT id FROM categories WHERE slug='bouquets'),
   'https://images.unsplash.com/photo-1471666875520-c75081f42081?w=600',
   35, false, ARRAY['عباد الشمس','أصفر','مبهج']),

  ('Lavender Dream', 'حلم اللافندر', 'lavender-dream',
   'Soothing lavender bouquet with dried flowers and ribbon.',
   'باقة لافندر مهدئة مع زهور مجففة وشريط أنيق.',
   85.00, 100.00,
   (SELECT id FROM categories WHERE slug='bouquets'),
   'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=600',
   25, false, ARRAY['لافندر','بنفسجي','مجفف'])

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Note: Run these in the Supabase SQL Editor if they don't apply automatically
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for 'product-images' bucket
-- 1. Allow everyone to view images
CREATE POLICY "Public Read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- 2. Allow admins to upload images
CREATE POLICY "Admin Insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Allow admins to update images
CREATE POLICY "Admin Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Allow admins to delete images
CREATE POLICY "Admin Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
