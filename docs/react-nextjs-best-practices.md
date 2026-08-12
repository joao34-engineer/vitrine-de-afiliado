# React e Next.js Best Practices

Baseado nas docs oficiais de Next.js App Router e React:

- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/getting-started/project-structure
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://react.dev/learn/typescript

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
