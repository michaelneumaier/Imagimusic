import {TOUCH_RECORD_MAX_BYTES} from './record.js';
import {createInverseJobs} from '../inverse/jobs.js';
const cancelled=()=>new DOMException('Opening cancelled.','AbortError');
const check=signal=>{if(signal?.aborted)throw cancelled();};
export async function readTouchFile(file,{signal}={}){
 check(signal);
 if(!file||typeof file.arrayBuffer!=='function'||typeof file.name!=='string')throw new Error('Choose a saved Touch gesture file.');
 const size=file.size,name=file.name.slice(0,200);
 if(!Number.isSafeInteger(size)||size<1||size>TOUCH_RECORD_MAX_BYTES)throw new Error('Choose gesture JSON no larger than 256 KiB.');
 const bytes=await file.arrayBuffer();check(signal);
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==size)throw new Error('The file size changed while reading.');
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('The gesture file must contain UTF-8 JSON.');}
 return {name,text};
}
/** Transactional selected-file preparation. No AudioContext or playback. */
export function createTouchReturnSession({read=readTouchFile,jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('./return-worker.js',import.meta.url),{type:'module'})}),onChange=()=>{}}={}){
 let result=null,state='idle',controller=null,generation=0,disposed=false;
 const emit=()=>{if(!disposed)onChange({state,result});};
 function cancel(){if(disposed)return;generation++;controller?.abort();controller=null;jobs.cancel();state=result?'ready':'idle';emit();}
 async function open(file){
  if(disposed)throw new Error('Reader is closed.');
  cancel();const own=generation,abort=new AbortController();controller=abort;state='preparing';emit();
  const current=()=>{if(disposed||own!==generation||abort.signal.aborted)throw cancelled();};
  try{const source=await read(file,{signal:abort.signal});current();const next=await jobs.run({text:source.text});current();result={...next,name:source.name};state='ready';controller=null;emit();return result;}
  catch(error){current();controller=null;state='error';emit();throw error;}
 }
 function dispose(){if(disposed)return;cancel();disposed=true;result=null;state='disposed';}
 return {open,cancel,dispose,get state(){return state;},get result(){return result;}};
}
