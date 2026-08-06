// Verifica a precificação REAL embutida em pedido.html.
// Uso: node scripts/verify-pricing.mjs  (a partir da raiz do repo)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'pedido.html'), 'utf8');

const tiersMatch = html.match(/const PRICING_TIERS = \[[\s\S]*?\];/);
const fnMatch = html.match(/const calculatePricing = [\s\S]*?\.price;/);
if (!tiersMatch || !fnMatch) {
  console.error('FAIL: PRICING_TIERS ou calculatePricing nao encontrados em pedido.html');
  process.exit(1);
}
const calculatePricing = new Function(`${tiersMatch[0]}\n${fnMatch[0]}\nreturn calculatePricing;`)();

// [quantidade total, preco unitario esperado]
const unitCases = [[0, 29], [1, 29], [2, 29], [4, 29], [5, 27], [9, 27], [10, 24], [14, 24], [15, 23.5], [19, 23.5], [20, 23], [25, 23], [100, 23]];
// [quantidade total, total esperado em R$]
const totalCases = [[2, 58], [7, 189], [12, 288], [17, 399.5], [20, 460], [25, 575]];

let fails = 0;
for (const [q, exp] of unitCases) {
  const got = calculatePricing(q);
  if (got !== exp) { console.error(`FAIL unitario q=${q}: esperado ${exp}, obtido ${got}`); fails++; }
}
for (const [q, exp] of totalCases) {
  const got = q * calculatePricing(q);
  if (Math.abs(got - exp) > 1e-9) { console.error(`FAIL total q=${q}: esperado ${exp}, obtido ${got}`); fails++; }
}

// A tabela visual deve renderizar de [...PRICING_TIERS] (spread) — sem o spread,
// reverse() mutaria o array e calculatePricing passaria a cobrar 29,00 sempre.
if (!html.includes('[...PRICING_TIERS].reverse()')) {
  console.error('FAIL: tabela visual nao renderiza de [...PRICING_TIERS].reverse() em pedido.html');
  fails++;
}

// Os precos dos kits exibidos na landing devem bater com calculatePricing.
const landing = readFileSync(join(root, 'index.html'), 'utf8');
for (const [q, valor, centavo] of [[10, 240, ',00'], [15, 352, ',50'], [20, 460, ',00']]) {
  const total = q * calculatePricing(q);
  const esperado = `<span class="valor">R$ ${valor}</span><span class="centavo">${centavo}</span>`;
  if (total !== valor + Number(centavo.replace(',', '.'))) {
    console.error(`FAIL landing kit ${q}: card mostra ${valor}${centavo}, calculo da faixa da ${total}`);
    fails++;
  }
  if (!landing.includes(esperado)) {
    console.error(`FAIL landing kit ${q}: trecho esperado nao encontrado em index.html: ${esperado}`);
    fails++;
  }
}

if (fails > 0) process.exit(1);
console.log(`PASS: ${unitCases.length + totalCases.length} casos de preco + fonte unica da tabela + 3 kits da landing ok`);
