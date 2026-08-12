# Security Guidelines

## Principios

- Fail closed para configuracao sensivel.
- Segredos nunca usam prefixo `NEXT_PUBLIC_`.
- Route handlers validam input como endpoints publicos.
- Redirect de afiliado deve validar dominio permitido antes de 302.
- Tracking interno deve falhar aberto: se tracking falhar, o usuario ainda deve chegar na oferta valida.
- Produtos afiliados devem ter disclosure claro no footer e perto de CTAs de compra.
- Amazon sem Creators API ou Product Advertising API nao deve exibir preco proprio na vitrine.
- Precos exibidos devem ser tratados como sujeitos a alteracao pelo marketplace.

## Compliance afiliado

As regras operacionais de disclosure, footer e Amazon estao em
`affiliate-compliance-footer.md`.

Resumo obrigatorio:

- footer com aviso de afiliado visivel;
- CTAs deixam claro que a compra acontece no marketplace parceiro;
- links Amazon podem existir, mas sem preco manual/congelado enquanto nao houver
  API oficial aprovada e integrada;
- `/r` deve continuar sendo acionado por clique consciente do usuario.

## Segredos

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- futuros tokens de API
- futuros tokens de CAPI, se forem adicionados depois

Publicos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Fora do V1

Pixel e CAPI nao entram nesta etapa. Nao criar env vars Meta ate pedido explicito.
