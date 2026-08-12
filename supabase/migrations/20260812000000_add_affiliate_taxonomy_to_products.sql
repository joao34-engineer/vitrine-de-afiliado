-- Fase 1A - Affiliate Vitrine taxonomy contract.
-- Review-only migration: do not apply to production without human approval.
-- This is additive and preserves the legacy public.products.category column.

alter table public.products
  add column if not exists department_slug text null,
  add column if not exists subcategory_slug text null,
  add column if not exists leaf_slug text null,
  add column if not exists classification_source text null,
  add column if not exists classification_confidence numeric null,
  add column if not exists classification_review_status text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_classification_review_status_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_classification_review_status_check
      check (
        classification_review_status is null
        or classification_review_status in ('auto', 'review')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_classification_confidence_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_classification_confidence_check
      check (
        classification_confidence is null
        or (
          classification_confidence >= 0
          and classification_confidence <= 1
        )
      );
  end if;
end $$;

comment on column public.products.department_slug is
  'Affiliate-vitrine department slug. Additive navigation contract; category remains legacy.';
comment on column public.products.subcategory_slug is
  'Optional affiliate-vitrine subcategory slug for visible refinements.';
comment on column public.products.leaf_slug is
  'Affiliate-vitrine leaf slug. Required by app contract before publishing.';
comment on column public.products.classification_source is
  'Source that assigned affiliate taxonomy slugs, for example legacy-backfill-v1.';
comment on column public.products.classification_confidence is
  'Classifier confidence between 0 and 1 when available.';
comment on column public.products.classification_review_status is
  'Classification review state: auto or review.';
