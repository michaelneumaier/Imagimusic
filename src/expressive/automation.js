/** Collapse exact repeated values, retaining the last time they held. Before a
 * changed ramp, flush that hold so the change cannot begin early. No epsilon. */
export function createExpressionAutomation(param){
 let last;
 return (value,time,method)=>{
  if(!last){param.setValueAtTime(value,time);last={value,time,pending:time};return;}
  if(value===last.value){last.pending=time;return;}
  if(last.pending>last.time)param.setValueAtTime(last.value,last.pending);
  param[method](value,time);last={value,time,pending:time};
 };
}
