function scale(values){const slice=values.slice(1),min=Math.min(...slice),max=Math.max(...slice),range=max-min||1;return values.map((v,i)=>i===0?0:(v-min)/range);}
function frequency(draws,size){const f=Array(61).fill(0);draws.slice(-Math.min(size,draws.length)).forEach(d=>d.listaDezenas.forEach(n=>f[Number(n)]++));return f;}
function scores(draws,w){
    const f30=frequency(draws,30),f100=frequency(draws,100),f300=frequency(draws,300),fg=frequency(draws,draws.length),n30=scale(f30),n100=scale(f100),n300=scale(f300),ng=scale(fg);
    const last1=new Set(draws.at(-1).listaDezenas.map(Number)),last2=new Set(draws.at(-2).listaDezenas.map(Number)),delays=Array(61).fill(draws.length);
    for(let n=1;n<=60;n++)for(let i=draws.length-1;i>=0;i--)if(draws[i].listaDezenas.map(Number).includes(n)){delays[n]=draws.length-1-i;break;}
    const matrix=Array.from({length:61},()=>Array(61).fill(0));draws.slice(-300).forEach(d=>{const a=d.listaDezenas.map(Number);for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){matrix[a[i]][a[j]]++;matrix[a[j]][a[i]]++;}});
    const ps=Array(61).fill(0);for(let n=1;n<=60;n++)ps[n]=matrix[n].slice(1).sort((a,b)=>b-a).slice(0,5).reduce((a,b)=>a+b,0);const np=scale(ps);
    return Array.from({length:60},(_,i)=>{const n=i+1,delay=Math.exp(-Math.abs(delays[n]-7)/14),stability=1-Math.min(1,Math.abs(n30[n]-n100[n]));return {number:n,score:100*(w.wFreq30*n30[n]+w.wFreq100*n100[n]+w.wFreq300*n300[n]+w.wDelay*delay+w.wGlobal*ng[n]+w.wPairs*np[n]+w.wStability*stability-w.wLast1*(last1.has(n)?1:0)-w.wLast2*(last2.has(n)?1:0))};}).sort((a,b)=>b.score-a.score||a.number-b.number);
}
function retained(winning,excluded){return winning.map(Number).reduce((t,n)=>t+(excluded.has(n)?0:1),0);}
self.onmessage=function(event){const {draws,excludeCount,requested,weights}=event.data,start=Math.max(100,draws.length-requested),model=Array(7).fill(0),lastTwo=Array(7).fill(0);let modelTotal=0,lastTwoTotal=0;
    for(let i=start;i<draws.length;i++){const rank=scores(draws.slice(0,i),weights),excluded=new Set(rank.slice(-excludeCount).map(x=>x.number)),r=retained(draws[i].listaDezenas,excluded);model[r]++;modelTotal+=r;const union=new Set([...draws[i-1].listaDezenas,...draws[i-2].listaDezenas].map(Number)),r2=retained(draws[i].listaDezenas,union);lastTwo[r2]++;lastTwoTotal+=r2;if((i-start)%25===0)postMessage({type:'progress',done:i-start,total:draws.length-start});}
    postMessage({type:'done',start,total:draws.length-start,model,lastTwo,modelTotal,lastTwoTotal});};
