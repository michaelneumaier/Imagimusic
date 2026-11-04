/** One cancellable worker per completion. Reconstruction stays off the UI thread;
 * the worker result is still a model verification, not measured device output.
 */
function createVerifyJob(input,workerURL,kind,{WorkerClass=globalThis.Worker,timeoutMs=15000}={}){
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>60000)throw Error('Invalid verification timeout.');
 const expected={seed:input?.seed,sampleRate:input?.sampleRate,originAudioFrame:input?.originAudioFrame};
 const worker=new WorkerClass(workerURL,{type:'module'});
 let settled=false,finish,timer;
 const promise=new Promise((resolve,reject)=>{
  finish=(error,result)=>{
   if(settled)return;settled=true;clearTimeout(timer);worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();
   if(error)reject(error);else resolve(result);
  };
  worker.onmessage=({data})=>{
   if(data?.type==='error'&&typeof data.message==='string'){finish(Error(data.message));return;}
   const result=data?.result;
   if(data?.type!=='verified'||!result||result.kind!==kind||result.version!==(kind===undefined?undefined:1)||result.seed!==expected.seed||result.originAudioFrame!==expected.originAudioFrame||result.record?.sampleRate!==expected.sampleRate||result.record?.kind!=='imagimusic-continuous-tine-record'||result.snapshot?.state!=='ended'){
    finish(Error('Invalid continuous verification response.'));return;
   }
   finish(null,result);
  };
  worker.onerror=event=>{event.preventDefault?.();finish(Error(event.message||'Continuous verification worker failed.'));};
  worker.onmessageerror=()=>finish(Error('Could not receive continuous verification.'));
  timer=setTimeout(()=>finish(Error('Continuous verification timed out.')),timeoutMs);
  try{worker.postMessage(input);}catch(error){finish(error);}
 });
 promise.catch(()=>{});
 return Object.freeze({promise,cancel(){finish(Object.assign(Error('Continuous verification cancelled.'),{name:'AbortError'}));}});
}

export function createContinuousReturnVerifyJob(input,options){return createVerifyJob(input,new URL('./continuous-return-verify-worker.js',import.meta.url),undefined,options);}
export function createMemoryReturnVerifyJob(input,options){return createVerifyJob(input,new URL('./memory-return-verify-worker.js',import.meta.url),'imagimusic-memory-return-completion',options);}
