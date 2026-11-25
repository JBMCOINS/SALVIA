// Fonte única de preços e cardápio da página de pedido (pedido.html).
// Para mudar preço, prato ou acompanhamento, edite SÓ este arquivo e rode `node --test`.

export const WHATSAPP = '5561983693411';

export const MIN_POR_SABOR = 2;
export const ACOMPANHAMENTOS_POR_PRATO = 2;

// Ordenado da MAIOR faixa para a menor: o preço é o da primeira faixa cujo `min` cabe na quantidade.
// `label` é o texto curto da faixa de preços em pedido.html (há teste garantindo que o HTML bate com isto).
export const PRICING_TIERS = [
  { min: 20, label: '20+',   price: 25.0 },
  { min: 15, label: '15–19', price: 25.5 },
  { min: 10, label: '10–14', price: 26.0 },
  { min: 5,  label: '5–9',   price: 29.0 },
  { min: 1,  label: '1–4',   price: 31.0 },
];

export const CATEGORIAS = [
  { id: 'carnes',        label: 'Carnes',        comAcompanhamentos: true },
  { id: 'frangos',       label: 'Frangos',       comAcompanhamentos: true },
  { id: 'pratos-unicos', label: 'Pratos únicos', comAcompanhamentos: false },
];

// `foto` é opcional: caminho da imagem, ex.: { nome: 'Picadinho', categoria: 'carnes', foto: 'assets/pratos/picadinho.webp' }.
// Sem foto, a linha do prato mostra só o texto.
export const PRATOS = [
  { nome: 'Carne moída',                      categoria: 'carnes' },
  { nome: 'Carne desfiada',                   categoria: 'carnes' },
  { nome: 'Picadinho',                        categoria: 'carnes' },
  { nome: 'Almôndegas ao molho',              categoria: 'carnes' },
  { nome: 'Strogonoff de carne fit',          categoria: 'carnes' },
  { nome: 'Músculo cozido',                   categoria: 'carnes' },
  { nome: 'Frango desfiado',                  categoria: 'frangos' },
  { nome: 'Frango em cubos',                  categoria: 'frangos' },
  { nome: 'Frango ao molho',                  categoria: 'frangos' },
  { nome: 'Sobrecoxa',                        categoria: 'frangos' },
  { nome: 'Fricassê de frango fit',           categoria: 'frangos' },
  { nome: 'Parmegiana fit',                   categoria: 'frangos' },
  { nome: 'Strogonoff de frango fit',         categoria: 'frangos' },
  { nome: 'Panqueca de carne',                categoria: 'pratos-unicos' },
  { nome: 'Panqueca de frango',               categoria: 'pratos-unicos' },
  { nome: 'Macarrão à bolonhesa',             categoria: 'pratos-unicos' },
  { nome: 'Escondidinho de frango e abóbora', categoria: 'pratos-unicos' },
  { nome: 'Escondidinho de carne e batata',   categoria: 'pratos-unicos' },
];

// A ordem aqui é a ordem em que os acompanhamentos aparecem no painel, no resumo e na mensagem.
export const GRUPOS_ACOMPANHAMENTOS = [
  {
    titulo: 'Arroz',
    itens: ['Arroz branco', 'Arroz com brócolis', 'Arroz com cenoura', 'Arroz integral',
      'Arroz integral com brócolis', 'Arroz integral com cenoura', 'Arroz 7 grãos'],
  },
  {
    titulo: 'Feijões e grãos',
    itens: ['Feijão carioca', 'Feijão preto', 'Grão de bico', 'Lentilha', 'Ervilha'],
  },
  {
    titulo: 'Batatas e purês',
    itens: ['Purê de batata', 'Purê de abóbora', 'Purê de mandioquinha', 'Batatas sauté',
      'Batatas rústicas', 'Batata inglesa cozida', 'Batata doce cozida', 'Batata doce assada'],
  },
  {
    titulo: 'Legumes',
    itens: ['Mix de legumes', 'Legumes assados', 'Berinjela', 'Abobrinha',
      'Macarrão de legumes (abobrinha e cenoura)', 'Abóbora e vagem no vapor'],
  },
  {
    titulo: 'Outros',
    itens: ['Quinoa', 'Cuscuz marroquino', 'Polenta'],
  },
];

// Combinações mais vendidas (informadas pelo usuário em 2026-11-25), nesta ordem.
export const MAIS_PEDIDOS = [
  { prato: 'Carne desfiada',         acompanhamentos: ['Arroz com brócolis', 'Mix de legumes'] },
  { prato: 'Fricassê de frango fit', acompanhamentos: ['Arroz branco', 'Mix de legumes'] },
  { prato: 'Carne moída',            acompanhamentos: ['Purê de mandioquinha', 'Lentilha'] },
  { prato: 'Picadinho',              acompanhamentos: ['Grão de bico', 'Mix de legumes'] },
];
