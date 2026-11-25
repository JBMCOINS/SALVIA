# Nova página de pedido — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever `pedido.html` como página de entrada direta (vinda do Instagram): rápida, com cardápio numa tela só, "Mais pedidos", painel de montagem, preços novos e fechamento pelo WhatsApp.

**Architecture:** Site estático no Netlify, sem build. Três módulos ES: `cardapio.js` (só dados), `pedido-regras.js` (lógica pura, testada com `node --test`) e `pedido.js` (DOM). Visual em `pedido.css`, com tokens. A landing (`index.html`) só recebe os preços novos.

**Tech Stack:** HTML + CSS + JavaScript puro (módulos ES no navegador), Node 24 (`node:test`, sem dependências), Google Fonts (Playfair Display SC e Karla), Netlify (publica a cada push na `main`).

**Spec:** [docs/superpowers/specs/2026-11-25-pagina-pedido-direta-design.md](../specs/2026-11-25-pagina-pedido-direta-design.md)

## Global Constraints

- **Branch:** todo o trabalho fica em `feat/pagina-pedido`. **Nunca** fazer push nem merge na `main` (o Netlify publica a `main` no ar) sem aprovação explícita do usuário.
- **Commits** terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nunca usar `git add -A` (há pastas não rastreadas que não entram: `.agents/`, `.claude/`, `.mcp.json`, `skills-lock.json`).
- **Preços** (preço/un pela quantidade total do pedido): 1–4 = R$ 31,00 · 5–9 = R$ 29,00 · 10–14 = R$ 26,00 · 15–19 = R$ 25,50 · 20+ = R$ 25,00.
- **Regras:** mínimo 2 unidades por sabor; prato de carne/frango leva **exatamente 2** acompanhamentos diferentes; prato único leva 0.
- **WhatsApp:** número `5561983693411`; envio por link comum (`<a href>`), nunca `window.open`.
- **Sem framework, sem build, sem script de terceiros.** HTML + CSS + JS próprios da página somam **menos de 50 KB**.
- **Visual:** cores e medidas só via tokens de `:root` em `pedido.css`. Laranja `#C2410C` é a cor de ação (texto branco sobre ele); `#EA580C` só em ícones, bordas e elementos grandes; `#FFF7ED` nos fundos de destaque; verde `#1B5E20` só nos sinais de "deu certo"; fundo da página branco `#FFFFFF`. Fontes: Playfair Display SC 700 só no título da página e nos títulos de seção; Karla 400/500/700 em todo o resto.
- **Acessibilidade:** alvos de toque ≥ 44×44 px; texto ≥ 12 px; campos de texto com 16 px; contraste de texto ≥ 4,5:1; zoom nunca bloqueado; nada de emoji como ícone (só SVG).
- **Textos exatos:** "Monte seu pedido" · "Marmitas fit ultracongeladas para a sua semana" · "Escolha seus pratos" / "Envie pelo WhatsApp" / "Receba congelado" · "Aceitamos Alelo e Sodexo Refeição" · "Dúvidas sobre entrega? Fale com a gente no WhatsApp" · "Quanto mais, menor o preço de cada uma" · "Mais pedidos" / "Os favoritos dos clientes" · "Adicionar 2" · "Monte do seu jeito" / "Escolha a proteína e 2 acompanhamentos" · "Adicionar ao pedido" · "Ver pedido" · "Seu pedido" · "Seu nome (opcional)" · "Enviar pedido pelo WhatsApp" · "Você confere a mensagem no WhatsApp antes de enviar." · "Voltar e ajustar" · "Item removido" + "Desfazer" · "Seu pedido está vazio." + "Ver cardápio".
- **Testes:** `node --test` na raiz do repositório roda tudo em `tests/*.test.mjs`.

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
| --- | --- | --- |
| `cardapio.js` | Criar | Só dados: preços, categorias, pratos, acompanhamentos, mais pedidos, WhatsApp |
| `pedido-regras.js` | Criar | Lógica pura: preço, aviso de faixa, carrinho, validação do salvo, mensagem |
| `pedido.js` | Criar | Tela: renderização, eventos, painel, resumo, avisos, histórico, salvamento |
| `pedido.css` | Criar | Tokens e estilos |
| `pedido.html` | Reescrever | Estrutura com o conteúdo fixo já escrito |
| `assets/salvia-logo-topo.png` | Criar | Logo recortado (254×64) para o cabeçalho |
| `index.html` | Modificar (linhas ~195, ~212, ~228-229) | Só os preços dos 3 cards |
| `_redirects` | Modificar | 404 para `/tests/*` e `/scripts/*` |
| `scripts/verify-pricing.mjs` | Remover | Substituído pelos testes em `tests/` |
| `tests/cardapio.test.mjs` | Criar | Integridade dos dados |
| `tests/preco.test.mjs` | Criar | Preço, totais, faixa, aviso, formatação |
| `tests/carrinho.test.mjs` | Criar | Junção, seletor, desfazer, validação do salvo |
| `tests/mensagem.test.mjs` | Criar | Mensagem e links do WhatsApp |
| `tests/paginas.test.mjs` | Criar | Landing, HTML da página de pedido e orçamento de peso |

---

### Task 1: Dados do cardápio (`cardapio.js`)

**Files:**
- Create: `cardapio.js`
- Test: `tests/cardapio.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces (exports de `cardapio.js`):
  - `WHATSAPP: string` = `'5561983693411'`
  - `MIN_POR_SABOR: number` = 2 · `ACOMPANHAMENTOS_POR_PRATO: number` = 2
  - `PRICING_TIERS: { min: number, label: string, price: number }[]` — ordem **decrescente** de `min`
  - `CATEGORIAS: { id: string, label: string, comAcompanhamentos: boolean }[]`
  - `PRATOS: { nome: string, categoria: string, foto?: string }[]`
  - `GRUPOS_ACOMPANHAMENTOS: { titulo: string, itens: string[] }[]`
  - `MAIS_PEDIDOS: { prato: string, acompanhamentos: string[] }[]`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/cardapio.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WHATSAPP, MIN_POR_SABOR, ACOMPANHAMENTOS_POR_PRATO, PRICING_TIERS,
  CATEGORIAS, PRATOS, GRUPOS_ACOMPANHAMENTOS, MAIS_PEDIDOS,
} from '../cardapio.js';

const todosAcompanhamentos = GRUPOS_ACOMPANHAMENTOS.flatMap((g) => g.itens);

test('faixas de preço em ordem decrescente com os valores combinados', () => {
  assert.deepEqual(
    PRICING_TIERS.map((t) => [t.min, t.label, t.price]),
    [[20, '20+', 25], [15, '15–19', 25.5], [10, '10–14', 26], [5, '5–9', 29], [1, '1–4', 31]],
  );
});

test('regras fixas e número do WhatsApp', () => {
  assert.equal(MIN_POR_SABOR, 2);
  assert.equal(ACOMPANHAMENTOS_POR_PRATO, 2);
  assert.equal(WHATSAPP, '5561983693411');
});

test('18 pratos: 6 carnes, 7 frangos, 5 pratos únicos', () => {
  const porCategoria = (id) => PRATOS.filter((p) => p.categoria === id).length;
  assert.equal(PRATOS.length, 18);
  assert.equal(porCategoria('carnes'), 6);
  assert.equal(porCategoria('frangos'), 7);
  assert.equal(porCategoria('pratos-unicos'), 5);
});

test('todo prato aponta para uma categoria existente', () => {
  const ids = CATEGORIAS.map((c) => c.id);
  for (const p of PRATOS) assert.ok(ids.includes(p.categoria), p.nome);
});

test('só carnes e frangos levam acompanhamento', () => {
  assert.deepEqual(
    CATEGORIAS.map((c) => [c.id, c.comAcompanhamentos]),
    [['carnes', true], ['frangos', true], ['pratos-unicos', false]],
  );
});

test('29 acompanhamentos em 5 grupos (7, 5, 8, 6, 3)', () => {
  assert.deepEqual(GRUPOS_ACOMPANHAMENTOS.map((g) => g.itens.length), [7, 5, 8, 6, 3]);
  assert.equal(todosAcompanhamentos.length, 29);
});

test('sem nomes duplicados', () => {
  const nomes = PRATOS.map((p) => p.nome);
  assert.equal(new Set(nomes).size, nomes.length);
  assert.equal(new Set(todosAcompanhamentos).size, todosAcompanhamentos.length);
});

test('mais pedidos usam pratos com acompanhamento e acompanhamentos existentes', () => {
  assert.equal(MAIS_PEDIDOS.length, 4);
  for (const combo of MAIS_PEDIDOS) {
    const prato = PRATOS.find((p) => p.nome === combo.prato);
    assert.ok(prato, `prato inexistente: ${combo.prato}`);
    const categoria = CATEGORIAS.find((c) => c.id === prato.categoria);
    assert.ok(categoria.comAcompanhamentos, `${combo.prato} não leva acompanhamento`);
    assert.equal(combo.acompanhamentos.length, ACOMPANHAMENTOS_POR_PRATO);
    assert.equal(new Set(combo.acompanhamentos).size, combo.acompanhamentos.length);
    for (const a of combo.acompanhamentos) {
      assert.ok(todosAcompanhamentos.includes(a), `acompanhamento inexistente: ${a}`);
    }
  }
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/cardapio.test.mjs`
Expected: FAIL com `Cannot find module '...\cardapio.js'` (ERR_MODULE_NOT_FOUND).

- [ ] **Step 3: Criar `cardapio.js`**

```js
// Fonte única de preços e cardápio da página de pedido (pedido.html).
// Para mudar preço, prato ou acompanhamento, edite SÓ este arquivo e rode `node --test`.

export const WHATSAPP = '5561983693411';

export const MIN_POR_SABOR = 2;
export const ACOMPANHAMENTOS_POR_PRATO = 2;

// Ordenado da MAIOR faixa para a menor: o preço é o da primeira faixa cujo `min` cabe na quantidade.
// `label` é o texto curto da faixa de preços em pedido.html (há teste garantindo que o HTML bate com isto).
export const PRICING_TIERS = [
  { min: 20, label: '20+',   price: 25.0 },
  { min: 15, label: '15–19', price: 25.5 },
  { min: 10, label: '10–14', price: 26.0 },
  { min: 5,  label: '5–9',   price: 29.0 },
  { min: 1,  label: '1–4',   price: 31.0 },
];

export const CATEGORIAS = [
  { id: 'carnes',        label: 'Carnes',        comAcompanhamentos: true },
  { id: 'frangos',       label: 'Frangos',       comAcompanhamentos: true },
  { id: 'pratos-unicos', label: 'Pratos únicos', comAcompanhamentos: false },
];

// `foto` é opcional: caminho da imagem, ex.: { nome: 'Picadinho', categoria: 'carnes', foto: 'assets/pratos/picadinho.webp' }.
// Sem foto, a linha do prato mostra só o texto.
export const PRATOS = [
  { nome: 'Carne moída',                      categoria: 'carnes' },
  { nome: 'Carne desfiada',                   categoria: 'carnes' },
  { nome: 'Picadinho',                        categoria: 'carnes' },
  { nome: 'Almôndegas ao molho',              categoria: 'carnes' },
  { nome: 'Strogonoff de carne fit',          categoria: 'carnes' },
  { nome: 'Músculo cozido',                   categoria: 'carnes' },
  { nome: 'Frango desfiado',                  categoria: 'frangos' },
  { nome: 'Frango em cubos',                  categoria: 'frangos' },
  { nome: 'Frango ao molho',                  categoria: 'frangos' },
  { nome: 'Sobrecoxa',                        categoria: 'frangos' },
  { nome: 'Fricassê de frango fit',           categoria: 'frangos' },
  { nome: 'Parmegiana fit',                   categoria: 'frangos' },
  { nome: 'Strogonoff de frango fit',         categoria: 'frangos' },
  { nome: 'Panqueca de carne',                categoria: 'pratos-unicos' },
  { nome: 'Panqueca de frango',               categoria: 'pratos-unicos' },
  { nome: 'Macarrão à bolonhesa',             categoria: 'pratos-unicos' },
  { nome: 'Escondidinho de frango e abóbora', categoria: 'pratos-unicos' },
  { nome: 'Escondidinho de carne e batata',   categoria: 'pratos-unicos' },
];

// A ordem aqui é a ordem em que os acompanhamentos aparecem no painel, no resumo e na mensagem.
export const GRUPOS_ACOMPANHAMENTOS = [
  {
    titulo: 'Arroz',
    itens: ['Arroz branco', 'Arroz com brócolis', 'Arroz com cenoura', 'Arroz integral',
      'Arroz integral com brócolis', 'Arroz integral com cenoura', 'Arroz 7 grãos'],
  },
  {
    titulo: 'Feijões e grãos',
    itens: ['Feijão carioca', 'Feijão preto', 'Grão de bico', 'Lentilha', 'Ervilha'],
  },
  {
    titulo: 'Batatas e purês',
    itens: ['Purê de batata', 'Purê de abóbora', 'Purê de mandioquinha', 'Batatas sauté',
      'Batatas rústicas', 'Batata inglesa cozida', 'Batata doce cozida', 'Batata doce assada'],
  },
  {
    titulo: 'Legumes',
    itens: ['Mix de legumes', 'Legumes assados', 'Berinjela', 'Abobrinha',
      'Macarrão de legumes (abobrinha e cenoura)', 'Abóbora e vagem no vapor'],
  },
  {
    titulo: 'Outros',
    itens: ['Quinoa', 'Cuscuz marroquino', 'Polenta'],
  },
];

// Combinações mais vendidas (informadas pelo usuário em 2026-11-25), nesta ordem.
export const MAIS_PEDIDOS = [
  { prato: 'Carne desfiada',         acompanhamentos: ['Arroz com brócolis', 'Mix de legumes'] },
  { prato: 'Fricassê de frango fit', acompanhamentos: ['Arroz branco', 'Mix de legumes'] },
  { prato: 'Carne moída',            acompanhamentos: ['Purê de mandioquinha', 'Lentilha'] },
  { prato: 'Picadinho',              acompanhamentos: ['Grão de bico', 'Mix de legumes'] },
];
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test tests/cardapio.test.mjs`
Expected: PASS — `ℹ pass 8`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add cardapio.js tests/cardapio.test.mjs
git commit -m "feat: cardapio.js como fonte unica de precos e cardapio da pagina de pedido

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Regras de preço e aviso de faixa (`pedido-regras.js`, parte 1)

