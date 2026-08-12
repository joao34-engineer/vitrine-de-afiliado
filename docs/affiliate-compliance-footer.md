# Affiliate Compliance and Footer Guidelines

Este documento alinha as exigencias de divulgacao de afiliados, uso de precos
e conteudo do footer da `affiliate-vitrine`.

## Fontes consultadas

- Amazon Associados BR - Politicas do Programa, atualizado em 14/04/2026:
  https://associados.amazon.com.br/help/operating/policies/
- Amazon Associados BR - Identificacao como associado:
  https://associados.amazon.com.br/help/node/topic/GPXFHVYZMTGPUMPE
- FTC - Endorsement Guides: affiliate disclosure:
  https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- CONAR - Codigo Brasileiro de Autorregulamentacao Publicitaria:
  https://www.conar.org.br/codigo/codigo.php
- Doc legado do ecossistema:
  `../docs/backlog/afiliado-compliance-google-amazon-shopee.md`

Politicas de afiliados mudam. Antes de ativar Amazon, Ads ou escalar budget,
revalidar as fontes oficiais na data da execucao.

## Decisao para a affiliate-vitrine

A vitrine deve ser clara para o usuario: a Salvat&Brand organiza ofertas e
pode receber comissao quando alguem compra pelos links. O marketplace continua
sendo o vendedor final, e o preco valido e o exibido no destino no momento da
compra.

## Disclosure geral

Exibir no footer e, quando houver CTA de compra, perto do CTA:

```text
A Salvat&Brand participa de programas de afiliados. Podemos receber comissao
por compras feitas pelos links, sem custo extra para voce.
```

Para CTAs ou links individuais, usar labels claros:

- `link patrocinado`
- `oferta afiliada`
- `ver oferta no marketplace`
- `ver oferta na Shopee`
- `ver oferta na Amazon`

Nao usar apenas `link afiliado` como unica explicacao, porque parte dos
usuarios pode nao entender que existe comissao.

## Amazon sem API oficial

Enquanto nao houver Creators API ou Product Advertising API aprovada e integrada:

- Produtos Amazon podem aparecer na vitrine.
- Cards, listings, PDPs, busca, destaques e copy editorial nao devem exibir
  preco Amazon manual ou congelado.
- CTA Amazon deve levar o usuario para conferir preco, prazo e disponibilidade
  diretamente na Amazon.
- Nao criar historico, alerta, comparador ou monitor de preco Amazon.
- Nao exibir estrelas, avaliacoes, imagens, textos ou dados vindos da Amazon
  fora do que for permitido por link/ferramenta oficial.

Copy recomendada para produtos Amazon sem API:

```text
Confira preco e disponibilidade na Amazon.
```

Se no futuro a API oficial for integrada, todo preco Amazon exibido precisa:

- vir da API ou de link/bloco servido pela propria Amazon;
- mostrar carimbo de data/hora quando exigido;
- apresentar aviso de que preco e disponibilidade podem mudar;
- usar o preco da Amazon no momento da compra como fonte final.

Texto exigido pela Amazon para o site quando o programa estiver ativo:

```text
Como associado da Amazon, eu ganho com compras qualificadas.
```

Esse texto deve aparecer de forma clara no footer ou em pagina de transparencia
quando houver produtos ou links Amazon.

## Shopee e outros marketplaces

Para Shopee, os documentos internos ja tratam preco como dado permitido via API
ou ingestao do fluxo atual, mas a UI deve evitar promessa enganosa. Portanto:

- preco Shopee pode aparecer quando vier do pipeline aprovado;
- nao prometer `menor preco`, `preco garantido` ou `oferta valida ate` sem dado
  verificavel;
- manter CTA explicito para o marketplace;
- usar `/p` como pagina de contexto e `/r` apenas depois do clique consciente.

Para outros marketplaces, aplicar a mesma regra conservadora ate existir
politica especifica documentada.

## Footer V1

O footer deve ter quatro blocos:

| Bloco | Conteudo |
| --- | --- |
| Marca | Logo circular, `salvat&brand`, frase curta sobre curadoria de ofertas |
| Comunidade | Link para grupo WhatsApp, Instagram e contato quando existir |
| Navegacao | `Como funciona`, `Transparencia`, `Departamentos`, `Ofertas recentes` |
| Afiliados | Disclosure geral, aviso de preco e Amazon Associate quando aplicavel |

Texto recomendado:

```text
Ofertas escolhidas por curadoria. A compra acontece no marketplace parceiro.
Precos, estoque e condicoes podem mudar sem aviso.
```

Quando houver Amazon:

```text
Produtos Amazon sem API oficial devem mostrar o preco apenas na Amazon.
```

## Figma

O footer no Figma deve refletir o contrato acima:

- desktop: footer em faixa horizontal com quatro colunas;
- mobile: footer em blocos empilhados;
- disclosure legivel, sem esconder em microtexto;
- links sociais e `Como funciona` visiveis;
- sem logos de marketplace no chrome principal;
- sem promessa de preco garantido.

## DoD

- Footer existe nos pares light/dark, mobile/desktop.
- Disclosure geral aparece no footer.
- Link WhatsApp e Instagram estao previstos.
- Existe entrada `Como funciona`.
- Amazon sem API nao exibe preco proprio.
- Documentos de execucao apontam para este guideline.
