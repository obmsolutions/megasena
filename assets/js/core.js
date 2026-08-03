(function(global) {
    'use strict';
    const FIBONACCI = [2,3,5,8,13,21,34,55];
    const PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59];
    const FRAME = [1,2,3,4,5,6,7,8,9,10,11,20,21,30,31,40,41,50,51,52,53,54,55,56,57,58,59,60];
    const CORE = [12,13,14,15,16,17,18,19,22,23,24,25,26,27,28,29,32,33,34,35,36,37,38,39,42,43,44,45,46,47,48,49];
    const Q = [
        [1,2,3,4,5,11,12,13,14,15,21,22,23,24,25],
        [6,7,8,9,10,16,17,18,19,20,26,27,28,29,30],
        [31,32,33,34,35,41,42,43,44,45,51,52,53,54,55],
        [36,37,38,39,40,46,47,48,49,50,56,57,58,59,60]
    ].map(x => new Set(x));
    const sets = { fibonacci:new Set(FIBONACCI), primes:new Set(PRIMES), frame:new Set(FRAME), core:new Set(CORE) };

    function normalizeCountToSix(count, gameSize) {
        return Math.max(0, Math.min(6, Math.round(count * 6 / gameSize)));
    }
    function countConsecutiveAdjacencies(numbers) {
        const sorted = numbers.map(Number).sort((a,b)=>a-b);
        let count=0;
        for(let i=1;i<sorted.length;i++) if(sorted[i]===sorted[i-1]+1) count++;
        return count;
    }
    function selected(options,key) { return Array.isArray(options?.[key]) ? options[key] : []; }
    function countEquivalent(combo,set) { return normalizeCountToSix(combo.filter(n=>set.has(n)).length,combo.length); }
    function matchesExact(opts,value) { return !opts.length || opts.includes(String(value)); }

    function applyFilters(combo, options={}, lastDraw=[]) {
        if(!Array.isArray(combo)||combo.length<6||combo.length>15||new Set(combo).size!==combo.length||combo.some(n=>!Number.isInteger(n)||n<1||n>60)) return false;
        const parity=selected(options,'parImparOptions');
        const even=normalizeCountToSix(combo.filter(n=>n%2===0).length,combo.length);
        if(parity.length&&!parity.includes(`${even}-${6-even}`)) return false;
        const sumOpts=selected(options,'somaOptions'), equivalentSum=combo.reduce((a,b)=>a+b,0)*6/combo.length;
        if(sumOpts.length&&!sumOpts.some(r=>{const [a,b]=r.split('-').map(Number);return equivalentSum>=a&&equivalentSum<=b;})) return false;
        const repeated=selected(options,'repetidasOptions');
        if(lastDraw.length===6&&repeated.length){const c=combo.filter(n=>lastDraw.includes(n)).length;if(!repeated.some(x=>x==='2'?c>=2:c===Number(x)))return false;}
        if(!matchesExact(selected(options,'fibonacciOptions'),countEquivalent(combo,sets.fibonacci)))return false;
        if(!matchesExact(selected(options,'primosOptions'),countEquivalent(combo,sets.primes)))return false;
        if(!matchesExact(selected(options,'molduraOptions'),countEquivalent(combo,sets.frame)))return false;
        if(!matchesExact(selected(options,'mioloOptions'),countEquivalent(combo,sets.core)))return false;
        if(!matchesExact(selected(options,'multiplos3Options'),normalizeCountToSix(combo.filter(n=>n%3===0).length,combo.length)))return false;
        if(!matchesExact(selected(options,'multiplos4Options'),normalizeCountToSix(combo.filter(n=>n%4===0).length,combo.length)))return false;
        const quadrants=new Set(combo.map(n=>Q.findIndex(q=>q.has(n))+1));
        if(!matchesExact(selected(options,'quadrantesOptions'),quadrants.size))return false;
        const lines=new Set(combo.map(n=>Math.ceil(n/10)));
        if(!matchesExact(selected(options,'linhasOptions'),lines.size))return false;
        const seq=selected(options,'sequenciaisOptions'), adj=countConsecutiveAdjacencies(combo);
        if(seq.length&&!((seq.includes('0')&&adj===0)||(seq.includes('2')&&adj===1)))return false;
        return true;
    }

    function parseCombinations(content) {
        const combinations=[],seen=new Set(),report={valid:0,invalid:0,duplicateGames:0,invalidLines:[]};
        String(content).split(/\r?\n/).forEach((raw,index)=>{
            const line=raw.trim();
            if(!line||line.startsWith('Mega Sena')||line.startsWith('Dezenas Selecionadas'))return;
            const numbers=line.split(/[\s,;-]+/).filter(Boolean).map(Number);
            if(numbers.length<6||numbers.length>15||numbers.some(n=>!Number.isInteger(n)||n<1||n>60)||new Set(numbers).size!==numbers.length){report.invalid++;if(report.invalidLines.length<10)report.invalidLines.push(index+1);return;}
            numbers.sort((a,b)=>a-b);const key=numbers.join(',');
            if(seen.has(key)){report.duplicateGames++;return;}seen.add(key);combinations.push(numbers);
        });
        report.valid=combinations.length;return {combinations,report};
    }
    global.OBMCore={version:'2.0.0',normalizeCountToSix,countConsecutiveAdjacencies,applyFilters,parseCombinations};
})(typeof self!=='undefined'?self:globalThis);
