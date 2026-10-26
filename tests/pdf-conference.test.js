const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app.js'), 'utf8');
const exportStart = appSource.indexOf('function exportToPDF()');
const exportEnd = appSource.indexOf('function getResultLabelFromKey', exportStart);
const exportSource = appSource.slice(exportStart, exportEnd);

test('PDF de conferência inclui o resumo completo dos resultados', () => {
    assert.ok(exportStart >= 0 && exportEnd > exportStart);
    assert.match(exportSource, /Resumo dos resultados:/);
    assert.match(exportSource, /Total de jogos conferidos:/);
    assert.match(exportSource, /\{ sena: 0, quina: 0, quadra: 0, terno: 0, duque: 0, as: 0, zero: 0 \}/);
    assert.match(exportSource, /getResultLabel\(card\.matches\)/);
});

test('PDF destaca em verde apenas as dezenas acertadas', () => {
    assert.match(exportSource, /drawNumberSet\.has\(Number\(number\)\)/);
    assert.match(exportSource, /isMatch \? \[16, 145, 99\] : \[226, 235, 246\]/);
    assert.match(exportSource, /isMatch \? \[255, 255, 255\] : \[39, 67, 94\]/);
});
