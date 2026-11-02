const aborted=()=>new DOMException('Continuation preparation cancelled.','AbortError');
/** Retain the last validated original independently of a live host's capture.
 * prepareSource owns strict validation, plan construction and source identity.
 * This session owns replacement/cancellation only; it never starts audio.
 */
export function createEnsembleContinuationSource({prepareSource,onChange=()=>{}}={}){
 if(typeof prepareSource!=='function')throw new Error('A continuation preparation job is required.');
 let source=null,state='idle',generation=0,controller=null,disposed=false;
 const emit=()=>{if(!disposed)onChange({state,hasSource:source!==null,origin:source?.origin??null});};
 const invalidate=()=>{generation++;controller?.abort();controller=null;};
 function checkOpen(){if(disposed)throw new Error('Continuation source is closed.');}
 async function prepare(record,{origin='saved',sampleRate}={}){
  checkOpen();
  if(!['personal','demonstration','saved'].includes(origin))throw new Error('Unknown passage origin.');
  if(!record||typeof record!=='object')throw new Error('A source passage is required.');
  if(sampleRate!==undefined&&(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000))throw new Error('Invalid continuation sample rate.');
  const retained=structuredClone(record);
  invalidate();const own=generation,abort=new AbortController();controller=abort;state='preparing';emit();
  const current=()=>{if(disposed||own!==generation||abort.signal.aborted)throw aborted();};
  try{
   current();const prepared=await prepareSource(structuredClone(retained),{sampleRate,signal:abort.signal});current();
   if(!prepared||typeof prepared!=='object')throw new Error('Continuation preparation produced no result.');
   // Never expose the stored original or metadata to a caller/job's mutations.
   const next={record:retained,origin,prepared:structuredClone(prepared)};
   source=next;controller=null;state='ready';emit();return structuredClone(source);
  }catch(error){current();controller=null;state='error';emit();throw error;}
 }
 function cancel(){if(disposed)return;invalidate();state=source?'ready':'idle';emit();}
 function clear(){checkOpen();invalidate();source=null;state='idle';emit();}
 function dispose(){if(disposed)return;disposed=true;invalidate();source=null;state='disposed';}
 return {prepare,cancel,clear,dispose,get source(){return source?structuredClone(source):null;},get hasSource(){return source!==null;},get state(){return state;}};
}
