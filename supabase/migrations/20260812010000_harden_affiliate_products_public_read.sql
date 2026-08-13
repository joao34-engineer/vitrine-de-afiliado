-- Fase 1C - Public read gate for affiliate-vitrine.
-- Review-only migration: do not apply to production without human approval.
-- No product rows are deleted or updated by this file.

alter table public.products enable row level security;

revoke select on table public.products from public;
grant select on table public.products to anon, authenticated;

do $$
declare
  other_select_policies integer;
begin
  select count(*)
  into other_select_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'products'
    and cmd = 'SELECT'
    and policyname <> 'Public can view active products';

  if other_select_policies > 0 then
    raise exception
      'Unexpected additional SELECT policy on public.products. Audit pg_policies before applying this migration.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'Public can view active products'
  ) then
    alter policy "Public can view active products"
      on public.products
      to anon, authenticated
      using (
        is_active = true
        and classification_review_status = 'auto'
        and department_slug is not null
        and leaf_slug is not null
      );
  else
    raise exception
      'Expected policy "Public can view active products" on public.products. Audit pg_policies before applying this migration.';
  end if;
end $$;
