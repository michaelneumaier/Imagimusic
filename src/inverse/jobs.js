const cancelled=()=>Object.assign(new Error('Preparation cancelled.'),{name:'AbortError'});
/** One disposable worker per request. Replacing a search actually stops its
 * computation, rather than merely discarding the eventual result.
 */
export function createInverseJobs({makeWorker=()=>new Worker(new URL('./prepare-worker.js',import.meta.url),{type:'module'})}={}){
 let pending=null;
 const finish=(job,error,result)=>{
  if(pending!==job)return;
  pending=null;job.worker.onmessage=null;job.worker.onerror=null;job.worker.onmessageerror=null;job.worker.terminate();
  if(error)job.reject(error);else job.resolve(result);
 };
 return {
  cancel(){if(pending)finish(pending,cancelled());},
  run(payload){
   if(pending)finish(pending,cancelled());
   return new Promise((resolve,reject)=>{
    let worker;
    try{worker=makeWorker();}catch(error){reject(error);return;}
    const job={worker,resolve,reject};pending=job;
    worker.onmessage=({data})=>{
     if(data?.error)finish(job,new Error(data.error));
     else if(data&&Object.hasOwn(data,'result'))finish(job,null,data.result);
     else finish(job,new Error('Preparation returned an invalid response.'));
    };
    worker.onerror=event=>{event.preventDefault?.();finish(job,new Error(event.message||'Preparation worker failed.'));};
    worker.onmessageerror=()=>finish(job,new Error('Preparation response could not be read.'));
    try{worker.postMessage(payload);}catch(error){finish(job,error);}
   });
  }
 };
}
