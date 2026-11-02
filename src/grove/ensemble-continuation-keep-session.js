const aborted=()=>new DOMException('Continuation keeping cancelled.','AbortError');
/** A finished continuation remains recoverable even if verification fails.
 * This session never exports an ordinary record or starts audio. The injected
 * worker must build and verify provenance before returning download text.
 */
export function createEnsembleContinuationKeepSession({prepare,onChange=()=>{}}={}){
 if(typeof prepare!=='function')throw new Error('A continuation keeping job is required.');
 let capture=null,result=null,origin=null,state='idle',generation=0,controller=null,disposed=false;
 const emit=()=>{if(!disposed)onChange({state,hasCapture:capture!==null,hasResult:result!==null,origin});};
 const check=()=>{if(disposed)throw new Error('Continuation keeping is closed.');};
 const invalidate=()=>{generation++;controller?.abort();controller=null;};
 function setCapture(value,{origin:nextOrigin='saved'}={}){
  check();
  if(!['personal','demonstration','saved'].includes(nextOrigin))throw new Error('Unknown passage origin.');
  if(!value?.source||!value?.continuation||!value?.ensemble)throw new Error('Source, continuation history and finished capture are required.');
  const snapshot=structuredClone(value);
  invalidate();capture=snapshot;origin=nextOrigin;result=null;state='idle';emit();
 }
 async function run(){
  check();if(!capture)throw new Error('Finish a continued passage first.');
  invalidate();const own=generation,abort=new AbortController();controller=abort;state='preparing';emit();
  const current=()=>{if(disposed||own!==generation||abort.signal.aborted)throw aborted();};
  try{
   current();const next=await prepare(structuredClone(capture),{signal:abort.signal});current();
   if(!next?.seeded||typeof next.text!=='string'||next.verification?.verified!==true)throw new Error('The continued history could not be verified.');
   result=structuredClone(next);controller=null;state='ready';emit();return structuredClone(result);
  }catch(error){current();controller=null;state='error';emit();throw error;}
 }
 function cancel(){if(disposed)return;invalidate();state=result?'ready':'idle';emit();}
 function clear(){check();invalidate();capture=result=origin=null;state='idle';emit();}
 function dispose(){if(disposed)return;disposed=true;invalidate();capture=result=origin=null;state='disposed';}
 return {setCapture,prepare:run,cancel,clear,dispose,get capture(){return capture?structuredClone(capture):null;},get result(){return result?structuredClone(result):null;},get origin(){return origin;},get state(){return state;},get hasCapture(){return capture!==null;}};
}
