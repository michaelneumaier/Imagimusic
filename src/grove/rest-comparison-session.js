import {restWorkerJob} from './contact-job.js';
const prepare=(data,options)=>restWorkerJob(new URL('./rest-comparison-worker.js',import.meta.url),data,options);
const cancelled=()=>new DOMException('Comparison cancelled.','AbortError');
/** Owns preparation only. Playback and the original capture remain with their existing owners. */
export function createRestComparisonSession({prepareComparison=prepare,onChange=()=>{}}={}){
 let state='idle',result=null,error=null,controller=null,generation=0,disposed=false;
 const emit=()=>{if(!disposed)onChange({state,result,error});};
 function cancel(){if(disposed)return;generation++;controller?.abort();controller=null;state=result?'ready':'idle';error=null;emit();}
 async function prepare(record,targetSeed){
  if(disposed)throw new Error('Comparison session is disposed.');
  cancel();const own=generation,abort=new AbortController();controller=abort;state='preparing';emit();
  try{
   const next=await prepareComparison({record:structuredClone(record),targetSeed},{signal:abort.signal});
   if(disposed||own!==generation||abort.signal.aborted)throw cancelled();
   result=next;state='ready';error=null;controller=null;emit();return result;
  }catch(failure){
   if(disposed||own!==generation||abort.signal.aborted)throw cancelled();
   controller=null;error=failure;state='error';emit();throw failure;
  }
 }
 function clear(){if(disposed)return;cancel();result=null;state='idle';emit();}
 function dispose(){disposed=true;generation++;controller?.abort();controller=null;result=null;state='disposed';}
 return {prepare,cancel,clear,dispose,get result(){return result;},get state(){return state;}};
}