**Files:**
- Create: `pedido-regras.js`
- Test: `tests/preco.test.mjs`

**Interfaces:**
- Consumes: `PRICING_TIERS` e os demais exports de `cardapio.js` (Task 1).
- Produces (exports de `pedido-regras.js`):
  - `formatarReais(valor: number): string` → `'R$ 1.000,00'` (espaço comum depois de `R$`, ponto de milhar, vírgula decimal)
  - `faixaDe(quantidade: number): {min,label,price} | null` → `null` se `quantidade < 1`
  - `precoUnitario(quantidade: number): number` → para `0` devolve o preço da menor faixa (31)
  - `resumoValores(itens: Item[]): { quantidade: number, unitario: number, total: number }`
  - `avisoFaixa(quantidade: number): { texto: string, menorPreco: boolean } | null` → `null` se `quantidade < 1`
  - Tipo `Item = { prato: string, acompanhamentos: string[], quantidade: number }`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/preco.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarReais, faixaDe, precoUnitario, resumoValores, avisoFaixa } from '../pedido-regras.js';

const pedidoDe = (quantidade) => [{ prato: 'X', acompanhamentos: [], quantidade }];

test('preço unitário nas bordas de cada faixa', () => {
  const casos = [[1, 31], [4, 31], [5, 29], [9, 29], [10, 26], [14, 26], [15, 25.5], [19, 25.5], [20, 25], [25, 25]];
  for (const [q, esperado] of casos) assert.equal(precoUnitario(q), esperado, `q=${q}`);
});

test('totais de referência', () => {
  const casos = [[1, 31], [4, 124], [9, 261], [10, 260], [12, 312], [15, 382.5], [19, 484.5], [20, 500], [25, 625]];
  for (const [q, esperado] of casos) assert.equal(resumoValores(pedidoDe(q)).total, esperado, `q=${q}`);
});

test('resumo soma todos os itens do pedido', () => {
  const itens = [
    { prato: 'A', acompanhamentos: [], quantidade: 4 },
    { prato: 'B', acompanhamentos: [], quantidade: 6 },
  ];
  assert.deepEqual(resumoValores(itens), { quantidade: 10, unitario: 26, total: 260 });
});

test('pedido vazio', () => {
  assert.deepEqual(resumoValores([]), { quantidade: 0, unitario: 31, total: 0 });
  assert.equal(faixaDe(0), null);
  assert.equal(avisoFaixa(0), null);
});

test('faixa atual', () => {
  assert.equal(faixaDe(1).min, 1);
  assert.equal(faixaDe(7).min, 5);
  assert.equal(faixaDe(14).min, 10);
  assert.equal(faixaDe(20).min, 20);
  assert.equal(faixaDe(99).min, 20);
});

test('formatação em reais', () => {
  assert.equal(formatarReais(0), 'R$ 0,00');
  assert.equal(formatarReais(25.5), 'R$ 25,50');
  assert.equal(formatarReais(382.5), 'R$ 382,50');
  assert.equal(formatarReais(1000), 'R$ 1.000,00');
  assert.equal(formatarReais(1234567.8), 'R$ 1.234.567,80');
});

