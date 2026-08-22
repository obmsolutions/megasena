(function(global){
    'use strict';
    const CACHE_KEY='obmMegaHistoryV2';
    const API='https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena';
    function normalize(draw){return {numero:Number(draw.numero),dataApuracao:draw.dataApuracao,listaDezenas:draw.listaDezenas.map(n=>String(n).padStart(2,'0')).sort()};}
    function merge(...groups){const map=new Map();groups.flat().forEach(d=>{if(d&&Number.isInteger(Number(d.numero))&&d.listaDezenas?.length===6)map.set(Number(d.numero),normalize(d));});return [...map.values()].sort((a,b)=>a.numero-b.numero);}
    function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'[]')}catch{return[]}}
    function writeCache(draws){try{localStorage.setItem(CACHE_KEY,JSON.stringify(draws.slice(-500)))}catch{}}
    async function fetchDraw(number=''){const response=await fetch(`${API}/${number}`);if(!response.ok)throw new Error(`API Caixa: ${response.status}`);return normalize(await response.json());}
    async function initialize(){
        const local=global.OBM_LOCAL_HISTORY?.concursos||[];let draws=merge(local,readCache());
        try{
            const known=draws.at(-1)?.numero||0;
            const latest=await fetchDraw();draws=merge(draws,[latest]);
            if(latest.numero>known){for(let n=known+1;n<=latest.numero;n++)draws=merge(draws,[await fetchDraw(n)]);}
            writeCache(draws);
        }catch(error){console.warn('Sincronização online indisponível; usando base local.',error);}
        return draws;
    }
    let promise;
    async function all(){if(!promise)promise=initialize();return promise;}
    async function recent(count){const draws=await all();return draws.slice(-count).sort((a,b)=>b.numero-a.numero);}
    async function byNumber(number){const draws=await all();const found=draws.find(d=>d.numero===Number(number));if(found)return found;const draw=await fetchDraw(number);writeCache(merge(draws,[draw]));return draw;}
    global.OBMDataStore={all,recent,byNumber,refresh(){promise=null;return all();},cacheKey:CACHE_KEY};
})(window);
