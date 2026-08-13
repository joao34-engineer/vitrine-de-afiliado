# Affiliate Vitrine - Coding Standards

Este documento define convencoes de codigo para `affiliate-vitrine`. Ele complementa
`AGENTS.md`, `typescript-best-practices.md` e `react-nextjs-best-practices.md`.

## Organizacao

- Use arquivos em `kebab-case`.
- Use nomes de funcoes e variaveis em `camelCase`.
- Use tipos, componentes e classes em `PascalCase`.
- Use `UPPER_SNAKE_CASE` somente para constantes realmente imutaveis e estaveis.
- Nomeie arquivos pelo dominio ou comportamento: `product-card.tsx`,
  `list-public-affiliate-products.ts`.
- Evite arquivos genericos como `utils.ts`, `helpers.ts` ou `types.ts` quando um
  nome de dominio mais preciso for possivel.

## Fronteiras

- `src/app/` contem convencoes do App Router e deve delegar composicao para
  `src/views/` quando a tela existir.
- `src/entities/` contem contratos e regras do produto afiliado; nao contem UI
  especifica de uma unica pagina sem reuso real.
- `src/shared/` contem infraestrutura generica, clientes e configuracao; nao
  recebe regras de classificacao, navegacao ou publicacao do produto.
- Consultas externas ficam em `api/`; validacao e mapeamento de dominio ficam
  em `model/`.
- Exponha slices por `index.ts`. Use `index.server.ts` apenas quando necessario
  para preservar a fronteira server-only.
- Nao importe de camadas superiores nem atravesse slices por imports profundos.

## Funcoes e componentes

- Prefira early returns, funcoes puras e responsabilidades unicas.
- Evite funcoes com mais de 50 linhas; divida regras complexas em funcoes nomeadas.
- Mantenha `page.tsx` fino e sem consulta SQL inline.
- Separe apresentacao, consulta, validacao e transformacao de dados.
- Nao use estado client para dados que podem ser renderizados no servidor.
- Nao use `console.log` em producao; erros de servidor devem ser tratados pelo
  contrato de erro adequado e por logging estruturado quando houver infraestrutura.

## Dados externos e seguranca

- Trate respostas do Supabase, query params e payloads externos como `unknown`
  ate a validacao.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou credenciais server-only.
- Nunca execute DDL, backfill ou escrita administrativa a partir de uma consulta
  publica do catalogo.
- Preserve `category` legado, mas nao use essa coluna como contrato de navegacao.

## Imports e validacao

- Agrupe imports externos, aliases internos, relativos e estilos quando aplicavel.
- Prefira imports estaticamente analisaveis.
- Nao use `any`, `@ts-ignore`, `@ts-expect-error` ou non-null assertion para
  esconder uma falha de contrato.
- Antes de concluir uma mudanca, rode `npm.cmd run lint`, `npx.cmd tsc --noEmit`
  e os testes relevantes.

## Referencias

- [TypeScript best practices](./typescript-best-practices.md)
- [React e Next.js best practices](./react-nextjs-best-practices.md)
- [Arquitetura](./architecture.md)
- [FSD v2.1](../../.agents/skills/feature-sliced-design/SKILL.md)
