import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarMensagem, linkPedidoWhatsApp, linkDuvidasWhatsApp } from '../pedido-regras.js';

const itens = [
  { prato: 'Carne desfiada', acompanhamentos: ['Arroz com brócolis', 'Mix de legumes'], quantidade: 4 },
  { prato: 'Macarrão à bolonhesa', acompanhamentos: [], quantidade: 2 },
];

test('mensagem com nome (texto exato)', () => {
  assert.equal(montarMensagem('  Mariana ', itens), [
    '*NOVO PEDIDO SÁLVIA PREMIUM*',
    '',
    'Meu nome é *Mariana* e este é meu pedido personalizado:',
    '',
    '- *4x CARNE DESFIADA*',
    '   _(Acomp: Arroz com brócolis + Mix de legumes)_',
    '',
    '- *2x MACARRÃO À BOLONHESA*',
    '',
    '_Preço por unidade: R$ 29,00_',
    '*VALOR TOTAL: R$ 174,00*',
    '_Qtde Total: 6 marmitas_',
  ].join('\n'));
});

test('mensagem sem nome', () => {
  const mensagem = montarMensagem('   ', itens);
  assert.ok(mensagem.includes('\nEste é meu pedido personalizado:\n'));
  assert.ok(!mensagem.includes('Meu nome é'));
});

test('link do pedido aponta para o número da Sálvia com o texto codificado', () => {
  const link = linkPedidoWhatsApp('Mariana', itens);
  assert.ok(link.startsWith('https://wa.me/5561983693411?text='));
  assert.equal(decodeURIComponent(link.split('?text=')[1]), montarMensagem('Mariana', itens));
});

test('link de dúvidas sobre entrega', () => {
  assert.equal(
    linkDuvidasWhatsApp(),
    'https://wa.me/5561983693411?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20entrega.',
  );
});
