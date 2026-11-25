# Nova página de pedido: direta, rápida e com preços novos

**Data:** 2026-11-25 · **Status:** aprovado em conversa, aguardando revisão do documento · **Branch:** `feat/pagina-pedido`

## Contexto

Quase todo cliente da Sálvia chega pelo Instagram, e quem convence é o próprio conteúdo do Instagram. Hoje a pessoa passa pela landing (`index.html`) antes de chegar ao pedido (`pedido.html`), e a landing agrega pouco. A direção agora é a página de pedido ser a entrada direta. Esta entrega melhora essa página. **A decisão sobre a landing (sai do ar, vira `/sobre` ou continua por causa do Google) fica para depois da validação**, fora deste escopo.

Problemas da página atual:

- **Lenta para abrir no celular.** React e ReactDOM vêm em versões de desenvolvimento, o Babel compila o código dentro do celular do cliente e o Tailwind vem pelo "play CDN". São cerca de 2 MB de scripts antes de aparecer qualquer coisa (estimativa, não medido).
- **4 telas por sabor:** categoria → proteína → 2 acompanhamentos → quantidade. Um pedido de 20 marmitas com 6 sabores exige uns 24 toques só de navegação.
- **O nome é pedido antes** de o cliente ver qualquer prato.
- **Nenhum incentivo** para chegar à próxima faixa de preço.
- **O carrinho se perde** quando o navegador do Instagram recarrega a página.

## Preços novos (fonte da verdade)

O preço por unidade é definido pela **quantidade total do pedido**, somando todos os sabores. Os preços entram em vigor na publicação, sem lógica de data.

| Total do pedido | Preço/un | Referência |
| --- | --- | --- |
| 1 a 4 | R$ 31,00 | 1 = R$ 31,00 |
| 5 a 9 | R$ 29,00 | 5 = R$ 145,00 · 9 = R$ 261,00 |
| 10 a 14 | R$ 26,00 | 10 = R$ 260,00 |
| 15 a 19 | R$ 25,50 | 15 = R$ 382,50 |
| 20 ou mais | R$ 25,00 | 20 = R$ 500,00 |

A passagem de 9 para 10 é **a única em que o total cai** (R$ 261,00 → R$ 260,00). Nas outras, o total sobe e o preço por unidade cai.

O mínimo de 2 unidades por sabor continua valendo.

## Cardápio

Os nomes seguem a grafia atual, com só a primeira letra maiúscula.

**Carnes** (com 2 acompanhamentos): Carne moída · Carne desfiada · Picadinho · Almôndegas ao molho · **Strogonoff de carne fit** (novo) · **Músculo cozido** (novo)

**Frangos** (com 2 acompanhamentos): Frango desfiado · Frango em cubos · Frango ao molho · Sobrecoxa · **Fricassê de frango fit** (substitui "Fricassé de frango") · Parmegiana fit · **Strogonoff de frango fit** (renomeado de "Strogonoff fit", para não confundir com o de carne)

**Pratos únicos** (sem acompanhamento): **Panqueca de carne** · **Panqueca de frango** (o item "Panquecas (carne ou frango)" se divide em dois, para o pedido não chegar ambíguo no WhatsApp) · Macarrão à bolonhesa · Escondidinho de frango e abóbora · Escondidinho de carne e batata

**Acompanhamentos**: 29 opções em 5 grupos. O cliente escolhe exatamente 2, sem repetir.

| Grupo | Itens |
| --- | --- |
| Arroz (7) | Arroz branco · Arroz com brócolis · Arroz com cenoura · Arroz integral · Arroz integral com brócolis · Arroz integral com cenoura · Arroz 7 grãos |
| Feijões e grãos (5) | Feijão carioca · Feijão preto · Grão de bico · Lentilha · Ervilha |
| Batatas e purês (8) | Purê de batata · Purê de abóbora · Purê de mandioquinha · Batatas sauté · **Batatas rústicas** · **Batata inglesa cozida** · **Batata doce cozida** · **Batata doce assada** |
| Legumes (6) | Mix de legumes · **Legumes assados** · **Berinjela** · **Abobrinha** · **Macarrão de legumes (abobrinha e cenoura)** · **Abóbora e vagem no vapor** |
| Outros (3) | Quinoa · Cuscuz marroquino · Polenta |

**Mais pedidos**, nesta ordem ("legumes" = Mix de legumes):

1. Carne desfiada + Arroz com brócolis + Mix de legumes
2. Fricassê de frango fit + Arroz branco + Mix de legumes
3. Carne moída + Purê de mandioquinha + Lentilha
4. Picadinho + Grão de bico + Mix de legumes

