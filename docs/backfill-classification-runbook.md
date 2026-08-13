# Backfill Classification Runbook

Este runbook descreve a Fase 1B da `affiliate-vitrine`: classificacao local,
deterministica e revisavel de produtos legados.

## Escopo

- O pipeline roda somente em memoria.
- Nao conecta no Supabase.
- Nao aplica migration.
- Nao atualiza `public.products`.
- Nao publica catalogo na vitrine.

## Entrada

Cada produto legado precisa fornecer:

```ts
{
  id: string;
  title: string;
  aiCopy: string | null;
  category: string | null;
  isActive: boolean;
}
```

`category` e preservada como dado legado, mas nao e fonte da verdade. A base
antiga pode ter produtos fora da pill correta; por isso, a classificacao usa
`title + aiCopy` como sinal principal.

## Saida

Cada resultado retorna:

```ts
{
  status: "auto" | "review";
  departmentSlug: DepartmentSlug | null;
  subcategorySlug: SubcategorySlug | null;
  leafSlug: LeafSlug | null;
  classificationSource: "legacy-backfill-v1";
  classificationConfidence: number;
  reasons: readonly string[];
}
```

## Regra Operacional

- `auto`: folha vencedora clara por texto forte.
- `review`: empate, texto fraco, texto generico ou conflito ambiguo.
- `legacy-category-mismatch`: a category antiga aponta para outra area, mas o
  texto tem sinal forte para a folha escolhida.
- `legacy-category-missing` ou `legacy-category-unknown`: a category nao ajuda,
  mas texto forte ainda pode classificar.
- `inactive-product`: o produto foi classificado para auditoria, mas a fase nao
  publica nada.

## Como Revisar

1. Rode o classificador em memoria sobre uma amostra exportada.
2. Revise todos os itens com `status = "review"`.
3. Revise uma amostragem dos itens `auto`, priorizando resultados com
   `legacy-category-mismatch`.
4. Somente depois de revisao humana, um backfill futuro pode gravar
   `department_slug`, `subcategory_slug` e `leaf_slug`.

## Garantias

- `category` nao e apagada, renomeada ou usada como slug de navegacao.
- O classificador sempre retorna `classificationSource = "legacy-backfill-v1"`.
- Produtos so ficam prontos para publicacao futura quando tiverem
  `departmentSlug` e `leafSlug` validos.

## Scripts locais

Os scripts operacionais sao TypeScript com ESM e usam Node.js 24 LTS. Eles
geram apenas arquivos locais revisaveis e nao executam migration nem conectam
ao Supabase.

Para consolidar a classificacao aprovada:

```text
npm.cmd run classify:consolidate
```

Para gerar o arquivo SQL revisavel do backfill:

```text
npm.cmd run classify:backfill
```

O runtime esperado e Node.js `24.19.0` ou outra versao `24.x` compativel,
registrado em `.nvmrc` e no campo `engines` do `package.json`. Node.js 26
continua classificado como Current, portanto nao e o runtime de producao
adotado nesta fase.
