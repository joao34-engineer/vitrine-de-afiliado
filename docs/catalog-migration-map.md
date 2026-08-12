# Catalog Migration Map - my-collection-page -> affiliate-vitrine

Este documento define como reaproveitar os produtos ja existentes no Supabase
do `my-collection-page` e classifica-los para a nova taxonomia da
`affiliate-vitrine` de forma automatizada, aditiva e revisavel.

## Objetivo

Usar a tabela `public.products` ja existente no Supabase como base de dados
inicial da vitrine afiliada, preservando o campo legado `category` e
preenchendo os novos campos:

- `department_slug`
- `subcategory_slug`
- `leaf_slug`

## Fonte atual do catalogo

O catalogo atual vem do `my-collection-page`, cuja tabela `public.products`
possui hoje, entre outros, os campos:

- `product_id_shopee`
- `title`
- `ai_copy`
- `category`
- `is_active`
- `sales`
- `created_at`

Categorias canonicas atuais da coluna `category`:

- `Casa & Decoracao`
- `Cozinha & Eletro`
- `Ferramentas & Bricolagem`
- `Eletronicos`
- `Moda & Beleza`
- `Esportes & Academia`
- `Bebe & Infantil`
- `Pet Shop`
- `Livros & Papelaria`
- `Automotivos`
- `Achadinhos Gerais`

`Todos` e apenas estado de UI e nao deve ser persistido como categoria de
produto.

## Taxonomia alvo da affiliate-vitrine

Departamentos de navegacao do V1:

- `home`
- `homens`
- `mulheres`
- `infantil`
- `casa`
- `cozinha`
- `tech`
- `beleza`
- `esportes`
- `pet`
- `mais`

Subcategorias visiveis quando aplicavel:

- `roupas`
- `calcados`
- `acessorios`
- `cuidados`
- `organizacao`
- `utensilios`
- `eletroportateis`
- `audio`
- `gaming`
- `papelaria`
- `ferramentas`
- `automotivo`

Folhas iniciais recomendadas para o backfill:

- `roupas-masculinas`
- `calcados-masculinos`
- `acessorios-masculinos`
- `roupas-femininas`
- `calcados-femininos`
- `acessorios-femininos`
- `beleza-e-cuidados`
- `bebe`
- `infantil`
- `decoracao`
- `organizacao`
- `utilidades-domesticas`
- `utensilios-de-cozinha`
- `eletroportateis`
- `audio`
- `eletronicos`
- `games-e-pc`
- `fitness`
- `esportes-ao-ar-livre`
- `pets`
- `papelaria`
- `ferramentas`
- `automotivo`
- `achadinhos-gerais`

## Regra de ouro da migracao

Cada produto recebe um unico caminho principal de navegacao:

`department_slug` -> `subcategory_slug` -> `leaf_slug`

Nao duplicar o mesmo produto em varios departamentos so porque ele poderia
servir para mais de um publico.

## Mapa base: category legado -> destino candidato

| `category` legado | `department_slug` base | Observacao |
| --- | --- | --- |
| `Casa & Decoracao` | `casa` | dividir por titulo entre decoracao, organizacao e utilidades |
| `Cozinha & Eletro` | `cozinha` | dividir por titulo entre utensilios e eletroportateis |
| `Ferramentas & Bricolagem` | `mais` | cair em `ferramentas` |
| `Eletronicos` | `tech` | dividir por titulo entre audio, eletronicos e games-e-pc |
| `Moda & Beleza` | `homens`/`mulheres`/`beleza` | exige segregacao por regras |
| `Esportes & Academia` | `esportes` | dividir por titulo entre fitness e esportes-ao-ar-livre |
| `Bebe & Infantil` | `infantil` | dividir por titulo entre bebe e infantil |
| `Pet Shop` | `pet` | cair em `pets` |
| `Livros & Papelaria` | `mais` | cair em `papelaria` |
| `Automotivos` | `mais` | cair em `automotivo` |
| `Achadinhos Gerais` | `mais` | fallback controlado em `achadinhos-gerais` |

## Mapa operacional por categoria

### 1. Casa & Decoracao

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| titulo menciona `organizador`, `caixa`, `gaveta`, `closet`, `cabide`, `prateleira` | `casa` | `organizacao` | `organizacao` |
| titulo menciona `almofada`, `quadro`, `tapete`, `vela`, `vaso`, `luminaria decorativa` | `casa` | `organizacao` | `decoracao` |
| demais casos | `casa` | `organizacao` | `utilidades-domesticas` |

### 2. Cozinha & Eletro

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| titulo menciona `air fryer`, `cafeteira`, `liquidificador`, `mixer`, `grill`, `chaleira`, `sanduicheira` | `cozinha` | `eletroportateis` | `eletroportateis` |
| demais casos | `cozinha` | `utensilios` | `utensilios-de-cozinha` |

### 3. Ferramentas & Bricolagem

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| qualquer produto ativo | `mais` | `ferramentas` | `ferramentas` |

### 4. Eletronicos

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| titulo menciona `fone`, `headset`, `caixa de som`, `earbud`, `microfone` | `tech` | `audio` | `audio` |
| titulo menciona `mouse gamer`, `teclado gamer`, `monitor`, `cadeira gamer`, `console`, `controle` | `tech` | `gaming` | `games-e-pc` |
| demais casos | `tech` | `audio` | `eletronicos` |

