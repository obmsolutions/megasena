importScripts('../js/core.js');

function candidate(numbers,size,frequencies){
    const remaining=[...numbers],result=[];
    while(result.length<size){const weights=remaining.map(n=>1/(1+frequencies[n])),total=weights.reduce((a,b)=>a+b,0);let target=Math.random()*total,index=weights.length-1;for(let i=0;i<weights.length;i++){target-=weights[i];if(target<=0){index=i;break;}}result.push(remaining.splice(index,1)[0]);}
    return result.sort((a,b)=>a-b);
}
self.onmessage=function(event){
    const {numbers,size,count,options,lastDraw,maxAttempts}=event.data;
    const frequencies=Object.fromEntries(numbers.map(n=>[n,0])),seen=new Set(),combinations=[];let attempts=0;
    while(combinations.length<count&&attempts<maxAttempts){const combo=candidate(numbers,size,frequencies),key=combo.join(',');if(!seen.has(key)&&OBMCore.applyFilters(combo,options,lastDraw)){seen.add(key);combinations.push(combo);combo.forEach(n=>frequencies[n]++);}attempts++;if(attempts%5000===0)postMessage({type:'progress',generated:combinations.length,attempts});}
    postMessage({type:'done',combinations,attempts,frequencies});
};
