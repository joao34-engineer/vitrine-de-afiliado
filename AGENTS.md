# Affiliate Vitrine - Governanca do Subprojeto

Este arquivo e a fonte normativa local para qualquer agente ou humano atuando no app `affiliate-vitrine/`.

## Papel do App

`affiliate-vitrine/` e a vitrine publica de afiliados em `ofertas.salvatbrand.com.br`.

- Stack: Next.js App Router, React, TypeScript, Tailwind e Supabase.
- Backend de loja: Supabase, nao Shopify.
- Pixel e CAPI: fora do V1; nao implementar sem pedido explicito.
- Taxonomia: folhas simplificadas de afiliado, nao a taxonomia DS/Shopify.

## Preflight Obrigatorio

Antes de editar codigo ou configuracao neste app, leia nesta ordem:

1. `../docs/feature-first-posture.md`
2. `../docs/README.md`
3. `./AGENTS.md`
4. `./docs/README.md`
5. Somente os docs tematicos relevantes para a tarefa atual.

## Regras Inegociaveis

- Nao tocar em `my-collection-page/` para implementar a vitrine afiliada, salvo pedido explicito.
- Nao copiar contratos DS/Shopify para este app.
- Nao usar categoria em texto livre como contrato de navegacao; usar `department_slug` e `leaf_slug`.
- Nao adicionar Pixel/CAPI no V1.
- Nao criar schema Supabase destrutivo; qualquer schema futuro deve ser aditivo e revisavel.
- Nao usar `any`, `@ts-ignore`, `@ts-expect-error` ou non-null assertion para mascarar tipos.
- Manter Server Components como padrao e usar `'use client'` apenas nas folhas interativas.

## Arquitetura

O app segue Next.js App Router com `src/app/` e FSD leve:

- `src/app/`: rotas, layouts, metadata, loading/error/not-found e route handlers.
- `src/views/`: composicao de paginas.
- `src/widgets/`: blocos reutilizados em 2+ views.
- `src/features/`: interacoes reutilizadas em 2+ pontos.
- `src/entities/`: modelos de dominio reutilizados.
- `src/shared/`: UI, lib, config e clientes sem regra de negocio.
- `src/lib/`: clientes/infra legados quando necessario; preferir `src/shared` para novo codigo.
- `src/types/`: tipos publicos e tipos gerados do Supabase.

## Validacao Padrao

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test` quando houver testes relevantes

## Mapa de Documentacao Operacional

Antes de editar, use o documento tematico correspondente:

| Trabalho | Documento principal |
| --- | --- |
| Clean code e fronteiras | `docs/coding-standards.md` |
| TypeScript e contratos | `docs/typescript-best-practices.md` |
| Next.js, React e Server Components | `docs/react-nextjs-best-practices.md` |
| Testes e contratos de rota | `docs/testing-standards.md` |
| Listing, indices, cache e paginacao | `docs/catalog-performance.md` |
| Supabase, RLS e credenciais | `docs/supabase-guidelines.md` e `docs/supabase-runtime-runbook.md` |

O pre-flight minimo continua sendo, nesta ordem:

1. `../docs/feature-first-posture.md`
2. `../docs/README.md`
3. `./AGENTS.md`
4. `./docs/README.md`
5. documento tematico da tarefa

Nao copiar regras ou contratos de `my-collection-page`; use aquela base apenas
como referencia tecnica quando a documentacao local apontar para ela.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
