const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../assets/js/core.js');
const core = require('../assets/js/grouped-core.js');

const eight = [1, 2, 3, 4, 5, 6, 7, 8];

test('calcula C(8,6), o limite inferior e a cobertura por jogo', () => {
  assert.equal(core.combinationCount(8, 6), 28);
  assert.equal(core.coveragePerGame(8, 4), 28);
  assert.equal(core.theoreticalLowerBound(8, 4, true), 2);
});

test('uma base de 8 dezenas gera 2 jogos com todas as dezenas e quadra comprovada', () => {
  const result = core.generate({
    numbers: eight,
    method: 'minimum',
    guarantee: 4,
    scope: 'group',
    groupCount: 1,
    groupSize: 8,
    gamesPerGroup: 2,
    seed: 20261020
  });
  assert.equal(result.groups.length, 1);
  assert.equal(result.totalGames, 2);
  assert.deepEqual(result.groups[0].baseNumbers, eight);
  assert.ok(result.groups.every(group => group.games.length === 2));
  assert.ok(result.groups.every(group => group.guarantee.verified));
  assert.equal(new Set(result.groups[0].games.flatMap(game => game.numbers)).size, 8);
  assert.equal(result.exactMinimum, true);
});

test('assinatura do grupo independe da ordem dos jogos', () => {
  const a = [[1,2,3,4,5,6], [1,2,3,4,7,8]];
  assert.equal(core.groupKey(a), core.groupKey([...a].reverse()));
});

test('cercamento total de um grupo de 8 dezenas produz os 28 jogos', () => {
  const result = core.generate({ numbers: eight, groupSize: 8, method: 'total', guarantee: 6, groupCount: 1, gamesPerGroup: 2 });
  const games = result.groups.flatMap(group => group.games);
  assert.equal(games.length, 28);
  assert.equal(new Set(games.map(game => game.signature)).size, 28);
  assert.equal(result.groups.length, 1);
  assert.deepEqual(result.groups[0].baseNumbers, eight);
  assert.equal(result.batchGuarantee.minimumHits, 6);
});

test('distribuição equilibrada forma grupos-base dentro de 40 dezenas', () => {
  const numbers = Array.from({ length: 40 }, (_, index) => index + 1);
  const result = core.generate({ numbers, groupSize: 8, method: 'balanced', guarantee: 0, groupCount: 30, gamesPerGroup: 2, seed: 99 });
  const frequencies = Object.fromEntries(numbers.map(number => [number, 0]));
  result.groups.forEach(group => group.games.forEach(game => game.numbers.forEach(number => frequencies[number]++)));
  const values = Object.values(frequencies);
  assert.equal(result.groups.length, 30);
  assert.equal(result.totalGames, 60);
  assert.equal(new Set(result.groups.map(group => group.signature)).size, 30);
  assert.equal(new Set(result.groups.flatMap(group => group.games.map(game => game.signature))).size, 60);
  assert.equal(result.batchGuarantee.notEvaluated, true);
  assert.ok(Math.max(...values) - Math.min(...values) <= 8);
  assert.ok(result.groups.every(group => group.baseNumbers.length === 8));
  assert.ok(result.groups.every(group => new Set(group.games.flatMap(game => game.numbers)).size === 8));
});

test('60 dezenas geram 30 grupos de 2 jogos obedecendo aos filtros ativos', () => {
  const numbers = Array.from({ length: 60 }, (_, index) => index + 1);
  const filterOptions = {
    parImparOptions: ['3-3'], somaOptions: ['120-240'], repetidasOptions: [],
    fibonacciOptions: [], primosOptions: [], molduraOptions: [], mioloOptions: [],
    multiplos3Options: [], multiplos4Options: [], quadrantesOptions: [],
    linhasOptions: [], sequenciaisOptions: [], colunasVaziasOptions: []
  };
  const result = core.generate({ numbers, groupSize: 8, method: 'balanced', guarantee: 0, groupCount: 30, gamesPerGroup: 2, seed: 2026, filterOptions, lastDraw: [] });
  const games = result.groups.flatMap(group => group.games.map(game => game.numbers));
  assert.equal(games.length, 60);
  assert.equal(new Set(games.map(core.gameKey)).size, 60);
  assert.ok(games.every(game => global.OBMCore.applyFilters(game, filterOptions, [])));
  assert.ok(result.groups.every(group => group.baseNumbers.length === 8));
  assert.ok(result.groups.every(group => new Set(group.games.flatMap(game => game.numbers)).size === 8));
  assert.ok(result.groups.every(group => group.games.every(game => game.numbers.every(number => group.baseNumbers.includes(number)))));
});

test('todos os tamanhos de grupo entre 7 e 15 utilizam a base completa', () => {
  const numbers = Array.from({ length: 60 }, (_, index) => index + 1);
  for (let groupSize = 7; groupSize <= 15; groupSize++) {
    const gamesPerGroup = Math.ceil(groupSize / 6);
    const result = core.generate({ numbers, groupSize, method: 'balanced', guarantee: 0, groupCount: 3, gamesPerGroup, seed: 500 + groupSize, filterOptions: {}, lastDraw: [] });
    assert.ok(result.groups.every(group => group.baseNumbers.length === groupSize));
    assert.ok(result.groups.every(group => new Set(group.games.flatMap(game => game.numbers)).size === groupSize));
    assert.ok(result.groups.every(group => group.games.every(game => game.numbers.every(number => group.baseNumbers.includes(number)))));
  }
});

test('validação rejeita configurações matematicamente ou operacionalmente inviáveis', () => {
  const tooFew = core.validateSpec({ numbers: eight, method: 'minimum', guarantee: 4, scope: 'group', groupCount: 1, gamesPerGroup: 1 });
  assert.equal(tooFew.ok, false);
  assert.match(tooFew.errors.join(' '), /pelo menos 2 jogo/);

  const insufficientSlots = core.validateSpec({ numbers: Array.from({ length: 40 }, (_, index) => index + 1), groupSize: 15, method: 'balanced', guarantee: 0, groupCount: 1, gamesPerGroup: 2 });
  assert.equal(insufficientSlots.ok, false);
  assert.match(insufficientSlots.errors.join(' '), /não conseguem utilizar todas as 15 dezenas/);
});

test('TXT agrupado mantém o formato contínuo do sistema tradicional', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/grouped-ui.js'), 'utf8');
  const exportBody = source.slice(source.indexOf('function exportGroupedTxt()'), source.indexOf('function exportGroupedAudit()'));
  assert.match(exportBody, /'Mega Sena Combinações'/);
  assert.match(exportBody, /Dezenas Selecionadas:/);
  assert.doesNotMatch(exportBody, /GRUPO|group\.label|Jogo \$\{/);
});

test('UI mantém o gerador tradicional e carrega o módulo por grupos separadamente', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'sistema.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
  assert.match(html, /id="traditionalModePanel"/);
  assert.match(html, /onclick="generateCombinations\(\)"/);
  assert.match(html, /id="groupedModePanel"/);
  assert.match(html, /assets\/js\/grouped-core\.js/);
  assert.match(html, /assets\/js\/grouped-ui\.js/);
  assert.match(html, /<option value="balanced" selected>Distribuição Equilibrada — aleatória com filtros<\/option>/);
  assert.match(html, /<option value="0" selected>Sem garantia — somente equilíbrio<\/option>/);
  assert.match(html, /id="groupSize"/);
  assert.match(html, /<option value="8" selected>8 dezenas<\/option>/);
  assert.match(app, /window\.OBMMegaBridge = Object\.freeze/);
});