test('aviso de faixa para cada total de 1 a 21', () => {
  const esperado = {
    1: 'Faltam 4 para R$ 29,00/un',
    2: 'Faltam 3 para R$ 29,00/un',
    3: 'Faltam 2 para R$ 29,00/un',
    4: 'Falta 1 para R$ 29,00/un',
    5: 'Faltam 5 para R$ 26,00/un',
    6: 'Faltam 4 para R$ 26,00/un',
    7: 'Faltam 3: 10 saem mais barato que 9',
    8: 'Faltam 2: 10 saem mais barato que 9',
    9: 'Falta 1: 10 saem mais barato que 9',
    10: 'Faltam 5 para R$ 25,50/un',
    11: 'Faltam 4 para R$ 25,50/un',
    12: 'Faltam 3 para R$ 25,50/un',
    13: 'Faltam 2 para R$ 25,50/un',
    14: 'Falta 1 para R$ 25,50/un',
    15: 'Faltam 5 para R$ 25,00/un',
    16: 'Faltam 4 para R$ 25,00/un',
    17: 'Faltam 3 para R$ 25,00/un',
    18: 'Faltam 2 para R$ 25,00/un',
    19: 'Falta 1 para R$ 25,00/un',
    20: 'Você está no menor preço: R$ 25,00/un',
    21: 'Você está no menor preço: R$ 25,00/un',
  };
  for (let q = 1; q <= 21; q += 1) {
    const aviso = avisoFaixa(q);
    assert.equal(aviso.texto, esperado[q], `texto q=${q}`);
    assert.equal(aviso.menorPreco, q >= 20, `menorPreco q=${q}`);
  }
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/preco.test.mjs`
Expected: FAIL com `ERR_MODULE_NOT_FOUND` para `pedido-regras.js`.

- [ ] **Step 3: Criar `pedido-regras.js` com a parte de preço**

```js
// Regras puras da página de pedido: preço, aviso de faixa, carrinho e mensagem do WhatsApp.
// Sem DOM — tudo aqui é testado em tests/*.test.mjs com `node --test`.
import {
  WHATSAPP, MIN_POR_SABOR, ACOMPANHAMENTOS_POR_PRATO, PRICING_TIERS,
  CATEGORIAS, PRATOS, GRUPOS_ACOMPANHAMENTOS,
} from './cardapio.js';

/** @typedef {{ prato: string, acompanhamentos: string[], quantidade: number }} Item */

// O aviso "N saem mais barato que N-1" aparece só quando faltam até 3 unidades para essa faixa.
const JANELA_AVISO_ESPECIAL = 3;

// ---------- Preço ----------

export function formatarReais(valor) {
  const [inteiro, centavos] = valor.toFixed(2).split('.');
  return `R$ ${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${centavos}`;
}

export function faixaDe(quantidade) {
  if (quantidade < 1) return null;
  return PRICING_TIERS.find((t) => quantidade >= t.min) ?? null;
}

export function precoUnitario(quantidade) {
  return (faixaDe(quantidade) ?? PRICING_TIERS[PRICING_TIERS.length - 1]).price;
}

/** @param {Item[]} itens */
export function resumoValores(itens) {
  const quantidade = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const unitario = precoUnitario(quantidade);
  return { quantidade, unitario, total: quantidade * unitario };
}

export function avisoFaixa(quantidade) {
  if (quantidade < 1) return null;
  const menor = PRICING_TIERS[0];
  if (quantidade >= menor.min) {
    return { texto: `Você está no menor preço: ${formatarReais(menor.price)}/un`, menorPreco: true };
  }
  const proxima = [...PRICING_TIERS].reverse().find((t) => t.min > quantidade);
  const faltam = proxima.min - quantidade;
  const inicio = `${faltam === 1 ? 'Falta' : 'Faltam'} ${faltam}`;
  const anterior = proxima.min - 1;
  // Só na passagem em que o TOTAL cai (hoje, 9 -> 10) vale o argumento "sai mais barato".
  const totalCai = proxima.min * proxima.price < anterior * precoUnitario(anterior);
  if (totalCai && faltam <= JANELA_AVISO_ESPECIAL) {
    return { texto: `${inicio}: ${proxima.min} saem mais barato que ${anterior}`, menorPreco: false };
  }
  return { texto: `${inicio} para ${formatarReais(proxima.price)}/un`, menorPreco: false };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test tests/preco.test.mjs`
Expected: PASS — `ℹ pass 7`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add pedido-regras.js tests/preco.test.mjs
git commit -m "feat: regras de preco por faixa e aviso de proxima faixa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Regras do carrinho (`pedido-regras.js`, parte 2)

**Files:**
- Modify: `pedido-regras.js` (acrescentar ao final do arquivo)
- Test: `tests/carrinho.test.mjs`

**Interfaces:**
- Consumes: `CATEGORIAS`, `PRATOS`, `GRUPOS_ACOMPANHAMENTOS`, `MIN_POR_SABOR`, `ACOMPANHAMENTOS_POR_PRATO` (já importados na Task 2).
- Produces (exports novos de `pedido-regras.js`, todos devolvem **arrays novos**, sem alterar o recebido):
  - `encontrarPrato(nome: string): { nome, categoria, foto?, comAcompanhamentos: boolean } | null`
  - `ordenarAcompanhamentos(lista: string[]): string[]` — ordem do cardápio
  - `itemValido(item: unknown): boolean`
  - `chaveItem(item: Item): string` — `prato|acomp1|acomp2` com acompanhamentos ordenados
  - `adicionarItem(itens: Item[], novo: Item): Item[]` — soma na linha se a chave já existe
  - `alterarQuantidade(itens: Item[], chave: string, delta: number): Item[]` — remove se ficar abaixo de 2
  - `removerItem(itens: Item[], chave: string): Item[]`
  - `reinserirItem(itens: Item[], item: Item, indice: number): Item[]` — para o "Desfazer"
  - `quantidadePorPrato(itens: Item[]): Record<string, number>`
  - `validarCarrinhoSalvo(dados: unknown): Item[]`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/carrinho.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encontrarPrato, ordenarAcompanhamentos, chaveItem, adicionarItem, alterarQuantidade,
  removerItem, reinserirItem, quantidadePorPrato, validarCarrinhoSalvo,
} from '../pedido-regras.js';

const picadinho = (quantidade = 2, acompanhamentos = ['Grão de bico', 'Mix de legumes']) =>
  ({ prato: 'Picadinho', acompanhamentos, quantidade });
const macarrao = (quantidade = 2) => ({ prato: 'Macarrão à bolonhesa', acompanhamentos: [], quantidade });

test('acompanhamentos ficam na ordem do cardápio', () => {
  assert.deepEqual(ordenarAcompanhamentos(['Mix de legumes', 'Arroz branco']), ['Arroz branco', 'Mix de legumes']);
  assert.deepEqual(ordenarAcompanhamentos(['Purê de mandioquinha', 'Lentilha']), ['Lentilha', 'Purê de mandioquinha']);
});

test('mesma combinação em outra ordem tem a mesma chave', () => {
  assert.equal(
    chaveItem(picadinho(2, ['Mix de legumes', 'Grão de bico'])),
    chaveItem(picadinho(2, ['Grão de bico', 'Mix de legumes'])),
  );
  assert.notEqual(chaveItem(picadinho()), chaveItem(picadinho(2, ['Arroz branco', 'Lentilha'])));
});

test('combinação nova cria linha; repetida soma na mesma linha', () => {
  let itens = adicionarItem([], picadinho(2, ['Mix de legumes', 'Grão de bico']));
  assert.deepEqual(itens, [picadinho(2)]);
  itens = adicionarItem(itens, picadinho(3));
  assert.equal(itens.length, 1);
  assert.equal(itens[0].quantidade, 5);
  itens = adicionarItem(itens, macarrao());
  assert.equal(itens.length, 2);
});

test('adicionarItem não altera o array recebido', () => {
  const original = [picadinho()];
  adicionarItem(original, picadinho());
  assert.equal(original[0].quantidade, 2);
});

test('+ soma 1; – subtrai 1; – em 2 remove', () => {
  const chave = chaveItem(picadinho());
  let itens = [picadinho(2)];
  itens = alterarQuantidade(itens, chave, +1);
  assert.equal(itens[0].quantidade, 3);
  itens = alterarQuantidade(itens, chave, -1);
  assert.equal(itens[0].quantidade, 2);
  itens = alterarQuantidade(itens, chave, -1);
  assert.deepEqual(itens, []);
});

test('remover tira só o item da chave', () => {
  assert.deepEqual(removerItem([picadinho(), macarrao()], chaveItem(picadinho())), [macarrao()]);
});

test('desfazer reinsere na posição original', () => {
  assert.deepEqual(reinserirItem([macarrao()], picadinho(4), 0), [picadinho(4), macarrao()]);
  assert.deepEqual(reinserirItem([macarrao()], picadinho(4), 5), [macarrao(), picadinho(4)]);
});

test('desfazer soma se a combinação voltou ao pedido nesse meio-tempo', () => {
  assert.deepEqual(reinserirItem([picadinho(2)], picadinho(4), 0), [picadinho(6)]);
});

test('quantidade por prato soma todas as combinações do prato', () => {
  const itens = [picadinho(2), picadinho(3, ['Arroz branco', 'Lentilha']), macarrao(4)];
  assert.deepEqual(quantidadePorPrato(itens), { Picadinho: 5, 'Macarrão à bolonhesa': 4 });
});

test('encontrarPrato informa se o prato leva acompanhamento', () => {
  assert.equal(encontrarPrato('Picadinho').comAcompanhamentos, true);
  assert.equal(encontrarPrato('Panqueca de carne').comAcompanhamentos, false);
  assert.equal(encontrarPrato('Panquecas (carne ou frango)'), null);
});

test('carrinho salvo: mantém os válidos e descarta os inválidos', () => {
  const salvo = [
    picadinho(2),
    { prato: 'Fricassé de frango', acompanhamentos: ['Arroz branco', 'Lentilha'], quantidade: 2 },   // prato que saiu
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Batata frita'], quantidade: 2 },       // acompanhamento inexistente
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco'], quantidade: 2 },                       // só 1 acompanhamento
    { prato: 'Macarrão à bolonhesa', acompanhamentos: ['Arroz branco'], quantidade: 2 },            // prato único com acompanhamento
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Arroz branco'], quantidade: 2 },       // acompanhamento repetido
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Lentilha'], quantidade: 1 },           // abaixo do mínimo
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Lentilha'], quantidade: 2.5 },         // não inteiro
    null,
    'lixo',
    macarrao(3),
  ];
  assert.deepEqual(validarCarrinhoSalvo(salvo), [picadinho(2), macarrao(3)]);
});

test('carrinho salvo que não é lista vira pedido vazio', () => {
  assert.deepEqual(validarCarrinhoSalvo(null), []);
  assert.deepEqual(validarCarrinhoSalvo(undefined), []);
  assert.deepEqual(validarCarrinhoSalvo({ itens: [] }), []);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/carrinho.test.mjs`
Expected: FAIL com `SyntaxError: The requested module '../pedido-regras.js' does not provide an export named 'encontrarPrato'`.

- [ ] **Step 3: Acrescentar ao final de `pedido-regras.js`**

```js

// ---------- Cardápio ----------

const TODOS_ACOMPANHAMENTOS = GRUPOS_ACOMPANHAMENTOS.flatMap((g) => g.itens);

export function encontrarPrato(nome) {
  const prato = PRATOS.find((p) => p.nome === nome);
  if (!prato) return null;
  const categoria = CATEGORIAS.find((c) => c.id === prato.categoria);
  return { ...prato, comAcompanhamentos: categoria.comAcompanhamentos };
}

export function ordenarAcompanhamentos(lista) {
  return [...lista].sort((a, b) => TODOS_ACOMPANHAMENTOS.indexOf(a) - TODOS_ACOMPANHAMENTOS.indexOf(b));
}

export function itemValido(item) {
  if (!item || typeof item !== 'object') return false;
  const prato = encontrarPrato(item.prato);
  if (!prato || !Array.isArray(item.acompanhamentos)) return false;
  const acomp = item.acompanhamentos;
  const esperado = prato.comAcompanhamentos ? ACOMPANHAMENTOS_POR_PRATO : 0;
  return acomp.length === esperado
    && new Set(acomp).size === acomp.length
    && acomp.every((a) => TODOS_ACOMPANHAMENTOS.includes(a))
    && Number.isInteger(item.quantidade)
    && item.quantidade >= MIN_POR_SABOR;
}

// ---------- Carrinho ----------
// Todas as funções devolvem um array NOVO e nunca alteram o recebido.

/** @param {Item} item */
export function chaveItem(item) {
  return [item.prato, ...ordenarAcompanhamentos(item.acompanhamentos)].join('|');
}

/** @param {Item[]} itens @param {Item} novo */
export function adicionarItem(itens, novo) {
  const item = {
    prato: novo.prato,
    acompanhamentos: ordenarAcompanhamentos(novo.acompanhamentos),
    quantidade: novo.quantidade,
  };
  const chave = chaveItem(item);
  if (!itens.some((i) => chaveItem(i) === chave)) return [...itens, item];
  return itens.map((i) => (chaveItem(i) === chave ? { ...i, quantidade: i.quantidade + item.quantidade } : i));
}

export function alterarQuantidade(itens, chave, delta) {
  return itens
    .map((i) => (chaveItem(i) === chave ? { ...i, quantidade: i.quantidade + delta } : i))
    .filter((i) => i.quantidade >= MIN_POR_SABOR);
}

export function removerItem(itens, chave) {
  return itens.filter((i) => chaveItem(i) !== chave);
}

export function reinserirItem(itens, item, indice) {
  const chave = chaveItem(item);
  if (itens.some((i) => chaveItem(i) === chave)) return adicionarItem(itens, item);
  const copia = [...itens];
  copia.splice(Math.min(indice, copia.length), 0, {
    ...item,
    acompanhamentos: ordenarAcompanhamentos(item.acompanhamentos),
  });
  return copia;
}

export function quantidadePorPrato(itens) {
  return itens.reduce((mapa, i) => ({ ...mapa, [i.prato]: (mapa[i.prato] ?? 0) + i.quantidade }), {});
}

// Recebe o que veio do localStorage (qualquer coisa) e devolve só os itens válidos, já juntados.
export function validarCarrinhoSalvo(dados) {
  if (!Array.isArray(dados)) return [];
  return dados
    .filter(itemValido)
    .reduce((itens, i) => adicionarItem(itens, {
      prato: i.prato,
      acompanhamentos: i.acompanhamentos,
      quantidade: i.quantidade,
    }), []);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test tests/carrinho.test.mjs tests/preco.test.mjs`
Expected: PASS — `ℹ pass 19`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add pedido-regras.js tests/carrinho.test.mjs
git commit -m "feat: regras do carrinho (juncao, seletor, desfazer, validacao do salvo)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Mensagem e links do WhatsApp (`pedido-regras.js`, parte 3)

**Files:**
- Modify: `pedido-regras.js` (acrescentar ao final)
- Test: `tests/mensagem.test.mjs`

**Interfaces:**
- Consumes: `WHATSAPP` (importado na Task 2), `resumoValores` e `formatarReais` (Task 2).
- Produces:
  - `montarMensagem(nome: string, itens: Item[]): string`
  - `linkPedidoWhatsApp(nome: string, itens: Item[]): string`
  - `linkDuvidasWhatsApp(): string` → `'https://wa.me/5561983693411?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20entrega.'`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/mensagem.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarMensagem, linkPedidoWhatsApp, linkDuvidasWhatsApp } from '../pedido-regras.js';

const itens = [
  { prato: 'Carne desfiada', acompanhamentos: ['Arroz com brócolis', 'Mix de legumes'], quantidade: 4 },
  { prato: 'Macarrão à bolonhesa', acompanhamentos: [], quantidade: 2 },
];

test('mensagem com nome (texto exato)', () => {
  assert.equal(montarMensagem('  Mariana ', itens), [
    '*NOVO PEDIDO SÁLVIA PREMIUM*',
    '',
    'Meu nome é *Mariana* e este é meu pedido personalizado:',
    '',
    '- *4x CARNE DESFIADA*',
    '   _(Acomp: Arroz com brócolis + Mix de legumes)_',
    '',
    '- *2x MACARRÃO À BOLONHESA*',
    '',
    '_Preço por unidade: R$ 29,00_',
    '*VALOR TOTAL: R$ 174,00*',
    '_Qtde Total: 6 marmitas_',
  ].join('\n'));
});

test('mensagem sem nome', () => {
  const mensagem = montarMensagem('   ', itens);
  assert.ok(mensagem.includes('\nEste é meu pedido personalizado:\n'));
  assert.ok(!mensagem.includes('Meu nome é'));
});

test('link do pedido aponta para o número da Sálvia com o texto codificado', () => {
  const link = linkPedidoWhatsApp('Mariana', itens);
  assert.ok(link.startsWith('https://wa.me/5561983693411?text='));
  assert.equal(decodeURIComponent(link.split('?text=')[1]), montarMensagem('Mariana', itens));
});

test('link de dúvidas sobre entrega', () => {
  assert.equal(
    linkDuvidasWhatsApp(),
    'https://wa.me/5561983693411?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20entrega.',
  );
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/mensagem.test.mjs`
Expected: FAIL com `does not provide an export named 'montarMensagem'`.

- [ ] **Step 3: Acrescentar ao final de `pedido-regras.js`**

```js

// ---------- WhatsApp ----------

/** @param {string} nome @param {Item[]} itens */
export function montarMensagem(nome, itens) {
  const { quantidade, unitario, total } = resumoValores(itens);
  const nomeLimpo = (nome ?? '').trim();
  const abertura = nomeLimpo
    ? `Meu nome é *${nomeLimpo}* e este é meu pedido personalizado:`
    : 'Este é meu pedido personalizado:';
  const linhas = itens.map((i) => {
    const titulo = `- *${i.quantidade}x ${i.prato.toLocaleUpperCase('pt-BR')}*`;
    return i.acompanhamentos.length > 0
      ? `${titulo}\n   _(Acomp: ${i.acompanhamentos.join(' + ')})_`
      : titulo;
  });
  return [
    '*NOVO PEDIDO SÁLVIA PREMIUM*',
    '',
    abertura,
    '',
    linhas.join('\n\n'),
    '',
    `_Preço por unidade: ${formatarReais(unitario)}_`,
    `*VALOR TOTAL: ${formatarReais(total)}*`,
    `_Qtde Total: ${quantidade} marmitas_`,
  ].join('\n');
}

export function linkPedidoWhatsApp(nome, itens) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(montarMensagem(nome, itens))}`;
}

export function linkDuvidasWhatsApp() {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre a entrega.')}`;
}
```

- [ ] **Step 4: Rodar tudo e ver passar**

Run: `node --test`
Expected: PASS — `ℹ pass 31`, `ℹ fail 0` (8 + 7 + 12 + 4).

- [ ] **Step 5: Commit**

```bash
git add pedido-regras.js tests/mensagem.test.mjs
git commit -m "feat: mensagem e links do WhatsApp com preco por unidade

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Preços novos na landing, `_redirects` e saída do script antigo

**Files:**
- Modify: `index.html` (seção `#planos`: 3 preços e a observação do kit 20+)
- Modify: `_redirects`
- Delete: `scripts/verify-pricing.mjs`
- Test: `tests/paginas.test.mjs` (criar; nesta task só o teste da landing)

**Interfaces:**
- Consumes: `PRICING_TIERS` (Task 1), `resumoValores`, `formatarReais` (Task 2).
- Produces: `tests/paginas.test.mjs` com os helpers `ler(arquivo)` e `totalPara(q)`, que as Tasks 6 e 7 ampliam.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/paginas.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { PRICING_TIERS } from '../cardapio.js';
import { resumoValores, formatarReais, linkDuvidasWhatsApp } from '../pedido-regras.js';

const raiz = new URL('../', import.meta.url);
const ler = (arquivo) => readFileSync(new URL(arquivo, raiz), 'utf8');
const totalPara = (q) => resumoValores([{ prato: 'X', acompanhamentos: [], quantidade: q }]).total;

test('landing: cards dos kits 10, 15 e 20 batem com a tabela de preços', () => {
  const landing = ler('index.html');
  for (const q of [10, 15, 20]) {
    const [inteiro, centavos] = formatarReais(totalPara(q)).replace('R$ ', '').split(',');
    const trecho = `<span class="valor">R$ ${inteiro}</span><span class="centavo">,${centavos}</span>`;
    assert.ok(landing.includes(trecho), `kit ${q}: esperado ${trecho}`);
  }
  const menor = PRICING_TIERS[0];
  assert.ok(landing.includes(`${formatarReais(menor.price)}/un a partir de ${menor.min} unidades`));
});
```

(`statSync` e `linkDuvidasWhatsApp` já ficam importados porque as Tasks 6 e 7 acrescentam testes que os usam.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/paginas.test.mjs`
Expected: FAIL — `kit 10: esperado <span class="valor">R$ 260</span><span class="centavo">,00</span>`.

- [ ] **Step 3: Atualizar os preços em `index.html`**

Três substituições exatas na seção `#planos` (cada trecho antigo aparece uma única vez no arquivo):

| Trecho antigo | Trecho novo |
| --- | --- |
| `<span class="valor">R$ 240</span><span class="centavo">,00</span>` | `<span class="valor">R$ 260</span><span class="centavo">,00</span>` |
| `<span class="valor">R$ 352</span><span class="centavo">,50</span>` | `<span class="valor">R$ 382</span><span class="centavo">,50</span>` |
| `<span class="valor">R$ 460</span><span class="centavo">,00</span>` | `<span class="valor">R$ 500</span><span class="centavo">,00</span>` |
| `<p class="preco-obs">R$ 23,00/un a partir de 20 unidades</p>` | `<p class="preco-obs">R$ 25,00/un a partir de 20 unidades</p>` |

Nenhuma outra linha do `index.html` muda.

- [ ] **Step 4: Atualizar `_redirects`**

Conteúdo completo do arquivo:

```text
# Documentos internos (specs/planos), testes e scripts nao sao paginas do site
/docs/*     /index.html  404!
/tests/*    /index.html  404!
/scripts/*  /index.html  404!
```

- [ ] **Step 5: Remover o script antigo (substituído pelos testes)**

Run: `git rm scripts/verify-pricing.mjs`
Expected: `rm 'scripts/verify-pricing.mjs'`

- [ ] **Step 6: Rodar tudo e ver passar**

Run: `node --test`
Expected: PASS — `ℹ pass 32`, `ℹ fail 0`.

- [ ] **Step 7: Commit**

```bash
git add index.html _redirects tests/paginas.test.mjs
git commit -m "feat: precos novos nos cards da landing; testes substituem verify-pricing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Estrutura e visual da página (`pedido.html`, `pedido.css`, logo)

**Files:**
- Create: `assets/salvia-logo-topo.png`
- Rewrite: `pedido.html` (substituir o arquivo inteiro)
- Create: `pedido.css`
- Modify: `tests/paginas.test.mjs` (acrescentar 2 testes)

**Interfaces:**
- Consumes: `PRICING_TIERS` (Task 1), `formatarReais` (Task 2), `linkDuvidasWhatsApp` (Task 4).
- Produces (IDs e classes que `pedido.js`, na Task 7, usa):
  - IDs: `tela-cardapio`, `tela-resumo`, `faixas`, `lista-mais-pedidos`, `atalhos`, `lista-pratos`, `barra`, `barra-total`, `barra-aviso`, `painel-fundo`, `painel`, `aviso-rapido`
  - Cada faixa de preço: `<li class="faixa" data-min="N">`; destaque via classe `atual` + `aria-current="true"`
  - Botão da barra: `data-acao="ver-resumo"`
  - Classes de estado usadas pelo JS: `body.tem-barra`, `body.travado`, `.barra.pulso`, `.barra-aviso.menor-preco`, `.aviso-rapido.visivel`, `.aviso-rapido.sucesso`, `.botao-icone.remover`, `.atalho[aria-current="true"]`, `.chip[aria-pressed="true"]`
  - Classes de componentes que o JS gera: `combo`, `combo-textos`, `combo-prato`, `combo-acomp`, `botao`, `botao-principal`, `botao-largo`, `botao-icone`, `seletor`, `seletor-valor`, `atalho`, `grupo-pratos`, `titulo-categoria`, `prato`, `prato-foto`, `prato-nome`, `selo`, `prato-mais`, `painel-cabeca`, `painel-titulo`, `painel-contador`, `painel-corpo`, `grupo-acomp`, `grupo-titulo`, `chips`, `chip`, `painel-rodape`, `painel-dica`, `painel-acoes`, `painel-qtd`, `painel-qtd-rotulo`, `resumo-cabeca`, `resumo-lista`, `resumo-item`, `resumo-valores`, `linha-valor`, `total`, `resumo-aviso`, `info`, `campo`, `botao-whatsapp`, `nota`, `link-discreto`, `voltar-ajustar`, `vazio`, `aviso-desfazer`, `icone`

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao final de `tests/paginas.test.mjs`:

```js

test('pedido.html: faixa de preços escrita no HTML bate com PRICING_TIERS', () => {
  const html = ler('pedido.html');
  for (const t of PRICING_TIERS) {
    const trecho = `<li class="faixa" data-min="${t.min}"><span class="faixa-qtd">${t.label}</span><span class="faixa-preco">${formatarReais(t.price)}</span></li>`;
    assert.ok(html.includes(trecho), `faixa ${t.label}: esperado ${trecho}`);
  }
  assert.equal(html.split('class="faixa"').length - 1, PRICING_TIERS.length);
});

test('pedido.html: link de dúvidas é o mesmo gerado pelas regras', () => {
  assert.ok(ler('pedido.html').includes(`href="${linkDuvidasWhatsApp()}"`));
});

test('pedido.html: não bloqueia zoom nem carrega framework', () => {
  const html = ler('pedido.html');
  assert.ok(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">'));
  assert.ok(!/user-scalable|maximum-scale/.test(html));
  assert.ok(!/react|babel|tailwind|gsap/i.test(html));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/paginas.test.mjs`
Expected: FAIL — `faixa 20+: esperado <li class="faixa" data-min="20">...` (o `pedido.html` antigo não tem essa estrutura) e o teste de framework falha por causa de `react`/`babel`.

- [ ] **Step 3: Gerar o logo recortado**

O `assets/salvia-logo.png` atual tem 1024×682 px, 148 KB, fundo branco opaco e muito espaço vazio. A marca "SÁLVIA" com as folhas ocupa `x 279–775`, `y 213–326`. Recortar com margem (`270, 205, 515×130`) e reduzir para 64 px de altura (2× a altura exibida, para tela retina). Rodar no **PowerShell**:

```powershell
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("c:\Projetos\salvia\assets\salvia_logo.png")
$crop = New-Object System.Drawing.Rectangle 270, 205, 515, 130
$h = 64; $w = [int][math]::Round(515 * $h / 130)
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), $crop, [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save("c:\Projetos\salvia\assets\salvia-logo-topo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $src.Dispose()
"{0}x{1} {2} bytes" -f $w, $h, (Get-Item "c:\Projetos\salvia\assets\salvia-logo-topo.png").Length
```

Expected: `254x64 14025 bytes` (o tamanho pode variar alguns bytes). Abrir a imagem com a ferramenta Read e confirmar que mostra "SÁLVIA" com as duas folhas inteiras, sem cortes.

- [ ] **Step 4: Reescrever `pedido.html` (arquivo inteiro)**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#FFFFFF">
  <title>SÁLVIA | Monte seu pedido</title>
  <meta name="description" content="Monte seu pedido de marmitas fit ultracongeladas e envie pelo WhatsApp. Quanto mais marmitas, menor o preço de cada uma.">
  <link rel="icon" type="image/png" href="assets/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;500;700&family=Playfair+Display+SC:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="pedido.css">
  <script type="module" src="pedido.js"></script>
</head>
<body>
  <header class="topo">
    <img src="assets/salvia-logo-topo.png" alt="Sálvia" width="127" height="32">
  </header>

  <main id="tela-cardapio" class="coluna">
    <h1 class="titulo-pagina">Monte seu pedido</h1>
    <p class="subtitulo">Marmitas fit ultracongeladas para a sua semana</p>

    <ol class="passos" aria-label="Como funciona">
      <li><span class="passo-num" aria-hidden="true">1</span>Escolha seus pratos</li>
      <li><span class="passo-num" aria-hidden="true">2</span>Envie pelo WhatsApp</li>
      <li><span class="passo-num" aria-hidden="true">3</span>Receba congelado</li>
    </ol>
    <p class="info">
      <svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
      Aceitamos Alelo e Sodexo Refeição
    </p>
    <a class="link-discreto" href="https://wa.me/5561983693411?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20entrega.">Dúvidas sobre entrega? Fale com a gente no WhatsApp</a>

    <section class="precos" aria-labelledby="titulo-precos">
      <h2 id="titulo-precos" class="rotulo">Quanto mais, menor o preço de cada uma</h2>
      <ul class="faixas" id="faixas">
        <li class="faixa" data-min="1"><span class="faixa-qtd">1–4</span><span class="faixa-preco">R$ 31,00</span></li>
        <li class="faixa" data-min="5"><span class="faixa-qtd">5–9</span><span class="faixa-preco">R$ 29,00</span></li>
        <li class="faixa" data-min="10"><span class="faixa-qtd">10–14</span><span class="faixa-preco">R$ 26,00</span></li>
        <li class="faixa" data-min="15"><span class="faixa-qtd">15–19</span><span class="faixa-preco">R$ 25,50</span></li>
        <li class="faixa" data-min="20"><span class="faixa-qtd">20+</span><span class="faixa-preco">R$ 25,00</span></li>
      </ul>
    </section>

    <section class="secao mais-pedidos" aria-labelledby="titulo-mais-pedidos">
      <h2 id="titulo-mais-pedidos" class="titulo-secao">Mais pedidos</h2>
      <p class="apoio">Os favoritos dos clientes</p>
      <ul id="lista-mais-pedidos" class="lista-combos"></ul>
    </section>

    <section class="secao" aria-labelledby="titulo-monte">
      <h2 id="titulo-monte" class="titulo-secao">Monte do seu jeito</h2>
      <p class="apoio">Escolha a proteína e 2 acompanhamentos</p>
      <nav class="atalhos" id="atalhos" aria-label="Categorias"></nav>
      <div id="lista-pratos"></div>
    </section>
  </main>

  <main id="tela-resumo" class="coluna" hidden></main>

  <div id="barra" class="barra" hidden>
    <div class="barra-conteudo">
      <div class="barra-textos">
        <p class="barra-total" id="barra-total"></p>
        <p class="barra-aviso" id="barra-aviso" aria-live="polite"></p>
      </div>
      <button type="button" class="botao botao-principal" data-acao="ver-resumo">Ver pedido</button>
    </div>
  </div>

  <div id="painel-fundo" class="painel-fundo" hidden></div>
  <section id="painel" class="painel" role="dialog" aria-modal="true" aria-labelledby="painel-titulo" hidden></section>
  <div id="aviso-rapido" class="aviso-rapido" role="status" aria-live="polite"></div>

  <noscript><p class="coluna">Para montar seu pedido, ative o JavaScript ou fale com a gente pelo WhatsApp: (61) 98369-3411.</p></noscript>
</body>
</html>
```

- [ ] **Step 5: Criar `pedido.css`**

```css
/* Página de pedido. Cores e medidas só via tokens de :root (spec: "Direção visual"). */
:root {
  --laranja: #C2410C;            /* ação: botões e textos de ação (branco sobre ele: 5,3:1) */
  --laranja-escuro: #9A3412;     /* ação pressionada */
  --laranja-vivo: #EA580C;       /* só ícones, bordas de seleção e elementos grandes */
  --laranja-claro: #FFF7ED;      /* fundos de destaque */
  --laranja-sobre-escuro: #FDBA74;
  --verde: #1B5E20;              /* "deu certo" */
  --texto: #1A1A1A;
  --texto-2: #4A4A4A;
  --texto-3: #6B6B6B;
  --borda: #ECE7E2;
  --desabilitado: #EEE9E4;
  --fundo: #FFFFFF;
  --remover: #B3261E;
  --veu: rgba(26, 26, 26, 0.45);

  --fonte-titulo: 'Playfair Display SC', Georgia, serif;
  --fonte-texto: 'Karla', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  --t-pagina: 28px;
  --t-total: 22px;
  --t-secao: 20px;
  --t-prato: 17px;
  --t-corpo: 16px;
  --t-apoio: 15px;
  --t-rotulo: 13px;
  --t-minimo: 12px;

  --e-1: 4px;
  --e-2: 8px;
  --e-3: 12px;
  --e-4: 16px;
  --e-5: 24px;
  --e-6: 32px;

  --raio-escolha: 12px;
  --raio-cartao: 16px;
  --raio-painel: 24px;
  --raio-pilula: 999px;

  --sombra-cartao: 0 1px 3px rgba(26, 26, 26, 0.06);
  --sombra-flutuante: 0 -6px 24px rgba(26, 26, 26, 0.12);

  --toque: 44px;
  --toque-grande: 56px;
  --icone: 20px;
  --icone-pequeno: 16px;
  --largura-max: 480px;
  --altura-atalhos: 60px;
  --espaco-barra: 112px;
  --duracao: 200ms;
  --duracao-toque: 100ms;
}

*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  font-family: var(--fonte-texto);
  font-size: var(--t-corpo);
  line-height: 1.5;
  color: var(--texto);
  background: var(--fundo);
  -webkit-tap-highlight-color: transparent;
}
body.travado { overflow: hidden; }

p, h1, h2, h3, ul, ol { margin: 0; }
ul, ol { padding: 0; list-style: none; }
button, input { font: inherit; color: inherit; }
img { display: block; max-width: 100%; }

.icone { width: var(--icone); height: var(--icone); flex-shrink: 0; }
:focus-visible { outline: 3px solid var(--laranja-vivo); outline-offset: 2px; }

/* ---------- Estrutura ---------- */
.topo { max-width: var(--largura-max); margin: 0 auto; padding: var(--e-3) var(--e-4); }
.topo img { height: var(--e-6); width: auto; }

.coluna { max-width: var(--largura-max); margin: 0 auto; padding: 0 var(--e-4) var(--e-6); }
body.tem-barra .coluna { padding-bottom: calc(var(--espaco-barra) + env(safe-area-inset-bottom)); }

.titulo-pagina { font-family: var(--fonte-titulo); font-size: var(--t-pagina); font-weight: 700; line-height: 1.15; }
.subtitulo { margin-top: var(--e-1); font-size: var(--t-apoio); color: var(--texto-2); }

/* ---------- Como funciona ---------- */
.passos { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--e-2); margin-top: var(--e-4); }
.passos li { display: flex; align-items: center; gap: var(--e-2); font-size: var(--t-rotulo); line-height: 1.3; color: var(--texto-2); }
.passo-num {
  display: inline-grid; place-items: center; flex-shrink: 0;
  width: var(--e-5); height: var(--e-5);
  border-radius: var(--raio-pilula);
  background: var(--laranja-claro); color: var(--laranja);
  font-size: var(--t-minimo); font-weight: 700;
}
.info { display: flex; align-items: center; gap: var(--e-2); margin-top: var(--e-3); font-size: var(--t-rotulo); color: var(--texto-2); }
.info .icone { color: var(--laranja-vivo); }
.link-discreto {
  display: inline-flex; align-items: center; min-height: var(--toque); padding: 0;
  border: 0; background: none; cursor: pointer;
  color: var(--laranja); font-size: var(--t-rotulo); font-weight: 500;
  text-decoration: underline; text-underline-offset: 3px;
}

/* ---------- Faixa de preços ---------- */
.precos { margin-top: var(--e-2); }
.rotulo { margin-bottom: var(--e-2); font-size: var(--t-rotulo); font-weight: 500; color: var(--texto-3); }
.faixas { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--e-1); }
.faixa {
  display: flex; flex-direction: column; align-items: center;
  padding: var(--e-2) 0;
  border: 1px solid var(--borda); border-radius: var(--raio-escolha);
  text-align: center;
}
.faixa-qtd { font-size: var(--t-minimo); color: var(--texto-3); }
.faixa-preco { font-size: var(--t-rotulo); font-weight: 700; white-space: nowrap; }
.faixa.atual { border: 2px solid var(--laranja-vivo); background: var(--laranja-claro); padding: calc(var(--e-2) - 1px) 0; }
.faixa.atual .faixa-preco { color: var(--laranja); }

/* ---------- Seções ---------- */
.secao { margin-top: var(--e-5); }
.titulo-secao { font-family: var(--fonte-titulo); font-size: var(--t-secao); font-weight: 700; line-height: 1.2; }
.apoio { margin: 2px 0 var(--e-3); font-size: var(--t-apoio); color: var(--texto-2); }
.mais-pedidos { padding: var(--e-4); border-radius: var(--raio-cartao); background: var(--laranja-claro); }

/* ---------- Cartões (mais pedidos e resumo) ---------- */
.lista-combos, .resumo-lista { display: grid; gap: var(--e-2); }
.combo, .resumo-item {
  display: flex; align-items: center; gap: var(--e-3);
  padding: var(--e-3) var(--e-3) var(--e-3) var(--e-4);
  background: var(--fundo);
  border: 1px solid var(--borda); border-radius: var(--raio-cartao);
  box-shadow: var(--sombra-cartao);
}
.combo-textos { flex: 1; min-width: 0; }
.combo-prato { font-size: var(--t-prato); font-weight: 700; line-height: 1.3; }
.combo-acomp { margin-top: 2px; font-size: var(--t-apoio); line-height: 1.35; color: var(--texto-2); }

/* ---------- Botões ---------- */
.botao {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--e-2);
  min-height: var(--toque); min-width: var(--toque);
  padding: var(--e-2) var(--e-4);
  border: 0; border-radius: var(--raio-escolha);
  font-size: var(--t-apoio); font-weight: 700; line-height: 1.2;
  text-align: center; text-decoration: none;
  cursor: pointer; touch-action: manipulation;
  transition: transform var(--duracao-toque) ease-out, background-color 150ms ease-out;
}
.botao:active { transform: scale(0.97); }
.botao-principal { background: var(--laranja); color: var(--fundo); }
.botao-principal:active { background: var(--laranja-escuro); }
.botao:disabled { background: var(--desabilitado); color: var(--texto-2); cursor: not-allowed; transform: none; }
.botao-largo { flex: 1; }

.botao-icone {
  display: inline-grid; place-items: center; flex-shrink: 0;
  width: var(--toque); height: var(--toque); padding: 0;
  border: 1.5px solid var(--borda); border-radius: var(--raio-escolha);
  background: var(--fundo); color: var(--laranja);
  cursor: pointer; touch-action: manipulation;
  transition: transform var(--duracao-toque) ease-out, background-color 150ms ease-out;
}
.botao-icone:active { transform: scale(0.94); background: var(--laranja-claro); }
.botao-icone:disabled { background: var(--desabilitado); color: var(--texto-3); cursor: not-allowed; transform: none; }
.botao-icone.remover { color: var(--remover); }

.seletor { display: inline-flex; align-items: center; gap: var(--e-1); flex-shrink: 0; }
.seletor-valor { min-width: 28px; text-align: center; font-size: var(--t-prato); font-weight: 700; }

/* ---------- Atalhos e lista de pratos ---------- */
.atalhos {
  position: sticky; top: 0; z-index: 5;
  display: flex; gap: var(--e-2);
  margin: 0 calc(-1 * var(--e-4));
  padding: var(--e-2) var(--e-4);
  background: var(--fundo);
  overflow-x: auto; scrollbar-width: none;
}
.atalho {
  flex-shrink: 0; min-height: var(--toque); padding: 0 var(--e-4);
  border: 1.5px solid var(--borda); border-radius: var(--raio-pilula);
  background: var(--fundo);
  font-size: var(--t-apoio); font-weight: 500;
  cursor: pointer; touch-action: manipulation;
}
.atalho[aria-current="true"] { border-color: var(--laranja-vivo); background: var(--laranja-claro); color: var(--laranja); font-weight: 700; }

.grupo-pratos { scroll-margin-top: calc(var(--altura-atalhos) + var(--e-2)); }
.titulo-categoria { margin: var(--e-4) 0 var(--e-2); font-size: var(--t-apoio); font-weight: 700; color: var(--texto-2); }
.prato {
  display: flex; align-items: center; gap: var(--e-3);
  width: 100%; min-height: var(--toque-grande); margin-bottom: var(--e-2);
  padding: var(--e-2) var(--e-3) var(--e-2) var(--e-4);
  border: 1px solid var(--borda); border-radius: var(--raio-cartao);
  background: var(--fundo); text-align: left;
  cursor: pointer; touch-action: manipulation;
  transition: transform var(--duracao-toque) ease-out, border-color 150ms ease-out;
}
.prato:active { transform: scale(0.98); border-color: var(--laranja-vivo); }
.prato-foto { width: var(--toque-grande); height: var(--toque-grande); border-radius: var(--raio-escolha); object-fit: cover; }
.prato-nome { flex: 1; font-size: var(--t-prato); font-weight: 500; }
.selo {
  padding: 2px var(--e-2); border-radius: var(--raio-pilula);
  background: var(--laranja-claro); color: var(--laranja);
  font-size: var(--t-rotulo); font-weight: 700; white-space: nowrap;
}
.prato-mais {
  display: inline-grid; place-items: center; flex-shrink: 0;
  width: var(--e-6); height: var(--e-6); border-radius: var(--raio-pilula);
  background: var(--laranja-claro); color: var(--laranja);
}

/* ---------- Barra de baixo ---------- */
.barra {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  padding: var(--e-3) var(--e-4) calc(var(--e-3) + env(safe-area-inset-bottom));
  background: var(--fundo);
  border-top: 1px solid var(--borda);
  box-shadow: var(--sombra-flutuante);
}
.barra-conteudo { display: flex; align-items: center; gap: var(--e-3); max-width: var(--largura-max); margin: 0 auto; }
.barra-textos { flex: 1; min-width: 0; }
.barra-total { font-size: var(--t-prato); font-weight: 700; }
.barra-aviso { display: flex; align-items: center; gap: var(--e-1); margin-top: 2px; font-size: var(--t-rotulo); line-height: 1.3; color: var(--texto-2); }
.barra-aviso .icone { width: var(--icone-pequeno); height: var(--icone-pequeno); }
.barra-aviso.menor-preco { color: var(--verde); font-weight: 700; }
.barra.pulso { animation: pulso 250ms ease-out; }

/* ---------- Painel de montagem ---------- */
.painel-fundo { position: fixed; inset: 0; z-index: 30; background: var(--veu); animation: aparecer var(--duracao) ease-out; }
.painel {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 31;
  display: flex; flex-direction: column;
  max-width: var(--largura-max); max-height: 85vh; max-height: 85dvh;
  margin: 0 auto;
  background: var(--fundo);
  border-radius: var(--raio-painel) var(--raio-painel) 0 0;
  box-shadow: var(--sombra-flutuante);
  animation: subir var(--duracao) ease-out;
}
.painel-cabeca {
  display: flex; align-items: flex-start; justify-content: space-between; gap: var(--e-3);
  padding: var(--e-4) var(--e-4) var(--e-3);
  border-bottom: 1px solid var(--borda);
}
.painel-titulo { font-size: var(--t-secao); font-weight: 700; line-height: 1.25; }
.painel-contador { margin-top: 2px; font-size: var(--t-rotulo); color: var(--texto-2); }
.painel-corpo { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 0 var(--e-4) var(--e-4); }
.grupo-titulo { margin: var(--e-4) 0 var(--e-2); font-size: var(--t-rotulo); font-weight: 700; color: var(--texto-3); }
.chips { display: flex; flex-wrap: wrap; gap: var(--e-2); }
.chip {
  display: inline-flex; align-items: center; gap: var(--e-1);
  min-height: var(--toque); padding: var(--e-2) var(--e-3);
  border: 1.5px solid var(--borda); border-radius: var(--raio-escolha);
  background: var(--fundo);
  font-size: var(--t-apoio); font-weight: 500; text-align: left;
  cursor: pointer; touch-action: manipulation;
  transition: background-color 150ms ease-out, border-color 150ms ease-out;
}
.chip .icone { display: none; width: var(--icone-pequeno); height: var(--icone-pequeno); color: var(--laranja-vivo); }
.chip[aria-pressed="true"] { border-color: var(--laranja-vivo); background: var(--laranja-claro); font-weight: 700; }
.chip[aria-pressed="true"] .icone { display: block; }
.chip:disabled { opacity: 0.45; cursor: not-allowed; }
.painel-rodape {
  padding: var(--e-3) var(--e-4) calc(var(--e-3) + env(safe-area-inset-bottom));
  border-top: 1px solid var(--borda);
}
.painel-dica { margin-bottom: var(--e-2); font-size: var(--t-rotulo); color: var(--texto-2); }
.painel-acoes { display: flex; align-items: flex-end; gap: var(--e-3); }
.painel-qtd-rotulo { margin-bottom: 2px; font-size: var(--t-minimo); color: var(--texto-3); }

/* ---------- Resumo ---------- */
.resumo-cabeca { display: flex; align-items: center; gap: var(--e-3); margin: var(--e-4) 0; }
.resumo-cabeca .titulo-pagina:focus { outline: none; }
.resumo-valores { margin-top: var(--e-4); padding: var(--e-4); border-radius: var(--raio-cartao); background: var(--laranja-claro); }
.linha-valor { display: flex; justify-content: space-between; gap: var(--e-3); font-size: var(--t-apoio); color: var(--texto-2); }
.linha-valor + .linha-valor { margin-top: var(--e-1); }
.linha-valor.total {
  margin-top: var(--e-2); padding-top: var(--e-2);
  border-top: 1px solid var(--borda);
  font-size: var(--t-total); font-weight: 700; color: var(--texto);
}
.resumo-aviso { display: flex; align-items: center; gap: var(--e-1); margin-top: var(--e-2); font-size: var(--t-rotulo); color: var(--texto-2); }
.resumo-aviso .icone { width: var(--icone-pequeno); height: var(--icone-pequeno); }
.resumo-aviso.menor-preco { color: var(--verde); font-weight: 700; }
.campo { margin-top: var(--e-5); }
.campo label { display: block; margin-bottom: var(--e-1); font-size: var(--t-apoio); font-weight: 700; }
.campo input {
  width: 100%; min-height: 48px; padding: 0 var(--e-3);
  border: 1.5px solid var(--borda); border-radius: var(--raio-escolha);
  background: var(--fundo); font-size: var(--t-corpo);
}
.campo input:focus { border-color: var(--laranja-vivo); }
.botao-whatsapp { width: 100%; min-height: var(--toque-grande); margin-top: var(--e-4); font-size: var(--t-prato); }
.nota { margin-top: var(--e-2); text-align: center; font-size: var(--t-rotulo); color: var(--texto-2); }
.voltar-ajustar { display: flex; margin: var(--e-2) auto 0; }
.vazio { display: grid; justify-items: center; gap: var(--e-4); margin-top: var(--e-6); text-align: center; color: var(--texto-2); }

/* ---------- Aviso rápido ---------- */
.aviso-rapido {
  position: fixed; left: var(--e-4); right: var(--e-4); z-index: 40;
  bottom: calc(var(--e-4) + env(safe-area-inset-bottom));
  display: flex; align-items: center; justify-content: space-between; gap: var(--e-3);
  max-width: calc(var(--largura-max) - 2 * var(--e-4)); margin: 0 auto;
  padding: var(--e-3) var(--e-4);
  border-radius: var(--raio-escolha);
  background: var(--texto); color: var(--fundo);
  font-size: var(--t-apoio);
  opacity: 0; transform: translateY(var(--e-2)); pointer-events: none;
  transition: opacity var(--duracao) ease-out, transform var(--duracao) ease-out;
}
body.tem-barra .aviso-rapido { bottom: calc(var(--espaco-barra) + env(safe-area-inset-bottom)); }
.aviso-rapido.visivel { opacity: 1; transform: none; pointer-events: auto; }
.aviso-rapido.sucesso { background: var(--verde); }
.aviso-desfazer {
  min-height: var(--toque); padding: 0 var(--e-2);
  border: 0; background: none; cursor: pointer;
  color: var(--laranja-sobre-escuro); font-weight: 700;
}

/* ---------- Movimento ---------- */
@keyframes subir { from { transform: translateY(100%); } }
@keyframes aparecer { from { opacity: 0; } }
@keyframes pulso { 50% { transform: translateY(-3px); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `node --test`
Expected: PASS — `ℹ pass 35`, `ℹ fail 0`.

- [ ] **Step 7: Commit**

```bash
git add pedido.html pedido.css assets/salvia-logo-topo.png tests/paginas.test.mjs
git commit -m "feat: nova estrutura e visual da pagina de pedido (laranja + serifada, tokens)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Comportamento da página (`pedido.js`)

**Files:**
- Create: `pedido.js`
- Modify: `tests/paginas.test.mjs` (acrescentar o teste de orçamento de peso)

**Interfaces:**
- Consumes: todos os exports de `cardapio.js` (Task 1) e de `pedido-regras.js` (Tasks 2–4); os IDs, classes e `data-acao` da Task 6.
- Produces: a página funcionando. `data-acao` tratados: `mais-pedido`, `mais`, `menos`, `abrir-painel`, `fechar-painel`, `alternar-acomp`, `painel-mais`, `painel-menos`, `confirmar-painel`, `ir-secao`, `ver-resumo`, `voltar`, `desfazer`. Chave do `localStorage`: `salvia:carrinho:v1`, com o formato `{ itens: Item[], nome: string }`.

- [ ] **Step 1: Escrever o teste de orçamento que falha**

Acrescentar ao final de `tests/paginas.test.mjs`:

```js

test('orçamento de peso: HTML + CSS + JS próprios abaixo de 50 KB', () => {
  const arquivos = ['pedido.html', 'pedido.css', 'pedido.js', 'pedido-regras.js', 'cardapio.js'];
  const total = arquivos.reduce((soma, a) => soma + statSync(new URL(a, raiz)).size, 0);
  assert.ok(total < 50 * 1024, `total ${total} bytes`);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/paginas.test.mjs`
Expected: FAIL com `ENOENT: no such file or directory, stat '...pedido.js'`.

- [ ] **Step 3: Criar `pedido.js`**

```js
// Tela da página de pedido (pedido.html).
// Dados em cardapio.js; contas e regras (testadas) em pedido-regras.js.
// Aqui: montar HTML, reagir a toques, painel, resumo, avisos, histórico e salvar no aparelho.
import {
  CATEGORIAS, PRATOS, GRUPOS_ACOMPANHAMENTOS, MAIS_PEDIDOS, MIN_POR_SABOR, ACOMPANHAMENTOS_POR_PRATO,
} from './cardapio.js';
import {
  formatarReais, faixaDe, resumoValores, avisoFaixa, encontrarPrato, ordenarAcompanhamentos, chaveItem,
  adicionarItem, alterarQuantidade, removerItem, reinserirItem, quantidadePorPrato, validarCarrinhoSalvo,
  linkPedidoWhatsApp,
} from './pedido-regras.js';

const CHAVE_SALVO = 'salvia:carrinho:v1';
const DURACAO_AVISO = 3000;
const DURACAO_DESFAZER = 5000;

// Ícones em traço (estilo Lucide, licença ISC). O do WhatsApp é preenchido (Simple Icons, CC0).
const TRACOS = {
  mais: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  menos: '<path d="M5 12h14"/>',
  lixeira: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  voltar: '<path d="m15 18-6-6 6-6"/>',
  cartao: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
};
const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

const $ = (id) => document.getElementById(id);
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

function icone(nome) {
  return `<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACOS[nome]}</svg>`;
}

function iconeWhatsApp() {
  return `<svg class="icone" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WHATSAPP_PATH}"/></svg>`;
}

function esc(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Estado ----------

const estado = {
  itens: [],            // Item[] — sempre na forma { prato, acompanhamentos, quantidade }
  nome: '',
  painel: null,         // { prato, comAcompanhamentos, acompanhamentos: string[], quantidade } quando aberto
  rolagemCardapio: 0,
};
let telaMostrada = null;        // 'cardapio' | 'resumo'
let navegouParaResumo = false;  // true quando o resumo foi aberto pelo botão (dá para usar history.back())
let totalAnterior = null;
let temporizadorAviso = null;
let desfazerPendente = null;

// ---------- Salvamento no aparelho ----------

function carregar() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_SALVO) ?? 'null');
    estado.itens = validarCarrinhoSalvo(bruto?.itens);
    estado.nome = typeof bruto?.nome === 'string' ? bruto.nome : '';
  } catch {
    estado.itens = [];
    estado.nome = '';
  }
}

