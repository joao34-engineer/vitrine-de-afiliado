# Supabase Runtime Runbook - Affiliate Vitrine

## Fonte oficial

`public.products` e a fonte oficial do catalogo da `affiliate-vitrine`.
O `my-collection-page` esta fora deste fluxo. O backend do `AFILIADO-SHOPEE`
faz operacoes administrativas server-side; a `affiliate-vitrine` faz leitura
publica com anon key, filtros de publicacao e RPCs endurecidas. A leitura direta
da tabela continua protegida por RLS; as RPCs `SECURITY DEFINER` sao uma
fronteira privilegiada separada e devem ser auditadas no diagnostico.

## Matriz de credenciais

| Consumidor | Credencial | Uso permitido |
| --- | --- | --- |
| `affiliate-vitrine` leitura server-only | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ler produtos liberados pela RLS |
| `affiliate-vitrine` redirect server-only | `SUPABASE_CLICK_KEY` | Somente RPC `record_click` com origem `vitrine` |
| `affiliate-vitrine` server-only | `SUPABASE_SERVICE_ROLE_KEY` | Somente ingestao/review administrativas; nunca leitura publica |
| `AFILIADO-SHOPEE/backend` tracking | `SUPABASE_CLICK_KEY` | Somente RPC `record_click` |
| `AFILIADO-SHOPEE/backend` produtos | `AFFILIATE_VITRINE_INTERNAL_SECRET` | Orquestrar a API M2M; nao acessa Supabase |

O contrato M2M entre backend e vitrine usa `AFFILIATE_VITRINE_INTERNAL_URL` no
backend e `AFFILIATE_VITRINE_INTERNAL_SECRET` em ambos os servidores. Esse
segredo nao e a chave do Supabase e nunca e enviado ao navegador. A migration
administrativa de ingestao/review ainda deve ser aplicada manualmente antes de
usar os endpoints em ambiente real.

O cliente de tracking nao deve receber permissao de produtos nem fazer
fallback para service role. A service role ignora RLS e nunca pode aparecer no
browser, em logs ou em respostas HTTP.

### Diagnostico de indisponibilidade M2M

`GET /json/version` nao e uma rota da aplicacao; e uma sondagem externa de
DevTools/browser automation e pode responder `404` sem indicar falha da API.
Um `502` em `/api/affiliate-vitrine/taxonomy` ou `/reviews` indica que o
backend nao conseguiu completar a chamada para a vitrine. Verifique, sem
exibir os valores, se ambos os processos possuem:

- `backend/.env`: `AFFILIATE_VITRINE_INTERNAL_URL` e
  `AFFILIATE_VITRINE_INTERNAL_SECRET`;
- `affiliate-vitrine/.env.local`/Vercel: o mesmo
  `AFFILIATE_VITRINE_INTERNAL_SECRET`;
- URL HTTPS fora de `localhost`/`127.0.0.1` exatos;
- Uvicorn, Next e Vite reiniciados depois da alteracao.

Segredo ausente ou URL insegura resulta em `503` de configuracao; falha de
gateway durante uma chamada resulta em `502`. A migration administrativa
pendente tambem pode deixar a fila de reviews indisponivel, mas nao deve
afetar o endpoint local de taxonomia.

## Regra de leitura publica

A policy publica e as RPCs publicas devem permitir somente linhas que atendam simultaneamente:

- `is_active = true`;
- `classification_review_status = 'auto'`;
- `department_slug IS NOT NULL`;
- `leaf_slug IS NOT NULL`.

O mapper TypeScript ainda valida o par departamento/folha contra a taxonomia
local. A policy do banco garante o estado minimo de publicacao, e o mapper
rejeita linhas fora do contrato da aplicacao.

Produtos em `review` nao sao apagados. Eles permanecem disponiveis para o
backend administrativo revisar e atualizar.

## Compatibilidade do slug

A tabela legada ainda nao possui uma coluna `slug`. Enquanto essa coluna nao
for criada em uma fase propria, o mapper deriva um slug estavel a partir de
`product_id_shopee`, com o prefixo `shopee-`. Essa derivacao nao altera a linha
do banco.

## Revisao da migration

Arquivo canonico ja aplicado: `supabase/migrations/20260813000000_add_affiliate_catalog_search_and_public_access.sql`.

Antes de aplicar:

1. Confirmar que a tabela e as colunas da Fase 1A existem.
2. Consultar `pg_policies` para confirmar a policy publica atual.
3. Confirmar que nao existe outra policy de `SELECT` em `public.products`.
4. Confirmar que a leitura publica usa anon e que operacoes administrativas ficam
   server-only com service role.
5. Testar anon com um produto `auto` e um produto `review`.
6. Confirmar que nenhum produto foi atualizado ou apagado pelo script.

