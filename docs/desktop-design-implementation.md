# Implementacao Desktop do Design

Este documento registra a adaptacao desktop da `affiliate-vitrine` a partir dos
frames validos do arquivo Figma Salvat Brand Affiliate Vitrine.

## Referencias

| Experiencia | Light | Dark |
| --- | --- | --- |
| Home | `3:528` | `3:912` |
| Listing | `3:627` | `3:1011` |
| PDP | `3:747` | `3:1131` |
| Navigation Panel | `3:826` | `3:1210` |

Canvas de referencia: 1440. Os frames `02 - mobile` e `03 - desktop` continuam
ignorados porque estao quebrados. O mobile permanece congelado em
[`mobile-design-implementation.md`](./mobile-design-implementation.md).

## Mapeamento

| Necessidade | Componente |
| --- | --- |
| Chrome, logo 48px e busca 360 | `widgets/catalog-header` |
| Rail e underline fixo do ativo | `features/department-navigation/ui/department-rail.tsx` |
| Mega menu overlay | `features/department-navigation/ui/department-sheet.tsx` |
| Hero editorial + 3 cards | `views/catalog-home` |
| Sidebar de folhas + busca | `views/catalog-listing` |
| Gallery + buy panel | `views/product-detail` |
| Card compacto | `entities/affiliate-product/ui/affiliate-product-card.tsx` + CSS default |
| Footer 4 colunas | `widgets/catalog-footer` |

A arvore publica e a mesma do mobile. O desktop substitui o CSS default
(acima de 640px). O bloco `@media (max-width: 640px)` so ganhou hides de
secoes novas e `nth-child(n+3)` nos relacionados.

## Tokens

Light default (`:root`) usa os tokens do Figma: fundo `#fbf8f3`, superficie
`#ffffff` e `#f6efe4`, texto `#191a17`, muted `#68645b`, borda `#ddd2c4`,
destaque `#d4548e`, preco `#b82d4b` e divisor `#d6cab8`.

Dark continua em `html.dark`, sem `prefers-color-scheme`. Theme toggle permanece
ao lado da busca, mesmo sem aparecer no Figma.

## Adaptacoes ao codigo existente

- Taxonomia real (`Homens`, `Mulheres`, `Casa`...), nao os labels ficticios do
  arquivo.
- Underline do rail: so `.is-active`, largura fixa `24px`. O frame `3:747`
  desenha linha em todos os depts e foi ignorado.
- Hairline de scroll permanece independente.
- Home reusa a copy do hero mobile. CTA ancora `#home-offers`.
- Listing nao implementa sort (`Menor preco` / `Mais recentes`). O chip mostra
  a folha ou o departamento atual.
- PDP nao inventa description. Related busca 5 itens; o mobile continua com 2.
- Mega menu reusa o controller do sheet (Escape, foco, sem fetch). Bottom sheet
  mobile nao muda.
- Entre 641px e 1440 o layout e fluido (5→4→3 colunas). Nao ha frame tablet.

## Validacao

1440 Light/Dark nas quatro telas; 1100 e 900 como colapso fluido; smoke
`390x844` e `375x812` para confirmar que o mobile nao moveu.
