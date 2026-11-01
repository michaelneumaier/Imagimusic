import test from 'node:test';
import assert from 'node:assert/strict';
import {createLoomRenderJob} from '../src/loom/render-job.js';
class FakeWorker {
 static instances=[];
 constructor(url,options){this.url=url;this.options=options;FakeWorker.instances.push(this);}
 postMessage(input){this.input=input;}
 terminate(){this.stops=(this.stops??0)+1;}
}
test('cancelled preparation releases worker, rejects, and ignores a late result',async()=>{
 const job=createLoomRenderJob({body:null},{WorkerClass:FakeWorker}),worker=FakeWorker.instances.at(-1);
 job.cancel();worker.onmessage({data:{pcm:'stale'}});
 await assert.rejects(job.promise,{name:'AbortError'});assert.equal(worker.stops,1);
});
test('successful and failed preparations terminate once without affecting the next job',async()=>{
 const a=createLoomRenderJob({body:0},{WorkerClass:FakeWorker}),first=FakeWorker.instances.at(-1);
 const b=createLoomRenderJob({body:1},{WorkerClass:FakeWorker}),second=FakeWorker.instances.at(-1);
 first.onmessage({data:{error:'bad render'}});second.onmessage({data:{pcm:{channels:[1,2]}}});
 await assert.rejects(a.promise,/bad render/);assert.deepEqual(await b.promise,{channels:[1,2]});
 a.cancel();b.cancel();assert.equal(first.stops,1);assert.equal(second.stops,1);
 assert.equal(second.options.type,'module');assert.equal(second.input.body,1);
});