function salvar() {
  try {
    localStorage.setItem(CHAVE_SALVO, JSON.stringify({ itens: estado.itens, nome: estado.nome }));
  } catch {
    // Navegação anônima ou armazenamento bloqueado: a página segue funcionando, só sem salvar.
  }
}

function mudarItens(novos) {
  estado.itens = novos;
  salvar();
  renderTudo();
}

// ---------- Peças de HTML ----------

function seletor(chave, quantidade, rotulo) {
  const noMinimo = quantidade <= MIN_POR_SABOR;
  return `<div class="seletor">
      <button type="button" class="botao-icone${noMinimo ? ' remover' : ''}" data-acao="menos" data-chave="${esc(chave)}"
        aria-label="${noMinimo ? 'Remover' : 'Diminuir'} ${esc(rotulo)}">${icone(noMinimo ? 'lixeira' : 'menos')}</button>
      <span class="seletor-valor">${quantidade}</span>
      <button type="button" class="botao-icone" data-acao="mais" data-chave="${esc(chave)}"
        aria-label="Aumentar ${esc(rotulo)}">${icone('mais')}</button>
    </div>`;
}

// ---------- Cardápio ----------

function renderMaisPedidos() {
  $('lista-mais-pedidos').innerHTML = MAIS_PEDIDOS.map((combo, indice) => {
    const chave = chaveItem({ ...combo, quantidade: 0 });
    const noPedido = estado.itens.find((i) => chaveItem(i) === chave);
    const acao = noPedido
      ? seletor(chave, noPedido.quantidade, combo.prato)
      : `<button type="button" class="botao botao-principal" data-acao="mais-pedido" data-indice="${indice}">Adicionar 2</button>`;
    return `<li class="combo">
        <div class="combo-textos">
          <p class="combo-prato">${esc(combo.prato)}</p>
          <p class="combo-acomp">${esc(ordenarAcompanhamentos(combo.acompanhamentos).join(' + '))}</p>
        </div>
        ${acao}
      </li>`;
  }).join('');
}

