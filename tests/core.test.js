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

test('importador rejeita linhas inválidas e jogos duplicados', () => {
  const text = '01 02 03 04 05 06\n06 05 04 03 02 01\n10 10 20 30 40 50\n07 08 09 10 11 12 13';
  const result = core.parseCombinations(text);
  assert.equal(result.combinations.length, 2);
  assert.equal(result.report.duplicateGames, 1);
  assert.equal(result.report.invalid, 1);
});
