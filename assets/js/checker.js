(function(global){
  'use strict';
  function process(combinations,draw){const winning=new Set(draw.listaDezenas.map(Number));return combinations.map(numbers=>({numbers,matches:numbers.filter(n=>winning.has(n)).length,drawNumbers:[...winning]}));}
  global.OBMChecker={process,parse:OBMCore.parseCombinations};
})(window);
