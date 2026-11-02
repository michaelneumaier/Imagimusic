const aborted=()=>new DOMException('Return preparation cancelled.','AbortError');
/** A derived result belongs to an explicit, immutable source snapshot.
 * The caller replaces that source only when a new passage actually succeeds.
 * The injected job owns model validation, transformation and sound rendering.
 */
export function createEnsembleReturnSession({prepare,onChange=()=>{}}={}){
 if(typeof prepare!=='function')throw new Error('A return preparation job is required.');
 let source=null,origin=null,result=null,state='idle',generation=0,controller=null,disposed=false;
 const emit=()=>{if(!disposed)onChange({state,result,origin,hasSource:source!==null});};
 const checkOpen=()=>{if(disposed)throw new Error('Return session is closed.');};
 function invalidate(){generation++;controller?.abort();controller=null;}
 function setSource(record,{origin:nextOrigin='saved'}={}){
  checkOpen();
  if(!['personal','demonstration','saved'].includes(nextOrigin))throw new Error('Unknown passage origin.');
  if(!record||typeof record!=='object')throw new Error('A source passage is required.');
  const snapshot=structuredClone(record);
  invalidate();source=snapshot;origin=nextOrigin;result=null;state='idle';emit();
 }
 function clearSource(){checkOpen();invalidate();source=origin=result=null;state='idle';emit();}
 function cancel(){if(disposed)return;invalidate();state=result?'ready':'idle';emit();}
 async function run(){
  checkOpen();if(!source)throw new Error('Finish a source passage first.');
  invalidate();const own=generation,abort=new AbortController();controller=abort;state='preparing';emit();
  const current=()=>{if(disposed||own!==generation||abort.signal.aborted)throw aborted();};
  try{
   // Protect the retained source even from a job that mutates its input.
   current();const next=await prepare(structuredClone(source),{signal:abort.signal});current();
   if(!next||typeof next!=='object')throw new Error('Return preparation produced no result.');
   result=next;controller=null;state='ready';emit();return result;
  }catch(error){current();controller=null;state='error';emit();throw error;}
 }
 function dispose(){if(disposed)return;disposed=true;invalidate();source=origin=result=null;state='disposed';}
 return {setSource,clearSource,prepare:run,cancel,dispose,get result(){return result;},get state(){return state;},get origin(){return origin;},get hasSource(){return source!==null;}};
}