Se a policy `Public can view active products` nao existir, a migration deve
falhar. Nao crie uma policy paralela sem primeiro auditar todas as policies de
`SELECT` da tabela, porque policies permissivas podem se combinar com `OR`.
O script tambem falha quando encontra outra policy de `SELECT` em
`public.products`.

A migration da Fase 1C foi aplicada manualmente e validada no Supabase. A
migration de catalogo desta fase tambem foi aplicada manualmente apos o
diagnostico pre-migration e autorizacao explicita. O diagnostico pos-migration
confirmou a coluna gerada, os quatro indices, as tres RPCs, os grants e a
preservacao dos 157 produtos.

## Operacoes administrativas - eixo de ingestao e review

O fluxo novo usa a API interna server-only da vitrine. O backend orquestra e o
console chama apenas endpoints autenticados do backend; o navegador nunca
recebe service role, anon key administrativa ou click key.

O cliente administrativo da vitrine usa service role somente no servidor. O
upsert tipado pode atualizar os campos brutos recebidos e a classificacao
calculada; a revisao humana aceita somente atualizacoes de:

- `department_slug`;
- `subcategory_slug`;
- `leaf_slug`;
- `classification_source`;
- `classification_confidence`;
- `classification_review_status`.

`POST /api/internal/catalog/products` recebe somente produto bruto e roda o
classificador `ingest-rules-v1`. `auto` publica quando a taxonomia e completa;
`review` preserva sugestao, motivos e revisao, mas permanece fora do catalogo.
`GET /api/internal/catalog/reviews` e os endpoints de approve/deactivate usam
cursor keyset e compare-and-swap por `classification_revision`. Cada aprovacao
ou desativacao tambem leva `operation_id`: o mesmo UUID pode ser repetido com
seguranca apos timeout; uma operacao diferente sobre uma revisao ja alterada
recebe conflito `409`. A reingestao limpa o identificador anterior quando
altera dados ou classificacao.

A allowlist oficial de links Shopee e HTTPS-only e aceita `shopee.com.br` e
seus subdominios, `shopee.com` e seus subdominios, alem de `shope.ee`,
`shp.ee` e `br.shp.ee`. Hosts parecidos, portas, credenciais e HTTP sao
rejeitados em cada fronteira.

Erros de leitura ou escrita falham explicitamente. A migration aditiva
`supabase/migrations/20260814000000_add_affiliate_ingestion_review_operations.sql`
ainda e pendente de aplicacao manual; ela adiciona os campos administrativos,
o indice da fila e as RPCs service-role-only. Nao executar DDL pelo app.
Depois dela, a migration revisavel
`supabase/migrations/20260814010000_align_affiliate_destination_allowlist.sql`
alinha a RPC de detalhe com a allowlist HTTPS oficial e remove a permissao
historica para hosts sem evidencia operacional. As duas devem ser revisadas e
aplicadas em ordem, manualmente e somente com autorizacao explicita.

## Camada de leitura publica - Fase 2

A consulta publica do catalogo usa `createPublicSupabaseClient` e a
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, mas e executada somente em modulos server-only.
Ela nao aceita client injetado, nao importa o client administrativo e nunca usa
`SUPABASE_SERVICE_ROLE_KEY` para leitura publica.

Toda consulta aplica os filtros de publicacao, mesmo com a RLS ativa:

- `is_active = true`;
- `classification_review_status = 'auto'`;
- `department_slug IS NOT NULL`;
- `leaf_slug IS NOT NULL`.

Filtros de departamento e folha usam somente os slugs canonicos. Um par
departamento/folha invalido e rejeitado antes da consulta. Listagem, busca e
detalhe usam RPCs de retorno explicito; os grants diretos da tabela nao incluem
`ai_copy`, `embedding`, `sales`, `shopee_affiliate_link` ou campos de
classificacao. O card usa somente
`PublicAffiliateProductCardData`; o contrato completo fica restrito ao PDP e
ao redirect server-only.

Depois da resposta do Supabase, a camada valida o formato da linha e usa o
mapper do contrato `PublicAffiliateProduct`. Produtos malformados, inativos,
em `review`, com URL/preco invalido ou taxonomia invalida sao descartados.
`category` e preservada no produto por compatibilidade e auditoria, mas nao
participa da navegacao nem dos filtros novos.

Falhas de leitura ou respostas com formato invalido geram erro explicito de
catalogo. A camada nao transforma erro em lista vazia e nao faz fallback para
service role.