## A página, de cima para baixo

1. **Cabeçalho:** só o logo. Quantidade e total ficam apenas na barra de baixo, para não repetir a informação.
2. **Topo:** **Monte seu pedido** / *Marmitas fit ultracongeladas para a sua semana*.
3. **Como funciona** (uma linha só, com 3 passos curtos lado a lado): 1 Escolha seus pratos · 2 Envie pelo WhatsApp · 3 Receba congelado. Abaixo, "Aceitamos Alelo e Sodexo Refeição" com ícone de cartão e o link discreto *"Dúvidas sobre entrega? Fale com a gente no WhatsApp"* (wa.me sem pedido), porque os detalhes de entrega ficam fora da página por enquanto.
4. **Preços:** **Quanto mais, menor o preço de cada uma**, com as 5 faixas lado a lado. Quando já há itens no pedido, a faixa em que ele está fica destacada.
5. **Mais pedidos** / *Os favoritos dos clientes*: 4 cartões com a combinação escrita.
   - O botão **Adicionar 2** adiciona 2 unidades. O texto evita o "+2" sozinho, que pode não ser entendido de primeira.
   - Se o combo já está no pedido, o cartão mostra o seletor de quantidade (ver "Seletor de quantidade").
6. **Monte do seu jeito** / *Escolha a proteína e 2 acompanhamentos*.
   - Os atalhos **[Carnes] [Frangos] [Pratos únicos]** ficam fixos no topo ao rolar e só rolam a página até a seção (não são etapas).
   - Abaixo, os 18 pratos numa lista única (6 carnes, 7 frangos e 5 pratos únicos), separada por títulos de seção.
   - Cada prato tem um espaço de foto. Sem foto, o espaço não aparece e a linha fica só com o texto. Para pôr foto depois, basta preencher o campo `foto` do prato no `cardapio.js`.
7. **Painel de montagem**: sobe de baixo ao tocar num prato.
   - **Prato com acompanhamentos:** os 29 acompanhamentos em botões agrupados pelos 5 grupos, com contador "Escolha 2 acompanhamentos (1/2)". Depois de 2 escolhidos, os outros ficam desabilitados até um ser desmarcado.
   - **Quantidade:** começa em 2, mínimo 2, nos botões [–] [+].
   - **Botão "Adicionar ao pedido":** desabilitado até haver 2 acompanhamentos, mostrando "Escolha mais N acompanhamento(s)".
   - **Prato único:** o painel tem só a quantidade.
   - O painel fecha ao adicionar, ao tocar fora, no X ou no **botão voltar do celular**. Comportamento detalhado em "UI, UX e design".
8. **Barra fixa embaixo**, que aparece a partir do primeiro item:
   - "**N marmitas · R$ total**";
   - o aviso de faixa (abaixo);
   - o botão **Ver pedido**.
9. **Resumo**: uma tela no lugar da lista, com endereço `#resumo`, para o botão voltar do celular retornar ao cardápio em vez de sair do site. Mostra:
   - a lista de itens, cada um com o seletor de quantidade;
   - o preço por unidade e o total;
   - "Aceitamos Alelo e Sodexo Refeição", com ícone de cartão;
   - o campo **Seu nome (opcional)**, opcional como hoje;
   - o botão **Enviar pedido pelo WhatsApp**;
   - o link "Voltar e ajustar".

### Aviso de faixa (barra de baixo)

| Total no pedido | Aviso |
| --- | --- |
| 1 a 6 | "Faltam N para R$ 29,00/un" (1–4) ou "Faltam N para R$ 26,00/un" (5–6) |
| 7 a 9 | **"Faltam N: 10 saem mais barato que 9"** |
| 10 a 19 | "Faltam N para R$ 25,50/un" (10–14) ou "Faltam N para R$ 25,00/un" (15–19) |
| 20 ou mais | **"Você está no menor preço: R$ 25,00/un"**, com ícone de check |

Com N = 1, o texto vai no singular: "Falta 1...".

### Seletor de quantidade (igual em todo lugar)

`[–] N [+]`. O **+** soma 1. O **–** subtrai 1, e quando N = 2 aparece como lixeira e remove o item, já que o mínimo é 2 por sabor. Toda remoção pode ser desfeita (ver "Toque e retorno visual"). A mesma regra vale nos cartões "Mais pedidos" e no resumo.

### Combinação repetida soma na mesma linha