### 5. Moda & Beleza

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| titulo menciona `perfume`, `serum`, `maquiagem`, `skincare`, `creme`, `secador`, `chapinha`, `escova secadora` | `beleza` | `cuidados` | `beleza-e-cuidados` |
| titulo menciona `masculino`, `homem`, `masc` e tambem `tenis`, `sapato`, `bota`, `chinelo`, `sandalia` | `homens` | `calcados` | `calcados-masculinos` |
| titulo menciona `masculino`, `homem`, `masc` e tambem `relogio`, `bone`, `oculos`, `carteira`, `cinto`, `mochila`, `bolsa` | `homens` | `acessorios` | `acessorios-masculinos` |
| titulo menciona `masculino`, `homem`, `masc` | `homens` | `roupas` | `roupas-masculinas` |
| titulo menciona `feminino`, `mulher`, `fem` e tambem `tenis`, `sapato`, `bota`, `chinelo`, `sandalia`, `salto` | `mulheres` | `calcados` | `calcados-femininos` |
| titulo menciona `feminino`, `mulher`, `fem` e tambem `bolsa`, `oculos`, `relogio`, `pulseira`, `colar`, `brinco`, `mochila` | `mulheres` | `acessorios` | `acessorios-femininos` |
| titulo menciona `feminino`, `mulher`, `fem`, `vestido`, `blusa`, `camiseta`, `saia`, `calca`, `short`, `conjunto`, `lingerie`, `biquini` | `mulheres` | `roupas` | `roupas-femininas` |
| titulo nao traz marcador de genero e parece moda vestivel | `REVIEW` | `REVIEW` | `REVIEW` |
| titulo nao traz marcador de genero e parece beleza | `beleza` | `cuidados` | `beleza-e-cuidados` |

### 6. Esportes & Academia

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| titulo menciona `halter`, `elastico`, `yoga`, `pilates`, `academia`, `treino`, `suporte flexao` | `esportes` | `fitness` | `fitness` |
| demais casos | `esportes` | `fitness` | `esportes-ao-ar-livre` |

### 7. Bebe & Infantil

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| titulo menciona `bebe`, `mamadeira`, `chupeta`, `maternidade`, `recem nascido`, `berco` | `infantil` | `cuidados` | `bebe` |
| demais casos | `infantil` | `roupas` | `infantil` |

### 8. Pet Shop

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| qualquer produto ativo | `pet` | `cuidados` | `pets` |

### 9. Livros & Papelaria

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| qualquer produto ativo | `mais` | `papelaria` | `papelaria` |

### 10. Automotivos

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| qualquer produto ativo | `mais` | `automotivo` | `automotivo` |

### 11. Achadinhos Gerais

| Condicao | `department_slug` | `subcategory_slug` | `leaf_slug` |
| --- | --- | --- | --- |
| titulo permite regra forte para outro departamento | usar regra do departamento detectado | usar regra do departamento detectado | usar regra do departamento detectado |
| caso ambiguo ou sem sinal suficiente | `mais` | `automotivo` | `achadinhos-gerais` |

## Casos que devem parar em revisao humana

Enviar para revisao em vez de publicar automaticamente quando:

- `Moda & Beleza` nao trouxer marcador confiavel de genero e tambem nao parecer
  beleza/cuidado.
- `Eletronicos` trouxer sinais fortes de mais de uma folha ao mesmo tempo.
- `Achadinhos Gerais` nao puder ser redistribuido por regra forte.
- O titulo estiver curto demais, truncado ou generico.
- Houver conflito entre `category` legado e palavras-chave do titulo.

## Pipeline automatizado recomendado

### Etapa 1 - Preparar schema

Adicionar de forma aditiva na tabela `products`:

- `department_slug text null`
- `subcategory_slug text null`
- `leaf_slug text null`
- `classification_source text null`
- `classification_confidence numeric null`
- `classification_review_status text null`

Valores iniciais recomendados:

- `classification_source = 'legacy-backfill-v1'`
- `classification_review_status = 'auto'` ou `review`

### Etapa 2 - Backfill em lote

Para cada produto ativo:

1. Ler `category`, `title` e `ai_copy`.
2. Aplicar o mapa base por `category`.
3. Aplicar regras deterministicas de palavras-chave.
4. Quando houver match forte, preencher os slugs.
5. Quando houver ambiguidade, gravar `classification_review_status = 'review'`.
6. Nunca apagar nem sobrescrever `category`.

### Etapa 3 - Validacao

Antes de publicar na `affiliate-vitrine`:

1. Rejeitar produtos sem `department_slug` e `leaf_slug`.
2. Rejeitar slugs fora da taxonomia local.
3. Revisar todos os itens com `classification_review_status = 'review'`.
4. Revisar amostragem dos itens `auto` antes do go-live.

## Ordem de execucao recomendada

1. Criar a taxonomia local canonica da `affiliate-vitrine`.
2. Criar migration aditiva no Supabase do catalogo legado.
3. Rodar backfill automatico sobre `products`.
4. Exportar lista de itens `review`.
5. Corrigir os ambiguos.
6. Liberar a vitrine para consumir apenas produtos com slugs validos.

## O que este documento evita

- reescrever o catalogo do zero
- quebrar o `my-collection-page`
- depender de classificacao manual produto por produto
- publicar `Moda & Beleza` inteira como um saco unico
- usar `category` legado como contrato de navegacao da nova vitrine

## Decisao operacional

Na hora da execucao, a migracao deve ser feita de uma vez sobre a base ja
existente no Supabase do `my-collection-page`, com regras deterministicas,
backfill automatizado e fila de revisao apenas para os casos ambiguos.
