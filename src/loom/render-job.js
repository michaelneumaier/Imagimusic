/** A cancellable render owns its worker; completed or superseded jobs release it. */
export function createLoomRenderJob(input,{WorkerClass=globalThis.Worker}={}){
 const worker=new WorkerClass(new URL('./render-worker.js',import.meta.url),{type:'module'});
 let settled=false,rejectJob;
 const promise=new Promise((resolve,reject)=>{
  rejectJob=reject;
  const finish=(error,pcm)=>{if(settled)return;settled=true;worker.terminate();error?reject(error):resolve(pcm);};
  worker.onmessage=({data})=>finish(data.error?new Error(data.error):null,data.pcm);
  worker.onerror=event=>{event.preventDefault?.();finish(new Error(event.message||'Audio preparation failed'));};
  worker.onmessageerror=()=>finish(new Error('Could not receive prepared audio'));
  try{worker.postMessage(input);}catch(error){finish(error);}
 });
 return {promise,cancel(){if(settled)return;settled=true;worker.terminate();rejectJob(new DOMException('Audio preparation cancelled','AbortError'));}};
}
