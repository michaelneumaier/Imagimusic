/** One cancellable worker per completion. Reconstruction stays off the UI thread;
 * the worker result is still a model verification, not measured device output.
 */
export function createMemoryEnsembleVerifyJob(input,{WorkerClass=globalThis.Worker,timeoutMs=15000}={}){
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>60000)throw Error('Invalid verification timeout.');
 const expected={seed:input?.seed,sampleRate:input?.sampleRate,originAudioFrame:input?.originAudioFrame};
 const worker=new WorkerClass(new URL('./memory-ensemble-verify-worker.js',import.meta.url),{type:'module'});
 let settled=false,finish,timer;
 const promise=new Promise((resolve,reject)=>{
  finish=(error,result)=>{
   if(settled)return;settled=true;clearTimeout(timer);worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();
   if(error)reject(error);else resolve(result);
  };
  worker.onmessage=({data})=>{
   if(data?.type==='error'&&typeof data.message==='string'){finish(Error(data.message));return;}
   const result=data?.result;
   if(data?.type!=='verified'||!result||result.kind!=='imagimusic-memory-ensemble-completion'||result.version!==1||result.seed!==expected.seed||result.originAudioFrame!==expected.originAudioFrame||!Array.isArray(result.records)||result.records.length!==3||result.records.some(record=>record?.sampleRate!==expected.sampleRate||record?.kind!=='imagimusic-continuous-tine-record')||!Array.isArray(result.snapshot)||result.snapshot.length!==3||result.snapshot.some(state=>state?.state!=='ended')){
    finish(Error('Invalid ensemble verification response.'));return;
   }
   finish(null,result);
  };
  worker.onerror=event=>{event.preventDefault?.();finish(Error(event.message||'Ensemble verification worker failed.'));};
  worker.onmessageerror=()=>finish(Error('Could not receive ensemble verification.'));
  timer=setTimeout(()=>finish(Error('Ensemble verification timed out.')),timeoutMs);
  try{worker.postMessage(input);}catch(error){finish(error);}
 });
 promise.catch(()=>{});
 return Object.freeze({promise,cancel(){finish(Object.assign(Error('Ensemble verification cancelled.'),{name:'AbortError'}));}});
}