Um item é identificado pelo **prato + os 2 acompanhamentos, sem importar a ordem**. Se o cliente adicionar de novo a mesma combinação, seja pelo painel ou pelo "Adicionar 2", a quantidade soma na linha existente. Os acompanhamentos são sempre guardados e exibidos na ordem do cardápio.

### Mensagem do WhatsApp

Mesmo número (5561983693411) e mesmo formato de hoje, com duas correções: o itálico do acompanhamento (o parêntese passa a ficar dentro do itálico) e a nova linha de preço por unidade.

```text
*NOVO PEDIDO SÁLVIA PREMIUM*

Meu nome é *Mariana* e este é meu pedido personalizado:

- *4x CARNE DESFIADA*
   _(Acomp: Arroz com brócolis + Mix de legumes)_

- *2x MACARRÃO À BOLONHESA*

_Preço por unidade: R$ 29,00_
*VALOR TOTAL: R$ 174,00*
_Qtde Total: 6 marmitas_
```

Sem nome, a frase vira "Este é meu pedido personalizado:".

## UI, UX e design

### Direção visual

- **A identidade da Sálvia continua:** verde, Outfit nos títulos e Inter no texto, para dar continuidade ao Instagram e à landing. A base de referência de UI sugeriu, para "comida", laranja e uma fonte serifada de restaurante. Descartei porque a marca já está estabelecida.
- **Estilo de cardápio de app de delivery:**
  - fundo claro, cartões brancos e uma única cor de destaque, o verde;
  - hierarquia por tamanho e peso da fonte;
  - sai o excesso da página atual: fonte extra-negrito e rótulos minúsculos em caixa-alta espaçada, de 9 a 10 px em cinza-claro, que são difíceis de ler.
