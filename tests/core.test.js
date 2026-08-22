const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/js/core.js');
const core = global.OBMCore;

test('aceita jogos válidos de 6 a 15 dezenas sem filtros', () => {
  assert.equal(core.applyFilters([1,5,10,20,35,60], {}), true);
  assert.equal(core.applyFilters([1,5,10,20,35,50,60], {}), true);
  assert.equal(core.applyFilters([1,3,5,7,9,12,14,16,18,20,22,24,26,28,30], {}), true);
});

test('rejeita repetição interna e números fora da faixa', () => {
  assert.equal(core.applyFilters([1,1,5,10,20,30], {}), false);
  assert.equal(core.applyFilters([0,2,3,4,5,6], {}), false);
});

test('Filtro 12 aceita somente um único par', () => {
  const two = {sequenciaisOptions:['2']};
  assert.equal(core.applyFilters([1,5,10,20,23,24,35], two), true);
  assert.equal(core.applyFilters([1,5,10,11,23,24,35], two), false);
  assert.equal(core.applyFilters([1,5,23,24,25,40,50], two), false);
});

test('Filtro 12 zero rejeita qualquer consecutiva', () => {
  assert.equal(core.applyFilters([1,5,10,20,23,24,35], {sequenciaisOptions:['0']}), false);
  assert.equal(core.applyFilters([1,5,10,20,23,35,50], {sequenciaisOptions:['0']}), true);
});

test('normaliza paridade em jogos maiores', () => {
  assert.equal(core.applyFilters([1,2,3,4,5,6,7], {parImparOptions:['3-3']}), true);
});

test('Filtro 2 aceita somente a soma equivalente entre 120 e 240', () => {
  const soma = {somaOptions:['120-240']};
  assert.equal(core.applyFilters([1,2,3,4,50,60], soma), true);
  assert.equal(core.applyFilters([20,30,40,45,50,55], soma), true);
  assert.equal(core.applyFilters([1,2,3,4,49,60], soma), false);
  assert.equal(core.applyFilters([21,30,40,45,50,55], soma), false);
  assert.equal(core.applyFilters([1,2,3,4,20,50,60], soma), true);
});

test('Filtro 11 calcula exatamente uma ou duas linhas vazias', () => {
  const umaLinha = [1,11,21,31,41,42];
  const duasLinhas = [1,2,11,21,31,32];
  assert.equal(core.applyFilters(umaLinha, {linhasOptions:['1']}), true);
  assert.equal(core.applyFilters(umaLinha, {linhasOptions:['2']}), false);
  assert.equal(core.applyFilters(duasLinhas, {linhasOptions:['2']}), true);
  assert.equal(core.applyFilters(duasLinhas, {linhasOptions:['1']}), false);
});

test('Filtro 13 calcula quatro, cinco ou seis colunas vazias', () => {
  const quatroVazias = [1,12,23,34,45,56];
  const cincoVazias = [1,11,22,33,44,55];
  const seisVazias = [1,11,21,32,43,54];
  assert.equal(core.applyFilters(quatroVazias, {colunasVaziasOptions:['4']}), true);
  assert.equal(core.applyFilters(cincoVazias, {colunasVaziasOptions:['5']}), true);
  assert.equal(core.applyFilters(seisVazias, {colunasVaziasOptions:['6']}), true);
  assert.equal(core.applyFilters(quatroVazias, {colunasVaziasOptions:['5']}), false);
  assert.equal(core.applyFilters(seisVazias, {colunasVaziasOptions:['5']}), false);
});

test('importador rejeita linhas inválidas e jogos duplicados', () => {
  const text = '01 02 03 04 05 06\n06 05 04 03 02 01\n10 10 20 30 40 50\n07 08 09 10 11 12 13';
  const result = core.parseCombinations(text);
  assert.equal(result.combinations.length, 2);
  assert.equal(result.report.duplicateGames, 1);
  assert.equal(result.report.invalid, 1);
});
