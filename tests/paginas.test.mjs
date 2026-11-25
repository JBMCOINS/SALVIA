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
