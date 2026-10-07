-- Busca publica ignora acentos nos dois lados (documento e p_query).
-- Recria somente a coluna gerada search_document. Nao apaga produtos.

begin;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_namespace
    where nspname = 'extensions'
  ) then
    raise exception 'Preflight failed: schema extensions does not exist.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_attribute
    where attrelid = 'public.products'::regclass
      and attname = 'search_document'
      and not attisdropped
  ) then
    raise exception 'Preflight failed: public.products.search_document does not exist.';
  end if;
end
$$;

create extension if not exists unaccent with schema extensions;

create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, input);
$$;

alter table public.products drop column search_document;

alter table public.products
  add column search_document tsvector
  generated always as (
    setweight(to_tsvector('portuguese', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', public.immutable_unaccent(coalesce(ai_copy, ''))), 'B')
  ) stored;

create index products_public_search_document_idx
  on public.products using gin (search_document)
  where is_active = true
    and classification_review_status = 'auto'
    and department_slug is not null
    and leaf_slug is not null
    and created_at is not null;

create or replace function public.search_public_affiliate_products(
  p_query text,
  p_department_slug text default null,
  p_leaf_slug text default null,
  p_limit integer default 25,
  p_cursor_rank real default null,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null
)
returns table (
  id uuid,
  product_id_shopee text,
  title text,
  price_original numeric,
  price_discount numeric,
  image_url text,
  category text,
  is_active boolean,
  created_at timestamptz,
  department_slug text,
  subcategory_slug text,
  leaf_slug text,
  relevance_rank real
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if trim(coalesce(p_query, '')) = '' or char_length(trim(p_query)) > 120 then
    raise exception 'Busca publica invalida';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 241 then
    raise exception 'Limite de busca publica invalido';
  end if;

  if (
    (p_cursor_rank is null)::integer +
    (p_cursor_created_at is null)::integer +
    (p_cursor_id is null)::integer
  ) not in (0, 3) then
    raise exception 'Cursor de busca publica incompleto';
  end if;

  return query
  with query_data as (
    select websearch_to_tsquery('portuguese', public.immutable_unaccent(trim(p_query))) as query
  ), ranked as (
    select
      products.id,
      products.product_id_shopee,
      products.title,
      products.price_original,
      products.price_discount,
      products.image_url,
      products.category,
      products.is_active,
      products.created_at,
      products.department_slug,
      products.subcategory_slug,
      products.leaf_slug,
      ts_rank(products.search_document, query_data.query) as relevance_rank
    from public.products as products
    cross join query_data
    where products.is_active = true
      and products.classification_review_status = 'auto'
      and products.department_slug is not null
      and products.leaf_slug is not null
      and products.created_at is not null
      and btrim(products.product_id_shopee) <> ''
      and btrim(products.title) <> ''
      and products.price_original is not null
      and products.price_original >= 0
      and products.price_discount is not null
      and products.price_discount >= 0
      and lower(products.image_url) ~ '^https://cf\.shopee\.com\.br(?:/|$)'
      and pg_catalog.lower(products.shopee_affiliate_link) ~ '^https://(([a-z0-9-]+[.])*shopee[.]com[.]br|([a-z0-9-]+[.])*shopee[.]com|shope[.]ee|shp[.]ee|br[.]shp[.]ee)([/?#]|$)'
      and products.search_document @@ query_data.query
      and (p_department_slug is null or products.department_slug = p_department_slug)
      and (p_leaf_slug is null or products.leaf_slug = p_leaf_slug)
  )
  select
    ranked.id,
    ranked.product_id_shopee,
    ranked.title,
    ranked.price_original,
    ranked.price_discount,
    ranked.image_url,
    ranked.category,
    ranked.is_active,
    ranked.created_at,
    ranked.department_slug,
    ranked.subcategory_slug,
    ranked.leaf_slug,
    ranked.relevance_rank
  from ranked
  where p_cursor_rank is null
    or ranked.relevance_rank < p_cursor_rank
    or (
      ranked.relevance_rank = p_cursor_rank
      and ranked.created_at < p_cursor_created_at
    )
    or (
      ranked.relevance_rank = p_cursor_rank
      and ranked.created_at = p_cursor_created_at
      and ranked.id > p_cursor_id
    )
  order by ranked.relevance_rank desc, ranked.created_at desc, ranked.id asc
  limit p_limit;
end;
$$;

revoke all on function public.search_public_affiliate_products(text, text, text, integer, real, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.search_public_affiliate_products(text, text, text, integer, real, timestamptz, uuid) to anon, authenticated;

commit;
