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
