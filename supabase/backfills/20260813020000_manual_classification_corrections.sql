-- Manual corrections reviewed against the affiliate-vitrine taxonomy.
-- This file changes classification columns only. It never changes product data.

begin;

do $$
declare
  expected_count integer := 8;
  matched_count integer;
begin
  select count(*)
  into matched_count
  from public.products
  where
    (id = 'a57cd548-acce-41fd-9f21-09686fd3d1f9'::uuid and department_slug = 'homens' and subcategory_slug = 'roupas' and leaf_slug = 'roupas-masculinas')
    or (id = 'f5f27e0d-91ae-48ef-873f-0867f9f5fac2'::uuid and department_slug = 'homens' and subcategory_slug = 'roupas' and leaf_slug = 'roupas-masculinas')
    or (id = '5bec0f2c-92e6-499a-bb89-a8aea32789c7'::uuid and department_slug = 'mulheres' and subcategory_slug = 'roupas' and leaf_slug = 'roupas-femininas')
    or (id = '650ea0d3-a7ce-4b93-9058-fbc489dfea0d'::uuid and department_slug = 'cozinha' and subcategory_slug = 'utensilios' and leaf_slug = 'utensilios-de-cozinha')
    or (id = '83d5b62c-d798-4401-97b6-4421e2619503'::uuid and department_slug = 'cozinha' and subcategory_slug = 'eletroportateis' and leaf_slug = 'eletroportateis')
    or (id = 'ac293fce-f2f8-4571-91d0-43c6f05c7628'::uuid and department_slug = 'tech' and subcategory_slug = 'audio' and leaf_slug = 'eletronicos')
    or (id = '18bdb95c-677d-4ac4-a66d-6c6ac4a1ab84'::uuid and department_slug = 'mais' and subcategory_slug = 'automotivo' and leaf_slug = 'automotivo')
    or (id = '36179f98-9abb-4692-a203-4fa2c8339367'::uuid and department_slug = 'mais' and subcategory_slug = 'automotivo' and leaf_slug = 'achadinhos-gerais');

  if matched_count <> expected_count then
    raise exception 'Correcao abortada: % registros nao estao no estado esperado; esperado %.', matched_count, expected_count;
  end if;
end $$;

do $$
declare
  expected_count integer := 8;
  updated_count integer;
begin
  update public.products as products
  set
    department_slug = corrections.department_slug,
    subcategory_slug = corrections.subcategory_slug,
    leaf_slug = corrections.leaf_slug
  from (
    values
      ('a57cd548-acce-41fd-9f21-09686fd3d1f9'::uuid, 'mulheres'::text, 'roupas'::text, 'roupas-femininas'::text),
      ('f5f27e0d-91ae-48ef-873f-0867f9f5fac2'::uuid, 'mulheres'::text, 'roupas'::text, 'roupas-femininas'::text),
      ('5bec0f2c-92e6-499a-bb89-a8aea32789c7'::uuid, 'cozinha'::text, 'utensilios'::text, 'utensilios-de-cozinha'::text),
      ('650ea0d3-a7ce-4b93-9058-fbc489dfea0d'::uuid, 'tech'::text, 'audio'::text, 'eletronicos'::text),
      ('83d5b62c-d798-4401-97b6-4421e2619503'::uuid, 'cozinha'::text, 'utensilios'::text, 'utensilios-de-cozinha'::text),
      ('ac293fce-f2f8-4571-91d0-43c6f05c7628'::uuid, 'cozinha'::text, 'utensilios'::text, 'utensilios-de-cozinha'::text),
      ('18bdb95c-677d-4ac4-a66d-6c6ac4a1ab84'::uuid, 'casa'::text, 'organizacao'::text, 'utilidades-domesticas'::text),
      ('36179f98-9abb-4692-a203-4fa2c8339367'::uuid, 'mulheres'::text, 'roupas'::text, 'roupas-femininas'::text)
  ) as corrections(id, department_slug, subcategory_slug, leaf_slug)
  where products.id = corrections.id;

  get diagnostics updated_count = row_count;

  if updated_count <> expected_count then
    raise exception 'Correcao abortada: % registros atualizados; esperado %.', updated_count, expected_count;
  end if;
end $$;

select
  id,
  title,
  department_slug,
  subcategory_slug,
  leaf_slug,
  classification_review_status
from public.products
where id in (
  'a57cd548-acce-41fd-9f21-09686fd3d1f9'::uuid,
  'f5f27e0d-91ae-48ef-873f-0867f9f5fac2'::uuid,
  '5bec0f2c-92e6-499a-bb89-a8aea32789c7'::uuid,
  '650ea0d3-a7ce-4b93-9058-fbc489dfea0d'::uuid,
  '83d5b62c-d798-4401-97b6-4421e2619503'::uuid,
  'ac293fce-f2f8-4571-91d0-43c6f05c7628'::uuid,
  '18bdb95c-677d-4ac4-a66d-6c6ac4a1ab84'::uuid,
  '36179f98-9abb-4692-a203-4fa2c8339367'::uuid
)
order by id;

commit;
