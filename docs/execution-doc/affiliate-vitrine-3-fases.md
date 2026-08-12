# Affiliate Vitrine - Plano de Execucao em 3 Fases

## Resumo

Criar a vitrine afiliada em `affiliate-vitrine/`, separada da loja DS em `my-collection-page/`, usando Next.js, React, TypeScript e Supabase. Dominio alvo: `ofertas.salvatbrand.com.br`.

Pixel e CAPI ficam fora por enquanto.

## Fase 1 - Fundacao

Objetivo: deixar o app e a governanca prontos para implementacao segura.

Entregas:

- Projeto Next.js com TypeScript, ESLint, Tailwind, App Router, `src/` e alias `@/*`.
- Docs de preflight e arquitetura.
- Estrutura FSD leve.
- Contrato de dados da vitrine definido em documentacao e tipos.
- Migration Supabase aditiva para a taxonomia da vitrine, preservando `category`.
- Taxonomia local canonica de departamentos, subcategorias e folhas.
- Plano de classificacao e backfill dos produtos existentes.
- Mapa documentado de migracao `my-collection-page -> affiliate-vitrine`,
  incluindo regras de automacao por `category`, `title` e `ai_copy`.
- Guideline de compliance afiliado, Amazon sem API e footer.
- Rotas alvo documentadas.

Nao fazer:

- Nao implementar catalogo completo.
- Nao publicar produtos sem `department_slug` e `leaf_slug` validos.
- Nao aplicar classificacao automatica sem revisao dos casos ambiguos.
- Nao implementar Pixel/CAPI.
- Nao portar DS/Shopify.
- Nao exibir preco proprio de Amazon sem API oficial aprovada e integrada.

DoD:

- `npm run lint` passa.
- `npx tsc --noEmit` passa.
- A migration e aditiva, preserva `category` e pode ser aplicada sem perda de dados.
- A taxonomia local e a validacao de slugs estao alinhadas com o contrato do Supabase.
- Existe um caminho documentado para classificar os produtos ja existentes.
- Existe um mapa operacional documentado para rodar o backfill automatico na
  base atual do Supabase sem quebrar o `my-collection-page`.
- Existe contrato de footer/disclosure para afiliado e marketplace.
- Docs possuem links relativos validos.
- LLM consegue saber quais docs abrir antes de editar.

## Fase 2 - Catalogo

Objetivo: publicar produtos afiliados navegaveis por folhas.

Entregas:

- Consumir o schema Supabase e a taxonomia criados na Fase 1.
- Executar a migracao aditiva dos produtos existentes: preservar `category` e preencher
  `department_slug`, `subcategory_slug` quando aplicavel e `leaf_slug`.
- Rodar o backfill automatico documentado sobre a tabela `products` herdada do
  `my-collection-page`, separando os itens `auto` dos itens `review`.
- Home com dept rail e sheet instantaneo.
- Dept rail com hairline animada por scroll, respeitando light/dark,
  mobile/desktop e `prefers-reduced-motion`.
- Listing por `/folha/[leafSlug]`.
- Busca textual.
- PDP simples em `/p/[slug]`.
- Redirect rastreado em `/r/[code]`.
- Pipeline inicial de classificacao por regras e revisao humana.
- Footer com links de comunidade, `Como funciona`, transparencia afiliada e
  aviso de preco/marketplace.

Nao fazer:

- Nao depender de centroides para publicar.
- Nao misturar produtos DS.
- Nao exigir CAPI para medir cliques.
- Nao mostrar preco Amazon em cards/listing/PDP enquanto nao houver API oficial.

DoD:

- Produto so publica com `department_slug` e `leaf_slug` validos.
- `category` legado permanece integro e nao e usado como contrato de navegacao.
- Produtos existentes sao classificados, revisados nos casos ambiguos e
  publicados somente depois da validacao dos slugs.
- O lote de migracao legado produz saida auditavel, com produtos classificados
  automaticamente e lista separada de itens que exigem revisao humana.
- Novos produtos entram pela mesma taxonomia, sem depender de classificacao
  manual espalhada em componentes ou consultas.
- Sheet abre sem fetch.
- Clique em folha carrega listagem.
- Hairline do dept rail aparece no scroll, some no topo e nao causa layout shift.
- PDP direciona para redirect rastreado.
- Footer apresenta disclosure afiliado e nao promete preco garantido.

## Fase 3 - Go-live

Objetivo: preparar a vitrine para producao.

Entregas:

- UX mobile revisada.
- SEO basico: metadata, sitemap, robots e JSON-LD quando aplicavel.
- Performance e imagens remotas configuradas.
- Checklist de dominio `ofertas.salvatbrand.com.br`.
- Deploy Vercel separado.
- Smoke do funil Instagram/DM -> PDP -> clique de saida.

Nao fazer:

- Nao ativar Pixel/CAPI sem decisao nova.
- Nao mover DS para este app.
- Nao colocar o afiliado em `/ofertas` no dominio principal.

DoD:

- Build passa.
- Dominio aponta para o projeto correto.
- Produto de teste abre via PDP.
- Redirect chega na oferta permitida.
- Operacao sabe onde revisar logs e env vars.