function renderAtalhos() {
  $('atalhos').innerHTML = CATEGORIAS.map((c) =>
    `<button type="button" class="atalho" data-acao="ir-secao" data-secao="sec-${c.id}">${esc(c.label)}</button>`).join('');
}

// Montada uma vez só; depois só os selos mudam (o observador de seções depende desses elementos).
function renderPratos() {
  $('lista-pratos').innerHTML = CATEGORIAS.map((c) => `
    <section class="grupo-pratos" id="sec-${c.id}" aria-labelledby="tit-${c.id}">
      <h3 class="titulo-categoria" id="tit-${c.id}">${esc(c.label)}</h3>
      ${PRATOS.filter((p) => p.categoria === c.id).map((p) => `
        <button type="button" class="prato" data-acao="abrir-painel" data-prato="${esc(p.nome)}">
          ${p.foto ? `<img class="prato-foto" src="${esc(p.foto)}" alt="" width="56" height="56" loading="lazy">` : ''}
          <span class="prato-nome">${esc(p.nome)}</span>
          <span class="selo" data-selo="${esc(p.nome)}" hidden></span>
          <span class="prato-mais" aria-hidden="true">${icone('mais')}</span>
        </button>`).join('')}
    </section>`).join('');
}

function atualizarSelos() {
  const porPrato = quantidadePorPrato(estado.itens);
  document.querySelectorAll('.selo[data-selo]').forEach((el) => {
    const qtd = porPrato[el.dataset.selo] ?? 0;
    el.hidden = qtd === 0;
    el.textContent = qtd > 0 ? `${qtd} no pedido` : '';
  });
}

