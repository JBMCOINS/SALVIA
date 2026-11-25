import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRICING_TIERS } from '../cardapio.js';
import { resumoValores, formatarReais, formatarPrecoCurto } from '../pedido-regras.js';

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

test('pedido.html: escada de preços escrita no HTML bate com PRICING_TIERS', () => {
  const html = ler('pedido.html');
  const melhor = PRICING_TIERS[0];
  for (const t of PRICING_TIERS) {
    const eMelhor = t === melhor;
    const trecho = `<li class="faixa${eMelhor ? ' melhor' : ''}" data-min="${t.min}"><span class="faixa-qtd">${t.label}</span>`
      + '<span class="faixa-degrau"><span class="sr-only"> marmitas: R$ </span>'
      + `<span class="faixa-preco">${formatarPrecoCurto(t.price)}</span><span class="sr-only"> cada</span>`
      + `${eMelhor ? '<span class="faixa-selo">melhor preço</span>' : ''}</span></li>`;
    assert.ok(html.includes(trecho), `faixa ${t.label}: esperado ${trecho}`);
  }
  assert.equal(html.split('<li class="faixa').length - 1, PRICING_TIERS.length);
});

test('pedido.html: título e economia da escada de preços', () => {
  const html = ler('pedido.html');
  const melhor = PRICING_TIERS[0];
  const base = PRICING_TIERS[PRICING_TIERS.length - 1];
  assert.ok(html.includes('>Leve mais, pague menos por marmita</h2>'));
  assert.ok(html.includes(`${melhor.min} ou mais: <strong>R$ ${formatarPrecoCurto(base.price - melhor.price)} a menos em cada marmita</strong>`));
});

test('pedido.html: nenhum atalho para o WhatsApp antes do pedido', () => {
  // Decisão do usuário: dúvidas chegam junto com o pedido enviado, não antes (evita o pedido "manual" pela conversa).
  assert.ok(!ler('pedido.html').includes('wa.me'));
});

test('pedido.html: não bloqueia zoom nem carrega framework', () => {
  const html = ler('pedido.html');
  assert.ok(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">'));
  assert.ok(!/user-scalable|maximum-scale/.test(html));
  assert.ok(!/react|babel|tailwind|gsap/i.test(html));
});

test('orçamento de peso: JS + CSS próprios abaixo de 50 KB (definição da spec)', () => {
  const arquivos = ['pedido.css', 'pedido.js', 'pedido-regras.js', 'cardapio.js'];
  // Netlify serve o conteúdo LF guardado no git; o checkout com CRLF não deve inflar a medição.
  const total = arquivos.reduce((soma, a) => soma + Buffer.byteLength(readFileSync(new URL(a, raiz), 'utf8').replace(/\r\n/g, '\n')), 0);
  assert.ok(total < 50 * 1024, `total ${total} bytes`);
});
