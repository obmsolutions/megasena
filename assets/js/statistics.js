(function(global){
  'use strict';
  function summary(draws){
    if(!draws?.length)return null;
    const numbers=draws.map(d=>d.listaDezenas.map(Number));
    const sums=numbers.map(a=>a.reduce((x,y)=>x+y,0));
    const consecutive=numbers.filter(a=>OBMCore.countConsecutiveAdjacencies(a)>0).length;
    const frequencies=Array(61).fill(0);numbers.forEach(a=>a.forEach(n=>frequencies[n]++));
    return {count:draws.length,averageSum:sums.reduce((a,b)=>a+b,0)/sums.length,consecutiveRate:consecutive/draws.length,frequencies};
  }
  global.OBMStatistics={summary};
})(window);
