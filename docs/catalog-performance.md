# Affiliate Vitrine - Catalog Performance Contract

Este documento registra o contrato de performance da Fase 2. A leitura, a
listagem, a busca, o cache e os cursores ja estao implementados localmente.
Nao autoriza migration, DDL ou alteracao remota por si so.

## Fluxo publico

```text
rota server-side
  -> consulta server-only
  -> filtros de publicacao e taxonomia
  -> pagina cursor-based
  -> validacao runtime
  -> props serializaveis para a UI
```

- A leitura direta da tabela continua protegida por RLS. O catalogo usa RPCs
  publicas `SECURITY DEFINER` endurecidas para filtrar campos internos sem
  concede-los ao consumidor; essa fronteira privilegiada deve ser validada pelo
  diagnostico pos-migration.
- A selecao de colunas e explicita; nunca usar `select('*')` no catalogo.
- Abrir sheet, rail ou taxonomia local nao consulta Supabase.
- A consulta ocorre quando a listagem ou a busca realmente precisa de dados.
- Erros do Supabase permanecem erros de catalogo; nao retornar lista vazia como fallback.

## Paginação

- Usar cursor/keyset, nao `OFFSET`.
- Ordenacao canonica: `created_at DESC, id ASC`.
- Tamanho inicial da pagina: 24 produtos.
- Consultar `limit + 1` linhas para derivar `hasNextPage`; retornar no maximo 24.
- O cursor precisa conter `created_at` e `id` da ultima linha da pagina.
- A pagina publica tem 24 itens; uma janela progressiva pede no maximo 241
  linhas (`240 + 1`) por chamada server-only. Se linhas invalidas forem
  encontradas, o refill usa cursores adicionais dentro do teto documentado.
- Para a ordenacao mista, a proxima pagina deve aplicar:
  `created_at < cursor.createdAt OR (created_at = cursor.createdAt AND id > cursor.id)`.
- Cursor e filtros devem ser validados antes da consulta. Cursor invalido deve
  produzir erro de entrada, nunca uma consulta ampla.
- Linhas que falharem na validacao runtime nao ocupam a pagina: a camada faz
  refill limitado por cursor, com teto fixo de tentativas. Se o teto for
  atingido sem formar uma pagina confiavel, retorna erro explicito.
- A resposta publica deve ter forma explicita, por exemplo:

```ts
{
  items: readonly PublicAffiliateProductCardData[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
```

O cursor deve ser opaco para a URL e nao pode carregar segredo ou dados internos.

## Cache e revalidacao

- A politica ativa usa Cache Components, `use cache`, `cacheLife` e tags.
- Perfil efetivo do catalogo: `stale = 60`, `revalidate = 300`, `expire = 900`.
- As tags cobrem catalogo, departamento, folha, busca e produto.
- A futura ingestao administrativa devera invalidar as tags afetadas depois de
  uma escrita confirmada; nenhuma invalidacao e executada nesta fase.
- Nao adicionar `staleTimes`, `dynamic`, `fetchCache` ou outra configuracao
  experimental sem uma decisao documentada e teste de build.
- O catalogo aceita consistencia eventual curta; erros nao entram no cache como
  lista vazia.
- Nao usar cache compartilhado mutavel em modulo server para armazenar estado de
  request ou credenciais.

## RPC e privilegios

- Listagem, busca e detalhe usam RPCs de retorno explicito; o catalogo nao
  consulta diretamente `products` para filtrar `classification_review_status`.
- `SECURITY DEFINER` e usado apenas nas RPCs que precisam ler campos internos
  para aplicar o filtro de publicacao. O SQL e estatico, o `search_path` e
  `pg_catalog`, o owner deve ser confiavel e o `EXECUTE` de `PUBLIC` e revogado.
- Grants diretos nao incluem `ai_copy`, `embedding`, `sales`,
  `shopee_affiliate_link` nem campos de classificacao.

## Indices e SQL

Antes de criar qualquer migration:

1. Inventariar indices existentes em `public.products`.
2. Confirmar a consulta real da listing, incluindo filtros RLS e ordenacao.
3. Rodar `EXPLAIN (ANALYZE, BUFFERS)` no ambiente autorizado, sem alterar dados.
4. Comparar custo, rows removidas, seq scan, sort e buffers.
5. Criar migration aditiva apenas se a evidencia justificar.
6. Revisar a migration manualmente antes de qualquer aplicacao.

Indices revisaveis para validar com EXPLAIN, nao comandos para executar
antecipadamente:

- folha: `(leaf_slug, created_at DESC, id ASC)`;
- departamento: `(department_slug, created_at DESC, id ASC)`;
- home: `(created_at DESC, id ASC)`;
- ambos com predicado parcial de produto publico: `is_active = true`,
  `classification_review_status = 'auto'`, `department_slug IS NOT NULL` e
  `leaf_slug IS NOT NULL`.

O predicado final deve ser compatível com a policy e com a forma efetiva da
consulta. Indices redundantes nao devem ser criados.

## UI e estados

- A primeira listagem deve ser Server Component.
- Cada segmento publico de catalogo possui `loading.tsx` e `error.tsx` para
  streaming do shell, skeleton e retry apropriado.
- A troca de folha deve manter feedback visual e evitar uma tela vazia sem contexto.
- Componentes client ficam restritos a eventos, estado e APIs do navegador; o grid
  e os cards permanecem server-side quando nao houver interacao propria.
- Arquivos-fonte continuam sendo TypeScript/TSX. `use client` apenas define uma
  fronteira de hidratacao; o Next.js compila esse TypeScript para o navegador.

## Referencias

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Supabase/Postgres runtime](./supabase-runtime-runbook.md)
