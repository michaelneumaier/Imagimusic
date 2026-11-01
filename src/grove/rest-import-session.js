import {readRestFile} from './read-rest-file.js';
import {restWorkerJob} from './contact-job.js';
const rebuild=(data,options)=>restWorkerJob(new URL('./rest-import-worker.js',import.meta.url),data,options);
const cancelled=()=>new DOMException('Opening cancelled.','AbortError');
/** A new file replaces the previous result only after its full reconstruction succeeds. */
export function createRestImportSession({read=readRestFile,prepare=rebuild,onChange=()=>{}}={}){
 let result=null,state='idle',controller=null,generation=0,disposed=false;
 const emit=()=>{if(!disposed)onChange({state,result});};
 function cancel(){if(disposed)return;generation++;controller?.abort();controller=null;state=result?'ready':'idle';emit();}
 async function open(file){
  if(disposed)throw new Error('Reader is closed.');
  cancel();const own=generation,abort=new AbortController();controller=abort;state='preparing';emit();
  const check=()=>{if(disposed||own!==generation||abort.signal.aborted)throw cancelled();};
  try{
   const source=await read(file,{signal:abort.signal});check();
   const next=await prepare({text:source.text},{signal:abort.signal});check();
   result={...next,name:source.name};state='ready';controller=null;emit();return result;
  }catch(error){check();controller=null;state='error';emit();throw error;}
 }
 function dispose(){disposed=true;generation++;controller?.abort();controller=null;result=null;state='disposed';}
 return {open,cancel,dispose,get result(){return result;},get state(){return state;}};
}
