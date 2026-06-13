
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS inspired_by_brand text,
  ADD COLUMN IF NOT EXISTS inspired_by_product text,
  ADD COLUMN IF NOT EXISTS retail_price numeric;

CREATE INDEX IF NOT EXISTS idx_products_inspired_brand ON public.products (inspired_by_brand);
