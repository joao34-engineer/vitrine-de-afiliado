# Supabase Guidelines

Supabase sera o SoT da vitrine afiliada. O schema completo fica para fase posterior.

## Regras

- Nao apagar, zerar ou recriar tabelas de producao.
- Mudancas de schema devem ser aditivas e revisaveis.
- Usar RLS para leitura publica apenas de produtos ativos.
- Service role e sempre server-only.
- Cliente anon/publishable pode ler catalogo publico.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no client.
- Tipos do Supabase devem ser gerados e versionados quando o schema existir.

## Env Vars Planejadas

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Configuracao Local e Vercel

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL do Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave `anon public` ou `Publishable`, segura para browser quando RLS estiver correta.
- `SUPABASE_SERVICE_ROLE_KEY`: chave `service_role`, somente server-side e nunca com prefixo `NEXT_PUBLIC_`.

Use `.env.example` como template revisavel. O arquivo real `.env.local` deve ficar fora do git.
No Vercel, configure as mesmas chaves em Environment Variables para os ambientes desejados.

O contrato tipado fica em `src/shared/config/env/`:

- `index.ts` exporta somente variaveis publicas.
- `index.server.ts` exporta variaveis server-only e importa `server-only`.

## Fora do V1

- Schema real de producao.
- Migracoes destrutivas.
- Pixel/CAPI.
- Sync com Shopify.
