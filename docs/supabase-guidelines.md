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

## Fora do V1

- Schema real de producao.
- Migracoes destrutivas.
- Pixel/CAPI.
- Sync com Shopify.
