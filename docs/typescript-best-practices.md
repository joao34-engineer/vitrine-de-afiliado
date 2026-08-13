# TypeScript Best Practices

Baseado nas docs oficiais:

- https://react.dev/learn/typescript
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html

## Regras

- Zero `any`.
- Zero `@ts-ignore` e zero `@ts-expect-error`.
- Evitar non-null assertion (`!`); usar narrowing, guards e fallback explicito.
- Dados externos entram como `unknown` e sao estreitados antes do uso.
- Objetos de config/taxonomia devem usar `as const` e `satisfies`.
- Tipos gerados do Supabase sao SoT do banco quando o schema existir.
- Mudanca de schema exige regenerar `src/types/database.types.ts`.

## Contratos e narrowing

- Dados de APIs, Supabase, query params, JSON e CSV entram como `unknown` e
  devem passar por type guard, schema ou parser antes do uso.
- Prefira tipos derivados de valores canonicos (`typeof values[number]`) e
  objetos `as const satisfies` para manter literais e validar a estrutura.
- Erros de dominio devem usar classes ou discriminated unions com codigo estavel;
  nao compare mensagens de erro para tomar decisoes.
- Use `readonly` em contratos que atravessam a fronteira server/client ou que nao
  devem ser mutados pelo consumidor.
- Evite casts. Quando um cast for inevitavel na borda de uma biblioteca, mantenha
  a validacao imediatamente proxima e documente a razao.

## TSConfig

O projeto deve manter:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

`noUncheckedIndexedAccess` e `forceConsistentCasingInFileNames` ainda nao fazem
parte do baseline atual. Antes de habilita-los, avaliar o impacto no codigo e
adicionar uma mudanca tecnica separada com correcoes e testes; nao mascarar erros
com assertions.

## Taxonomia

`department_slug` e `leaf_slug` devem ser tipos derivados da taxonomia local, nao strings soltas espalhadas pelo codigo.
