begin;

do $$
begin
  if to_regclass('public.products') is null then
    raise exception 'Preflight failed: public.products does not exist.';
  end if;
end
$$;

create or replace function public.upsert_affiliate_product_ingestion(
  p_product_id_shopee text,
  p_title text,
  p_price_original numeric,
  p_price_discount numeric,
  p_image_url text,
  p_shopee_affiliate_link text,
  p_ai_copy text,
  p_category text,
  p_department_slug text,
  p_subcategory_slug text,
  p_leaf_slug text,
  p_classification_source text,
  p_classification_confidence numeric,
  p_classification_review_status text,
  p_suggested_department_slug text,
  p_suggested_subcategory_slug text,
  p_suggested_leaf_slug text,
  p_classification_reasons text[]
)
returns table (
  id uuid,
  product_id_shopee text,
  previous_public_eligible boolean,
  public_eligible boolean,
  classification_review_status text,
  classification_revision bigint,
  changed boolean,
  created boolean
)
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  current_product public.products%rowtype;
  inserted_product public.products%rowtype;
  next_department text;
  next_subcategory text;
  next_leaf text;
  next_source text;
  next_confidence numeric;
  next_status text;
  next_suggested_department text;
  next_suggested_subcategory text;
  next_suggested_leaf text;
  next_reasons text[];
  previous_public boolean;
  next_public boolean;
  raw_changed boolean;
  classification_changed boolean;
  normalized_product_id text;
