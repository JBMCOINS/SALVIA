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