function atualizarFaixas(quantidade) {
  const atual = faixaDe(quantidade);
  document.querySelectorAll('#faixas .faixa').forEach((el) => {
    const ativa = atual !== null && Number(el.dataset.min) === atual.min;
    el.classList.toggle('atual', ativa);
    if (ativa) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
}

function irParaSecao(id) {
  $(id)?.scrollIntoView({ behavior: reduzirMovimento.matches ? 'auto' : 'smooth', block: 'start' });
}

function observarSecoes() {
  if (!('IntersectionObserver' in window)) return;
  const visiveis = new Map();
  const ids = CATEGORIAS.map((c) => `sec-${c.id}`);
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => visiveis.set(e.target.id, e.isIntersecting));
    const ativa = ids.find((id) => visiveis.get(id));
    document.querySelectorAll('.atalho').forEach((b) => {
      if (b.dataset.secao === ativa) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }, { rootMargin: '-70px 0px -60% 0px' });
  ids.forEach((id) => observador.observe($(id)));
}

// ---------- Barra de baixo ----------

function pulsar(el) {
  el.classList.remove('pulso');
  void el.offsetWidth; // reinicia a animação
  el.classList.add('pulso');
}

function atualizarBarra() {
  const { quantidade, total } = resumoValores(estado.itens);
  const barra = $('barra');
  barra.hidden = quantidade === 0 || telaAtual() === 'resumo';
  document.body.classList.toggle('tem-barra', !barra.hidden);
  if (quantidade === 0) {
    totalAnterior = 0;
    return;
  }
  $('barra-total').textContent = `${quantidade} marmitas · ${formatarReais(total)}`;
  const aviso = avisoFaixa(quantidade);
  const elAviso = $('barra-aviso');
  elAviso.classList.toggle('menor-preco', aviso.menorPreco);
  elAviso.innerHTML = `${aviso.menorPreco ? icone('check') : ''}<span>${esc(aviso.texto)}</span>`;
  if (totalAnterior !== null && totalAnterior !== total && !barra.hidden) pulsar(barra);
  totalAnterior = total;
}

// ---------- Aviso rápido ----------

function avisar(texto, { tipo = 'neutro', desfazer = null } = {}) {
  const el = $('aviso-rapido');
  clearTimeout(temporizadorAviso);
  desfazerPendente = desfazer;
  el.className = `aviso-rapido visivel${tipo === 'sucesso' ? ' sucesso' : ''}`;
  el.innerHTML = `<span>${esc(texto)}</span>${desfazer ? '<button type="button" class="aviso-desfazer" data-acao="desfazer">Desfazer</button>' : ''}`;
  temporizadorAviso = setTimeout(esconderAviso, desfazer ? DURACAO_DESFAZER : DURACAO_AVISO);
}

function esconderAviso() {
  const el = $('aviso-rapido');
  clearTimeout(temporizadorAviso);
  el.classList.remove('visivel');
  desfazerPendente = null;
  setTimeout(() => { if (!el.classList.contains('visivel')) el.innerHTML = ''; }, 300);
}

function removerComDesfazer(chave) {
  const indice = estado.itens.findIndex((i) => chaveItem(i) === chave);
  if (indice === -1) return;
  const item = estado.itens[indice];
  mudarItens(removerItem(estado.itens, chave));
  avisar('Item removido', { desfazer: () => mudarItens(reinserirItem(estado.itens, item, indice)) });
}

// ---------- Painel de montagem ----------

function abrirPainel(nomePrato) {
  const prato = encontrarPrato(nomePrato);
  if (!prato) return;
  estado.painel = {
    prato: prato.nome,
    comAcompanhamentos: prato.comAcompanhamentos,
    acompanhamentos: [],
    quantidade: MIN_POR_SABOR,
  };
  const corpo = prato.comAcompanhamentos
    ? `<div class="painel-corpo">
        ${GRUPOS_ACOMPANHAMENTOS.map((g) => `
          <div class="grupo-acomp" role="group" aria-label="${esc(g.titulo)}">
            <h3 class="grupo-titulo">${esc(g.titulo)}</h3>
            <div class="chips">
              ${g.itens.map((a) => `<button type="button" class="chip" data-acao="alternar-acomp" data-acomp="${esc(a)}" aria-pressed="false">${icone('check')}<span>${esc(a)}</span></button>`).join('')}
            </div>
          </div>`).join('')}
      </div>`
    : '';
  const painel = $('painel');
  painel.innerHTML = `
    <div class="painel-cabeca">
      <div>
        <h2 class="painel-titulo" id="painel-titulo">${esc(prato.nome)}</h2>
        <p class="painel-contador" id="painel-contador">${prato.comAcompanhamentos ? '' : 'Prato completo, sem acompanhamentos'}</p>
      </div>
      <button type="button" class="botao-icone" data-acao="fechar-painel" aria-label="Fechar">${icone('fechar')}</button>
    </div>
    ${corpo}
    <div class="painel-rodape">
      <p class="painel-dica" id="painel-dica" hidden>Desmarque um para trocar</p>
      <div class="painel-acoes">
        <div>
          <p class="painel-qtd-rotulo">Quantas? (mínimo ${MIN_POR_SABOR} por sabor)</p>
          <div class="seletor">
            <button type="button" class="botao-icone" data-acao="painel-menos" aria-label="Diminuir quantidade">${icone('menos')}</button>
            <span class="seletor-valor" id="painel-qtd"></span>
            <button type="button" class="botao-icone" data-acao="painel-mais" aria-label="Aumentar quantidade">${icone('mais')}</button>
          </div>
        </div>
        <button type="button" class="botao botao-principal botao-largo" data-acao="confirmar-painel" id="painel-confirmar"></button>
      </div>
    </div>`;
  $('painel-fundo').hidden = false;
  painel.hidden = false;
  document.body.classList.add('travado');
  atualizarPainel();
  history.pushState({ painel: true }, '');
  painel.querySelector('[data-acao="fechar-painel"]').focus();
}

function faltamAcompanhamentos() {
  const p = estado.painel;
  return p.comAcompanhamentos ? ACOMPANHAMENTOS_POR_PRATO - p.acompanhamentos.length : 0;
}

function atualizarPainel() {
  const p = estado.painel;
  if (!p) return;
  const faltam = faltamAcompanhamentos();
  if (p.comAcompanhamentos) {
    $('painel-contador').textContent =
      `Escolha ${ACOMPANHAMENTOS_POR_PRATO} acompanhamentos (${p.acompanhamentos.length}/${ACOMPANHAMENTOS_POR_PRATO})`;
    document.querySelectorAll('#painel .chip').forEach((chip) => {
      const marcado = p.acompanhamentos.includes(chip.dataset.acomp);
      chip.setAttribute('aria-pressed', String(marcado));
      chip.disabled = !marcado && faltam === 0;
    });
    $('painel-dica').hidden = faltam !== 0;
  }
  $('painel-qtd').textContent = String(p.quantidade);
  document.querySelector('#painel [data-acao="painel-menos"]').disabled = p.quantidade <= MIN_POR_SABOR;
  const confirmar = $('painel-confirmar');
  confirmar.disabled = faltam > 0;
  confirmar.textContent = faltam > 0
    ? `Escolha mais ${faltam} acompanhamento${faltam > 1 ? 's' : ''}`
    : 'Adicionar ao pedido';
}

function alternarAcompanhamento(nome) {
  const p = estado.painel;
  if (!p) return;
  if (p.acompanhamentos.includes(nome)) {
    p.acompanhamentos = p.acompanhamentos.filter((a) => a !== nome);
  } else if (p.acompanhamentos.length < ACOMPANHAMENTOS_POR_PRATO) {
    p.acompanhamentos = [...p.acompanhamentos, nome];
  }
  atualizarPainel();
}

function fecharPainel({ viaHistorico = false } = {}) {
  const p = estado.painel;
  if (!p) return;
  estado.painel = null;
  $('painel').hidden = true;
  $('painel').innerHTML = '';
  $('painel-fundo').hidden = true;
  document.body.classList.remove('travado');
  if (!viaHistorico && history.state?.painel) history.back();
  document.querySelector(`.prato[data-prato="${CSS.escape(p.prato)}"]`)?.focus({ preventScroll: true });
}

function confirmarPainel() {
  const p = estado.painel;
  if (!p || faltamAcompanhamentos() > 0) return;
  mudarItens(adicionarItem(estado.itens, { prato: p.prato, acompanhamentos: p.acompanhamentos, quantidade: p.quantidade }));
  fecharPainel();
  avisar(`${p.prato} ×${p.quantidade} adicionado`, { tipo: 'sucesso' });
}

// ---------- Resumo ----------

function telaAtual() {
  return location.hash === '#resumo' ? 'resumo' : 'cardapio';
}

function renderResumo() {
  const { quantidade, unitario, total } = resumoValores(estado.itens);
  const tela = $('tela-resumo');
  if (quantidade === 0) {
    tela.innerHTML = `
      <div class="resumo-cabeca">
        <h1 class="titulo-pagina" id="resumo-titulo" tabindex="-1">Seu pedido</h1>
      </div>
      <div class="vazio">
        <p>Seu pedido está vazio.</p>
        <button type="button" class="botao botao-principal" data-acao="voltar">Ver cardápio</button>
      </div>`;
    return;
  }
  const aviso = avisoFaixa(quantidade);
  tela.innerHTML = `
    <div class="resumo-cabeca">
      <button type="button" class="botao-icone" data-acao="voltar" aria-label="Voltar ao cardápio">${icone('voltar')}</button>
      <h1 class="titulo-pagina" id="resumo-titulo" tabindex="-1">Seu pedido</h1>
    </div>
    <ul class="resumo-lista">
      ${estado.itens.map((i) => `
        <li class="resumo-item">
          <div class="combo-textos">
            <p class="combo-prato">${esc(i.prato)}</p>
            ${i.acompanhamentos.length ? `<p class="combo-acomp">${esc(i.acompanhamentos.join(' + '))}</p>` : ''}
          </div>
          ${seletor(chaveItem(i), i.quantidade, i.prato)}
        </li>`).join('')}
    </ul>
    <div class="resumo-valores">
      <p class="linha-valor"><span>Marmitas</span><span>${quantidade}</span></p>
      <p class="linha-valor"><span>Preço por unidade</span><span>${formatarReais(unitario)}</span></p>
      <p class="linha-valor total"><span>Total</span><span>${formatarReais(total)}</span></p>
      <p class="resumo-aviso${aviso.menorPreco ? ' menor-preco' : ''}">${aviso.menorPreco ? icone('check') : ''}<span>${esc(aviso.texto)}</span></p>
      <p class="info">${icone('cartao')}Aceitamos Alelo e Sodexo Refeição</p>
    </div>
    <div class="campo">
      <label for="campo-nome">Seu nome (opcional)</label>
      <input id="campo-nome" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="done" value="${esc(estado.nome)}">
    </div>
    <a class="botao botao-principal botao-whatsapp" id="link-whatsapp" href="${esc(linkPedidoWhatsApp(estado.nome, estado.itens))}">${iconeWhatsApp()}Enviar pedido pelo WhatsApp</a>
    <p class="nota">Você confere a mensagem no WhatsApp antes de enviar.</p>
    <button type="button" class="link-discreto voltar-ajustar" data-acao="voltar">Voltar e ajustar</button>`;
}

function mostrarTela() {
  const tela = telaAtual();
  if (tela === 'resumo') renderResumo();
  if (tela === telaMostrada) return;
  const primeira = telaMostrada === null;
  if (tela === 'resumo' && !primeira) estado.rolagemCardapio = window.scrollY;
  if (tela === 'cardapio') navegouParaResumo = false;
  $('tela-cardapio').hidden = tela !== 'cardapio';
  $('tela-resumo').hidden = tela !== 'resumo';
  telaMostrada = tela;
  atualizarBarra();
  if (tela === 'resumo') {
    window.scrollTo(0, 0);
    if (!primeira) $('resumo-titulo').focus({ preventScroll: true });
  } else if (!primeira) {
    window.scrollTo(0, estado.rolagemCardapio);
  }
}

function voltarAoCardapio() {
  if (navegouParaResumo) {
    history.back();
  } else {
    history.replaceState(null, '', location.pathname + location.search);
    mostrarTela();
  }
}

// ---------- Tudo junto ----------

function renderTudo() {
  const { quantidade } = resumoValores(estado.itens);
  renderMaisPedidos();
  atualizarSelos();
  atualizarFaixas(quantidade);
  atualizarBarra();
  if (telaMostrada === 'resumo') renderResumo();
}

function refocar(acao, chave) {
  const tela = telaMostrada === 'resumo' ? 'tela-resumo' : 'tela-cardapio';
  document.querySelector(`#${tela} [data-acao="${acao}"][data-chave="${CSS.escape(chave)}"]`)?.focus({ preventScroll: true });
}

document.addEventListener('click', (evento) => {
  const alvo = evento.target.closest('[data-acao]');
  if (!alvo) return;
  const { acao, chave } = alvo.dataset;
  switch (acao) {
    case 'mais-pedido': {
      const combo = MAIS_PEDIDOS[Number(alvo.dataset.indice)];
      mudarItens(adicionarItem(estado.itens, { ...combo, quantidade: MIN_POR_SABOR }));
      avisar(`${combo.prato} ×${MIN_POR_SABOR} adicionado`, { tipo: 'sucesso' });
      refocar('mais', chaveItem({ ...combo, quantidade: 0 }));
      break;
    }
    case 'mais':
      mudarItens(alterarQuantidade(estado.itens, chave, +1));
      refocar('mais', chave);
      break;
    case 'menos': {
      const item = estado.itens.find((i) => chaveItem(i) === chave);
      if (!item) break;
      if (item.quantidade <= MIN_POR_SABOR) {
        removerComDesfazer(chave);
      } else {
        mudarItens(alterarQuantidade(estado.itens, chave, -1));
        refocar('menos', chave);
      }
      break;
    }
    case 'abrir-painel': abrirPainel(alvo.dataset.prato); break;
    case 'fechar-painel': fecharPainel(); break;
    case 'alternar-acomp': alternarAcompanhamento(alvo.dataset.acomp); break;
    case 'painel-mais':
      estado.painel.quantidade += 1;
      atualizarPainel();
      break;
    case 'painel-menos':
      estado.painel.quantidade = Math.max(MIN_POR_SABOR, estado.painel.quantidade - 1);
      atualizarPainel();
      break;
    case 'confirmar-painel': confirmarPainel(); break;
    case 'ir-secao': irParaSecao(alvo.dataset.secao); break;
    case 'ver-resumo':
      navegouParaResumo = true;
      location.hash = 'resumo';
      break;
    case 'voltar': voltarAoCardapio(); break;
    case 'desfazer': {
      const desfazer = desfazerPendente;
      esconderAviso();
      desfazer?.();
      break;
    }
    default: break;
  }
});

document.addEventListener('input', (evento) => {
  if (evento.target.id !== 'campo-nome') return;
  estado.nome = evento.target.value;
  salvar();
  const link = $('link-whatsapp');
  if (link) link.href = linkPedidoWhatsApp(estado.nome, estado.itens);
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && estado.painel) fecharPainel();
});

