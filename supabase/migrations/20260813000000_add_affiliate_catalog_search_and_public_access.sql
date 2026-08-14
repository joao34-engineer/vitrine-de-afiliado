-- Fase 2 - catalogo publico: busca, indices, RPCs e acesso minimo.
-- Arquivo revisavel. Nao aplicar automaticamente nem executar em producao sem autorizacao.
-- Esta migration nao altera, remove ou reclassifica produtos.

begin;

do $$
declare
  select_policy_count integer;
  policy_roles name[];
  policy_qual text;
begin
  if to_regclass('public.products') is null then
    raise exception 'Migration abortada: public.products nao existe.';
  end if;

  if not exists (
    select 1
    from pg_class
    where oid = 'public.products'::regclass
      and relrowsecurity = true
  ) then
    raise exception 'Migration abortada: RLS nao esta habilitado em public.products.';
  end if;

  select count(*) into select_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'products'
    and cmd in ('SELECT', 'ALL');

  select roles,
         replace(
           replace(
             regexp_replace(
               trim(both '()' from lower(coalesce(qual, ''))),
               '\s+',
               '',
               'g'
             ),
             '(',
             ''
           ),
           ')',
           ''
         )
    into policy_roles, policy_qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'products'
    and policyname = 'Public can view active products'
    and cmd = 'SELECT';

  if select_policy_count <> 1
     or policy_roles is null
     or cardinality(policy_roles) <> 2
     or not (policy_roles @> array['anon'::name, 'authenticated'::name])
     or not (array['anon'::name, 'authenticated'::name] @> policy_roles)
     or policy_qual <> 'is_active=trueandclassification_review_status=''auto''::textanddepartment_slugisnotnullandleaf_slugisnotnull' then
    raise exception 'Migration abortada: policy SELECT esperada e unica nao encontrada em public.products.';
  end if;

  if exists (
    select 1
    from pg_attribute
    where attrelid = 'public.products'::regclass
      and attname = 'search_document'
      and not attisdropped
      and (atttypid <> 'pg_catalog.tsvector'::regtype or attgenerated <> 's')
  ) then
    raise exception 'Migration abortada: public.products.search_document existe com tipo ou geracao incompatível.';
  end if;

  if exists (
    select 1
    from pg_attribute as attributes
    join pg_attrdef as defaults
      on defaults.adrelid = attributes.attrelid
     and defaults.adnum = attributes.attnum
    where attributes.attrelid = 'public.products'::regclass
      and attributes.attname = 'search_document'
      and not attisdropped
      and (
        lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%to_tsvector%'
        or lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%portuguese%'
        or lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%setweight%'
        or lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%title%'
        or lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%ai_copy%'
        or lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%coalesce%'
        or lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%''a''%'
        or lower(pg_get_expr(defaults.adbin, defaults.adrelid)) not like '%''b''%'
      )
  ) then
    raise exception 'Migration abortada: expressao gerada de search_document incompatível.';
  end if;
end;
$$;

do $$
declare
  routine record;
  expected_identity text;
  existing_result text;
begin
    for routine in
      select routine_name, identity_arguments, result_definition
      from (values
      (
        'list_public_affiliate_products'::name,
        'text, text, integer, timestamp with time zone, uuid'::text,
        'TABLE(id uuid, product_id_shopee text, title text, price_original numeric, price_discount numeric, image_url text, category text, is_active boolean, created_at timestamp with time zone, department_slug text, subcategory_slug text, leaf_slug text)'::text
      ),
      (
        'search_public_affiliate_products'::name,
        'text, text, text, integer, real, timestamp with time zone, uuid'::text,
        'TABLE(id uuid, product_id_shopee text, title text, price_original numeric, price_discount numeric, image_url text, category text, is_active boolean, created_at timestamp with time zone, department_slug text, subcategory_slug text, leaf_slug text, relevance_rank real)'::text
      ),
      (
        'get_public_affiliate_product'::name,
        'uuid'::text,
        'TABLE(id uuid, product_id_shopee text, title text, price_original numeric, price_discount numeric, image_url text, shopee_affiliate_link text, category text, is_active boolean, created_at timestamp with time zone, department_slug text, subcategory_slug text, leaf_slug text)'::text
      )
    ) as expected(routine_name, identity_arguments, result_definition)
  loop
    expected_identity := routine.identity_arguments;
    if exists (
      select 1
      from pg_proc as procedures
      join pg_namespace as namespaces on namespaces.oid = procedures.pronamespace
      where namespaces.nspname = 'public'
        and procedures.proname = routine.routine_name
        and pg_get_function_identity_arguments(procedures.oid) <> expected_identity
    ) then
      raise exception 'Migration abortada: RPC publica % possui assinatura incompatível.', routine.routine_name;
    end if;

    select pg_get_function_result(procedures.oid)
      into existing_result
    from pg_proc as procedures
    join pg_namespace as namespaces on namespaces.oid = procedures.pronamespace
    where namespaces.nspname = 'public'
      and procedures.proname = routine.routine_name
      and pg_get_function_identity_arguments(procedures.oid) = expected_identity
    limit 1;

    if existing_result is not null and
       regexp_replace(lower(existing_result), '\s+', '', 'g') <>
       regexp_replace(lower(routine.result_definition), '\s+', '', 'g') then
      raise exception 'Migration abortada: RPC publica % possui retorno incompatível.', routine.routine_name;
    end if;
  end loop;
end;
$$;

do $$
declare
  expected_index record;
  index_definition text;
  index_is_valid boolean;
