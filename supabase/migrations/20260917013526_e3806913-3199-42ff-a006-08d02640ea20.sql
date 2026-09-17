CREATE TABLE public.pricing_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key_hash text NOT NULL,
  product_prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  reference_prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  savings_percent numeric NOT NULL DEFAULT 0,
  signal_tier smallint NOT NULL DEFAULT 0,
  region_band text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.pricing_quotes TO service_role;
ALTER TABLE public.pricing_quotes ENABLE ROW LEVEL SECURITY;

CREATE INDEX pricing_quotes_expiry_idx ON public.pricing_quotes (expires_at);
CREATE INDEX pricing_quotes_visitor_idx ON public.pricing_quotes (visitor_key_hash, created_at DESC);

ALTER TABLE public.orders
  ADD COLUMN pricing_quote_id uuid REFERENCES public.pricing_quotes(id) ON DELETE SET NULL;

ALTER TABLE public.order_items
  ADD COLUMN reference_price numeric,
  ADD COLUMN offer_savings numeric NOT NULL DEFAULT 0;

COMMENT ON TABLE public.pricing_quotes IS 'Private, short-lived server-issued pricing offers. No direct client access.';
COMMENT ON COLUMN public.pricing_quotes.region_band IS 'Broad non-sensitive campaign region only; never demographic profiling.';