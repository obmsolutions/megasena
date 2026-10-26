const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('base histórica local é íntegra e ordenada', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','mega-sena.json'),'utf8'));
  assert.equal(data.total, 3038);
  assert.equal(data.primeiroConcurso, 1);
  assert.equal(data.ultimoConcurso, 3038);
  assert.equal(data.concursos.length, 3038);
  data.concursos.forEach((draw,index) => {
    assert.equal(draw.numero,index+1);
    assert.equal(draw.listaDezenas.length,6);
    assert.equal(new Set(draw.listaDezenas).size,6);
    draw.listaDezenas.forEach(n => assert.ok(Number(n)>=1 && Number(n)<=60));
  });
});