A listagem usa paginacao keyset com cursor opaco, ordenada por
`created_at DESC, id ASC`, e consulta 24 itens mais uma linha para detectar a
proxima pagina. Uma janela de ate 10 lotes pede no maximo 241 linhas por
consulta server-only; linhas invalidas podem acionar refill limitado por cursor,
sem ultrapassar o teto interno. O limite nunca vem diretamente da URL. O botao
"Carregar mais" possui uma fronteira client pequena para acrescentar o proximo
lote sem recarregar a pagina. A Server Action valida o href e executa a
consulta server-only; sem JavaScript, o mesmo elemento continua sendo um link
normal. Nao ha consulta ao abrir o sheet. A busca usa a RPC de full-text search com
`title` em peso maior e `ai_copy` em peso menor. `ai_copy` nunca e selecionado
nem enviado para os cards.

As consultas publicas usam Cache Components com `stale = 60`, `revalidate =
300` e `expire = 900`, alem de tags por catalogo, departamento, folha, busca e
produto. A invalidacao de tags ocorre somente depois de escrita administrativa
confirmada; falha nessa etapa retorna erro temporario para permitir retry
idempotente.

O redirect `/r/[productId]` consulta o mesmo contrato publico, responde `302`
com `Cache-Control: no-store` e registra somente `record_click` com a chave
estreita de tracking. O tracking e fail-open: uma falha nunca impede a oferta.
Nao ha Pixel, CAPI, service role ou chave administrativa nesse caminho.

O sheet, rail e taxonomia local abrem sem fetch; a consulta ocorre somente
quando a listagem ou a busca e carregada. Esta etapa nao executa backfill nem
escrita no Supabase.

## Migration de performance e diagnostico

Antes de aplicar a migration de performance, executar manualmente o diagnostico
somente-leitura em `supabase/diagnostics/20260813_catalog_pre_migration_readonly.sql`.
Depois da aplicacao autorizada, executar
`supabase/diagnostics/20260813_catalog_post_migration_readonly.sql` para
confirmar a coluna gerada, grants, RPCs, hosts e planos `EXPLAIN`.

A migration aplicada e versionada localmente e
`supabase/migrations/20260813000000_add_affiliate_catalog_search_and_public_access.sql`.
Ela cria indices parciais, `search_document`, RPCs de listagem/busca/detalhe e
grants minimos em uma unidade revisavel. As RPCs usam `CREATE OR REPLACE`, sem
`DROP FUNCTION`; uma assinatura
ou retorno incompatível faz a migration abortar. Nao executar DDL pelo app e
qualquer nova alteracao deve ser criada em migration aditiva separada e
revisada antes de aplicacao manual. Nao executar DDL pelo app.

Checklist de performance:

- verificar o plano de execucao e os indices existentes para os filtros de
  publicacao, `department_slug`, `leaf_slug` e a ordenacao por `created_at` e
  `id`;
- criar migration aditiva de indice somente se a verificacao demonstrar
  necessidade, sem aplicar nada automaticamente em producao;
- definir a politica de cache e revalidacao do Next antes de conectar a UI;
- manter o carregamento da listagem no servidor, sem fetch client-side para a
  consulta inicial;
- manter `loading.tsx` e `error.tsx` nos segmentos de departamento, folha, busca
  e PDP, evitando uma interface sem feedback durante a navegacao;
- manter o sheet e a taxonomia local instantaneos, sem consulta ao Supabase ao
  abrir o menu;
- manter a paginacao keyset de 24 itens e o cursor composto;
- manter cache e revalidacao alinhados ao perfil `affiliateCatalog`;
- confirmar que o sheet nao dispara consulta ao Supabase.

Essa migration remove o SELECT amplo de `PUBLIC`, `anon` e `authenticated` e
concede somente colunas de catalogo. `ai_copy`, `embedding`, `sales`, o link
afiliado e os campos de classificacao nao sao acessiveis por SELECT direto na
tabela. As tres RPCs possuem `SECURITY DEFINER` somente porque precisam aplicar
o filtro de publicacao sobre colunas protegidas, usam `search_path` restrito a
`pg_catalog`, SQL estatico, retorno explicito e grants de execute limitados a
`anon` e `authenticated`. O diagnostico pos-migration confirmou owner
confiavel, limites e configuracao efetiva das funcoes.

O redirect usa `SUPABASE_CLICK_KEY` somente para `record_click`. O tracking e
fail-open e falhas retornadas pelo Supabase sao registradas sem chaves,
destinos ou dados sensiveis.

O catalogo usa navegacao progressiva: `pagina` aceita no maximo 10 lotes de 24
produtos. Ao atingir 240 cards, a proxima janela comeca por um cursor opaco.
O botao de carregar mais e a unica fronteira client da grade: ele chama uma
Server Action validada, que consulta no servidor e devolve somente DTOs
publicos; o link continua funcionando como fallback sem JavaScript. Nenhuma
credencial ou dado administrativo e hidratado no navegador.
