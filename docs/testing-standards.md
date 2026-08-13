# Affiliate Vitrine - Testing Standards

Os testes devem provar contratos e comportamentos observaveis sem depender de
Supabase de producao. A suite usa Vitest e os testes devem permanecer deterministas.

## Piramide local

- **Unitario:** taxonomia, slugs, classificacao, validadores, mappers, formatacao
  e funcoes de paginação.
- **Contrato de API:** query builder Supabase simulado, colunas selecionadas,
  filtros, cursor, ordenacao e propagacao de erros.
- **Componente/rota:** render server-side, `loading.tsx`, `error.tsx`,
  `not-found.tsx` e props serializaveis quando essas telas existirem.
- **E2E:** somente quando um fluxo publico completo existir; nunca usar para
  substituir testes de dominio ou de contrato.

## Regras

- Nao conectar testes unitarios ou de contrato ao Supabase real.
- Mockar o client publico e verificar que o client server-only nao foi importado
  pela leitura publica.
- Testar dados externos como `unknown`, incluindo resposta nula, objeto malformado
  e linhas com campos invalidos.
- Testar tanto o caminho feliz quanto falhas explicitas; erro de consulta nao pode
  virar lista vazia silenciosamente.
- Para paginação, testar primeira pagina, cursor valido, cursor invalido,
  `limit + 1`, `hasNextPage` e ordenacao estavel.
- Para filtros, testar departamento, folha, par invalido e ausencia de consulta
  quando a entrada e rejeitada.
- Para componentes client, testar apenas interacao que exige navegador: abertura
  do sheet, navegacao, pending/loading e acessibilidade basica.

## Comandos de aceite

```text
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test
npm.cmd run build
git diff --check
```

Uma mudanca que toca Supabase tambem deve ser validada com uma revisao SQL
revisavel, sem executar migration em producao durante os testes locais.