begin
    for expected_index in
      select index_name, required_definition
      from (values
      ('products_public_home_created_id_idx'::name, 'created_at desc, id asc'::text),
      ('products_public_leaf_created_id_idx'::name, 'leaf_slug, created_at desc, id asc'::text),
      ('products_public_department_created_id_idx'::name, 'department_slug, created_at desc, id asc'::text),
      ('products_public_search_document_idx'::name, 'using gin (search_document)'::text)
    ) as expected(index_name, required_definition)
  loop
    select lower(pg_get_indexdef(indexes.indexrelid)), indexes.indisvalid
      into index_definition, index_is_valid
    from pg_index as indexes
    join pg_class as relations on relations.oid = indexes.indexrelid
    join pg_namespace as namespaces on namespaces.oid = relations.relnamespace
    where namespaces.nspname = 'public'
      and indexes.indrelid = 'public.products'::regclass
      and relations.relname = expected_index.index_name;

    if index_definition is not null and (
      index_is_valid is distinct from true
      or
      position(lower(expected_index.required_definition) in index_definition) = 0
      or position('is_active = true' in index_definition) = 0
      or position('classification_review_status = ''auto''' in index_definition) = 0
      or position('department_slug is not null' in index_definition) = 0
      or position('leaf_slug is not null' in index_definition) = 0
      or position('created_at is not null' in index_definition) = 0
    ) then
      raise exception 'Migration abortada: indice % possui definicao incompatível.', expected_index.index_name;
    end if;
  end loop;
end;
$$;

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

create index if not exists products_public_home_created_id_idx
  on public.products (created_at desc, id asc)
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

create or replace function public.list_public_affiliate_products(
  p_department_slug text default null,
  p_leaf_slug text default null,
  p_limit integer default 25,
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
  leaf_slug text
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 241 then
    raise exception 'Limite de catalogo publico invalido';
  end if;

  if ((p_cursor_created_at is null)::integer + (p_cursor_id is null)::integer) not in (0, 2) then
    raise exception 'Cursor de catalogo publico incompleto';
  end if;

  return query
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
    products.leaf_slug
  from public.products as products
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
    and (p_department_slug is null or products.department_slug = p_department_slug)
    and (p_leaf_slug is null or products.leaf_slug = p_leaf_slug)
    and (
      p_cursor_created_at is null
      or products.created_at < p_cursor_created_at
      or (products.created_at = p_cursor_created_at and products.id > p_cursor_id)
    )
  order by products.created_at desc, products.id asc
  limit p_limit;
end;
$$;

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
    select websearch_to_tsquery('portuguese', trim(p_query)) as query
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
    and btrim(products.product_id_shopee) <> ''
    and btrim(products.title) <> ''
    and products.price_original is not null
    and products.price_original >= 0
    and products.price_discount is not null
    and products.price_discount >= 0
    and lower(products.image_url) ~ '^https://cf\.shopee\.com\.br(?:/|$)'
    and lower(products.shopee_affiliate_link) ~ '^https://([a-z0-9-]+\.)*(shopee\.com\.br|shopee\.com|shopee\.ee|shp\.ee|shopeesz\.com)(?:/|$)'
  limit 1;
$$;

revoke all on function public.list_public_affiliate_products(text, text, integer, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.search_public_affiliate_products(text, text, text, integer, real, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.get_public_affiliate_product(uuid) from public, anon, authenticated;
grant execute on function public.list_public_affiliate_products(text, text, integer, timestamptz, uuid) to anon, authenticated;
grant execute on function public.search_public_affiliate_products(text, text, text, integer, real, timestamptz, uuid) to anon, authenticated;
grant execute on function public.get_public_affiliate_product(uuid) to anon, authenticated;

revoke all on table public.products from public, anon, authenticated;

revoke select (
  ai_copy,
  embedding,
  shopee_affiliate_link,
  classification_source,
  classification_confidence,
  classification_review_status,
  search_document
) on table public.products from public, anon, authenticated;

grant select (
  id,
  product_id_shopee,
  title,
  price_original,
  price_discount,
  image_url,
  category,
  is_active,
  created_at,
  department_slug,
  subcategory_slug,
  leaf_slug
) on table public.products to anon, authenticated;

-- ai_copy, embedding, shopee_affiliate_link e campos de classificacao
-- nao sao concedidos via tabela. O link afiliado sai apenas pela RPC de detalhe.

do $$
declare
  routine record;
begin
  for routine in
    select p.oid,
           p.proname,
           p.prosecdef,
           p.proconfig,
           pg_get_userbyid(p.proowner) as owner_name,
           coalesce(owner_role.rolbypassrls, false) as owner_bypasses_rls,
           products_table.relowner = p.proowner as owner_is_products_owner,
           products_table.relforcerowsecurity as products_force_rls
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    join pg_roles as owner_role on owner_role.oid = p.proowner
    cross join pg_class as products_table
    where n.nspname = 'public'
      and products_table.oid = 'public.products'::regclass
      and p.proname in (
        'list_public_affiliate_products',
        'search_public_affiliate_products',
        'get_public_affiliate_product'
      )
  loop
    if not routine.prosecdef
       or routine.owner_name in ('anon', 'authenticated', 'public')
       or not (
         routine.owner_bypasses_rls
         or (routine.owner_is_products_owner and not routine.products_force_rls)
       )
       or routine.proconfig is null
       or not ('search_path=pg_catalog' = any(routine.proconfig)) then
      raise exception 'Migration abortada: RPC % nao possui hardening esperado.', routine.proname;
    end if;
  end loop;
end;
$$;

commit;
