-- Correção revisável da allowlist de destinos da Fase 2.
-- A migration original já foi aplicada; este arquivo alinha somente a RPC
-- de detalhe com os hosts aceitos pelo backend e pelo runtime TypeScript.
-- Não altera produtos e não deve ser executado automaticamente.

begin;

do $$
declare
  result_definition text;
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc as procedures
    join pg_catalog.pg_namespace as namespaces
      on namespaces.oid = procedures.pronamespace
    where namespaces.nspname = 'public'
      and procedures.proname = 'get_public_affiliate_product'
      and pg_catalog.pg_get_function_identity_arguments(procedures.oid) = 'uuid'
  ) then
    raise exception 'Preflight failed: public.get_public_affiliate_product(uuid) does not exist.';
  end if;

  select pg_catalog.pg_get_function_result(procedures.oid)
    into result_definition
  from pg_catalog.pg_proc as procedures
  join pg_catalog.pg_namespace as namespaces
    on namespaces.oid = procedures.pronamespace
  where namespaces.nspname = 'public'
    and procedures.proname = 'get_public_affiliate_product'
    and pg_catalog.pg_get_function_identity_arguments(procedures.oid) = 'uuid';

  if pg_catalog.regexp_replace(pg_catalog.lower(result_definition), '\s+', '', 'g') <>
     pg_catalog.regexp_replace(
       pg_catalog.lower(
         'TABLE(id uuid, product_id_shopee text, title text, price_original numeric, price_discount numeric, image_url text, shopee_affiliate_link text, category text, is_active boolean, created_at timestamp with time zone, department_slug text, subcategory_slug text, leaf_slug text)'
       ),
       '\s+',
       '',
       'g'
     ) then
    raise exception 'Preflight failed: public.get_public_affiliate_product(uuid) has an incompatible return type.';
  end if;
end
$$;

create or replace function public.get_public_affiliate_product(
  p_product_id uuid
)
returns table (
  id uuid,
  product_id_shopee text,
  title text,
  price_original numeric,
  price_discount numeric,
  image_url text,
  shopee_affiliate_link text,
  category text,
  is_active boolean,
  created_at timestamptz,
  department_slug text,
  subcategory_slug text,
  leaf_slug text
)
language sql
security definer
set search_path = pg_catalog
as $$
  select
    products.id,
    products.product_id_shopee,
    products.title,
    products.price_original,
    products.price_discount,
    products.image_url,
    products.shopee_affiliate_link,
    products.category,
    products.is_active,
    products.created_at,
    products.department_slug,
    products.subcategory_slug,
    products.leaf_slug
  from public.products as products
  where products.id = p_product_id
    and products.is_active = true
    and products.classification_review_status = 'auto'
    and products.department_slug is not null
    and products.leaf_slug is not null
    and products.created_at is not null
    and pg_catalog.btrim(products.product_id_shopee) <> ''
    and pg_catalog.btrim(products.title) <> ''
    and products.price_original is not null
    and products.price_original >= 0
    and products.price_discount is not null
    and products.price_discount >= 0
    and pg_catalog.lower(products.image_url) ~ '^https://cf[.]shopee[.]com[.]br([/?#]|$)'
    and pg_catalog.lower(products.shopee_affiliate_link) ~ '^https://(([a-z0-9-]+[.])*shopee[.]com[.]br|([a-z0-9-]+[.])*shopee[.]com|shopee[.]ee|shp[.]ee|br[.]shp[.]ee)([/?#]|$)';
$$;

revoke all on function public.get_public_affiliate_product(uuid) from public, anon, authenticated;
grant execute on function public.get_public_affiliate_product(uuid) to anon, authenticated;

commit;
