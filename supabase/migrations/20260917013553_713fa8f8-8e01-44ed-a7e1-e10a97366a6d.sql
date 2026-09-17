CREATE POLICY "Pricing quotes are server only"
ON public.pricing_quotes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);