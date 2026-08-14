-- Diagnostico POST-MIGRATION do catalogo publico.
-- Execute somente depois de aplicar manualmente a migration revisada.
-- Este arquivo tambem e somente leitura; os blocos de teste apenas chamam RPCs.

-- 1. Coluna gerada e indices criados.
select attributes.attname,
       format_type(attributes.atttypid, attributes.atttypmod) as data_type,
       attributes.attgenerated,
       pg_get_expr(defaults.adbin, defaults.adrelid) as generated_expression
from pg_attribute as attributes
left join pg_attrdef as defaults
  on defaults.adrelid = attributes.attrelid
 and defaults.adnum = attributes.attnum
where attributes.attrelid = 'public.products'::regclass
  and attributes.attname = 'search_document'
  and not attributes.attisdropped;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'products'
  and indexname in (
    'products_public_home_created_id_idx',
    'products_public_leaf_created_id_idx',
    'products_public_department_created_id_idx',
    'products_public_search_document_idx'
  )
order by indexname;

-- 2. Grants efetivos: nenhum acesso direto a campos internos.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'products';

select
  has_table_privilege('anon', 'public.products', 'SELECT') as anon_table_select,
  has_table_privilege('authenticated', 'public.products', 'SELECT') as authenticated_table_select,
  has_column_privilege('anon', 'public.products', 'ai_copy', 'SELECT') as anon_ai_copy_select,
  has_column_privilege('anon', 'public.products', 'embedding', 'SELECT') as anon_embedding_select,
  has_column_privilege('anon', 'public.products', 'shopee_affiliate_link', 'SELECT') as anon_affiliate_link_select,
  has_column_privilege('anon', 'public.products', 'classification_review_status', 'SELECT') as anon_classification_select,
  has_column_privilege('authenticated', 'public.products', 'ai_copy', 'SELECT') as authenticated_ai_copy_select,
  has_column_privilege('authenticated', 'public.products', 'embedding', 'SELECT') as authenticated_embedding_select,
  has_column_privilege('authenticated', 'public.products', 'shopee_affiliate_link', 'SELECT') as authenticated_affiliate_link_select,
  has_column_privilege('authenticated', 'public.products', 'classification_review_status', 'SELECT') as authenticated_classification_select;

select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'products'
  and grantee in ('public', 'anon', 'authenticated')
order by grantee, column_name, privilege_type;

select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'products'
  and grantee in ('public', 'anon', 'authenticated')
  and column_name in (
    'ai_copy',
    'embedding',
    'shopee_affiliate_link',
    'classification_source',
    'classification_confidence',
    'classification_review_status',
    'search_document'
  )
order by grantee, column_name, privilege_type;

select privilege_type
from aclexplode(
  coalesce(
    (select relacl from pg_class where oid = 'public.products'::regclass),
    acldefault('r', (select relowner from pg_class where oid = 'public.products'::regclass))
  )
)
where grantee = 0
order by privilege_type;

-- 3. RLS, policy e RPCs.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
order by policyname;

select
  p.oid::regprocedure as routine,
  pg_get_function_result(p.oid) as return_shape,
  p.prosecdef as security_definer,
  pg_get_userbyid(p.proowner) as owner,
  coalesce(owner_role.rolbypassrls, false) as owner_bypasses_rls,
  products_table.relowner = p.proowner as owner_is_products_owner,
  products_table.relforcerowsecurity as products_force_rls,
  p.proconfig as function_config,
  position('EXECUTE' in upper(pg_get_functiondef(p.oid))) = 0 as no_dynamic_execute,
  exists (
    select 1
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as privileges
    where privileges.grantee = 0
      and privileges.privilege_type = 'EXECUTE'
  ) as public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
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
order by p.oid::regprocedure::text;

-- 4. EXPLAIN direto da home, folha, departamento, cursor e GIN.
explain (analyze, buffers)
select id, product_id_shopee, title, price_original, price_discount,
       image_url, category, is_active, created_at, department_slug,
       subcategory_slug, leaf_slug
from public.products
where is_active = true
  and classification_review_status = 'auto'
  and department_slug is not null
  and leaf_slug is not null
  and created_at is not null
order by created_at desc, id asc
limit 25;

explain (analyze, buffers)
select id, title, created_at, leaf_slug
from public.products
where is_active = true
  and classification_review_status = 'auto'
  and department_slug is not null
  and leaf_slug is not null
  and created_at is not null
  and leaf_slug = 'roupas-masculinas'
order by created_at desc, id asc
limit 25;

explain (analyze, buffers)
select id, title, created_at, department_slug
from public.products
where is_active = true
  and classification_review_status = 'auto'
  and department_slug is not null
  and leaf_slug is not null
  and created_at is not null
  and department_slug = 'homens'
order by created_at desc, id asc
limit 25;

explain (analyze, buffers)
select id, title, created_at, leaf_slug
from public.products
where is_active = true
  and classification_review_status = 'auto'
  and department_slug is not null
  and leaf_slug is not null
  and created_at is not null
  and leaf_slug = 'roupas-masculinas'
  and (
    created_at < timestamptz '2026-08-12T00:00:00Z'
    or (created_at = timestamptz '2026-08-12T00:00:00Z' and id > uuid '00000000-0000-0000-0000-000000000000')
  )
order by created_at desc, id asc
limit 25;

explain (analyze, buffers)
select id, title, created_at, leaf_slug,
       ts_rank(search_document, websearch_to_tsquery('portuguese', 'fone bluetooth')) as relevance_rank
from public.products
where is_active = true
  and classification_review_status = 'auto'
  and department_slug is not null
  and leaf_slug is not null
  and created_at is not null
  and search_document @@ websearch_to_tsquery('portuguese', 'fone bluetooth')
order by relevance_rank desc, created_at desc, id asc
limit 25;

-- 5. Limites nulos devem ser rejeitados pelas RPCs.
do $$
declare
  accepted boolean;
begin
  accepted := false;
  begin
    perform * from public.list_public_affiliate_products(null, null, null, null, null);
    accepted := true;
  exception when others then
    accepted := false;
  end;
  if accepted then
    raise exception 'Falha de hardening: list RPC aceitou p_limit NULL';
  end if;

  accepted := false;
  begin
    perform * from public.search_public_affiliate_products('fone', null, null, null, null, null, null);
    accepted := true;
  exception when others then
    accepted := false;
  end;
  if accepted then
    raise exception 'Falha de hardening: search RPC aceitou p_limit NULL';
  end if;
end;
$$;

-- 6. Hosts e volume depois da migration.
select
  count(*) as total_products,
  count(*) filter (where is_active = true and classification_review_status = 'auto') as public_candidates,
  count(*) filter (where image_url is null or image_url !~* '^https://cf\.shopee\.com\.br(?:/|$)') as invalid_public_image_hosts,
  count(*) filter (where shopee_affiliate_link is null or lower(shopee_affiliate_link) !~ '^https://([a-z0-9-]+\.)*(shopee\.com\.br|shopee\.com|shopee\.ee|shp\.ee|shopeesz\.com)(?:/|$)') as invalid_public_affiliate_hosts
from public.products;
