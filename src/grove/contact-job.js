/** One cancellable worker request; stale workers cannot publish into a new passage. */
export function restWorkerJob(url,data,{signal}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(new DOMException('Cancelled','AbortError'));return;}
  const worker=new Worker(url,{type:'module'});
  const cleanup=()=>{worker.terminate();signal?.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(new DOMException('Cancelled','AbortError'));};
  signal?.addEventListener('abort',abort,{once:true});
  worker.onmessage=({data})=>{cleanup();data.error?reject(new Error(data.error)):resolve(data);};
  worker.onerror=event=>{cleanup();reject(new Error(event.message||'Rest worker failed'));};
  try{worker.postMessage(data);}catch(error){cleanup();reject(error);}
 });
}
