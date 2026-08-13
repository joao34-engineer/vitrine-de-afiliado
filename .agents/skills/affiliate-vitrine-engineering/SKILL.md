---
name: affiliate-vitrine-engineering
description: Use when implementing or reviewing affiliate-vitrine code, especially Next.js App Router routes, React Server/Client Components, TypeScript contracts, Supabase/RLS queries, catalog listing, pagination, indexes, cache, loading states, or tests.
---

# Affiliate Vitrine Engineering

Use this skill to apply the local engineering contract of `affiliate-vitrine`.
It is a routing guide: read the referenced documents instead of duplicating
their full contents here.

## Mandatory pre-flight

Read in order before editing:

1. `../../../docs/feature-first-posture.md`
2. `../../../docs/README.md`
3. `../../../AGENTS.md`
4. `../../../docs/README.md`
5. The thematic document for the task.

Keep all changes inside `affiliate-vitrine` unless the user explicitly expands
the scope. Do not touch `my-collection-page`, Shopify, Pixel/CAPI or production
Supabase as part of this app's normal implementation.

## Route by task

- TypeScript, contracts or external data: `../../../docs/typescript-best-practices.md`
  and `../../../docs/coding-standards.md`.
- React, Next.js, App Router, loading or errors:
  `../../../docs/react-nextjs-best-practices.md`.
- Catalog listing, cursor pagination, indexes, cache or revalidation:
  `../../../docs/catalog-performance.md`, `../../../docs/supabase-runtime-runbook.md`
  and `../../../docs/react-nextjs-best-practices.md`.
- Supabase client, RLS, credentials or migration:
  `../../../docs/supabase-guidelines.md` and `../../../docs/supabase-runtime-runbook.md`.
- Unit, route or contract tests: `../../../docs/testing-standards.md` plus the feature
  document being changed.
- FSD placement: `../../../docs/architecture.md` and the repository
  `feature-sliced-design` skill.

## Non-negotiable implementation gates

- Keep Server Components as the default; isolate `'use client'` at interactive
  leaves and pass only serializable props.
- Keep public catalog reads server-only, use the anon key, explicit columns and
  RLS filters. Never use service role in public reads.
- Validate unknown external data before mapping it into a domain contract.
- Use cursor/keyset pagination for deep listings; do not introduce `OFFSET`.
- Do not add an index or migration based only on intuition: inspect the existing
  schema and execution plan first, then create a revisable SQL migration.
- Do not turn query failures into empty catalog results.
- Do not add cache settings without documenting TTL, invalidation and error
  behavior for the affected route.
- Run lint, TypeScript, relevant tests, build and `git diff --check` before handoff.
