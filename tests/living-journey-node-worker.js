// Exercise the browser worker module in a real Node worker thread. This tests
// transfer/cancellation behavior, not browser policy or Web Audio activation.
import {parentPort,workerData} from 'node:worker_threads';
globalThis.self={postMessage:(data,buffers)=>parentPort.postMessage(data,buffers)};
await import(workerData);
parentPort.on('message',data=>{parentPort.postMessage({testStarted:true});self.onmessage({data});});