begin
  if p_product_id_shopee is null or pg_catalog.btrim(p_product_id_shopee) = '' then
    raise exception 'product_id_shopee is required';
  end if;
  normalized_product_id := pg_catalog.btrim(p_product_id_shopee);
  if pg_catalog.length(normalized_product_id) > 128 then
    raise exception 'product_id_shopee is too long';
  end if;
  if p_title is null or pg_catalog.btrim(p_title) = '' then
    raise exception 'title is required';
  end if;
  if pg_catalog.length(pg_catalog.btrim(p_title)) > 300 then
    raise exception 'title is too long';
  end if;
  if p_image_url is null
     or p_image_url !~* '^https://cf[.]shopee[.]com[.]br([/?#]|$)' then
    raise exception 'image_url is not an allowed HTTPS Shopee image URL';
  end if;
  if p_shopee_affiliate_link is null
     or p_shopee_affiliate_link !~* '^https://(([a-z0-9-]+[.])*shopee[.]com[.]br|([a-z0-9-]+[.])*shopee[.]com|shopee[.]ee|shp[.]ee|br[.]shp[.]ee)([/?#]|$)' then
    raise exception 'shopee_affiliate_link is not an allowed HTTPS Shopee URL';
  end if;
  if p_ai_copy is not null and pg_catalog.length(pg_catalog.btrim(p_ai_copy)) > 5000 then
    raise exception 'ai_copy is too long';
  end if;
  if p_category is not null and pg_catalog.length(pg_catalog.btrim(p_category)) > 160 then
    raise exception 'category is too long';
  end if;
  if p_classification_source is null or pg_catalog.btrim(p_classification_source) = ''
     or pg_catalog.length(pg_catalog.btrim(p_classification_source)) > 120 then
    raise exception 'classification_source is invalid';
  end if;
  if p_price_original is null or p_price_discount is null
     or pg_catalog.lower(p_price_original::text) in ('nan', 'infinity', '-infinity')
     or pg_catalog.lower(p_price_discount::text) in ('nan', 'infinity', '-infinity')
     or p_price_original <= 0 or p_price_discount <= 0 then
    raise exception 'prices must be finite and positive';
  end if;
  if p_classification_review_status is null
     or p_classification_review_status not in ('auto', 'review') then
    raise exception 'classification_review_status is invalid';
  end if;
  if p_classification_confidence is null
     or pg_catalog.lower(p_classification_confidence::text) in ('nan', 'infinity', '-infinity')
     or p_classification_confidence < 0 or p_classification_confidence > 1 then
    raise exception 'classification_confidence is invalid';
  end if;
  if p_classification_reasons is null
     or pg_catalog.cardinality(p_classification_reasons) = 0
     or exists (
       select 1
       from pg_catalog.unnest(p_classification_reasons) as reasons(reason)
       where reason is null or pg_catalog.btrim(reason) = ''
     ) then
    raise exception 'classification_reasons is required';
  end if;
  if p_classification_review_status = 'auto'
     and (p_department_slug is null or p_leaf_slug is null) then
    raise exception 'auto classification requires department and leaf';
  end if;
  if p_classification_review_status = 'review'
     and (p_department_slug is not null or p_subcategory_slug is not null or p_leaf_slug is not null) then
    raise exception 'review classification cannot publish accepted taxonomy';
  end if;
  if (p_department_slug is not null and pg_catalog.btrim(p_department_slug) = '')
     or (p_subcategory_slug is not null and pg_catalog.btrim(p_subcategory_slug) = '')
     or (p_leaf_slug is not null and pg_catalog.btrim(p_leaf_slug) = '')
     or (p_suggested_department_slug is not null and pg_catalog.btrim(p_suggested_department_slug) = '')
     or (p_suggested_subcategory_slug is not null and pg_catalog.btrim(p_suggested_subcategory_slug) = '')
     or (p_suggested_leaf_slug is not null and pg_catalog.btrim(p_suggested_leaf_slug) = '') then
    raise exception 'classification taxonomy contains an empty slug';
  end if;
  if p_leaf_slug is null and (p_department_slug is not null or p_subcategory_slug is not null) then
    raise exception 'accepted taxonomy must be complete or null';
  end if;
  if p_suggested_leaf_slug is null
     and (p_suggested_department_slug is not null or p_suggested_subcategory_slug is not null) then
    raise exception 'classification suggestion must be complete or null';
  end if;
  if p_suggested_leaf_slug is not null and p_suggested_department_slug is null then
    raise exception 'classification suggestion requires department';
  end if;
  select * into current_product
  from public.products as product_row
  where product_row.product_id_shopee = normalized_product_id
  for update;

  if not found then
    insert into public.products (
      id,
      product_id_shopee,
      title,
      price_original,
      price_discount,
      image_url,
      shopee_affiliate_link,
      ai_copy,
      category,
      is_active,
      created_at,
      department_slug,
      subcategory_slug,
      leaf_slug,
      classification_source,
      classification_confidence,
      classification_review_status,
      classification_suggested_department_slug,
      classification_suggested_subcategory_slug,
      classification_suggested_leaf_slug,
      classification_reasons,
      classification_revision,
      classification_updated_at,
      classification_reviewed_at,
      classification_last_operation_id,
      classification_last_operation_kind
    ) values (
      pg_catalog.gen_random_uuid(),
      normalized_product_id,
      pg_catalog.btrim(p_title),
      p_price_original,
      p_price_discount,
      pg_catalog.btrim(p_image_url),
      pg_catalog.btrim(p_shopee_affiliate_link),
      nullif(pg_catalog.btrim(p_ai_copy), ''),
      nullif(pg_catalog.btrim(p_category), ''),
      true,
      pg_catalog.now(),
      p_department_slug,
      p_subcategory_slug,
      p_leaf_slug,
      p_classification_source,
      p_classification_confidence,
      p_classification_review_status,
      p_suggested_department_slug,
      p_suggested_subcategory_slug,
      p_suggested_leaf_slug,
      p_classification_reasons,
      0,
      pg_catalog.now(),
      null,
      null,
      null
    )
    on conflict do nothing
    returning * into inserted_product;

    if found then
      return query
        select inserted_product.id,
          inserted_product.product_id_shopee,
          false,
          inserted_product.is_active
            and inserted_product.classification_review_status = 'auto'
            and inserted_product.department_slug is not null
            and inserted_product.leaf_slug is not null,
          inserted_product.classification_review_status,
          inserted_product.classification_revision,
          true,
          true;
      return;
    end if;

    select * into current_product
    from public.products as product_row
    where product_row.product_id_shopee = normalized_product_id
    for update;

    if not found then
      raise exception 'Concurrent ingestion could not resolve product.';
    end if;
  end if;

  previous_public := current_product.is_active
    and current_product.classification_review_status = 'auto'
    and current_product.department_slug is not null
    and current_product.leaf_slug is not null;

  if current_product.classification_source = 'manual-review-v1' then
    next_department := current_product.department_slug;
    next_subcategory := current_product.subcategory_slug;
    next_leaf := current_product.leaf_slug;
    next_source := current_product.classification_source;
    next_confidence := current_product.classification_confidence;
    next_status := current_product.classification_review_status;
    next_suggested_department := current_product.classification_suggested_department_slug;
    next_suggested_subcategory := current_product.classification_suggested_subcategory_slug;
    next_suggested_leaf := current_product.classification_suggested_leaf_slug;
    next_reasons := current_product.classification_reasons;
  else
    next_department := p_department_slug;
    next_subcategory := p_subcategory_slug;
    next_leaf := p_leaf_slug;
    next_source := p_classification_source;
    next_confidence := p_classification_confidence;
    next_status := p_classification_review_status;
    next_suggested_department := p_suggested_department_slug;
    next_suggested_subcategory := p_suggested_subcategory_slug;
    next_suggested_leaf := p_suggested_leaf_slug;
    next_reasons := p_classification_reasons;
  end if;

  raw_changed := current_product.title is distinct from pg_catalog.btrim(p_title)
    or current_product.price_original is distinct from p_price_original
    or current_product.price_discount is distinct from p_price_discount
    or current_product.image_url is distinct from pg_catalog.btrim(p_image_url)
    or current_product.shopee_affiliate_link is distinct from pg_catalog.btrim(p_shopee_affiliate_link)
    or current_product.ai_copy is distinct from nullif(pg_catalog.btrim(p_ai_copy), '')
    or current_product.category is distinct from nullif(pg_catalog.btrim(p_category), '');

  classification_changed := current_product.department_slug is distinct from next_department
    or current_product.subcategory_slug is distinct from next_subcategory
    or current_product.leaf_slug is distinct from next_leaf
    or current_product.classification_source is distinct from next_source
    or current_product.classification_confidence is distinct from next_confidence
    or current_product.classification_review_status is distinct from next_status
    or current_product.classification_suggested_department_slug is distinct from next_suggested_department
    or current_product.classification_suggested_subcategory_slug is distinct from next_suggested_subcategory
    or current_product.classification_suggested_leaf_slug is distinct from next_suggested_leaf
    or current_product.classification_reasons is distinct from next_reasons;

  if raw_changed or classification_changed then
    update public.products as products
    set title = pg_catalog.btrim(p_title),
      price_original = p_price_original,
      price_discount = p_price_discount,
      image_url = pg_catalog.btrim(p_image_url),
      shopee_affiliate_link = pg_catalog.btrim(p_shopee_affiliate_link),
      ai_copy = nullif(pg_catalog.btrim(p_ai_copy), ''),
      category = nullif(pg_catalog.btrim(p_category), ''),
      department_slug = next_department,
      subcategory_slug = next_subcategory,
      leaf_slug = next_leaf,
      classification_source = next_source,
      classification_confidence = next_confidence,
      classification_review_status = next_status,
      classification_suggested_department_slug = next_suggested_department,
      classification_suggested_subcategory_slug = next_suggested_subcategory,
      classification_suggested_leaf_slug = next_suggested_leaf,
      classification_reasons = next_reasons,
      classification_revision = current_product.classification_revision + 1,
      classification_updated_at = pg_catalog.now(),
      classification_last_operation_id = null,
      classification_last_operation_kind = null,
      classification_reviewed_at = case
        when current_product.classification_source = 'manual-review-v1' then current_product.classification_reviewed_at
        else null
      end
    where products.id = current_product.id
    returning * into current_product;
  end if;

  next_public := current_product.is_active
    and current_product.classification_review_status = 'auto'
    and current_product.department_slug is not null
    and current_product.leaf_slug is not null;

  return query
    select current_product.id,
      current_product.product_id_shopee,
      previous_public,
      next_public,
      current_product.classification_review_status,
      current_product.classification_revision,
      (raw_changed or classification_changed),
      false;
