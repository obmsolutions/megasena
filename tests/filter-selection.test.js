const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sistema.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app.js'), 'utf8');

function valuesOf(id) {
  const match = html.match(new RegExp(`id="${id}">([\\s\\S]*?)</div>\\s*</div>`));
  assert.ok(match, `Controle ${id} não encontrado.`);
  return [...match[1].matchAll(/data-value="([^"]+)"/g)].map(item => item[1]);
}

test('Filtro 2 contém apenas a faixa 120 a 240', () => {
  assert.deepEqual(valuesOf('somaOptions'), ['120-240']);
});

test('Filtro 11 contém somente uma e duas linhas vazias', () => {
  assert.match(html, /Filtro 11: Linhas Vazias/);
  assert.deepEqual(valuesOf('linhasOptions'), ['1', '2']);
});

test('Filtro 13 contém 4, 5 e 6 colunas vazias com 5 pré-selecionada', () => {
  assert.deepEqual(valuesOf('colunasVaziasOptions'), ['4', '5', '6']);
  assert.match(html, /class="filter-option selected" data-value="5">Cinco Colunas Vazias/);
  assert.match(app, /colunasVaziasOptions: \['5'\]/);
});

test('avisos da geração permanecem visíveis na aba Desdobramento', () => {
  assert.equal((html.match(/id="errorContainer"/g) || []).length, 1);
  assert.ok(html.indexOf('id="errorContainer"') < html.indexOf('id="tab1"'));
  assert.match(html, /id="generationStatus"[^>]*>Aguardando a geração das combinações\.<\/div>/);
});

test('falha do Worker aciona o gerador alternativo', () => {
  assert.match(app, /worker\.onerror\s*=\s*error\s*=>[\s\S]*?runFallback\(\)/);
  assert.match(app, /function runGeneratorInMainThread\(/);
});
