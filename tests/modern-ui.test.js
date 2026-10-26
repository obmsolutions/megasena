const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'sistema.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets', 'css', 'app.css'), 'utf8');
const login = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('interface modernizada mantém os oito módulos originais', () => {
  ['tab1','tab2','tab3','tab5','tab6','tab7','tab8','tab9'].forEach(id => {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
  });
  assert.equal((html.match(/role="tab"/g) || []).length, 8);
});

test('novo padrão visual possui cabeçalho, badge, cards e rodapé', () => {
  assert.match(html, /class="hero"/);
  assert.match(html, /class="hero-badge"[^>]*>6 de 60</);
  assert.match(html, /OBM Mega Analytics v2\.1 • Desdobramento por Grupos • Análise estatística não garante premiação/);
  assert.match(css, /--blue: #075fca/);
  assert.match(css, /\.filter-grid/);
  assert.match(css, /@media \(max-width: 620px\)/);
});

test('indicador de filtros ativos está integrado sem alterar o motor central', () => {
  assert.match(html, /id="activeFilterSummary"/);
  assert.match(app, /function updateActiveFilterSummary\(\)/);
  assert.match(app, /13 de \$\{groups\.length\}|\$\{activeGroups\} de \$\{groups\.length\} filtros ativos/);
  assert.match(app, /return OBMCore\.applyFilters\(combo, getFilterConfig\(\), lastDrawNumbers\)/);
});

test('filtros possuem suporte a teclado sem evento duplicado da análise', () => {
  assert.match(app, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.equal((app.match(/option\.addEventListener\('click', toggle\)/g) || []).length, 1);
});

test('tela de acesso também usa a identidade modernizada', () => {
  assert.match(login, /class="login-badge">6 de 60/);
  assert.match(login, /Entrar no sistema/);
});