- **Tokens em `pedido.css` (`:root`).** Nenhuma cor ou medida fica solta nos componentes.
  - **Cores:**
    - `--verde #1B5E20`: ações e destaques;
    - `--verde-2 #2E7D32`: pressionado;
    - `--creme #F1F8E9`: fundos de destaque;
    - `--texto #1A1A1A`;
    - `--texto-2 #4A4A4A`: secundário, contraste de 8,9:1 sobre branco;
    - `--texto-3 #6B6B6B`: rótulos, 5,3:1;
    - `--borda #E3E8E4`;
    - `--fundo #FDFDFD`;
    - `--remover #B3261E`.
    - O verde suave (#81C784) é só decorativo e nunca vai em texto.
  - **Tipografia:**
    - 28 px no título da página, 20 px nos títulos de seção, 17 px no nome do prato, 15 px em acompanhamentos e textos de apoio, 13 px em rótulos;
    - nada abaixo de 12 px;
    - campos de texto com 16 px, o que evita o zoom automático do iPhone.
  - **Espaçamento:** escala 4 / 8 / 12 / 16 / 24 / 32, com margem lateral de 16 px.
  - **Raios:** 12 nos botões de escolha, 16 nos cartões e 24 no painel.
  - **Sombras:** só dois níveis, um para cartão e outro para painel e barra.
- **Ícones em SVG embutido**, com o mesmo traço, e nenhum emoji: o cartão do vale-refeição, o check do menor preço, o X, a lixeira, o [–] e o [+], e o WhatsApp. Os números do "Como funciona" são círculos feitos em CSS.
- `<meta name="color-scheme" content="light">`, para o modo escuro forçado de alguns Androids não inverter as cores da página.

### Primeira tela

- **Num celular de 375×667 (iPhone SE/8), já descontadas as barras do navegador do Instagram, o primeiro cartão de "Mais pedidos" aparece sem rolar.** Quem chega quer ver comida. Por isso o "Como funciona" é uma linha só, e os preços são uma faixa compacta, sem cartões grandes.
- **O HTML já chega com o conteúdo fixo escrito:** cabeçalho, título, "Como funciona" e preços. O JavaScript só monta as listas. Não há tela em branco nem animação de entrada escondendo conteúdo. Hoje a página começa com tudo invisível até a animação rodar.

### Toque e retorno visual

- Todo elemento tocável tem **no mínimo 44×44 px e 8 px de distância** do vizinho, incluindo os botões [–] e [+].
- Todo toque tem resposta visual em até 100 ms: um leve encolhimento ou mudança de cor.
- **Adicionar sempre confirma, de três formas:**
  - o cartão de "Mais pedidos" vira o seletor de quantidade na hora;
  - a barra de baixo dá um pulso curto quando o total muda;
  - aparece um aviso rápido, como "Picadinho ×2 adicionado", que some em 3 s.
- **Remover tem "Desfazer".** Ao remover um item, pela lixeira ou pelo [–] no 2, aparece "Item removido · Desfazer" por 5 s. Assim ninguém perde por engano uma combinação montada com cuidado.
- **Selo "N no pedido" no cardápio:** cada prato que já está no pedido mostra a quantidade, somando todas as combinações daquele prato.

### Painel de montagem

- **A quantidade e o botão "Adicionar ao pedido" ficam fixos no rodapé do painel**, e só a lista de acompanhamentos rola. Com 29 opções, sem isso o botão ficaria escondido embaixo da lista.
- O cabeçalho do painel também é fixo, com o nome do prato, o contador (1/2) e o botão de fechar.
- O painel ocupa no máximo ~85% da altura da tela. O fundo escurece e não rola enquanto o painel está aberto.
- **O botão voltar do celular fecha o painel** em vez de sair do site, assim como acontece no resumo.
- **Acompanhamento selecionado:** fundo creme, borda verde e ícone de check, para não depender só da cor. Com 2 escolhidos, os outros ficam esmaecidos e aparece a dica "Desmarque um para trocar".
- **Fechar sem adicionar descarta a seleção, sem pergunta de confirmação.** Refazer custa 2 toques, e uma pergunta atrapalharia mais.

### Barra de baixo e atalhos

- A barra respeita a área de gesto do iPhone (safe area), e o fim da página tem espaço para a barra não cobrir o último prato.
- Ao tocar num atalho ([Carnes] [Frangos] [Pratos únicos]), a página para com o título da seção visível, sem ficar escondido atrás dos atalhos fixos. Enquanto a pessoa rola, o atalho da seção visível fica marcado.

### Resumo e envio

- **Campo de nome:**
  - tem rótulo visível ("Seu nome (opcional)"), e não só um texto de exemplo dentro do campo;
  - usa `autocomplete="name"`;
  - tem fonte de 16 px.
- **Botão "Enviar pedido pelo WhatsApp":**
  - tem o ícone do WhatsApp e fica no verde da Sálvia, porque o verde do WhatsApp com texto branco não tem contraste suficiente;
  - logo abaixo aparece *"Você confere a mensagem no WhatsApp antes de enviar."*
- **O envio é um link comum para o wa.me**, e não `window.open`, porque funciona melhor dentro do navegador do Instagram.
- **Resumo vazio:** abrir `#resumo` sem itens mostra "Seu pedido está vazio" e o botão "Ver cardápio".

### Acessibilidade e movimento

- Todo texto tem contraste mínimo de 4,5:1.
- **Leitores de tela:**
  - botões só com ícone (X, lixeira, –, +) têm descrição;
  - os acompanhamentos usam `aria-pressed`;
  - o painel é um diálogo (`role="dialog"`), recebe o foco ao abrir, devolve o foco ao fechar e fecha com Esc no computador.
- O aviso de faixa e os avisos rápidos são lidos pelo leitor de tela sem roubar o foco (`aria-live="polite"`).
- **Animações curtas e só funcionais**, de 150 a 250 ms: o painel subindo e o pulso da barra. Elas ficam desligadas para quem ativou "reduzir movimento" no celular. Não usa GSAP.
- O zoom do navegador nunca é bloqueado.

### Verificação visual

Antes de mostrar ao usuário, a página é conferida em 360, 375 e 414 px de largura (Androids e iPhones comuns) e no computador. O roteiro cobre:

- adicionar um "Mais pedido";
- montar um prato com acompanhamentos e um prato único;
- alterar e remover itens, incluindo o Desfazer;
- passar de 9 para 10 e de 19 para 20 marmitas;
- abrir e fechar o painel pelo botão voltar;
- gerar o link do WhatsApp.

## Construção técnica

**Sem framework e sem etapa de build:** HTML, CSS e JavaScript puro (módulos ES), servidos como arquivos estáticos pelo Netlify, como hoje. Os ícones viram SVG embutido, sem a fonte Material Symbols. As fontes Outfit e Inter continuam, carregadas só nos pesos usados. Meta: **JS + CSS próprios abaixo de 50 KB e nenhum script de terceiros.**

| Arquivo | Responsabilidade |
| --- | --- |
| `cardapio.js` | **Só dados:** `PRICING_TIERS`, categorias, pratos (com `foto` opcional), grupos de acompanhamentos, `MAIS_PEDIDOS` e o número do WhatsApp. Para mudar preço ou prato no futuro, mexe só aqui. |
| `pedido-regras.js` | **Só lógica pura, sem tela:** preço unitário, total, aviso de faixa, identificação e junção de itens, alteração de quantidade, validação do carrinho salvo e texto da mensagem. |
| `pedido.js` | Tela: monta o HTML, trata os toques, abre e fecha o painel, troca para o resumo e salva o carrinho. |
| `pedido.css` | Estilos com a identidade atual: verde Sálvia (#1B5E20 / #2E7D32 / #F1F8E9), cantos arredondados. |
| `pedido.html` | Estrutura mínima que carrega os módulos acima. |

Layout pensado primeiro para celular. No computador, a coluna fica centralizada com no máximo ~480 px.

### Carrinho salvo e situações de exceção

- O carrinho (prato, acompanhamentos e quantidade de cada item) e o nome ficam no `localStorage`, na chave `salvia:carrinho:v1`.
- **O preço nunca é salvo**, e sim recalculado sempre. Assim, ninguém vê preço antigo depois de uma mudança.
- **Ao carregar, cada item salvo é validado.** O item é descartado em silêncio se:
  - o prato não existe mais;
  - algum acompanhamento não existe mais;
  - a quantidade de acompanhamentos não bate com o tipo do prato;
  - a quantidade não é um inteiro maior ou igual a 2.
- Se o `localStorage` falhar (navegação anônima, bloqueio), a página funciona normalmente, só sem salvar.
- Depois de enviar pelo WhatsApp, o carrinho **continua salvo**, caso a pessoa volte para ajustar ou queira repetir o pedido.
- Os links antigos (`pedido.html?kit=10|15|20`) continuam abrindo a página. O parâmetro é ignorado.

## Landing (enquanto estiver no ar)

Na seção `#planos` do `index.html` mudam só os preços, sem mexer em layout ou texto:

| Card | Hoje | Novo |
| --- | --- | --- |
| Kit 10 | R$ 240,00 | **R$ 260,00** |
| Kit 15 | R$ 352,50 | **R$ 382,50** |
| Kit 20+ | R$ 460,00 · "R$ 23,00/un a partir de 20 unidades" | **R$ 500,00** · "R$ 25,00/un a partir de 20 unidades" |

## Testes

Os testes ficam em `tests/` e rodam com `node --test` (Node 24, sem dependências). Eles importam `cardapio.js` e `pedido-regras.js` diretamente e substituem `scripts/verify-pricing.mjs`, que extraía os preços por expressão regular. Cobrem:

- **Preço unitário** em todas as bordas de faixa: 1, 4, 5, 9, 10, 14, 15, 19, 20, 25.
- **Totais:** 1 = 31 · 4 = 124 · 9 = 261 · 10 = 260 · 12 = 312 · 15 = 382,50 · 19 = 484,50 · 20 = 500 · 25 = 625.
- **Aviso de faixa:** para cada total de 1 a 21, incluindo o singular "Falta 1" e o aviso especial de 7 a 9.
- **Junção de itens:** a mesma combinação em outra ordem vira uma linha só e soma a quantidade.
- **Seletor:** o **–** em 2 remove o item, e o **+** soma 1.
- **Validação do carrinho salvo:** descarta prato inexistente, acompanhamento inexistente, contagem errada de acompanhamentos e quantidade inválida, e mantém os itens válidos.
- **Mensagem do WhatsApp:** com e sem nome, com e sem acompanhamentos (texto exato).
- **Integridade do cardápio:** os 4 "Mais pedidos" usam pratos e acompanhamentos existentes, e prato com acompanhamento tem exatamente 2; não há nomes duplicados; os acompanhamentos somam 29.
- **Landing:** os 3 cards mostram exatamente os totais calculados para 10, 15 e 20, e o texto "R$ 25,00/un".

Além dos testes automáticos, a página é verificada **no navegador em tamanho de celular**, percorrendo o fluxo completo até gerar o link do WhatsApp, antes de ser mostrada ao usuário.

O `_redirects` ganha `/tests/*` e `/scripts/*` com 404, como já acontece com `/docs/*`, porque o site publica a raiz do repositório.

## Publicação

Tudo é feito na branch `feat/pagina-pedido`. O Netlify publica a cada push na `main`, então **nada vai para a `main` sem a aprovação do usuário**, depois que ele vir a página funcionando.

## Fora do escopo (combinado para depois)

- Destino da landing: raiz do site, `/sobre` ou continuar como está.
- Fotos dos pratos: o espaço fica pronto, mas as fotos vêm depois.
- Detalhes de entrega no "Como funciona": região, dias, frete, antecedência, validade e entrega ou retirada.
- Vídeo no Higgsfield "Veja como é simples pedir" para o destaque do Instagram, e versão impressa para a loja física.
- Métricas e analytics, e pagamento online.
