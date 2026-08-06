# Nova tabela de preços dos kits + vale-refeição

**Data:** 2026-08-05 · **Status:** aprovado pelo usuário · **Vigência comercial:** desde 03/08/2026 (já em vigor — publicar imediatamente, sem lógica de data)

## Contexto

O site salviamarmitas.com (Netlify, auto-deploy a cada push na `main` de `JBMCOINS/SALVIA`) exibe e cobra os preços antigos. A nova tabela comercial sobe os valores, cria a faixa de 20+ unidades e passa a aceitar Alelo Refeição e Sodexo Refeição.

## Nova precificação (fonte da verdade)

Preço por unidade, definido pela **quantidade total do carrinho** (soma de todos os sabores). Quantidades intermediárias herdam o preço da faixa em que caem (decisão do usuário: "por faixas").

| Faixa (total de un.) | Preço/un | Kit de referência |
| --- | --- | --- |
| 1 a 4 | R$ 29,00 | 1 marmita = R$ 29,00 |
| 5 a 9 | R$ 27,00 | Kit 5 = R$ 135,00 |
| 10 a 14 | R$ 24,00 | Kit 10 = R$ 240,00 |
| 15 a 19 | R$ 23,50 | Kit 15 = R$ 352,50 |
| 20 ou mais | R$ 23,00 | Kit 20 = R$ 460,00 |

Regras preservadas, sem alteração: mínimo de 2 unidades por sabor (clamp em 3 pontos), controles +/- no carrinho e resumo, fluxo de fechamento via WhatsApp.

## Mudanças em `pedido.html`

1. **Fonte única de preços.** Novo array no topo do script, ordenado da maior faixa para a menor:

   ```js
   const PRICING_TIERS = [
     { min: 20, label: '20 ou mais', price: 23.0, elite: true },
     { min: 15, label: '15 a 19',    price: 23.5 },
     { min: 10, label: '10 a 14',    price: 24.0 },
     { min: 5,  label: '5 a 9',      price: 27.0 },
     { min: 1,  label: 'Até 4',      price: 29.0 },
   ];
   const calculatePricing = (q) =>
     (PRICING_TIERS.find(t => q >= t.min) ?? PRICING_TIERS.at(-1)).price;
   ```

   `q = 0` cai no fallback (29,00) — total continua R$ 0,00 pois é multiplicado pela quantidade.

2. **Tabela visual renderizada do mesmo array** (ordem crescente de faixa), substituindo o array literal hardcoded atual. Grade `grid-cols-2` com 5 células: a célula "20 ou mais" (elite) ocupa a linha inteira (`col-span-2`), assumindo o papel de destaque que hoje é do "15+". Preços exibidos com `toFixed(2).replace('.', ',')`.

3. **Vale-refeição:** faixa discreta imediatamente abaixo da tabela de preços — "💳 Aceitamos Alelo Refeição e Sodexo Refeição" — e a mesma nota no resumo final, junto ao box de total (último ponto antes do WhatsApp).

4. **Limpeza:** remover a linha morta `const kitGoal = parseInt(params.get('kit') || '0');` (parseada e nunca usada desde o commit `84dc1bac`). Os links `?kit=` da landing continuam funcionando como sempre (o parâmetro é inerte).

## Mudanças em `index.html` (seção `#planos`)

Sai o card "Iniciante" (5 marmitas). Ficam **três cards**, na ordem:

| Card | Título / subtítulo | Preço | Extras |
| --- | --- | --- | --- |
| Kit 10 | "Dedicado" — 10 Marmitas (Performance) | **R$ 240,00** | mantém bullets e link `pedido.html?kit=10` |
| Kit 15 | "Transformação" — 15 Marmitas (Total) | **R$ 352,50** | mantém destaque "Elite / Mais Vendido" e link `?kit=15` |
| Kit 20+ (novo) | "Estilo de Vida" — 20+ Marmitas | **R$ 460,00** | sublinha "R$ 23,00/un acima de 20 unidades"; bullet forte "O melhor preço por unidade"; link `pedido.html?kit=20` |

Estrutura do novo card copia o padrão dos existentes (`plano-card reveal-card`, `plano-header`, `plano-preco`, `plano-features`, botão). Grade permanece de 3 colunas — sem mudança de layout.

**Vale-refeição:** faixa centralizada abaixo da `planos-grid` — "💳 Aceitamos Alelo Refeição e Sodexo Refeição".

## Mudanças em `style.css`

Apenas o necessário: `.preco-obs` (sublinha de preço do card 20+) e `.pagamento-info` (faixa de vale-refeição na landing), seguindo tokens/padrões existentes no arquivo. Nenhuma alteração na grade.

## Entrega e verificação

- Commit único na `main` com todas as mudanças + push → deploy automático Netlify.
- Verificação pós-deploy no site vivo: landing mostra 240,00 / 352,50 / 460,00 e a faixa de vale-refeição; cardápio mostra a tabela de 5 faixas.
- Verificação da matemática antes do push (casos de teste): 2→58,00 · 7→189,00 · 12→288,00 · 17→399,50 · 20→460,00 · 25→575,00.

## Fora de escopo

- Pasta do Antigravity (`scratch\salvia`): mercado de bebidas, vitrine, PIX — intocados por decisão do usuário (05/08).
- Menção a vale-refeição na mensagem do WhatsApp e no rodapé da landing (não selecionados).
- Qualquer mudança nas regras de carrinho existentes.
