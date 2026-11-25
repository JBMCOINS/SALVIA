// Página de pedido (pedido.html). Dados: cardapio.js. Regras testadas: pedido-regras.js.
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

const estado = {
  itens: [],
  nome: '',
  painel: null,
  rolagemCardapio: 0,
};
let telaMostrada = null;
let navegouParaResumo = false;
let totalAnterior = null;
let temporizadorAviso = null;
let desfazerPendente = null;

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

function pulsar(el) {
  el.classList.remove('pulso');
  void el.offsetWidth;
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
