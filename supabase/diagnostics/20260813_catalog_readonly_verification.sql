-- Fase 2 - diagnostico somente leitura para revisar antes dos indices.
-- Executar manualmente no SQL Editor autorizado. Este arquivo nao faz DDL nem DML.

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'products'
order by indexname;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
order by policyname;

select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'products'
  and grantee in ('anon', 'authenticated')
order by grantee, column_name;

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

explain (analyze, buffers)
select id, product_id_shopee, title, price_original, price_discount,
       image_url, shopee_affiliate_link, category, is_active, created_at,
       department_slug, subcategory_slug, leaf_slug, classification_source,
       classification_confidence, classification_review_status
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
       image_url, shopee_affiliate_link, category, is_active, created_at,
       department_slug, subcategory_slug, leaf_slug, classification_source,
       classification_confidence, classification_review_status
from public.products
where is_active = true
  and classification_review_status = 'auto'
  and department_slug is not null
  and leaf_slug is not null
  and created_at is not null
  and department_slug = 'homens'
order by created_at desc, id asc
limit 25;

-- A busca abaixo sera executavel depois da migration de search_document.
-- explain (analyze, buffers)
-- select id, title, created_at, leaf_slug
-- from public.products
-- where is_active = true
--   and classification_review_status = 'auto'
--   and department_slug is not null
--   and leaf_slug is not null
--   and created_at is not null
--   and search_document @@ websearch_to_tsquery('portuguese', 'fone bluetooth')
-- order by ts_rank(search_document, websearch_to_tsquery('portuguese', 'fone bluetooth')) desc,
--          created_at desc, id asc
-- limit 25;
