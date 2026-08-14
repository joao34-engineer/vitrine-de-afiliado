# Documentacao - Affiliate Vitrine

Entrada obrigatoria para LLMs e humanos antes de trabalhar no `affiliate-vitrine/`.

## Ordem de Leitura

1. `../../docs/feature-first-posture.md`
2. `../../docs/README.md`
3. `../AGENTS.md`
4. Este arquivo
5. Documento tematico da tarefa atual

## Docs Tematicos

| Tarefa | Ler |
| --- | --- |
| Next.js, App Router, Server/Client Components | `react-nextjs-best-practices.md` |
| TypeScript, tipos, validacao e zero `any` | `typescript-best-practices.md` |
| Clean code, nomenclatura e fronteiras | `coding-standards.md` |
| Testes unitarios, contratos e rotas | `testing-standards.md` |
| Catalogo, indices, cache e paginação | `catalog-performance.md` |
| Estrutura de pastas e FSD leve | `architecture.md` |
| Supabase, env vars e RLS | `supabase-guidelines.md` |
| Runtime Supabase, clients e policy publica | `supabase-runtime-runbook.md` |
| Seguranca, redirects e segredos | `security.md` |
| Compliance afiliado, Amazon e footer | `affiliate-compliance-footer.md` |
| Categorias, departamentos e folhas | `taxonomy-guidelines.md` |
| Dept rail e hairline animada | `dept-rail-hairline-motion.md` |
| Migracao automatica do catalogo legado | `catalog-migration-map.md` |
| Backfill local e classificacao revisavel | `backfill-classification-runbook.md` |
| Ingestao administrativa e console de review | `execution-doc/affiliate-vitrine-3-fases.md` + `supabase-runtime-runbook.md` |
| Execucao do produto em 3 fases | `execution-doc/affiliate-vitrine-3-fases.md` |

## Decisoes Vigentes

- Dominio alvo: `ofertas.salvatbrand.com.br`.
- App separado de `my-collection-page/`.
- Supabase sera o SoT da vitrine afiliada.
- Shopify e taxonomia DS ficam fora deste app.
- Pixel e CAPI ficam fora do V1.
- Navegacao por departamento/sheet deve usar taxonomia local e abrir sem fetch.

## Pre-flight por tarefa

| Tarefa | Leitura minima adicional |
| --- | --- |
| Catalogo/listing | `architecture.md`, `react-nextjs-best-practices.md`, `catalog-performance.md`, `supabase-runtime-runbook.md` |
| UI/home/sheet | `architecture.md`, `react-nextjs-best-practices.md`, `coding-standards.md` |
| Supabase/RLS/migration | `supabase-guidelines.md`, `supabase-runtime-runbook.md`, `catalog-performance.md` |
| TypeScript/contratos | `typescript-best-practices.md`, `coding-standards.md`, testes relevantes |
| Testes | `testing-standards.md` e o documento da feature tocada |

O pre-flight nao substitui `../docs/feature-first-posture.md` nem `AGENTS.md`.
