UPDATE public.products SET image_url = CASE
  WHEN name ILIKE '%oud%' OR name ILIKE '%smoke%' OR name ILIKE '%ember%' OR name ILIKE '%velvet%' OR name ILIKE '%royale%' THEN '/__l5e/assets-v1/3d10f102-a291-4b20-a65d-d4d8bceb775d/scent-oud.jpg'
  WHEN gender = 'womens' OR name ILIKE '%mist%' OR name ILIKE '%rose%' OR name ILIKE '%cherry%' OR name ILIKE '%rush%' THEN '/__l5e/assets-v1/017cd181-7087-4d9a-9762-5d7eaf8dbdf6/scent-floral.jpg'
  WHEN name ILIKE '%sky%' OR name ILIKE '%drift%' OR name ILIKE '%imagination%' OR name ILIKE '%wild%' OR name ILIKE '%aqua%' THEN '/__l5e/assets-v1/3ec8cf1a-c383-4347-9a22-9e4be1440ea9/scent-fresh.jpg'
  WHEN gender = 'mens' THEN '/__l5e/assets-v1/e4da1d0d-5ed0-40dd-8b29-7a83b19d73e2/scent-woody.jpg'
  ELSE '/__l5e/assets-v1/a214e569-86fd-49f9-9b77-52e88d98da7c/scent-amber.jpg'
END;