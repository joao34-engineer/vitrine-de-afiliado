# Dept Rail Hairline Motion

Este documento registra o padrao de linha horizontal animada sob o department
rail implementado na `affiliate-vitrine`, usando a referencia visual do
`my-collection-page` sem importar seus contratos de loja.

## Objetivo

Adicionar uma hairline horizontal logo abaixo do dept rail para reforcar a
separacao do header durante o scroll, sem deixar uma borda fixa sempre visivel.

Comportamento desejado:

- no topo da pagina, header, busca e dept rail parecem um bloco unico;
- ao iniciar o scroll, a linha aparece suavemente abaixo do rail;
- quando o usuario volta para o topo e o navbar se reintegra ao lugar original,
  a linha some;
- o mesmo comportamento vale para mobile e desktop;
- o tema dark usa cor/token dark, nao a linha do light mode.

## Referencia no my-collection-page

Arquivos de origem:

- `my-collection-page/src/features/category-filter/ui/department-rail.tsx`
- `my-collection-page/src/features/category-filter/ui/department-rail-divider.tsx`
- `my-collection-page/src/shared/ui/scroll-reveal-hairline.tsx`
- `my-collection-page/src/shared/lib/gsap-client.ts`
- `my-collection-page/docs/theme-and-chrome.md`

Padrao atual:

- `DepartmentRail` e um Client Component dentro do `Navbar` sticky.
- A linha fica dentro do `nav`, com `position: absolute`, `bottom: 0`,
  `height: 1px` e `pointer-events: none`.
- A cor vem de token CSS: `--dept-divider`.
- A animacao usa `gsap` + `ScrollTrigger`.
- No topo, a linha inicia totalmente escondida (`autoAlpha: 0`); ela nao fica
  parcialmente visivel.
- O reveal completa por volta de `140px` de scroll.
- Em `prefers-reduced-motion: reduce`, a linha fica visivel e estatica, sem
  listener de scroll ou scrub.

## Contrato visual

### Light mode

| Elemento | Regra |
| --- | --- |
| `dept rail bg` | mesma cor do background/chrome da pagina |
| hairline | token claro de borda, visivel mas discreto |
| estado no topo | invisivel com motion normal; visivel e estatica em reduced motion |
| estado com scroll | `opacity: 1`, `scaleX: 1` |

### Dark mode

| Elemento | Regra |
| --- | --- |
| `dept rail bg` | mesma cor do background/chrome dark |
| hairline | token dark proprio, com contraste suficiente |
| estado no topo | invisivel com motion normal; visivel e estatica em reduced motion |
| estado com scroll | visivel sem parecer linha light colada no dark |

Token sugerido para dark: um tom proximo de `#35302A` ou o border dark vigente
do app. O valor final deve sair dos tokens reais da `affiliate-vitrine` quando
o CSS existir.

Os sublinhados dos itens do rail sao elementos estaticos independentes. A
hairline nao deve substituir, duplicar ou animar esses sublinhados.

## Contrato de interacao

| Situacao | Resultado |
| --- | --- |
| scroll `0px` | linha invisivel |
| scroll `1px` a `140px` | linha aparece com scrub |
| scroll acima de `140px` | linha fica visivel |
| voltar ao topo | linha some progressivamente |
| reduced motion | sem scrub; usar estado estatico definido no componente |

Configuracao recomendada:

```ts
const RAIL_LINE_REVEAL_END_PX = 140;

gsap.set(line, {
  autoAlpha: 0,
  scaleX: 0.92,
  transformOrigin: '50% 50%',
});

gsap.to(line, {
  autoAlpha: 1,
  scaleX: 1,
  ease: 'none',
  scrollTrigger: {
    start: 0,
    end: RAIL_LINE_REVEAL_END_PX,
    scrub: 0.4,
  },
});
```

## Estrutura recomendada na affiliate-vitrine

Implementacao atual:

```text
src/shared/lib/gsap-client.ts
src/shared/ui/scroll-reveal-hairline.tsx
src/features/department-navigation/ui/department-rail.tsx
src/features/department-navigation/ui/department-rail-divider.tsx
```

Responsabilidades:

| Modulo | Responsabilidade |
| --- | --- |
| `gsap-client.ts` | registrar `useGSAP` e `ScrollTrigger` uma vez |
| `scroll-reveal-hairline.tsx` | componente generico client-only da hairline |
| `department-rail-divider.tsx` | instancia da hairline com classes/tokens do dept rail |
| `department-rail.tsx` | render do rail e inclusao do divider como ultimo filho |

O divider nao deve fazer parte do public API da feature se for detalhe interno.

## Dependencias

Hoje a `affiliate-vitrine` possui `gsap` e `@gsap/react` no `package.json`;
esta fase deve usar essas dependencias somente no divider client-only.

Dependencias usadas:

- `gsap`
- `@gsap/react`

Depois rodar:

- `npm run lint`
- `npx tsc --noEmit`
- testes relevantes de UI

## CSS e tokens

Adicionar tokens equivalentes aos do `my-collection-page`:

```css
:root {
  --dept-divider: var(--divider);
}

html.dark {
  --dept-divider: var(--divider);
}
```

Se o dark ficar fraco demais, usar um token dedicado:

```css
html.dark {
  --dept-divider: #35302a;
}
```

Classe atual do divider:

```tsx
<div
  aria-hidden
  className="department-hairline"
/>
```

## Acessibilidade

- A linha deve ter `aria-hidden`.
- A linha nao pode receber foco nem interceptar clique.
- Respeitar `prefers-reduced-motion`.
- Em reduced motion, evitar scrub.
- O rail continua sendo o elemento navegavel; a hairline e apenas feedback
  visual do estado sticky.

## Testes esperados

Criar testes equivalentes aos do `my-collection-page`:

- renderiza `aria-hidden`;
- usa classe/token de divider;
- sem reduced motion inicia escondido e chama `gsap.to` com `scrollTrigger`;
- reduced motion nao abre scrub;
- dark e light usam o mesmo componente, variando apenas por token CSS;
- `DepartmentRail` mocka o divider no teste de navegacao para nao misturar
  interacao de rota com animacao.

## DoD

- Linha aparece somente durante/apos scroll.
- Linha some ao voltar ao topo.
- Mobile e desktop usam o mesmo contrato.
- Dark mode usa token dark.
- O dept rail continua com altura estavel, sem layout shift.
- O sheet/dropdown continua abrindo sem fetch e sem depender da animacao.
- `prefers-reduced-motion` funciona.
- Lint, TypeScript e testes relevantes passam.

## Fora de escopo

- Animar o proprio navbar.
- Criar nova regra de layout para o header.
- Trocar o comportamento do sheet/dropdown.
- Nao usar GSAP fora do divider client-only.
- Copiar a taxonomia DS/Shopify do `my-collection-page`.