$('painel-fundo').addEventListener('click', () => fecharPainel());

// Botão voltar do celular: fecha o painel (se aberto) e alterna entre cardápio e resumo sem sair do site.
window.addEventListener('popstate', () => {
  if (estado.painel && !history.state?.painel) fecharPainel({ viaHistorico: true });
  mostrarTela();
});
window.addEventListener('hashchange', mostrarTela);

function iniciar() {
  history.scrollRestoration = 'manual';
  if (history.state?.painel) history.replaceState(null, '');
  carregar();
  renderAtalhos();
  renderPratos();
  observarSecoes();
  renderTudo();
  mostrarTela();
}

iniciar();
```

- [ ] **Step 4: Conferir a sintaxe do módulo**

Run: `node --check pedido.js`
Expected: nenhuma saída e código de saída 0. (O `node --check` só valida a sintaxe; ele não executa o código, que depende do navegador.)

- [ ] **Step 5: Rodar todos os testes**

Run: `node --test`
Expected: PASS — `ℹ pass 36`, `ℹ fail 0`. Se o teste de orçamento falhar, o total em bytes aparece na mensagem: reduza comentários longos ou CSS repetido até ficar abaixo de 51.200 bytes.

- [ ] **Step 6: Commit**

```bash
git add pedido.js tests/paginas.test.mjs
git commit -m "feat: comportamento da nova pagina de pedido (painel, mais pedidos, resumo, desfazer)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Verificação no navegador (roteiro da spec)

