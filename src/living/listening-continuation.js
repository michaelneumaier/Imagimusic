/** Visit-local opt-in continuation. Only the owner decides that a piece ended
 * naturally. Epoch checks also suppress callbacks already queued at cancellation.
 */
export function createListeningContinuation({next,onChange=()=>{},schedule=setTimeout,cancel=clearTimeout,delayMs=3000}){
 let enabled=false,pending=false,handle=null,epoch=0;
 function cancelPending(){epoch++;if(handle!==null)cancel(handle);handle=null;pending=false;onChange();}
 function stop(){enabled=false;cancelPending();}
 function enable(){enabled=true;onChange();}
 function queue(){
  if(!enabled||pending)return;
  pending=true;const own=++epoch;
  handle=schedule(()=>{if(own!==epoch||!enabled)return;const firing=++epoch;handle=null;pending=false;onChange();if(enabled&&firing===epoch)next();},delayMs);
  onChange();
 }
 return {enable,stop,cancelPending,queue,get enabled(){return enabled;},get pending(){return pending;}};
}
