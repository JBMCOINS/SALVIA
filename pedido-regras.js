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
