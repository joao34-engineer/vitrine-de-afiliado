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

## Status de execucao da Fase 2

A Fase 2 foi implementada localmente na `affiliate-vitrine`: home, rail e
sheet local, listagens por departamento/folha, busca full-text, paginacao
cursor-based, PDP, redirect `record_click` fail-open, footer e estados de
loading/erro.

A migration de indices e busca foi aplicada manualmente no Supabase a partir de
`supabase/migrations/20260813000000_add_affiliate_catalog_search_and_public_access.sql`.
O diagnostico pre-migration foi revisado antes da aplicacao e o diagnostico
pos-migration confirmou a coluna gerada, os indices, as RPCs, os grants e os
planos `EXPLAIN`. Nenhuma migration e aplicada automaticamente pelo app.

Pixel e CAPI continuam fora do projeto. O caminho publico nao usa service role
nem qualquer chave administrativa.

## Fase 3 - Go-live

Status: adiada ate o encerramento da Fase 4. A implementacao visual do design
aprovado no Figma sera a frente ativa agora; o checklist de go-live e os
smoke tests serao retomados depois que a Fase 4 estiver concluida.

Objetivo: preparar a vitrine para producao.

Entregas:

- UX mobile revisada.
- Performance e imagens remotas configuradas.
- Checklist de dominio `ofertas.salvatbrand.com.br`.
- Deploy Vercel separado.
- Smoke do funil Instagram/DM -> PDP -> clique de saida.

Adiado nesta fase:

- SEO basico, incluindo metadata orientada a busca, sitemap, robots e JSON-LD.
  SEO nao bloqueia o go-live da vitrine afiliada e sera retomado somente se
  houver uma necessidade concreta de descoberta organica.

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

## Fase 4 - Implementacao do Design

Status: frente ativa. Esta fase sera executada antes da retomada da Fase 3,
preservando os contratos, a seguranca, o tracking e as consultas server-only ja
implementados.

Objetivo: trazer para a `affiliate-vitrine` o design aprovado no Figma, sem
reabrir contratos de dados, seguranca ou arquitetura ja concluidos.

Entregas:

- Mapear os frames aprovados para home, rail, sheet, listing, PDP e estados de
  carregamento/erro.
- Implementar o design em TypeScript/TSX, respeitando a arquitetura FSD leve e
  os componentes server-only do catalogo.
- Alinhar tokens visuais, tipografia, espacamento, temas claro/escuro e
  responsividade com o arquivo do Figma.
- Preservar navegacao por departamento/folha, consultas server-only, redirect e
  disclosure de afiliado.
- Validar visualmente desktop e mobile com screenshots e revisar acessibilidade
  das interacoes existentes.

Nao fazer:

- Nao alterar `my-collection-page`.
- Nao reintroduzir Shopify, Pixel ou CAPI.
- Nao substituir a taxonomia, os contratos Supabase ou a politica de acesso.
- Nao mover consultas, RLS ou dados internos para o client. A unica excecao
  visual e o botao `Carregar mais`, que recebe DTOs publicos por Server Action
  para acrescentar o proximo lote sem recarregar a pagina.

DoD:

- Os frames aprovados estao representados nas rotas reais da vitrine.
- O comportamento visual e responsivo foi validado em desktop e mobile.
- O sheet continua sem fetch, as consultas continuam server-only e somente a
  interacao de `Carregar mais` possui uma fronteira client explicita.
- Testes, TypeScript, lint e build passam.
- Nenhum contrato de seguranca ou tracking foi ampliado.

## Eixo operacional - Ingestao e console de revisao de classificacao

Status: implementado localmente; migration administrativa, configuracao M2M e
deploy ainda pendentes. O catalogo e o go-live continuam operacionais sem este eixo;
enquanto o deploy do fluxo nao for concluido, a revisao manual por
lote/arquivo revisavel continua sendo o procedimento operacional.

O fluxo oficial novo e:

1. O backend envia o produto bruto para a API interna server-only da vitrine.
2. A vitrine executa o classificador canonico `ingest-rules-v1`.
3. `auto` fica elegivel ao catalogo; `review` e salvo, mas permanece oculto.
4. O console autenticado do backend lista a fila e envia somente a folha
   escolhida para aprovacao.
5. A vitrine deriva departamento/subcategoria, aplica CAS por revisao e
   invalida o cache publico somente depois da escrita confirmada.

Reenvios usam `product_id_shopee` como chave idempotente. Produtos manuais e
inativos nao sao sobrescritos pelo classificador automatico. A chave de
tracking continua isolada e nao participa de nenhuma operacao administrativa.
Approve e deactivate usam `operation_id` UUID para diferenciar retry idempotente
de concorrencia real; uma revisao nova invalida a operacao anterior.

### Objetivo

A area administrativa na dashboard do sistema principal revisa produtos que o
classificador marcou como `review`. A vitrine publica nao recebe essa
interface; ela continua somente leitura e server-only.

### Fluxo previsto

1. O backend identifica produtos com `classification_review_status = 'review'`.
2. A dashboard mostra titulo, imagem, `category` legado, sugestao do
   classificador, confianca e motivo do conflito.
3. O operador escolhe uma folha da taxonomia canonica em uma lista agrupada por
   departamento. A escolha nao sera texto livre.
   O console tambem pode filtrar a fila carregada por departamento e por folha;
   esses filtros sao visuais e nao alteram o contrato da API.
4. O backend valida o `leaf_slug` e deriva `department_slug` e
   `subcategory_slug` pela taxonomia oficial.
5. A aprovacao atualiza somente os campos de classificacao e muda o status para
   `auto`, tornando o produto elegivel para a leitura publica.
6. Um produto pode permanecer em `review` ou ser desativado sem ser apagado.

A escolha manual de folha fica restrita aos casos ambiguos. Produtos com sinal
forte e folha unica continuam sendo classificados automaticamente pelo pipeline.

### Seguranca e contratos

- A dashboard chama endpoints administrativos autenticados do backend.
- O navegador nao acessa o Supabase com `SUPABASE_SERVICE_ROLE_KEY`.
- Operacoes administrativas usam o cliente de produtos com service role
  somente no servidor.
- `SUPABASE_ANON_KEY` permanece leitura publica e `SUPABASE_CLICK_KEY`
  permanece exclusiva do `record_click`.
- O backend aceita somente slugs canonicos e atualiza apenas campos de
  classificacao; `category`, titulo, precos, imagens e links permanecem
  preservados.
- A publicacao continua protegida por RLS/RPC: produtos `review` nao aparecem
  na vitrine.

### Fora do eixo

- Nao substitui o classificador deterministico.
- Nao transforma a dashboard em editor geral de produtos.
- Nao altera `my-collection-page`.
- Nao adiciona Pixel, CAPI, Shopify ou uma nova regra de tracking.
- Nao adiciona Pixel, CAPI, Shopify, embedding ou `price_history`.
