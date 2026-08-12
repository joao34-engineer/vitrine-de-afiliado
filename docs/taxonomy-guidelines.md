# Taxonomy Guidelines

A vitrine afiliada usa taxonomia fechada e simplificada por folhas.

## Contrato

- Produto publicado deve ter `department_slug` e `leaf_slug`.
- `category` em texto livre nao e contrato de navegacao.
- O sheet de departamentos deve abrir com dados locais, sem fetch.
- Fetch de rede acontece ao escolher uma folha e carregar a listagem.

## Compatibilidade com o catalogo existente

O campo legado `category` da tabela `products` deve ser preservado durante a
migracao. Ele continua atendendo o `my-collection-page` e classificacoes
anteriores, mas nao sera usado como fonte principal de navegacao nesta vitrine.

A nova vitrine usara uma taxonomia estruturada e aditiva:

| Campo | Papel | Exemplo |
| --- | --- | --- |
| `category` | legado/compatibilidade | `Moda & Beleza` |
| `department_slug` | departamento exibido no rail e no sheet | `homens` |
| `leaf_slug` | folha que abre a listing | `roupas-masculinas` |
| `subcategory_slug` | refinamento dentro da listing, quando aplicavel | `roupas` |

`department_slug` e `leaf_slug` sao obrigatorios para publicar um produto.
`subcategory_slug` e opcional na primeira versao, mas deve ser preenchido
quando o departamento possuir refinamentos visiveis, como `roupas`,
`calcados` e `acessorios` em Homens ou Mulheres.

Essa estrategia evita uma reescrita do sistema atual: `category` nao e apagado
nem renomeado, e as consultas antigas continuam funcionando enquanto a nova
listing passa a consultar a taxonomia da vitrine. A substituicao e gradual:
primeiro os dados recebem a nova classificacao; depois as telas novas usam os
slugs; por fim, somente os consumidores antigos que ainda forem necessarios
continuam lendo `category`.

O mapa operacional dessa transicao, partindo do Supabase ja usado pelo
`my-collection-page`, esta em `catalog-migration-map.md`. Ele define como as
categorias legadas devem virar `department_slug`, `subcategory_slug` e
`leaf_slug` de forma automatizada e revisavel.

## Estrutura Canonica

Cada departamento/folha deve declarar:

- `department_slug`
- `department_label`
- `leaf_slug`
- `leaf_label`
- descricao curta
- palavras de inclusao
- palavras de exclusao
- exemplos

Essa estrutura sera criada agora, junto com a fundacao da vitrine, e nao
deixada para uma etapa posterior. O schema deve ser aditivo e revisavel: nao
renomear, apagar ou substituir a coluna legada `category`.

## Classificacao

V1 deve favorecer:

- regras deterministicas
- exemplos aprovados
- revisao humana nos casos ambiguos
- backfill automatizado sobre a base legada antes da publicacao

## Migracao dos produtos existentes

O preenchimento inicial deve ser feito de forma aditiva e revisavel:

1. Mapear os valores atuais de `category`, titulo e descricao para um
   `department_slug`, `subcategory_slug` e `leaf_slug` candidatos.
2. Revisar manualmente os produtos ambiguos antes de publica-los.
3. Gravar os slugs validos no produto sem alterar o `category` legado.
4. Validar que todo produto publicado possui departamento e folha existentes
   na taxonomia local.
5. Fazer novos produtos entrarem ja classificados antes de ficarem visiveis.

Para a execucao inicial, a fonte de dados e a propria tabela `products` do
Supabase que hoje atende o `my-collection-page`. A migracao nao cria um
catalogo paralelo: ela acrescenta os novos slugs na mesma base, preserva
`category` e permite que o backfill seja rodado em lote com revisao apenas dos
casos ambiguos.

Um produto deve ter um caminho principal de navegacao. Por exemplo, um
relogio masculino recebe `homens` -> `acessorios` -> `relogios`; ele nao deve
ser duplicado em varios departamentos apenas porque pode ser usado por
publicos diferentes. Kits ou produtos mistos devem receber o caminho que
melhor representa a oferta principal, com revisao humana quando houver duvida.

Embeddings, kNN ou centroides podem entrar depois, mas nao sao o coracao do V1.
