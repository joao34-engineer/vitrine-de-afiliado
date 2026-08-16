-- Affiliate ingestion/review RPC regression test.
--
-- SAFETY: run only against a disposable Supabase/Postgres database. This
-- script inserts reserved synthetic rows inside one transaction and always
-- rolls the transaction back at the end. It is intentionally not a production
-- smoke test and is not executed automatically because this repository does
-- not provide a disposable Postgres/pgTAP harness.

begin;

do $$
declare
  ingestion_signature text :=
    'public.upsert_affiliate_product_ingestion(text, text, numeric, numeric, text, text, text, text, text, text, text, text, numeric, text, text, text, text, text[])';
  approve_signature text :=
    'public.approve_affiliate_product_classification(uuid, text, text, text, bigint, uuid)';
  deactivate_signature text :=
    'public.deactivate_affiliate_product(uuid, bigint, uuid)';
  auto_id uuid;
  review_id uuid;
  deactivate_id uuid;
  auto_public boolean;
  auto_changed boolean;
  auto_created boolean;
  auto_status text;
  auto_revision bigint;
  review_public boolean;
  review_changed boolean;
  review_created boolean;
  review_status text;
  review_revision bigint;
  approve_public boolean;
  approve_changed boolean;
  approve_revision bigint;
  approve_retry_changed boolean;
  approve_retry_revision bigint;
  deactivate_public boolean;
  deactivate_changed boolean;
  deactivate_revision bigint;
  deactivate_retry_changed boolean;
  deactivate_retry_revision bigint;
  approve_operation uuid := '00000000-0000-0000-0000-000000000151';
  deactivate_operation uuid := '00000000-0000-0000-0000-000000000152';
  function_definition text;
