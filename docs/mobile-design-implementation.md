# Implementacao Mobile do Design

Este documento registra a adaptacao mobile da `affiliate-vitrine` a partir dos
frames validos do arquivo Figma Salvat Brand Affiliate Vitrine.

## Referencias

Frames usados nesta etapa:

| Experiencia | Light | Dark |
| --- | --- | --- |
| Home | `3:61` | `3:294` |
| Listing | `3:129` | `3:362` |
| PDP | `3:211` | `3:444` |
| Sheet | `4:2` | `4:39` |

Os frames `02 - mobile` e `03 - desktop` foram ignorados porque estao
quebrados. A referencia visual desktop fica para uma etapa posterior.

## Mapeamento de Componentes

| Necessidade | Componente |
| --- | --- |
| Chrome, logo e busca | `widgets/catalog-header` e `widgets/catalog-shell` |
| Rail horizontal | `features/department-navigation/ui/department-rail.tsx` |
| Menu geral | `features/department-navigation/ui/department-menu-button.tsx` e `department-sheet.tsx` |
| Sheet por departamento | `features/department-navigation/ui/department-sheet.tsx` |
| Hero e grid da home | `views/catalog-home` |
| Controles e grid da listing | `views/catalog-listing` e `entities/affiliate-product/ui` |
| Imagem, CTA e relacionados da PDP | `views/product-detail` |
| Footer e disclosure | `widgets/catalog-footer` |
| Hairline do rail | `shared/ui/scroll-reveal-hairline.tsx` e `department-rail-divider.tsx` |

## Tokens Mobile

Light usa fundo `#fbf8f3`, superficies `#ffffff` e `#f6efe4`, texto
`#191a17`, texto secundario `#68645b`, borda `#ddd2c4`, destaque `#d4548e`,
preco `#b82d4b` e divisor `#d6cab8`.

Dark usa fundo `#121411`, superficies `#1c1e1a` e `#11100e`, texto
`#f7f1e8`, texto secundario `#b7aea1`, borda `#3a3c34`, destaque `#ff8b5d`,
preco `#ff9a88` e divisor `#35302a`.

Os tokens sao aplicados apenas no breakpoint mobile nesta etapa. O desktop
continua com o chrome existente.

## Navegacao

O rail usa scroll horizontal nativo, sem consulta ao Supabase. Home e um link
direto para `/`. Os demais departamentos abrem o sheet especifico, que mostra
Todos e as folhas do departamento.

O botao de menu abre o sheet geral. Nesse sheet, o grupo `Mais` nao aparece
como uma linha; suas folhas `Papelaria`, `Ferramentas`, `Automotivo` e
`Achadinhos gerais` entram diretamente na lista. Busca e filtragem do sheet sao
locais e usam somente a taxonomia em memoria.

## Home, Listing e PDP

A home mobile usa os dois primeiros produtos reais da pagina atual no hero. Os
demais produtos formam o grid sem duplicar os itens do hero. Com menos de dois
produtos, o hero e omitido.

A listing usa busca contextual com os filtros taxonomicos atuais, botao
Filtros e grid de duas colunas. Carregar mais continua sendo um link normal
server-only.

A PDP usa a imagem principal, titulo, preco, CTA rastreado, disclosure e no
maximo dois relacionados da mesma folha. Relacionados sao buscados no servidor,
excluem o produto atual e nao expoem dados internos.

## Sheets e Acessibilidade

O sheet especifico e o sheet geral compartilham o mesmo controlador client. No
mobile o painel e um bottom sheet; no desktop o comportamento anterior e
preservado. O fluxo mantem foco inicial, ciclo de Tab, Escape, restauracao de
foco, `aria-modal` e fundo inerte. Abrir qualquer sheet nao busca catalogo.

## Hairline

A hairline usa GSAP e ScrollTrigger, com reveal entre `0` e `140px`, `scrub`
`0.4`, escala inicial `0.92` e origem central. Em reduced motion ela fica
visivel e estatica, sem listener de scroll ou scrub. O componente e apenas
feedback visual e nao altera o layout ou a navegacao.

## Assets e Fronteiras

O logo usado no chrome esta em `public/brand/salvat-brand-seal.jpeg`. Imagens
de produtos continuam vindo do Supabase e passam por `next/image`; nenhum
asset de produto ficticio do Figma foi incorporado.

Server Components continuam sendo o padrao. JavaScript fica restrito ao rail,
sheets, estado de navegacao e hairline. Nao foram alterados clients Supabase,
migrations, backend, tracking, Pixel, CAPI, Shopify ou `my-collection-page`.

## Validacao

Validar em `390x844`, `390x1237` e `375x812`, nos temas claro e escuro. Fazer
tambem um smoke test desktop amplo para garantir que o chrome anterior nao foi
quebrado. A implementacao desktop baseada nos frames validos fica reservada
para uma etapa posterior.