**Files:**
- Modify (somente se o roteiro encontrar problema): `pedido.css`, `pedido.js`, `pedido.html`

**Interfaces:**
- Consumes: a página completa das Tasks 1–7.
- Produces: a página verificada, mais o relatório do que foi conferido e do que foi corrigido.

- [ ] **Step 1: Subir um servidor local**

Run (em segundo plano, a partir da raiz do repositório): `python -m http.server 8080 --bind 127.0.0.1`
Expected: `Serving HTTP on 127.0.0.1 port 8080`. Página: `http://127.0.0.1:8080/pedido.html`.

- [ ] **Step 2: Abrir no navegador**

Carregar a skill de navegador disponível na sessão (`anthropic-skills:built-in-browser` ou `anthropic-skills:chrome-browser`) e abrir a página. Antes de começar, rodar no console `localStorage.clear()` e recarregar.

- [ ] **Step 3: Conferir a primeira tela (375×560, simulando o navegador do Instagram num iPhone SE)**

Ajustar a janela ou viewport para **375×560**, recarregar, tirar print e rodar no console:

```js
document.querySelector('.combo').getBoundingClientRect().bottom <= window.innerHeight
```

Expected: `true`. Se der `false`, reduzir nesta ordem e conferir de novo: `.passos { margin-top }` de `--e-4` para `--e-3`; `.info { margin-top }` de `--e-3` para `--e-2`; `.secao { margin-top }` de `--e-5` para `--e-4`.

- [ ] **Step 4: Conferir alvos de toque e textos mínimos (em 360, 375 e 414 px)**

Em cada largura, rodar no console:

```js
[...document.querySelectorAll('button, a, input')]
  .filter((el) => el.offsetParent !== null)
  .map((el) => ({ el: (el.textContent.trim() || el.getAttribute('aria-label') || el.id).slice(0, 40), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
  .filter((x) => x.w < 44 || x.h < 44)
```

Expected: `[]`. Também conferir no print que nenhuma faixa de preço quebra ou corta o "R$ 25,50" em **360 px**. Se cortar, trocar `.faixa-preco { font-size }` para `var(--t-minimo)`.

- [ ] **Step 5: Percorrer o roteiro (375 px) e conferir cada resultado**

| # | Ação | Resultado esperado |
| --- | --- | --- |
| 1 | "Adicionar 2" em **Carne desfiada** (Mais pedidos) | O cartão vira `[lixeira] 2 [+]`; aviso verde "Carne desfiada ×2 adicionado" some em ~3 s; a barra aparece com "2 marmitas · R$ 62,00" e "Faltam 3 para R$ 29,00/un"; a faixa "1–4" fica destacada; o selo "2 no pedido" aparece em Carne desfiada na lista |
| 2 | Tocar no atalho **Frangos** | A página rola até "Frangos" com o título visível (não escondido atrás dos atalhos); o atalho "Frangos" fica marcado |
| 3 | Tocar em **Picadinho** | O painel sobe; o contador mostra "Escolha 2 acompanhamentos (0/2)"; o botão mostra "Escolha mais 2 acompanhamentos", desabilitado; a quantidade e o botão ficam visíveis no rodapé sem rolar |
| 4 | Marcar "Grão de bico" e "Mix de legumes" | O contador fica (2/2); os outros botões ficam esmaecidos; aparece "Desmarque um para trocar"; o botão vira "Adicionar ao pedido" |
| 5 | Rolar a lista de acompanhamentos até o fim | Só a lista rola; o fundo da página não se mexe; o rodapé continua fixo |
| 6 | [+] duas vezes e depois "Adicionar ao pedido" | O painel fecha; aviso "Picadinho ×4 adicionado"; barra com "6 marmitas · R$ 174,00" e "Faltam 4 para R$ 26,00/un"; a barra dá um pulso |
| 7 | Abrir **Macarrão à bolonhesa** | O painel mostra só a quantidade e "Prato completo, sem acompanhamentos"; adicionar 2 → barra com "8 marmitas · R$ 232,00" e "Faltam 2: 10 saem mais barato que 9" |
| 8 | Abrir **Sobrecoxa** e usar o **voltar** do navegador | O painel fecha e a página continua no site, sem sair |
| 9 | Abrir **Sobrecoxa**, tocar no fundo escuro | O painel fecha |
| 10 | Em Carne desfiada (Mais pedidos), [+] duas vezes | Barra com "10 marmitas · R$ 260,00" e "Faltam 5 para R$ 25,50/un"; faixa "10–14" destacada |
| 11 | "Ver pedido" | O resumo abre no topo com "Seu pedido", 3 itens (os acompanhamentos aparecem na ordem do cardápio), Marmitas 10, Preço por unidade R$ 26,00, Total R$ 260,00; a barra some |
| 12 | No resumo, lixeira de **Macarrão à bolonhesa** (está em 2) | O item some; aviso "Item removido · Desfazer"; o total vira R$ 232,00 |
| 13 | "Desfazer" | O Macarrão volta na mesma posição; total R$ 260,00 |
| 14 | Digitar "Mariana" em "Seu nome (opcional)" e conferir o `href` de "Enviar pedido pelo WhatsApp" | `decodeURIComponent` do `href` traz "Meu nome é *Mariana*", os 3 itens e "*VALOR TOTAL: R$ 260,00*" |
| 15 | Voltar do navegador | Volta ao cardápio na mesma posição de rolagem em que estava |
| 16 | Recarregar a página | O pedido (10 marmitas) e o nome continuam lá |
| 17 | Somar itens até 20 (por exemplo, [+] nos Mais pedidos) | Barra "Você está no menor preço: R$ 25,00/un", em verde e com check; faixa "20+" destacada |
| 18 | Abrir `http://127.0.0.1:8080/pedido.html#resumo` numa aba anônima | "Seu pedido está vazio." e o botão "Ver cardápio", que leva ao cardápio |
| 19 | Rodar `localStorage.setItem('salvia:carrinho:v1', '{quebrado')` no console e recarregar | A página abre normalmente, com o pedido vazio |
| 20 | Abrir `http://127.0.0.1:8080/pedido.html?kit=20` | A página abre normalmente |

Também conferir em **414 px** e com a janela larga de computador: a coluna fica centralizada, com no máximo 480 px, e o painel também fica centralizado.

- [ ] **Step 6: Conferir o visual nos prints**

Expected nos prints: título e títulos de seção em Playfair Display SC; o resto em Karla; botões principais em laranja com texto branco; logo nítido, sem retângulo em volta; o ícone do WhatsApp aparece certo (se aparecer deformado, trocar `WHATSAPP_PATH` pelo path oficial do Simple Icons "whatsapp").

- [ ] **Step 7: Rodar os testes de novo e fazer commit das correções (se houve alguma)**

Run: `node --test`
Expected: PASS — `ℹ pass 36`, `ℹ fail 0`.

Se houve correção:

```bash
git add pedido.css pedido.js pedido.html
git commit -m "fix: ajustes da verificacao no navegador da pagina de pedido

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Parar o servidor local**

Parar o processo em segundo plano do Step 1.

---

### Task 9: Entrega ao usuário (sem publicar)

**Files:** nenhum.

- [ ] **Step 1: Confirmar o estado da branch**

Run: `git status --short && git log --oneline main..feat/pagina-pedido`
Expected: nenhum arquivo rastreado modificado (só os não rastreados `.agents/`, `.claude/`, `.mcp.json` e `skills-lock.json`) e os commits das Tasks 1–8 listados.

- [ ] **Step 2: Mostrar ao usuário**

Enviar ao usuário, em PT-BR:
- os prints da Task 8, em 375 px: primeira tela, painel aberto, barra com aviso e resumo;
- o que foi conferido e o que precisou de ajuste;
- como ver no computador: `python -m http.server 8080` na pasta do projeto e abrir `http://localhost:8080/pedido.html` com o modo celular do navegador (F12 → ícone de celular).

- [ ] **Step 3: Perguntar como ele quer ver no celular**

Oferecer: com a autorização dele, fazer push da branch `feat/pagina-pedido` e abrir um pull request. O Netlify gera um link de pré-visualização para abrir no celular, sem mexer no site no ar. **Não fazer push sem o "sim" dele.**

- [ ] **Step 4: Publicar somente com aprovação explícita**

Merge em `main` (que publica no ar) **só** depois de o usuário aprovar a página. Depois de publicado, lembrar das pendências guardadas na memória (`pendencias-pos-pagina-pedido`): vídeo no Higgsfield, versão impressa para a loja, destino da landing e detalhes de entrega.
