-- Diagnostico PRE-MIGRATION do catalogo publico.
-- Somente leitura: nao faz DDL, DML, grants ou alteracoes remotas.
-- Execute antes de revisar/aplicar a migration da Fase 2.

-- 1. Tabela, RLS, policies e indices atuais.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'products';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
order by policyname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'products'
order by indexname;

-- 2. Grants atuais e acesso efetivo a campos internos.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'products'
order by grantee, privilege_type;

select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'products'
order by grantee, column_name, privilege_type;

select
  has_table_privilege('anon', 'public.products', 'SELECT') as anon_table_select,
  has_table_privilege('authenticated', 'public.products', 'SELECT') as authenticated_table_select,
  has_column_privilege('anon', 'public.products', 'ai_copy', 'SELECT') as anon_ai_copy_select,
  has_column_privilege('anon', 'public.products', 'embedding', 'SELECT') as anon_embedding_select,
  has_column_privilege('anon', 'public.products', 'shopee_affiliate_link', 'SELECT') as anon_affiliate_link_select,
  has_column_privilege('anon', 'public.products', 'classification_review_status', 'SELECT') as anon_classification_select,
  has_column_privilege('authenticated', 'public.products', 'ai_copy', 'SELECT') as authenticated_ai_copy_select,
  has_column_privilege('authenticated', 'public.products', 'classification_review_status', 'SELECT') as authenticated_classification_select,
  exists (
    select 1
    from pg_class as products_class
    cross join lateral aclexplode(
      coalesce(products_class.relacl, acldefault('r', products_class.relowner))
    ) as privileges
    where products_class.oid = 'public.products'::regclass
      and privileges.grantee = 0
      and privileges.privilege_type = 'SELECT'
  ) as public_table_select;

select privilege_type
from aclexplode(
  coalesce(
    (select relacl from pg_class where oid = 'public.products'::regclass),
    acldefault('r', (select relowner from pg_class where oid = 'public.products'::regclass))
  )
)
where grantee = 0
order by privilege_type;

-- 3. Policy esperada e policies adicionais de SELECT.
select count(*) as public_read_policy_count,
       count(*) filter (where policyname = 'Public can view active products') as expected_policy_count,
       count(*) filter (where policyname <> 'Public can view active products' or cmd = 'ALL') as additional_public_read_policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
  and cmd in ('SELECT', 'ALL');

select policyname,
       roles,
       cmd,
       replace(
         replace(
           regexp_replace(trim(both '()' from lower(coalesce(qual, ''))), '\s+', '', 'g'),
           '(',
           ''
         ),
         ')',
         ''
       ) as normalized_qual
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
  and cmd in ('SELECT', 'ALL')
order by policyname;

-- 4. Volume e hosts reais para decidir remotePatterns e allowlists.
select leaf_slug, count(*) as public_rows
from public.products
where is_active = true
  and classification_review_status = 'auto'
  and department_slug is not null
  and leaf_slug is not null
group by leaf_slug
order by public_rows desc, leaf_slug;

select
  count(*) as total_products,
  count(*) filter (where is_active = true and classification_review_status = 'auto') as public_candidates,
  count(*) filter (where image_url is null or image_url !~* '^https://') as non_https_images,
  count(*) filter (where shopee_affiliate_link is null or shopee_affiliate_link !~* '^https://') as non_https_affiliate_links
from public.products;

select 'image' as host_kind,
       split_part(regexp_replace(image_url, '^https?://', ''), '/', 1) as host,
       count(*) as rows
from public.products
where image_url is not null
group by host
union all
select 'affiliate_link' as host_kind,
       split_part(regexp_replace(shopee_affiliate_link, '^https?://', ''), '/', 1) as host,
       count(*) as rows
from public.products
where shopee_affiliate_link is not null
group by host
order by host_kind, rows desc, host;

-- 5. Planos atuais somente leitura. Compare seq scan, sort e buffers.
-- Substitua os slugs por valores existentes no inventario acima.
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
  and leaf_slug = 'roupas-masculinas'
order by created_at desc, id asc
limit 25;

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
  and department_slug = 'homens'
order by created_at desc, id asc
limit 25;

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

-- Cursor keyset real: substitua os valores por uma linha existente.
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
