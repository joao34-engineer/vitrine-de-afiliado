# React e Next.js Best Practices

Baseado nas docs oficiais de Next.js App Router e React:

- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/getting-started/project-structure
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://react.dev/learn/typescript
- https://nextjs.org/docs/app/getting-started/fetching-data
- https://nextjs.org/docs/app/guides/migrating-to-cache-components
- https://react.dev/reference/react/Suspense

## Regras

- Usar App Router; `pages/` e proibido.
- `src/app/` contem rotas e arquivos especiais do Next.
- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts` e `route.ts` seguem convencoes oficiais.
- Componentes sao Server Components por padrao.
- Usar `'use client'` somente para estado, eventos, efeitos, APIs do navegador ou hooks client-only.
- Passar somente props serializaveis de Server para Client Components.
- Dados de Supabase devem ser buscados no servidor, nao por `useEffect` em componente client.
- Segredos ficam server-only; variaveis `NEXT_PUBLIC_*` sao publicas.
- Usar `server-only` em modulos que acessam service role, tokens ou credenciais.

## Server-first e streaming

- Server Components sao o padrao para rotas, views, grids e cards sem interacao.
- A fronteira `'use client'` deve ficar na menor folha que precisa de estado,
  evento ou API do navegador.
- Props server -> client devem ser serializaveis; nao passar funcoes, clients ou
  erros complexos.
- Use `loading.tsx` no segmento que aguarda dados e `error.tsx` para falhas nao
  recuperaveis. Use `notFound()` para slugs que nao existem.
- Use Suspense quando o shell puder aparecer antes dos dados sem causar layout
  shift. Nao esconda uma listagem ja visivel durante uma troca nao urgente.
- Dados de catalogo nao devem ser buscados por `useEffect` no browser.

## Cache no Next.js 16

- Cache, revalidacao e tags devem ser decididos por consulta/rota, nao por
  defaults espalhados.
- Antes de habilitar Cache Components, avaliar `use cache`, `cacheLife`,
  `revalidateTag` e `revalidatePath` na versao instalada.
- Nao introduzir `staleTimes`, `dynamic`, `fetchCache` ou outras opcoes
  experimentais sem decisao documentada e validacao de build.
- Nao usar estado mutavel compartilhado em modulo server para cache de request.

## Padrao de Rota

Rotas em `src/app/` devem ser pequenas e delegar para `src/views/`.

```tsx
import { HomeView } from "@/views/home";

export default function Page() {
  return <HomeView />;
}
```

## Anti-padroes

- Fetch client-side para catalogo inicial.
- Widget inteiro com `'use client'` por causa de um botao interno.
- `console.log` de debug no navegador em producao.
- Expor service role, CAPI token ou qualquer segredo no client.
- Misturar codigo DS/Shopify neste app.
- Usar `select('*')` em consultas de catalogo.
- Implementar `OFFSET` para paginas profundas quando cursor composto for aplicavel.
- Adicionar uma configuracao de cache sem registrar TTL, invalidacao e comportamento
  de erro.
