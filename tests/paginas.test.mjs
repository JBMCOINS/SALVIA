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
