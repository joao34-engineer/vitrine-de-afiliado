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

## Taxonomia

`department_slug` e `leaf_slug` devem ser tipos derivados da taxonomia local, nao strings soltas espalhadas pelo codigo.