begin
  if to_regclass('public.products') is null then
    raise exception 'products table is required for SQL regression test';
  end if;

  if exists (
    select 1
    from public.products as product_row
    where product_row.product_id_shopee in (
      'codex-sql-regression-auto-20260815',
      'codex-sql-regression-review-20260815',
      'codex-sql-regression-deactivate-20260815'
    )
  ) then
    raise exception 'reserved SQL regression product identifier already exists';
  end if;

  if not has_function_privilege('service_role', ingestion_signature, 'EXECUTE')
     or not has_function_privilege('service_role', approve_signature, 'EXECUTE')
     or not has_function_privilege('service_role', deactivate_signature, 'EXECUTE') then
    raise exception 'service_role must be able to execute all administrative RPCs';
  end if;

  if has_function_privilege('anon', ingestion_signature, 'EXECUTE')
     or has_function_privilege('authenticated', ingestion_signature, 'EXECUTE')
     or has_function_privilege('anon', approve_signature, 'EXECUTE')
     or has_function_privilege('authenticated', approve_signature, 'EXECUTE')
     or has_function_privilege('anon', deactivate_signature, 'EXECUTE')
     or has_function_privilege('authenticated', deactivate_signature, 'EXECUTE') then
    raise exception 'administrative RPCs must not be executable by public roles';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as function_row
    join pg_catalog.pg_namespace as namespace_row
      on namespace_row.oid = function_row.pronamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        function_row.proacl,
        pg_catalog.acldefault('f', function_row.proowner)
      )
    ) as privilege_row
    where namespace_row.nspname = 'public'
      and function_row.proname in (
        'upsert_affiliate_product_ingestion',
        'approve_affiliate_product_classification',
        'deactivate_affiliate_product'
      )
      and privilege_row.grantee = 0
      and privilege_row.privilege_type = 'EXECUTE'
  ) then
    raise exception 'administrative RPCs must not grant EXECUTE to PUBLIC';
  end if;

  select pg_catalog.pg_get_functiondef(function_row.oid)
    into function_definition
  from pg_catalog.pg_proc as function_row
  join pg_catalog.pg_namespace as namespace_row
    on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname = 'public'
    and function_row.proname = 'upsert_affiliate_product_ingestion'
    and pg_catalog.pg_get_function_identity_arguments(function_row.oid) =
      'p_product_id_shopee text, p_title text, p_price_original numeric, p_price_discount numeric, p_image_url text, p_shopee_affiliate_link text, p_ai_copy text, p_category text, p_department_slug text, p_subcategory_slug text, p_leaf_slug text, p_classification_source text, p_classification_confidence numeric, p_classification_review_status text, p_suggested_department_slug text, p_suggested_subcategory_slug text, p_suggested_leaf_slug text, p_classification_reasons text[]';

  if function_definition is null
     or function_definition ~* 'where[[:space:]]+product_id_shopee[[:space:]]*='
     or function_definition ~* 'on[[:space:]]+conflict[[:space:]]*\([[:space:]]*product_id_shopee[[:space:]]*\)' then
    raise exception 'ingestion RPC still contains an ambiguous product_id_shopee reference';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as function_row
    join pg_catalog.pg_namespace as namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.proname in (
        'approve_affiliate_product_classification',
        'deactivate_affiliate_product'
      )
      and pg_catalog.pg_get_functiondef(function_row.oid) ~* 'where[[:space:]]+id[[:space:]]*=[[:space:]]+p_product_id'
  ) then
    raise exception 'approval/deactivation RPC still contains an ambiguous id reference';
  end if;

  select result.id,
    result.public_eligible,
    result.classification_review_status,
    result.classification_revision,
    result.changed,
    result.created
  into auto_id, auto_public, auto_status, auto_revision, auto_changed, auto_created
  from public.upsert_affiliate_product_ingestion(
    'codex-sql-regression-auto-20260815',
    'Codex SQL regression auto product',
    100.00,
    80.00,
    'https://cf.shopee.com.br/file/codex-regression-auto.jpg',
    'https://shopee.com.br/product/codex-regression-auto',
    'Regression copy',
    'tech',
    'tech',
    null,
    'audio',
    'ingest-rules-v1',
    0.95,
    'auto',
    null,
    null,
    null,
    array['matched-tech-audio']::text[]
  ) as result;

  if auto_id is null or not auto_public or auto_status <> 'auto'
     or auto_revision <> 0 or not auto_changed or not auto_created then
    raise exception 'auto ingestion did not return its expected publication state';
  end if;

  if (select count(*) from public.products as product_row
      where product_row.product_id_shopee = 'codex-sql-regression-auto-20260815') <> 1
     or not exists (
       select 1
       from public.products as product_row
       where product_row.product_id_shopee = 'codex-sql-regression-auto-20260815'
         and product_row.is_active = true
         and product_row.classification_review_status = 'auto'
         and product_row.department_slug = 'tech'
         and product_row.leaf_slug = 'audio'
     ) then
    raise exception 'auto ingestion did not persist the expected row';
  end if;

  select result.id,
    result.public_eligible,
    result.classification_review_status,
    result.classification_revision,
    result.changed,
    result.created
  into auto_id, auto_public, auto_status, auto_revision, auto_changed, auto_created
  from public.upsert_affiliate_product_ingestion(
    '  codex-sql-regression-auto-20260815  ',
    'Codex SQL regression auto product',
    100.00,
    80.00,
    'https://cf.shopee.com.br/file/codex-regression-auto.jpg',
    'https://shopee.com.br/product/codex-regression-auto',
    'Regression copy',
    'tech',
    'tech',
    null,
    'audio',
    'ingest-rules-v1',
    0.95,
    'auto',
    null,
    null,
    null,
    array['matched-tech-audio']::text[]
  ) as result;

  if not auto_public or auto_status <> 'auto' or auto_revision <> 0
     or auto_changed or auto_created then
    raise exception 'same auto ingestion was not idempotent';
  end if;

  select result.id,
    result.public_eligible,
    result.classification_review_status,
    result.classification_revision,
    result.changed,
    result.created
  into review_id, review_public, review_status, review_revision, review_changed, review_created
  from public.upsert_affiliate_product_ingestion(
    'codex-sql-regression-review-20260815',
    'Codex SQL regression review product',
    120.00,
    99.00,
    'https://cf.shopee.com.br/file/codex-regression-review.jpg',
    'https://shopee.com.br/product/codex-regression-review',
    'Review copy',
    'tech',
    null,
    null,
    null,
    'ingest-rules-v1',
    0.42,
    'review',
    'tech',
    null,
    'audio',
    array['needs-manual-leaf-review']::text[]
  ) as result;

  if review_id is null or review_public or review_status <> 'review'
     or review_revision <> 0 or not review_changed or not review_created then
    raise exception 'review ingestion did not remain unpublished';
  end if;

  if not exists (
    select 1
    from public.products as product_row
    where product_row.id = review_id
      and product_row.is_active = true
      and product_row.classification_review_status = 'review'
      and product_row.department_slug is null
      and product_row.leaf_slug is null
      and product_row.classification_suggested_department_slug = 'tech'
      and product_row.classification_suggested_leaf_slug = 'audio'
  ) then
    raise exception 'review ingestion did not persist the expected suggestion state';
  end if;

  select result.public_eligible, result.classification_revision, result.changed
  into approve_public, approve_revision, approve_changed
  from public.approve_affiliate_product_classification(
    review_id,
    'tech',
    null,
    'audio',
    0,
    approve_operation
  ) as result;

  if not approve_public or approve_revision <> 1 or not approve_changed then
    raise exception 'approval did not publish the review product';
  end if;

  if not exists (
    select 1
    from public.products as product_row
    where product_row.id = review_id
      and product_row.is_active = true
      and product_row.classification_review_status = 'auto'
      and product_row.classification_source = 'manual-review-v1'
      and product_row.department_slug = 'tech'
      and product_row.leaf_slug = 'audio'
      and product_row.classification_revision = 1
  ) then
    raise exception 'approval did not persist the expected state';
  end if;

  select result.classification_revision, result.changed
  into approve_retry_revision, approve_retry_changed
  from public.approve_affiliate_product_classification(
    review_id,
    'tech',
    null,
    'audio',
    0,
    approve_operation
  ) as result;

  if approve_retry_revision <> 1 or approve_retry_changed then
    raise exception 'approval retry with the same operation id was not idempotent';
  end if;

  select result.id
  into deactivate_id
  from public.upsert_affiliate_product_ingestion(
    'codex-sql-regression-deactivate-20260815',
    'Codex SQL regression deactivate product',
    130.00,
    110.00,
    'https://cf.shopee.com.br/file/codex-regression-deactivate.jpg',
    'https://shopee.com.br/product/codex-regression-deactivate',
    'Deactivate copy',
    'tech',
    null,
    null,
    null,
    'ingest-rules-v1',
    0.31,
    'review',
    'tech',
    null,
    'audio',
    array['needs-manual-leaf-review']::text[]
  ) as result;

  select result.public_eligible, result.classification_revision, result.changed
  into deactivate_public, deactivate_revision, deactivate_changed
  from public.deactivate_affiliate_product(
    deactivate_id,
    0,
    deactivate_operation
  ) as result;

  if deactivate_public or deactivate_revision <> 1 or not deactivate_changed then
    raise exception 'deactivation did not remove publication eligibility';
  end if;

  if not exists (
    select 1
    from public.products as product_row
    where product_row.id = deactivate_id
      and product_row.is_active = false
      and product_row.classification_review_status = 'review'
      and product_row.classification_revision = 1
  ) then
    raise exception 'deactivation did not persist the expected state';
  end if;

  select result.classification_revision, result.changed
  into deactivate_retry_revision, deactivate_retry_changed
  from public.deactivate_affiliate_product(
    deactivate_id,
    0,
    deactivate_operation
  ) as result;

  if deactivate_retry_revision <> 1 or deactivate_retry_changed then
    raise exception 'deactivation retry with the same operation id was not idempotent';
  end if;
end
$$;

rollback;
