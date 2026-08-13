-- Fase 2 - Catalogo publico: indices e busca textual.
-- Arquivo revisavel. Nao aplicar automaticamente nem executar em producao sem autorizacao.
-- Esta migration nao altera, remove ou reclassifica produtos.

alter table public.products
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(ai_copy, '')), 'B')
  ) stored;

create index if not exists products_public_leaf_created_id_idx
  on public.products (leaf_slug, created_at desc, id asc)
  where is_active = true
    and classification_review_status = 'auto'
    and department_slug is not null
    and leaf_slug is not null
    and created_at is not null;

create index if not exists products_public_department_created_id_idx
  on public.products (department_slug, created_at desc, id asc)
  where is_active = true
    and classification_review_status = 'auto'
    and department_slug is not null
    and leaf_slug is not null
    and created_at is not null;

create index if not exists products_public_search_document_idx
  on public.products using gin (search_document)
  where is_active = true
    and classification_review_status = 'auto'
    and department_slug is not null
    and leaf_slug is not null
    and created_at is not null;

drop function if exists public.search_public_affiliate_products(text, text, text, integer, real, timestamptz, uuid);

create function public.search_public_affiliate_products(
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
  classification_source text,
  classification_confidence numeric,
  classification_review_status text,
  relevance_rank real
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if trim(coalesce(p_query, '')) = '' or char_length(trim(p_query)) > 120 then
    raise exception 'Busca publica invalida';
  end if;

  if p_limit < 1 or p_limit > 25 then
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
  with ranked as (
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
      products.classification_source,
      products.classification_confidence,
      products.classification_review_status,
      ts_rank(
        products.search_document,
        websearch_to_tsquery('portuguese', trim(p_query))
      ) as relevance_rank
    from public.products as products
    where products.is_active = true
      and products.classification_review_status = 'auto'
      and products.department_slug is not null
      and products.leaf_slug is not null
      and products.created_at is not null
      and products.search_document @@ websearch_to_tsquery('portuguese', trim(p_query))
      and (p_department_slug is null or products.department_slug = p_department_slug)
      and (p_leaf_slug is null or products.leaf_slug = p_leaf_slug)
  )
  select ranked.*
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

revoke all on function public.search_public_affiliate_products(text, text, text, integer, real, timestamptz, uuid) from public;
grant execute on function public.search_public_affiliate_products(text, text, text, integer, real, timestamptz, uuid) to anon, authenticated;

drop function if exists public.get_public_affiliate_product(uuid);

create function public.get_public_affiliate_product(
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
  leaf_slug text,
  classification_source text,
  classification_confidence numeric,
  classification_review_status text
)
language sql
security definer
set search_path = pg_catalog, public
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
    products.leaf_slug,
    products.classification_source,
    products.classification_confidence,
    products.classification_review_status
  from public.products as products
  where products.id = p_product_id
    and products.is_active = true
    and products.classification_review_status = 'auto'
    and products.department_slug is not null
    and products.leaf_slug is not null
  limit 1;
$$;

revoke all on function public.get_public_affiliate_product(uuid) from public;
grant execute on function public.get_public_affiliate_product(uuid) to anon, authenticated;
