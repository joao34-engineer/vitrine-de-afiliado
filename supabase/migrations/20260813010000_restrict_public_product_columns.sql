-- Fase 2 - hardening de colunas publicas.
-- Revisavel: executar somente depois da migration de busca/indexes e apos auditoria.
-- Nao aplicar automaticamente nem executar em producao sem autorizacao.

do $$
begin
  if to_regclass('public.products') is null then
    raise exception 'Hardening abortado: public.products nao existe.';
  end if;

  if not exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'search_public_affiliate_products'
  ) then
    raise exception 'Hardening abortado: RPC de busca publica nao existe.';
  end if;
end;
$$;

revoke all on table public.products from anon, authenticated;

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
  leaf_slug,
  classification_source,
  classification_confidence,
  classification_review_status
) on table public.products to anon, authenticated;

-- ai_copy, embedding, sales e shopee_affiliate_link nao sao concedidos via tabela.
-- O redirect usa a RPC dedicada, que retorna somente um produto publicavel.
