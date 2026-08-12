# Arquitetura - Affiliate Vitrine

Este app usa Next.js App Router com FSD leve, seguindo o padrao ja adotado no ecossistema e as referencias oficiais de estrutura do Next.js.

## Estrutura

```text
affiliate-vitrine/
├── docs/
│   └── execution-doc/
├── public/
└── src/
    ├── app/
    ├── views/
    ├── widgets/
    ├── features/
    ├── entities/
    ├── shared/
    ├── lib/
    └── types/
```

## Responsabilidades

- `src/app/`: roteamento Next.js, layouts, metadata, loading/error/not-found e route handlers.
- `src/views/`: composicao de telas (`home`, `leaf-listing`, `product-detail`).
- `src/widgets/`: blocos grandes reutilizados em mais de uma view.
- `src/features/`: interacoes reutilizadas, como busca ou department sheet.
- `src/entities/`: modelos reutilizados, como produto afiliado.
- `src/shared/`: UI generica, libs puras, configs e clientes sem regra de negocio.
- `src/lib/`: infra compat quando necessario; para codigo novo, preferir `shared`.
- `src/types/`: tipos publicos e tipos gerados.

## Regras FSD

- Importar apenas de camadas inferiores.
- Slices expostos por `index.ts`.
- Sem import entre slices da mesma camada.
- Nao criar entity/feature por antecipacao; paginas podem manter codigo local ate existir reuso real.
- `src/shared` nao recebe regra de negocio.

## Rotas Alvo

- `/`
- `/folha/[leafSlug]`
- `/p/[slug]`
- `/r/[code]`

Essas rotas serao implementadas nas fases seguintes. Nesta fundacao, o objetivo e deixar a estrutura e os contratos documentados.
