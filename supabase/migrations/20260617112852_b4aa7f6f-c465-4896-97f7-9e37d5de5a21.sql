
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unisex'
  CHECK (gender IN ('mens','womens','unisex'));

-- Heuristic backfill from inspired_by_product / name
UPDATE public.products SET gender = 'mens'
WHERE gender = 'unisex' AND (
  (coalesce(inspired_by_product,'') || ' ' || name) ~* '\y(homme|for men|pour homme|aventus|sauvage|bleu de|invictus|1 million|le male|acqua di gio|eros|stronger with you|y edp|y eau|boss bottled|fahrenheit|polo|kouros)\y'
);

UPDATE public.products SET gender = 'womens'
WHERE gender = 'unisex' AND (
  (coalesce(inspired_by_product,'') || ' ' || name) ~* '\y(femme|for women|pour femme|miss dior|j''adore|la vie est belle|mon paris|black opium|good girl|chance|coco mademoiselle|libre|alien|angel|si |olympea|scandal|gabrielle|idole)\y'
);

-- Deactivate Open Sky
UPDATE public.products SET is_active = false WHERE slug = 'open-sky-301';