end
$$;

create or replace function public.approve_affiliate_product_classification(
  p_product_id uuid,
  p_department_slug text,
  p_subcategory_slug text,
  p_leaf_slug text,
  p_expected_revision bigint,
  p_operation_id uuid
)
returns table (
  id uuid,
  public_eligible boolean,
  classification_revision bigint,
  changed boolean
)
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  current_product public.products%rowtype;
begin
  if p_operation_id is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'approval operation data is invalid';
  end if;
  if p_department_slug is null or pg_catalog.btrim(p_department_slug) = ''
     or p_subcategory_slug is not null and pg_catalog.btrim(p_subcategory_slug) = ''
     or p_leaf_slug is null or pg_catalog.btrim(p_leaf_slug) = '' then
    raise exception 'approval taxonomy is incomplete';
  end if;

  select *
    into current_product
  from public.products as product_row
  where product_row.id = p_product_id
  for update;

  if not found then
    return;
  end if;

  if current_product.classification_last_operation_id = p_operation_id
     and current_product.classification_last_operation_kind = 'approve'
     and current_product.classification_review_status = 'auto'
     and current_product.classification_source = 'manual-review-v1'
     and current_product.department_slug = p_department_slug
     and current_product.subcategory_slug is not distinct from p_subcategory_slug
     and current_product.leaf_slug = p_leaf_slug then
    return query
      select current_product.id,
        current_product.is_active
          and current_product.classification_review_status = 'auto'
          and current_product.department_slug is not null
          and current_product.leaf_slug is not null,
        current_product.classification_revision,
        false;
    return;
  end if;

  return query
  update public.products as products
  set department_slug = p_department_slug,
      subcategory_slug = p_subcategory_slug,
      leaf_slug = p_leaf_slug,
      classification_source = 'manual-review-v1',
      classification_confidence = null,
      classification_review_status = 'auto',
      classification_reviewed_at = pg_catalog.now(),
      classification_updated_at = pg_catalog.now(),
      classification_last_operation_id = p_operation_id,
      classification_last_operation_kind = 'approve',
      classification_revision = products.classification_revision + 1
  where products.id = p_product_id
    and products.is_active = true
    and products.classification_review_status = 'review'
    and products.classification_revision = p_expected_revision
  returning products.id,
    true as public_eligible,
    products.classification_revision,
    true as changed;
