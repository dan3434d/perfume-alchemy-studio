
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Distribute uploaded product photos
WITH urls AS (
  SELECT slug, image FROM (VALUES
    ('imagination-storm-304', '/__l5e/assets-v1/e951c0bc-9f93-4cc2-a7fa-a239e4b1f7d6/Imagination_Storm.jpeg'),
    ('black-mist-286',        '/__l5e/assets-v1/c79633cf-d1c5-45ee-9b5f-42cd8418aa55/ALL_2.jpeg'),
    ('white-oud-287',         '/__l5e/assets-v1/5fc6a2e7-0a42-48c3-9579-822b172fa98c/ALL.jpeg'),
    ('eros-elixir-288',       '/__l5e/assets-v1/7bdc7205-ddd6-4022-89cd-cbaa7d41f156/MENS_PERFUME.jpeg'),
    ('midnight-oud-289',      '/__l5e/assets-v1/c79633cf-d1c5-45ee-9b5f-42cd8418aa55/ALL_2.jpeg'),
    ('oud-royale-290',        '/__l5e/assets-v1/0ae6daa4-468e-42ab-80f6-40d298c2dede/MENS_PERFUME_2.jpeg'),
    ('ember-oud-292',         '/__l5e/assets-v1/c79633cf-d1c5-45ee-9b5f-42cd8418aa55/ALL_2.jpeg'),
    ('smoke-ritual-293',      '/__l5e/assets-v1/c79633cf-d1c5-45ee-9b5f-42cd8418aa55/ALL_2.jpeg'),
    ('crimson-smoke-294',     '/__l5e/assets-v1/d987f6e8-677a-4333-aec1-e5837b51188e/WOMENS.jpeg'),
    ('velvet-ash-295',        '/__l5e/assets-v1/ca1b9950-cdde-4d90-aceb-7a64e4a3599b/UNISEX_ONLY.jpeg'),
    ('burnt-velvet-296',      '/__l5e/assets-v1/c79633cf-d1c5-45ee-9b5f-42cd8418aa55/ALL_2.jpeg'),
    ('guilty-intense-297',    '/__l5e/assets-v1/7bdc7205-ddd6-4022-89cd-cbaa7d41f156/MENS_PERFUME.jpeg'),
    ('imperial-smoke-298',    '/__l5e/assets-v1/c79633cf-d1c5-45ee-9b5f-42cd8418aa55/ALL_2.jpeg'),
    ('wild-rush-299',         '/__l5e/assets-v1/9ce75cd9-0a53-48c7-a726-b3c644bee79c/ALL_3.jpeg'),
    ('night-drift-300',       '/__l5e/assets-v1/c79633cf-d1c5-45ee-9b5f-42cd8418aa55/ALL_2.jpeg'),
    ('open-sky-301',          '/__l5e/assets-v1/9ce75cd9-0a53-48c7-a726-b3c644bee79c/ALL_3.jpeg'),
    ('oud-storm-302',         '/__l5e/assets-v1/0ae6daa4-468e-42ab-80f6-40d298c2dede/MENS_PERFUME_2.jpeg'),
    ('lost-rush-303',         '/__l5e/assets-v1/9ce75cd9-0a53-48c7-a726-b3c644bee79c/ALL_3.jpeg')
  ) AS t(slug, image)
)
UPDATE public.products p SET image_url = u.image
FROM urls u WHERE p.slug = u.slug;
