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
| Estrutura de pastas e FSD leve | `architecture.md` |
| Supabase, env vars e RLS | `supabase-guidelines.md` |
| Seguranca, redirects e segredos | `security.md` |
| Compliance afiliado, Amazon e footer | `affiliate-compliance-footer.md` |
| Categorias, departamentos e folhas | `taxonomy-guidelines.md` |
| Dept rail e hairline animada | `dept-rail-hairline-motion.md` |
| Migracao automatica do catalogo legado | `catalog-migration-map.md` |
| Backfill local e classificacao revisavel | `backfill-classification-runbook.md` |
| Execucao do produto em 3 fases | `execution-doc/affiliate-vitrine-3-fases.md` |

## Decisoes Vigentes

- Dominio alvo: `ofertas.salvatbrand.com.br`.
- App separado de `my-collection-page/`.
- Supabase sera o SoT da vitrine afiliada.
- Shopify e taxonomia DS ficam fora deste app.
- Pixel e CAPI ficam fora do V1.
- Navegacao por departamento/sheet deve usar taxonomia local e abrir sem fetch.
