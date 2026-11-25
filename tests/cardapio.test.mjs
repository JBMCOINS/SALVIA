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
