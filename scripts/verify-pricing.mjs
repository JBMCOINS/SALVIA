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
if (fails > 0) process.exit(1);
console.log(`PASS: ${unitCases.length + totalCases.length} casos ok`);