end
$$;

create or replace function public.deactivate_affiliate_product(
  p_product_id uuid,
  p_expected_revision bigint,
  p_operation_id uuid
)
returns table (
  id uuid,
  public_eligible boolean,
  classification_revision bigint,
  changed boolean
)
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  current_product public.products%rowtype;
begin
  if p_operation_id is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'deactivation operation data is invalid';
  end if;

  select *
    into current_product
  from public.products as product_row
  where product_row.id = p_product_id
  for update;

  if not found then
    return;
  end if;

  if current_product.classification_last_operation_id = p_operation_id
     and current_product.classification_last_operation_kind = 'deactivate'
     and current_product.is_active = false then
    return query
      select current_product.id,
        false,
        current_product.classification_revision,
        false;
    return;
  end if;

  return query
  update public.products as products
  set is_active = false,
      classification_updated_at = pg_catalog.now(),
      classification_last_operation_id = p_operation_id,
      classification_last_operation_kind = 'deactivate',
      classification_revision = products.classification_revision + 1
  where products.id = p_product_id
    and products.is_active = true
    and products.classification_review_status = 'review'
    and products.classification_revision = p_expected_revision
  returning products.id,
    false as public_eligible,
    products.classification_revision,
    true as changed;
end
$$;

revoke all on function public.upsert_affiliate_product_ingestion(text, text, numeric, numeric, text, text, text, text, text, text, text, text, numeric, text, text, text, text, text[]) from public, anon, authenticated;
revoke all on function public.approve_affiliate_product_classification(uuid, text, text, text, bigint, uuid) from public, anon, authenticated;
revoke all on function public.deactivate_affiliate_product(uuid, bigint, uuid) from public, anon, authenticated;

grant execute on function public.upsert_affiliate_product_ingestion(text, text, numeric, numeric, text, text, text, text, text, text, text, text, numeric, text, text, text, text, text[]) to service_role;
grant execute on function public.approve_affiliate_product_classification(uuid, text, text, text, bigint, uuid) to service_role;
grant execute on function public.deactivate_affiliate_product(uuid, bigint, uuid) to service_role;

do $$
declare
  definition text;
begin
  select pg_catalog.pg_get_functiondef(p.oid)
    into definition
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'upsert_affiliate_product_ingestion'
    and pg_catalog.pg_get_function_identity_arguments(p.oid) =
      'p_product_id_shopee text, p_title text, p_price_original numeric, p_price_discount numeric, p_image_url text, p_shopee_affiliate_link text, p_ai_copy text, p_category text, p_department_slug text, p_subcategory_slug text, p_leaf_slug text, p_classification_source text, p_classification_confidence numeric, p_classification_review_status text, p_suggested_department_slug text, p_suggested_subcategory_slug text, p_suggested_leaf_slug text, p_classification_reasons text[]';

  if definition is null
     or definition ~* 'where[[:space:]]+product_id_shopee[[:space:]]*='
     or definition !~* 'where[[:space:]]+product_row[.]product_id_shopee[[:space:]]*=' then
    raise exception 'Preflight failed: ingestion RPC is not using qualified product_id_shopee references.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as p
    join pg_catalog.pg_namespace as n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'approve_affiliate_product_classification',
        'deactivate_affiliate_product'
      )
      and pg_catalog.pg_get_functiondef(p.oid) ~* 'where[[:space:]]+id[[:space:]]*=[[:space:]]+p_product_id'
  ) then
    raise exception 'Preflight failed: administrative RPC still has an unqualified id predicate.';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.upsert_affiliate_product_ingestion(text, text, numeric, numeric, text, text, text, text, text, text, text, text, numeric, text, text, text, text, text[])',
    'EXECUTE'
  ) then
    raise exception 'Preflight failed: service_role lost ingestion RPC execute privilege.';
  end if;
end
$$;

commit;
