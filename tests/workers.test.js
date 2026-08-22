const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function workerContext(file, includeCore=false) {
  const messages=[];
  const context={console,Math,Set,Map,Array,Number,Object,String,postMessage:m=>messages.push(m)};
  context.self=context;
  context.importScripts=()=>{
    if(includeCore) vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js','core.js'),'utf8'),context);
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  return {context,messages};
}

test('Worker gera carteira completa e filtrada', () => {
  const {context,messages}=workerContext('assets/workers/generator-worker.js',true);
  const numbers=Array.from({length:30},(_,i)=>i+1);
  context.self.onmessage({data:{numbers,size:6,count:50,maxAttempts:20000,options:{sequenciaisOptions:['0','2']},lastDraw:[]}});
  const done=messages.find(m=>m.type==='done');
  assert.equal(done.combinations.length,50);
  done.combinations.forEach(c=>assert.equal(context.OBMCore.applyFilters(c,{sequenciaisOptions:['0','2']},[]),true));
});

test('Worker de retroteste conclui sem acessar dados futuros', () => {
  const {context,messages}=workerContext('assets/workers/backtest-worker.js');
  const data=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','mega-sena.json'),'utf8')).concursos.slice(0,140);
  const weights={wFreq30:.1,wFreq100:.2,wFreq300:.1,wDelay:.1,wLast1:.1,wLast2:.05,wGlobal:.15,wPairs:.1,wStability:.1};
  context.self.onmessage({data:{draws:data,excludeCount:12,requested:30,weights}});
  const done=messages.find(m=>m.type==='done');
  assert.equal(done.total,30);
  assert.equal(done.model.reduce((a,b)=>a+b,0),30);
});

test('Gerador alternativo conclui quando o Worker não está disponível', async () => {
  const context={
    console,Math,Set,Map,Array,Number,Object,String,Date,Promise,setTimeout,clearTimeout,
    document:{addEventListener(){}},window:{location:{href:'http://127.0.0.1/sistema.html'}}
  };
  context.self=context;
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js','core.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js','app.js'),'utf8'),context);
  const numbers=Array.from({length:60},(_,i)=>i+1);
  const options={somaOptions:['120-240'],linhasOptions:['1','2'],colunasVaziasOptions:['5']};
  const result=await context.runGeneratorInMainThread(numbers,6,40,40000,options,[],()=>{});
  assert.equal(result.combinations.length,40);
  assert.equal(result.fallback,true);
  result.combinations.forEach(c=>assert.equal(context.OBMCore.applyFilters(c,options,[]),true));
});
