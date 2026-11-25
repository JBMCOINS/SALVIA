import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encontrarPrato, ordenarAcompanhamentos, chaveItem, adicionarItem, alterarQuantidade,
  removerItem, reinserirItem, quantidadePorPrato, validarCarrinhoSalvo,
} from '../pedido-regras.js';

const picadinho = (quantidade = 2, acompanhamentos = ['Grão de bico', 'Mix de legumes']) =>
  ({ prato: 'Picadinho', acompanhamentos, quantidade });
const macarrao = (quantidade = 2) => ({ prato: 'Macarrão à bolonhesa', acompanhamentos: [], quantidade });

test('acompanhamentos ficam na ordem do cardápio', () => {
  assert.deepEqual(ordenarAcompanhamentos(['Mix de legumes', 'Arroz branco']), ['Arroz branco', 'Mix de legumes']);
  assert.deepEqual(ordenarAcompanhamentos(['Purê de mandioquinha', 'Lentilha']), ['Lentilha', 'Purê de mandioquinha']);
});

test('mesma combinação em outra ordem tem a mesma chave', () => {
  assert.equal(
    chaveItem(picadinho(2, ['Mix de legumes', 'Grão de bico'])),
    chaveItem(picadinho(2, ['Grão de bico', 'Mix de legumes'])),
  );
  assert.notEqual(chaveItem(picadinho()), chaveItem(picadinho(2, ['Arroz branco', 'Lentilha'])));
});

test('combinação nova cria linha; repetida soma na mesma linha', () => {
  let itens = adicionarItem([], picadinho(2, ['Mix de legumes', 'Grão de bico']));
  assert.deepEqual(itens, [picadinho(2)]);
  itens = adicionarItem(itens, picadinho(3));
  assert.equal(itens.length, 1);
  assert.equal(itens[0].quantidade, 5);
  itens = adicionarItem(itens, macarrao());
  assert.equal(itens.length, 2);
});

test('adicionarItem não altera o array recebido', () => {
  const original = [picadinho()];
  adicionarItem(original, picadinho());
  assert.equal(original[0].quantidade, 2);
});

test('+ soma 1; – subtrai 1; – em 2 remove', () => {
  const chave = chaveItem(picadinho());
  let itens = [picadinho(2)];
  itens = alterarQuantidade(itens, chave, +1);
  assert.equal(itens[0].quantidade, 3);
  itens = alterarQuantidade(itens, chave, -1);
  assert.equal(itens[0].quantidade, 2);
  itens = alterarQuantidade(itens, chave, -1);
  assert.deepEqual(itens, []);
});

test('remover tira só o item da chave', () => {
  assert.deepEqual(removerItem([picadinho(), macarrao()], chaveItem(picadinho())), [macarrao()]);
});

test('desfazer reinsere na posição original', () => {
  assert.deepEqual(reinserirItem([macarrao()], picadinho(4), 0), [picadinho(4), macarrao()]);
  assert.deepEqual(reinserirItem([macarrao()], picadinho(4), 5), [macarrao(), picadinho(4)]);
});

test('desfazer soma se a combinação voltou ao pedido nesse meio-tempo', () => {
  assert.deepEqual(reinserirItem([picadinho(2)], picadinho(4), 0), [picadinho(6)]);
});

test('quantidade por prato soma todas as combinações do prato', () => {
  const itens = [picadinho(2), picadinho(3, ['Arroz branco', 'Lentilha']), macarrao(4)];
  assert.deepEqual(quantidadePorPrato(itens), { Picadinho: 5, 'Macarrão à bolonhesa': 4 });
});

test('encontrarPrato informa se o prato leva acompanhamento', () => {
  assert.equal(encontrarPrato('Picadinho').comAcompanhamentos, true);
  assert.equal(encontrarPrato('Panqueca de carne').comAcompanhamentos, false);
  assert.equal(encontrarPrato('Panquecas (carne ou frango)'), null);
});

test('carrinho salvo: mantém os válidos e descarta os inválidos', () => {
  const salvo = [
    picadinho(2),
    { prato: 'Fricassé de frango', acompanhamentos: ['Arroz branco', 'Lentilha'], quantidade: 2 },   // prato que saiu
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Batata frita'], quantidade: 2 },       // acompanhamento inexistente
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco'], quantidade: 2 },                       // só 1 acompanhamento
    { prato: 'Macarrão à bolonhesa', acompanhamentos: ['Arroz branco'], quantidade: 2 },            // prato único com acompanhamento
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Arroz branco'], quantidade: 2 },       // acompanhamento repetido
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Lentilha'], quantidade: 1 },           // abaixo do mínimo
    { prato: 'Picadinho', acompanhamentos: ['Arroz branco', 'Lentilha'], quantidade: 2.5 },         // não inteiro
    null,
    'lixo',
    macarrao(3),
  ];
  assert.deepEqual(validarCarrinhoSalvo(salvo), [picadinho(2), macarrao(3)]);
});

test('carrinho salvo que não é lista vira pedido vazio', () => {
  assert.deepEqual(validarCarrinhoSalvo(null), []);
  assert.deepEqual(validarCarrinhoSalvo(undefined), []);
  assert.deepEqual(validarCarrinhoSalvo({ itens: [] }), []);
});
